const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Perform medical triage reasoning using Gemini LLM (Primary Fallback Engine)
 * @param {Object} patientData Core patient vitals and demographics
 * @param {Object} patientContext Extended context (allergies, medications, chronic conditions, last visit, emergency contact)
 * @returns {Promise<Object>}
 */
async function performLLMTriage(patientData, patientContext = {}) {
    const apiKey = process.env.LLM_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("LLM_KEY / GEMINI_API_KEY is missing from server environment");
    }

    const keyHint = `${apiKey.substring(0, 8)}...`;
    console.log(`[AI-DIAGNOSTIC] Initializing Gemini Clinical Reasoning Engine with Key: ${keyHint}`);

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelNames = [
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-2.0-flash",
        "gemini-1.5-flash"
    ];
    let lastError = null;

    const normalizedPayload = {
        patient: {
            age: parseInt(patientData.age, 10) || 30,
            gender: patientData.gender || 'Unknown',
            bloodGroup: patientData.bloodGroup || 'Unknown',
            allergies: Array.isArray(patientContext.allergies) ? patientContext.allergies : (patientContext.allergies ? [patientContext.allergies] : []),
            medications: Array.isArray(patientContext.medications) ? patientContext.medications : (patientContext.medications ? [patientContext.medications] : []),
            chronicConditions: Array.isArray(patientContext.chronicConditions) ? patientContext.chronicConditions : (patientContext.chronicConditions ? [patientContext.chronicConditions] : (patientData.history || [])),
            lastVisit: patientContext.lastVisit || '',
            emergencyContact: patientContext.emergencyContact || null,
        },
        vitals: {
            temperature: parseFloat(patientData.temperature) || 98.6,
            pulse: parseInt(patientData.heartRate, 10) || 72,
            bloodPressure: String(patientData.bloodPressure || '120/80'),
            spo2: parseInt(patientData.oxygenLevel, 10) || 98
        },
        symptoms: Array.isArray(patientData.symptoms) ? patientData.symptoms : [String(patientData.symptoms || '')],
        medicalHistory: Array.isArray(patientData.history) ? patientData.history : []
    };

    const prompt = `
ROLE & IDENTITY:
You are the "Clinical Decision-Support Reasoning Engine for Bharat PulseLink."
You provide structured clinical prioritization and explainable routing assistance to trained hospital triage clinicians.
You are NOT an autonomous doctor. You must NOT diagnose diseases with certainty, prescribe medicines, recommend treatments, fabricate vitals, or invent unsupplied records. If any factor lacks sufficient information, state "Insufficient information for this factor."

SUPPLIED PATIENT RECORD (STRICT GROUND TRUTH - DO NOT HALLUCINATE):
${JSON.stringify(normalizedPayload, null, 2)}

CLINICAL GUIDELINES & ACUITY STRATIFICATION (ESI v4.0):
- CRITICAL: SpO2 < 88%, Systolic BP > 200 or < 80, HR > 140 or < 40, active respiratory failure, unconsciousness.
- HIGH: SpO2 88-92%, Systolic BP 180-200, HR 110-140, acute chest pain, stroke-like focal deficits, severe respiratory distress, acute abdominal crisis with fever.
- MODERATE: SpO2 93-95%, Systolic BP 140-179, temp > 101°F with stable hemodynamics, multiple complex comorbidities (e.g., uncontrolled diabetes).
- LOW: Stable vitals (SpO2 > 96%, HR 60-100, BP normal), minor complaints, routine care.

REQUIRED JSON OUTPUT SCHEMA (RETURN STRICT JSON ONLY - NO MARKDOWN OR BACKTICKS):
{
  "priority": "CRITICAL" | "HIGH" | "MODERATE" | "LOW",
  "priorityScore": <integer between 0 and 100>,
  "department": "<Appropriate Hospital Department, e.g. Emergency Medicine | Cardiology | Pulmonology | General Medicine | Neurology | Trauma / ER>",
  "departmentReason": "<Concise 1-2 sentence medical explanation of why this specific department was selected based strictly on the patient's vitals and symptoms>",
  "clinicalSummary": "<Concise 2-3 sentence overview explaining why the patient has been prioritized at this moment>",
  "keyRiskFactors": [
    "<High-impact finding 1>",
    "<High-impact finding 2>"
  ],
  "explanation": [
    {
      "factor": "<Clinical Parameter, e.g. Oxygen Saturation | Blood Pressure | Core Body Temperature | Medical Context>",
      "finding": "<Exact observed value from patient, e.g. SpO2 85% | 210 mmHg | 100.6°F | History of Diabetes>",
      "impact": "HIGH" | "MEDIUM" | "LOW"
    }
  ],
  "recommendedNextStep": "<Immediate clinical workflow recommendation, e.g. Immediate bedside evaluation & continuous pulse oximetry>",
  "confidence": <integer between 75 and 99>,
  "modelUsed": "Gemini",
  "disclaimer": "Decision support only; final clinical decision remains with qualified hospital staff."
}
`;

    for (const modelName of modelNames) {
        try {
            console.log(`[AI-DIAGNOSTIC] Attempting Gemini analysis with ${modelName}...`);
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.1,
                }
            });

            const result = await model.generateContent(prompt);
            const text = result.response.text();
            const cleanText = text.replace(/```json|```/g, "").trim();
            const parsed = JSON.parse(cleanText);

            // Normalize priority and scores
            const priority = (parsed.priority || 'MODERATE').toUpperCase();
            const priorityScore = typeof parsed.priorityScore === 'number' ? Math.min(100, Math.max(0, parsed.priorityScore)) : 65;
            const confidence = typeof parsed.confidence === 'number' ? Math.min(100, Math.max(50, parsed.confidence)) : 94;

            return {
                priority: ['CRITICAL', 'HIGH', 'MODERATE', 'LOW'].includes(priority) ? priority : 'HIGH',
                priorityScore,
                department: parsed.department || 'General Medicine',
                departmentReason: parsed.departmentReason || 'Recommended based on presenting clinical presentation.',
                clinicalSummary: parsed.clinicalSummary || 'Clinical prioritization generated based on vital signs and symptoms.',
                keyRiskFactors: Array.isArray(parsed.keyRiskFactors) ? parsed.keyRiskFactors : [],
                explanation: Array.isArray(parsed.explanation) ? parsed.explanation : [],
                recommendedNextStep: parsed.recommendedNextStep || 'Proceed with standard triage evaluation.',
                confidence,
                modelUsed: 'Gemini',
                engine: 'Gemini Clinical Reasoning',
                modelStatus: 'FALLBACK ACTIVE',
                modelPath: [
                    'XGBoost Triage Model (Unavailable/Timeout)',
                    'Gemini Clinical Reasoning'
                ],
                disclaimer: 'Decision support only; final clinical decision remains with qualified hospital staff.'
            };
        } catch (err) {
            console.error(`[AI-ERROR] ${modelName} failed:`, err.message);
            lastError = err;
        }
    }
    throw lastError;
}

/**
 * Parse raw text from an EHR/medical record and extract structured patient data.
 * @param {string} text Raw text extracted from PDF/Doc/etc.
 * @returns {Promise<Object>} Structured patient data
 */
async function parseEHRText(text) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured");
    }
    if (!text || text.trim().length < 10) {
        return {};
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
    You are a medical data extraction assistant. I will provide you with raw text from a medical record or Electronic Health Record (EHR). 
    Extract the following information into a structured JSON format. 
    If a field is not found, use null or an empty array as appropriate.

    FIELDS TO EXTRACT:
    - name: Patient's full name
    - age: Patient's age (numeric value in years)
    - gender: Patient's gender (male/female/other)
    - phone: Contact number
    - bloodGroup: Blood group (e.g., O+, A-, etc.)
    - temperature: Body temperature in °F (convert if in °C)
    - heartRate: Pulse/Heart rate in BPM
    - bloodPressure: Blood pressure (e.g., 120/80)
    - oxygenLevel: Oxygen saturation SpO2 in %
    - symptoms: Description of current symptoms/complaints
    - history: Array of previous medical conditions/history

    TEXT TO PARSE:
    ${text}

    OUTPUT SCHEMA:
    Return ONLY a valid JSON object matching the fields above, nothing else.
    `;

    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const cleanText = responseText.replace(/```json|```/g, "").trim();
        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Gemini EHR Parsing Error:", error);
        throw new Error("Failed to extract medical data from text using AI: " + error.message);
    }
}

module.exports = {
    performLLMTriage,
    parseEHRText
};
