const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { performLLMTriage } = require('../services/aiService');
const { predictWithXGBoost } = require('../services/xgboostService');
const { generateEHRPDF } = require('../utils/pdfGenerator');
const { recommendDepartment } = require('../utils/routingEngine');
const Patient = require('../models/Patient');

// Simulate basic validation
const validatePatientData = (data) => {
    const required = ['age', 'gender', 'symptoms'];
    for (const field of required) {
        if (!data[field]) return `Missing field: ${field}`;
    }
    return null;
};

/** 
 * Enhanced medical triage assessment algorithm (Safety Net Fallback)
 * Provides accurate risk stratification based on clinical guidelines with structured explanation
 */
function getFallbackTriageResult(data, context = {}) {
    const symptoms = String(data.symptoms || '').toLowerCase();
    const history = Array.isArray(data.history) ? data.history.map(h => String(h).toLowerCase()) : [];
    const age = parseInt(data.age, 10) || 30;
    const temp = parseFloat(data.temperature) || 98.6;
    const heartRate = parseInt(data.heartRate, 10) || 72;
    const oxygenLevel = parseInt(data.oxygenLevel, 10) || 98;
    const bp = String(data.bloodPressure || '');
    const systolic = bp.includes('/') ? parseInt(bp.split('/')[0], 10) : parseInt(bp, 10) || 120;
    const diastolic = bp.includes('/') ? parseInt(bp.split('/')[1], 10) : 80;

    let riskScore = 0;
    let riskFactors = [];
    let explanation = [];
    let department = 'General Medicine';

    // 1. Oxygen Saturation
    if (oxygenLevel < 88) {
        riskScore += 55;
        riskFactors.push('Critical Hypoxia (<88%)');
        explanation.push({
            factor: 'Oxygen Saturation',
            finding: `SpO₂ ${oxygenLevel}% (Critical Hypoxia)`,
            impact: 'HIGH'
        });
        department = 'Emergency Medicine';
    } else if (oxygenLevel < 93) {
        riskScore += 30;
        riskFactors.push('Hypoxemia Symptoms');
        explanation.push({
            factor: 'Oxygen Saturation',
            finding: `SpO₂ ${oxygenLevel}% (Sub-optimal Saturation)`,
            impact: 'MEDIUM'
        });
        department = 'Pulmonology';
    } else {
        explanation.push({
            factor: 'Oxygen Saturation',
            finding: `SpO₂ ${oxygenLevel}% (Normal Physiological Range)`,
            impact: 'LOW'
        });
    }

    // 2. Blood Pressure
    if (systolic >= 185 || diastolic >= 115) {
        riskScore += 65;
        riskFactors.push('Hypertensive Crisis (Systolic ≥185)');
        explanation.push({
            factor: 'Blood Pressure',
            finding: `${systolic}/${diastolic} mmHg (Hypertensive Crisis)`,
            impact: 'HIGH'
        });
        department = 'Emergency Medicine';
    } else if (systolic >= 160 || diastolic >= 105) {
        riskScore += 40;
        riskFactors.push('Severe Hypertension (Stage 2)');
        explanation.push({
            factor: 'Blood Pressure',
            finding: `${systolic}/${diastolic} mmHg (Stage 2 Hypertension)`,
            impact: 'MEDIUM'
        });
        if (department === 'General Medicine') department = 'Cardiology';
    } else if (systolic >= 140) {
        riskScore += 15;
        riskFactors.push('Hypertension Stage 1');
        explanation.push({
            factor: 'Blood Pressure',
            finding: `${systolic}/${diastolic} mmHg (Stage 1 Elevation)`,
            impact: 'LOW'
        });
    } else {
        explanation.push({
            factor: 'Blood Pressure',
            finding: `${systolic}/${diastolic} mmHg (Within Normal Limits)`,
            impact: 'LOW'
        });
    }

    // 3. Core Temperature
    if (temp >= 104) {
        riskScore += 35;
        riskFactors.push('Critical Hyperpyrexia (≥104°F)');
        explanation.push({
            factor: 'Core Body Temperature',
            finding: `${temp}°F (Severe Hyperpyrexia)`,
            impact: 'HIGH'
        });
    } else if (temp >= 102) {
        riskScore += 20;
        riskFactors.push('High Fever (>102°F)');
        explanation.push({
            factor: 'Core Body Temperature',
            finding: `${temp}°F (Marked Pyrexia)`,
            impact: 'MEDIUM'
        });
    } else if (temp >= 100.4) {
        riskScore += 10;
        riskFactors.push('Mild Pyrexia');
        explanation.push({
            factor: 'Core Body Temperature',
            finding: `${temp}°F (Mild Pyrexia Detected)`,
            impact: 'LOW'
        });
    } else {
        explanation.push({
            factor: 'Core Body Temperature',
            finding: `${temp}°F (Afebrile)`,
            impact: 'LOW'
        });
    }

    // 4. Pulse / Heart Rate
    if (heartRate > 130 || heartRate < 40) {
        riskScore += 35;
        riskFactors.push('Critical Pulse Abnormality');
        explanation.push({
            factor: 'Heart Rate / Pulse',
            finding: `${heartRate} bpm (Significant Dysrhythmia / Tachycardia)`,
            impact: 'HIGH'
        });
        if (department === 'General Medicine') department = 'Cardiology';
    } else if (heartRate > 105) {
        riskScore += 15;
        riskFactors.push('Tachycardia');
        explanation.push({
            factor: 'Heart Rate / Pulse',
            finding: `${heartRate} bpm (Sinus Tachycardia)`,
            impact: 'MEDIUM'
        });
    }

    // 5. Symptom Matches
    const symptomMap = [
        { keys: ['chest pain', 'crushing', 'arm pain'], weight: 50, dept: 'Cardiology', factor: 'Potential Acute Coronary Syndrome', title: 'Cardiac Presentation' },
        { keys: ['breath', 'shortness', 'suffocat', 'wheez'], weight: 45, dept: 'Pulmonology', factor: 'Respiratory Distress', title: 'Respiratory Profile' },
        { keys: ['stroke', 'paralysis', 'facial drooping', 'slurred'], weight: 65, dept: 'Neurology', factor: 'Acute Neurovascular Event (Stroke)', title: 'Neurological Deficit' },
        { keys: ['bleed', 'hemorrhage', 'cut'], weight: 40, dept: 'Trauma / ER', factor: 'Active Hemorrhage Risk', title: 'Hemorrhage Risk' },
        { keys: ['abdominal', 'stomach', 'vomit'], weight: 25, dept: 'Gastroenterology', factor: 'Acute Abdominal Syndrome', title: 'Gastrointestinal Presentation' },
        { keys: ['fracture', 'broken', 'fall', 'bone'], weight: 35, dept: 'Orthopedics', factor: 'Orthopedic Trauma', title: 'Musculoskeletal Injury' },
        { keys: ['cancer', 'chem', 'tumor'], weight: 40, dept: 'Oncology', factor: 'Oncology Related Complication', title: 'Malignancy Complication' },
        { keys: ['confusion', 'conscious', 'fainting'], weight: 45, dept: 'Neurology', factor: 'Altered Mental Status', title: 'Consciousness Level' }
    ];

    symptomMap.forEach(item => {
        if (item.keys.some(k => symptoms.includes(k))) {
            riskScore += item.weight;
            riskFactors.push(item.factor);
            explanation.push({
                factor: item.title,
                finding: `Reported symptoms: "${data.symptoms}"`,
                impact: item.weight >= 40 ? 'HIGH' : 'MEDIUM'
            });
            if (department === 'General Medicine' || item.weight >= 40) department = item.dept;
        }
    });

    // 6. Medical History & Chronic Comorbidities
    if (history.includes('cancer')) {
        riskScore += 25;
        riskFactors.push('History of Malignancy');
        explanation.push({ factor: 'Medical History', finding: 'Documented history of malignancy', impact: 'MEDIUM' });
        if (department === 'General Medicine') department = 'Oncology';
    }
    if (history.includes('heart disease')) {
        riskScore += 20;
        riskFactors.push('Cardiac History');
        explanation.push({ factor: 'Medical History', finding: 'Prior cardiac disease adds acuity', impact: 'MEDIUM' });
        if (department === 'General Medicine') department = 'Cardiology';
    }
    if (history.includes('diabetes')) {
        riskScore += 15;
        riskFactors.push('Diabetes Comorbidity');
        explanation.push({ factor: 'Medical History', finding: 'Diabetes comorbidity adds clinical vulnerability', impact: 'MEDIUM' });
    }

    if (context.allergies && context.allergies.length > 0) {
        const allergyStr = Array.isArray(context.allergies) ? context.allergies.join(', ') : String(context.allergies);
        explanation.push({ factor: 'Allergies Profile', finding: `Documented allergies: ${allergyStr}`, impact: 'LOW' });
    }

    if (age >= 80) {
        riskScore += 20;
        explanation.push({ factor: 'Geriatric Acuity', finding: `Age ${age} yrs increases physiological vulnerability`, impact: 'MEDIUM' });
    } else if (age <= 2) {
        riskScore += 15;
        explanation.push({ factor: 'Pediatric Acuity', finding: `Age ${age} yrs requires specialized pediatric assessment`, impact: 'MEDIUM' });
    }

    const priorityScore = Math.min(100, Math.max(15, Math.floor(riskScore)));
    const priority = priorityScore >= 75 ? 'CRITICAL' : (priorityScore >= 50 ? 'HIGH' : (priorityScore >= 28 ? 'MODERATE' : 'LOW'));
    const riskLevel = priority === 'CRITICAL' || priority === 'HIGH' ? 'High' : (priority === 'LOW' ? 'Low' : 'Medium');

    const topFindings = explanation.slice(0, 3).map(e => `${e.factor}: ${e.finding}`).join('. ');
    const clinicalSummary = `Deterministic clinical decision rules stratified this patient as ${priority} urgency (Score: ${priorityScore}/100). Physiological findings: ${topFindings}.`;

    return {
        priority,
        priorityScore,
        riskLevel,
        riskScore: priorityScore,
        confidence: 94,
        department,
        departmentReason: `Assigned to ${department} based on vital abnormalities and clinical presentation guidelines.`,
        clinicalSummary,
        keyRiskFactors: riskFactors.length > 0 ? riskFactors.slice(0, 5) : ['Vitals baseline within standard triage observation limits'],
        explanation: explanation.slice(0, 5),
        recommendedNextStep: priorityScore >= 75 ? 'Immediate resuscitation bay admission and clinician assessment.' : 'Proceed to bedside clinical evaluation.',
        modelUsed: 'Clinical Rules',
        engine: 'Clinical Decision Support Rules',
        modelStatus: 'LOCAL FALLBACK',
        modelPath: [
            'XGBoost Triage Model (Unavailable/Timeout)',
            'Gemini Clinical Reasoning (Key Missing/Error)',
            'Clinical Decision Support Rules (Active Safety Net)'
        ],
        disclaimer: 'Decision support only; final clinical decision remains with qualified hospital staff.'
    };
}

/**
 * Multi-Tier Triage Orchestrator:
 * Primary: XGBoost ML Model -> Fallback: Gemini LLM Clinical Reasoning -> Safety Net: Clinical Rules
 */
async function orchestrateTriage(patientData, patientContext = {}) {
    // Tier 1: Primary XGBoost ML Model
    console.log('[Triage] Step 1: Evaluating primary XGBoost triage model...');
    try {
        const xgbResult = await predictWithXGBoost(patientData);
        if (xgbResult) {
            console.log(`[Triage] Primary XGBoost prediction successful: ${xgbResult.priority} (${xgbResult.confidence}%)`);
            const routing = recommendDepartment(patientData, xgbResult);
            return {
                ...xgbResult,
                department: xgbResult.department || routing.department,
                departmentReason: xgbResult.departmentReason || routing.reason,
                recommendedDepartment: xgbResult.department || routing.department,
                routingReason: xgbResult.departmentReason || routing.reason,
                routingPriorityScore: xgbResult.priorityScore,
                riskLevel: xgbResult.priority === 'CRITICAL' || xgbResult.priority === 'HIGH' ? 'High' : xgbResult.priority === 'LOW' ? 'Low' : 'Medium',
                riskScore: xgbResult.priorityScore,
            };
        }
    } catch (xgbErr) {
        console.warn('[Triage] Primary XGBoost model error:', xgbErr.message);
    }

    // Tier 2: Gemini LLM Clinical Reasoning Engine
    const hasGeminiKey = !!(process.env.LLM_KEY || process.env.GEMINI_API_KEY);
    console.log(`[Triage] Step 2: Checking Gemini LLM Fallback (Key present: ${hasGeminiKey})...`);
    if (hasGeminiKey) {
        try {
            const geminiResult = await performLLMTriage(patientData, patientContext);
            if (geminiResult) {
                console.log(`[Triage] Gemini Clinical Reasoning successful: ${geminiResult.priority} (${geminiResult.confidence}%)`);
                const routing = recommendDepartment(patientData, geminiResult);
                return {
                    ...geminiResult,
                    department: geminiResult.department || routing.department,
                    recommendedDepartment: geminiResult.department || routing.department,
                    departmentReason: geminiResult.departmentReason || routing.reason,
                    routingReason: geminiResult.departmentReason || routing.reason,
                    routingPriorityScore: geminiResult.priorityScore,
                    riskLevel: geminiResult.priority === 'CRITICAL' || geminiResult.priority === 'HIGH' ? 'High' : geminiResult.priority === 'LOW' ? 'Low' : 'Medium',
                    riskScore: geminiResult.priorityScore,
                };
            }
        } catch (geminiErr) {
            console.error('[Triage] Gemini Clinical Reasoning failed:', geminiErr.message);
        }
    }

    // Tier 3: Safety Net Deterministic Clinical Rules
    console.log('[Triage] Step 3: Using Local Clinical Rule-Based Engine (Safety Net Fallback)...');
    const fallback = getFallbackTriageResult(patientData, patientContext);
    const routing = recommendDepartment(patientData, fallback);
    return {
        ...fallback,
        department: fallback.department || routing.department,
        recommendedDepartment: fallback.department || routing.department,
        departmentReason: fallback.departmentReason || routing.reason,
        routingReason: fallback.departmentReason || routing.reason,
        routingPriorityScore: fallback.priorityScore || routing.priorityScore,
    };
}

const inMemoryPatients = [];

router.get('/', async (req, res) => {
    try {
        const { date, startDate, endDate, filter, status, ownerEmail } = req.query;
        let query = {};

        if (ownerEmail) {
            query.ownerEmail = ownerEmail;
        } else {
            console.warn('[Triage] Request with no ownerEmail');
        }

        if (status) query.status = status;

        if (mongoose.connection.readyState !== 1) {
            let list = [...inMemoryPatients];
            if (ownerEmail) list = list.filter(p => p.ownerEmail === ownerEmail);
            if (status) list = list.filter(p => p.status === status);
            return res.json(list.reverse());
        }

        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const endOfDay = new Date(now.setHours(23, 59, 59, 999));

        if (filter) {
            switch (filter) {
                case 'today':
                    query.createdAt = { $gte: startOfDay, $lte: endOfDay };
                    break;
                case 'yesterday':
                    const yesterdayStart = new Date(startOfDay);
                    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
                    const yesterdayEnd = new Date(endOfDay);
                    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
                    query.createdAt = { $gte: yesterdayStart, $lte: yesterdayEnd };
                    break;
                case 'last7':
                    const last7Start = new Date(startOfDay);
                    last7Start.setDate(last7Start.getDate() - 7);
                    query.createdAt = { $gte: last7Start, $lte: endOfDay };
                    break;
                case 'last30':
                    const last30Start = new Date(startOfDay);
                    last30Start.setDate(last30Start.getDate() - 30);
                    query.createdAt = { $gte: last30Start, $lte: endOfDay };
                    break;
            }
        } else if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            query.createdAt = { $gte: start, $lte: end };
        } else if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.createdAt = { $gte: start, $lte: end };
        }

        const patients = await Patient.find(query).sort({ createdAt: -1 });
        res.json(patients);
    } catch (error) {
        console.error('Fetch Patients Error:', error);
        const list = inMemoryPatients.filter(p => !req.query.ownerEmail || p.ownerEmail === req.query.ownerEmail);
        res.json(list.reverse());
    }
});

// Quick check that triage API is reachable
router.get('/status', (req, res) => {
    res.json({
        ok: true,
        service: 'triage',
        xgboostScriptAvailable: fs.existsSync(path.resolve(__dirname, '../Trained_data/main.py')),
        llmKeyConfigured: !!(process.env.LLM_KEY || process.env.GEMINI_API_KEY)
    });
});

/**
 * POST /api/triage/analyze
 * Direct clinical analysis endpoint using XGBoost -> Gemini -> Rules fallback orchestration
 */
router.post('/analyze', async (req, res) => {
    console.log('[Triage] POST /api/triage/analyze received');
    try {
        const { patientContext, ownerEmail, ...patientData } = req.body;
        const error = validatePatientData(patientData);
        if (error) {
            return res.status(400).json({ error });
        }

        const assessment = await orchestrateTriage(patientData, patientContext || {});
        return res.json(assessment);
    } catch (err) {
        console.error('[Triage] Analyze error:', err);
        return res.status(500).json({ error: 'Failed to analyze patient presentation: ' + err.message });
    }
});

// SAVE patient assessment to database
router.post('/save', async (req, res) => {
    console.log('[Triage] POST /save received');
    try {
        const { patientData, assessment, ownerEmail, patientContext } = req.body;

        if (!patientData || !assessment || !ownerEmail) {
            return res.status(400).json({ error: 'Missing patient data, assessment result, or owner email' });
        }

        const context = patientContext || patientData.patientContext || {};
        const allergies = Array.isArray(context.allergies) ? context.allergies : (context.allergies ? [context.allergies] : []);
        const medications = Array.isArray(context.medications) ? context.medications : (context.medications ? [context.medications] : []);
        const chronicConditions = Array.isArray(context.chronicConditions) ? context.chronicConditions : (context.chronicConditions ? [context.chronicConditions] : (patientData.history || []));
        const lastVisit = context.lastVisit || patientData.lastVisit || '';
        const emergencyContact = context.emergencyContact || patientData.emergencyContact || null;

        if (mongoose.connection.readyState !== 1) {
            const existingIndex = inMemoryPatients.findIndex(
                p => p.patientId === patientData.patientId && p.ownerEmail === ownerEmail
            );
            if (existingIndex >= 0) {
                inMemoryPatients[existingIndex].status = 'Admitted';
                inMemoryPatients[existingIndex].assessment = assessment;
                inMemoryPatients[existingIndex].allergies = allergies;
                inMemoryPatients[existingIndex].medications = medications;
                inMemoryPatients[existingIndex].chronicConditions = chronicConditions;
                inMemoryPatients[existingIndex].lastVisit = lastVisit;
                inMemoryPatients[existingIndex].emergencyContact = emergencyContact;
                inMemoryPatients[existingIndex].patientContext = context;
                return res.status(200).json({ success: true, message: 'Patient admission confirmed', id: inMemoryPatients[existingIndex]._id });
            }
            const record = {
                _id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                patientId: patientData.patientId,
                name: patientData.name,
                age: patientData.age,
                gender: patientData.gender,
                phone: patientData.phone,
                bloodGroup: patientData.bloodGroup,
                vitals: {
                    temperature: patientData.temperature,
                    heartRate: patientData.heartRate,
                    bloodPressure: patientData.bloodPressure,
                    oxygenLevel: patientData.oxygenLevel
                },
                symptoms: patientData.symptoms,
                history: patientData.history,
                allergies,
                medications,
                chronicConditions,
                lastVisit,
                emergencyContact,
                patientContext: context,
                assessment: assessment,
                status: 'Admitted',
                ownerEmail: ownerEmail,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            inMemoryPatients.push(record);
            return res.status(201).json({ success: true, message: 'Patient admission confirmed and saved', id: record._id });
        }

        let record = await Patient.findOne({
            patientId: patientData.patientId,
            ownerEmail: ownerEmail
        });

        if (record) {
            record.status = 'Admitted';
            record.assessment = assessment;
            record.allergies = allergies;
            record.medications = medications;
            record.chronicConditions = chronicConditions;
            record.lastVisit = lastVisit;
            record.emergencyContact = emergencyContact;
            record.patientContext = context;
            await record.save();
            console.log(`[DB] Updated status to Admitted for ${patientData.name}`);
            return res.status(200).json({ success: true, message: 'Patient admission confirmed', id: record._id });
        }

        const newPatient = new Patient({
            patientId: patientData.patientId,
            name: patientData.name,
            age: patientData.age,
            gender: patientData.gender,
            phone: patientData.phone,
            bloodGroup: patientData.bloodGroup,
            vitals: {
                temperature: patientData.temperature,
                heartRate: patientData.heartRate,
                bloodPressure: patientData.bloodPressure,
                oxygenLevel: patientData.oxygenLevel
            },
            symptoms: patientData.symptoms,
            history: patientData.history,
            allergies,
            medications,
            chronicConditions,
            lastVisit,
            emergencyContact,
            patientContext: context,
            assessment: assessment,
            status: 'Admitted',
            ownerEmail: ownerEmail
        });

        await newPatient.save();
        console.log(`[DB] Successfully created admitted patient record for ${patientData.name}`);
        res.status(201).json({ success: true, message: 'Patient admission confirmed and saved', id: newPatient._id });
    } catch (error) {
        console.error('[DB] Save Error:', error);
        res.status(500).json({ error: 'Failed to confirm patient admission' });
    }
});

// UPDATE patient status (e.g., mark as Completed)
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) return res.status(400).json({ error: 'Status is required' });

        if (mongoose.connection.readyState !== 1) {
            const patient = inMemoryPatients.find(p => p._id === req.params.id);
            if (patient) {
                patient.status = status;
                patient.departmentQueueStatus = status === 'Completed' ? 'Completed' : 'In Progress';
                return res.json({ success: true, patient });
            }
        }

        const patient = await Patient.findByIdAndUpdate(
            req.params.id,
            { status, departmentQueueStatus: status === 'Completed' ? 'Completed' : 'In Progress' },
            { new: true }
        );

        if (!patient) return res.status(404).json({ error: 'Patient not found' });

        console.log(`[DB] Updated status to ${status} for patient ${patient.name}`);
        res.json({ success: true, patient });
    } catch (error) {
        console.error('Update Status Error:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// POST /api/triage/assess (Automated Flow: Assess + Store + PDF)
router.post('/assess', async (req, res) => {
    console.log('[Triage] POST /assess received - Automated Flow');
    try {
        const { ownerEmail, patientContext, ...patientData } = req.body;

        if (!ownerEmail) {
            return res.status(400).json({ error: 'ownerEmail is required for assessment' });
        }

        const error = validatePatientData(patientData);
        if (error) {
            return res.status(400).json({ error });
        }

        const finalResult = await orchestrateTriage(patientData, patientContext || {});

        const context = patientContext || patientData.patientContext || {};
        const allergies = Array.isArray(context.allergies) ? context.allergies : (context.allergies ? [context.allergies] : []);
        const medications = Array.isArray(context.medications) ? context.medications : (context.medications ? [context.medications] : []);
        const chronicConditions = Array.isArray(context.chronicConditions) ? context.chronicConditions : (context.chronicConditions ? [context.chronicConditions] : (patientData.history || []));
        const lastVisit = context.lastVisit || patientData.lastVisit || '';
        const emergencyContact = context.emergencyContact || patientData.emergencyContact || null;

        if (mongoose.connection.readyState !== 1) {
            const memRecord = {
                _id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                patientId: patientData.patientId || `P-${Math.floor(1000 + Math.random() * 9000)}`,
                name: patientData.name || 'Anonymous',
                age: patientData.age,
                gender: patientData.gender,
                phone: patientData.phone,
                bloodGroup: patientData.bloodGroup,
                vitals: {
                    temperature: patientData.temperature,
                    heartRate: patientData.heartRate,
                    bloodPressure: patientData.bloodPressure,
                    oxygenLevel: patientData.oxygenLevel
                },
                symptoms: patientData.symptoms,
                history: patientData.history,
                allergies,
                medications,
                chronicConditions,
                lastVisit,
                emergencyContact,
                patientContext: context,
                assessment: {
                    ...finalResult,
                    riskMarkers: finalResult.keyRiskFactors || finalResult.riskFactors
                },
                assignedDepartment: finalResult.department,
                routingReason: finalResult.departmentReason,
                routingPriorityScore: finalResult.priorityScore,
                departmentQueueStatus: 'Waiting',
                status: 'Waiting',
                ownerEmail: ownerEmail,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            inMemoryPatients.push(memRecord);
            console.log(`[Memory] Auto-saved record for ${memRecord.name}`);
            return res.json({
                ...finalResult,
                dbId: memRecord._id,
                storedRecord: memRecord
            });
        }

        try {
            const newPatient = new Patient({
                patientId: patientData.patientId || `P-${Math.floor(1000 + Math.random() * 9000)}`,
                name: patientData.name || 'Anonymous',
                age: patientData.age,
                gender: patientData.gender,
                phone: patientData.phone,
                bloodGroup: patientData.bloodGroup,
                vitals: {
                    temperature: patientData.temperature,
                    heartRate: patientData.heartRate,
                    bloodPressure: patientData.bloodPressure,
                    oxygenLevel: patientData.oxygenLevel
                },
                symptoms: patientData.symptoms,
                history: patientData.history,
                allergies,
                medications,
                chronicConditions,
                lastVisit,
                emergencyContact,
                patientContext: context,
                assessment: {
                    ...finalResult,
                    riskMarkers: finalResult.keyRiskFactors || finalResult.riskFactors
                },
                assignedDepartment: finalResult.department,
                routingReason: finalResult.departmentReason,
                routingPriorityScore: finalResult.priorityScore,
                departmentQueueStatus: 'Waiting',
                status: 'Waiting',
                ownerEmail: ownerEmail
            });

            console.log('[Triage] Generating EHR PDF...');
            const pdfPath = await generateEHRPDF(patientData, finalResult);
            newPatient.pdfPath = pdfPath;

            await newPatient.save();
            console.log(`[DB] Auto-saved record and PDF for ${newPatient.name}`);

            return res.json({
                ...finalResult,
                assignedDepartment: finalResult.department,
                routingReason: finalResult.departmentReason,
                routingPriorityScore: finalResult.priorityScore,
                priorityScore: finalResult.priorityScore,
                dbId: newPatient._id,
                pdfUrl: pdfPath,
                storedRecord: newPatient
            });

        } catch (storageErr) {
            console.error('[Triage] Automated Storage/PDF Error:', storageErr.message);
            return res.json({
                ...finalResult,
                storageError: storageErr.message
            });
        }

    } catch (error) {
        console.error('Triage Route Error:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

module.exports = router;
