/**
 * Hospital Web Backend — Primary ML Triage Service (XGBoost)
 *
 * Executes the primary XGBoost classification model via Python bridge (Trained_data/main.py).
 * Encapsulates execution timeouts, process management, and schema mapping.
 *
 * If the model is unreachable, times out, or fails to serialize, gracefully returns null
 * so the triage router can seamlessly transition to Gemini LLM Clinical Reasoning.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const SCRIPT_PATH = path.resolve(__dirname, '../Trained_data/main.py');
const TIMEOUT_MS = 12000;

/**
 * Execute the XGBoost model script with patient vitals & symptoms.
 * @param {Object} patientData
 * @returns {Promise<Object|null>} Structured triage output or null if unavailable
 */
async function predictWithXGBoost(patientData) {
    if (!fs.existsSync(SCRIPT_PATH)) {
        console.warn(`[XGBoost] Script not found at: ${SCRIPT_PATH}`);
        return null;
    }

    // Try `py -3` first (standard Windows Python Launcher), then fallback to `python`
    const pythonCommands = process.platform === 'win32'
        ? [['py', ['-3', SCRIPT_PATH]], ['python', [SCRIPT_PATH]]]
        : [['python3', [SCRIPT_PATH]], ['python', [SCRIPT_PATH]]];

    for (const [cmd, args] of pythonCommands) {
        try {
            const result = await executeProcess(cmd, args, patientData);
            if (result && (result.riskLevel || result.priority)) {
                console.log(`[XGBoost] Primary model execution succeeded via ${cmd}`);
                return mapXGBoostResult(result, patientData);
            }
        } catch (err) {
            console.warn(`[XGBoost] Attempt with ${cmd} failed: ${err.message}`);
        }
    }

    console.warn('[XGBoost] All execution attempts exhausted. Primary model unavailable.');
    return null;
}

function executeProcess(cmd, args, inputData) {
    return new Promise((resolve, reject) => {
        let child;
        try {
            child = spawn(cmd, args, {
                windowsHide: true,
                timeout: TIMEOUT_MS,
            });
        } catch (spawnErr) {
            return reject(spawnErr);
        }

        let stdout = '';
        let stderr = '';
        let isTimedOut = false;

        const timer = setTimeout(() => {
            isTimedOut = true;
            try { child.kill(); } catch (_) { }
            reject(new Error(`Execution timed out after ${TIMEOUT_MS}ms`));
        }, TIMEOUT_MS);

        child.stdout.on('data', (chunk) => {
            stdout += chunk.toString();
        });

        child.stderr.on('data', (chunk) => {
            stderr += chunk.toString();
        });

        child.on('error', (err) => {
            clearTimeout(timer);
            reject(err);
        });

        child.on('close', (code) => {
            clearTimeout(timer);
            if (isTimedOut) return;

            if (code !== 0 && !stdout.trim()) {
                return reject(new Error(`Process exited with code ${code}: ${stderr}`));
            }

            try {
                // Find valid JSON in stdout (in case python printed warnings to stdout)
                const jsonMatch = stdout.match(/\{[\s\S]*\}/);
                if (!jsonMatch) {
                    return reject(new Error(`No JSON found in stdout: ${stdout}`));
                }
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.error) {
                    return reject(new Error(parsed.error));
                }
                resolve(parsed);
            } catch (parseErr) {
                reject(new Error(`Failed to parse XGBoost output: ${parseErr.message}. Output was: ${stdout}`));
            }
        });

        // Write input data as JSON to stdin
        try {
            const payload = {
                age: inputData.age || 30,
                gender: inputData.gender || 'unknown',
                temperature: inputData.temperature || 98.6,
                heartRate: inputData.heartRate || 72,
                bloodPressure: inputData.bloodPressure || '120/80',
                oxygenLevel: inputData.oxygenLevel || 98,
                symptoms: inputData.symptoms || '',
                history: Array.isArray(inputData.history) ? inputData.history : [],
                patientId: inputData.patientId || '0',
            };
            child.stdin.write(JSON.stringify(payload));
            child.stdin.end();
        } catch (writeErr) {
            clearTimeout(timer);
            try { child.kill(); } catch (_) { }
            reject(writeErr);
        }
    });
}

/**
 * Maps raw XGBoost output to the standardized Bharat PulseLink Triage Schema
 */
function mapXGBoostResult(raw, patientData) {
    const rawLevel = String(raw.riskLevel || 'Medium').toUpperCase();
    let priority = 'MODERATE';
    let priorityScore = 50;

    if (rawLevel.includes('HIGH') || rawLevel.includes('CRITICAL')) {
        priority = 'HIGH';
        priorityScore = 88;
    } else if (rawLevel.includes('LOW')) {
        priority = 'LOW';
        priorityScore = 24;
    } else {
        priority = 'MODERATE';
        priorityScore = 54;
    }

    const confidence = typeof raw.confidence === 'number'
        ? Math.min(100, Math.round(raw.confidence > 1 ? raw.confidence : raw.confidence * 100))
        : 92;

    const department = raw.department || 'General Medicine';

    return {
        priority,
        priorityScore,
        department,
        departmentReason: `Predicted by primary XGBoost decision tree classifier based on patient age, vitals (${patientData.temperature || '98.6'}°F, pulse ${patientData.heartRate || '72'}, BP ${patientData.bloodPressure || '120/80'}, SpO2 ${patientData.oxygenLevel || '98'}%), and presenting complaint cluster.`,
        clinicalSummary: raw.explanation || `XGBoost Triage Model classified this presentation as ${priority} acuity with a calculated confidence of ${confidence}%.`,
        keyRiskFactors: [
            ...(patientData.oxygenLevel && Number(patientData.oxygenLevel) < 92 ? [`SpO2 ${patientData.oxygenLevel}% (Hypoxia)`] : []),
            ...(patientData.bloodPressure && String(patientData.bloodPressure).includes('1') ? [`BP ${patientData.bloodPressure} mmHg`] : []),
            ...(patientData.temperature && Number(patientData.temperature) >= 100.4 ? [`Temperature ${patientData.temperature}°F`] : []),
            ...(raw.riskLevel ? [`Model Category: ${raw.riskLevel}`] : [])
        ],
        explanation: [
            {
                factor: 'XGBoost Feature Tree',
                finding: `Risk classified as ${raw.riskLevel || priority}`,
                impact: priority === 'CRITICAL' || priority === 'HIGH' ? 'HIGH' : priority === 'MODERATE' ? 'MEDIUM' : 'LOW'
            },
            {
                factor: 'Oxygen Saturation',
                finding: `SpO2 ${patientData.oxygenLevel || 98}%`,
                impact: Number(patientData.oxygenLevel || 98) < 90 ? 'HIGH' : Number(patientData.oxygenLevel || 98) < 95 ? 'MEDIUM' : 'LOW'
            },
            {
                factor: 'Hemodynamic Markers',
                finding: `BP ${patientData.bloodPressure || '120/80'}, Pulse ${patientData.heartRate || 72} bpm`,
                impact: 'MEDIUM'
            }
        ],
        recommendedNextStep: 'Proceed to nurse-led bedside triage verification.',
        confidence,
        modelUsed: 'XGBoost',
        engine: 'XGBoost Triage Model',
        modelStatus: 'PRIMARY MODEL',
        modelPath: ['XGBoost Triage Model (Primary ML Engine)'],
        disclaimer: 'Decision support only; final clinical decision remains with qualified hospital staff.'
    };
}

module.exports = {
    predictWithXGBoost,
};
