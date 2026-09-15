const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Perform medical triage using Gemini LLM
 * @param {Object} patientData 
 * @returns {Promise<Object>}
 */
async function performLLMTriage(patientData) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is missing from server environment");
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const keyHint = apiKey ? `${apiKey.substring(0, 8)}...` : "MISSING";
    console.log(`[AI-DIAGNOSTIC] Initializing Gemini with Key: ${keyHint}`);

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelNames = [
        "gemini-2.0-flash",
        "gemini-1.5-flash-8b",
        "gemini-1.5-flash",
        "gemini-1.5-pro"
    ];
    let lastError = null;

    for (const modelName of modelNames) {
        try {
            console.log(`[AI-DIAGNOSTIC] Attempting analysis with ${modelName}...`);
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: { responseMimeType: "application/json" }
            });

            const prompt = `
            ROLE: Senior Emergency Medicine Specialist & Clinical Decision Support AI.
            TASK: Perform emergency medical triage based on ESI (Emergency Severity Index) v4.0.

            PATIENT VITALS:
            - Age: ${patientData.age}
            - Gender: ${patientData.gender}
            - Temp: ${patientData.temperature}°F
            - Pulse: ${patientData.heartRate} BPM
            - BP: ${patientData.bloodPressure} mmHg
            - SpO2: ${patientData.oxygenLevel}%

            CLINICAL CONTEXT:
            - Symptoms: ${patientData.symptoms}
            - History: ${JSON.stringify(patientData.history)}

            STRICT MEDICAL CRITERIA:
            1. LEVEL 1 (CRITICAL): SpO2 < 88%, Systolic BP > 200, HR > 140, or GCS < 8.
            2. LEVEL 2 (EMERGENT): Systolic BP > 180, chest pain, stroke signs, or severe respiratory distress.
            3. LEVEL 3 (URGENT): Mild vitals changes, requires multiple resources.

            OUTPUT SCHEMA (JSON ONLY):
            {
                "riskLevel": "Low | Medium | High",
                "riskScore": 0-100,
                "confidence": 0.0-1.0,
                "department": "Specialized Hospital Dept",
                "explanation": "Professional clinical rationale explaining the physiological risk.",
                "keyRiskFactors": ["Factor A", "Factor B"]
            }
            `;

            const result = await model.generateContent(prompt);
            const text = result.response.text();

            // Clean markdown if present
            const cleanText = text.replace(/```json|```/g, "").trim();
            return JSON.parse(cleanText);
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
