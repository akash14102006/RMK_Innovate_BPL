/**
 * ADVANCED AUTOMATIC DEPARTMENT RECOMMENDATION ENGINE
 * Implements clinical priority routing based on vitals, symptoms, history, and AI assessment.
 */

/**
 * ADVANCED AUTOMATIC DEPARTMENT RECOMMENDATION ENGINE
 * Implements clinical priority routing based on vitals, symptoms, history, and AI assessment.
 * Optimized with NEWS2-inspired scoring and multi-factor weighted analysis.
 */

function recommendDepartment(patientData, aiAssessment) {
    const { age, gender, symptoms, history } = patientData;
    const { riskLevel, riskScore } = aiAssessment;

    // Helper: Parse Vitals - extract from top-level fields
    const temp = parseFloat(patientData.temperature) || 98.6;
    const heartRate = parseFloat(patientData.heartRate) || 80;
    const oxygen = parseFloat(patientData.oxygenLevel) || 98;
    const bp = patientData.bloodPressure || "120/80";
    const [systolic, diastolic] = bp.split('/').map(val => parseFloat(val) || 0);

    const symptomsLower = (symptoms || "").toLowerCase();
    const historyLower = (history || []).join(" ").toLowerCase();

    // --- 1. PHYSIOLOGICAL RISK SCORING (NEWS2-inspired) ---
    // Calculates a baseline clinical urgency score purely from vitals
    let physioScore = 0;

    // Oxygen Saturation
    if (oxygen <= 91) physioScore += 3;
    else if (oxygen <= 93) physioScore += 2;
    else if (oxygen <= 95) physioScore += 1;

    // Heart Rate
    if (heartRate <= 40 || heartRate >= 131) physioScore += 3;
    else if (heartRate >= 111) physioScore += 2;
    else if (heartRate <= 50 || heartRate >= 91) physioScore += 1;

    // Temperature
    if (temp <= 95 || temp >= 102.3) physioScore += 2; // Hypothermia or High Fever
    else if (temp >= 100.5) physioScore += 1;

    // Blood Pressure (Systolic) - Any reading >= 180 is a hypertensive emergency
    if (systolic <= 90 || systolic >= 180) physioScore += 3;
    else if (systolic >= 160) physioScore += 1;

    // Diastolic Crisis check
    if (diastolic >= 110) physioScore += 2;

    const criticalVitals = physioScore >= 3; // NEWS2 standard: 3 points in one parameter = RED risk (Critical)

    // --- 2. DEPARTMENT WEIGHTING SYSTEM ---
    // Assigns scores to departments based on symptom/history matches.
    // The department with the highest score wins, unless Emergency overrides it.

    const deptScores = {
        'Cardiology': 0,
        'Neurology': 0,
        'Pulmonology': 0,
        'Orthopedics': 0,
        'Gastroenterology': 0,
        'Oncology': 0,       // Added for cancer/tumors
        'Nephrology': 0,     // Added for kidney issues
        'Endocrinology': 0,  // Added for diabetes/thyroid
        'Urology': 0,        // Added for urinary issues
        'Psychiatry': 0,     // Added for mental health
        'Pediatrics': 0,
        'Gynecology': 0,
        'Dermatology': 0,
        'ENT': 0,
        'General Medicine': 1 // Baseline
    };

    // Keyword Weights - Enhanced Medical Dictionary
    const rules = [
        // Critical / High Priority Departments
        { dept: 'Cardiology', keywords: ['chest pain', 'palpitation', 'heart', 'angina', 'bps', 'hypertension', 'cardiac', 'myocardial', 'heart attack'], weight: 6, riskBooster: true },
        { dept: 'Neurology', keywords: ['headache', 'dizzy', 'faint', 'stroke', 'seizure', 'numbness', 'slurred', 'vision loss', 'paralysis', 'migraine', 'concussion', 'neuro'], weight: 6, riskBooster: true },
        { dept: 'Oncology', keywords: ['cancer', 'tumor', 'lump', 'carcinoma', 'leukemia', 'lymphoma', 'chemo', 'radiation', 'metastasis', 'malignancy', 'oncologist'], weight: 10, riskBooster: true }, // High weight to ensure cancer detection

        // Specialized Departments
        { dept: 'Nephrology', keywords: ['kidney', 'renal', 'dialysis', 'creatinine', 'urine test', 'nephritis'], weight: 6 },
        { dept: 'Endocrinology', keywords: ['diabetes', 'sugar', 'thyroid', 'hormone', 'insulin', 'gland', 'metabolic'], weight: 5 },
        { dept: 'Urology', keywords: ['urinary', 'bladder', 'prostate', 'urine', 'hematuria', 'uti', 'kidney stone'], weight: 5 },
        { dept: 'Psychiatry', keywords: ['depression', 'anxiety', 'panic', 'suicide', 'mental', 'hallucinat', 'bipolar', 'stress', 'psychotic', 'insomnia'], weight: 5 },

        // Standard Departments
        { dept: 'Pulmonology', keywords: ['cough', 'breath', 'asthma', 'copd', 'pneumonia', 'wheez', 'sob', 'sputum', 'tuberculosis', 'lung', 'bronchitis'], weight: 5 },
        { dept: 'Orthopedics', keywords: ['fracture', 'bone', 'joint', 'back pain', 'knee', 'shoulder', 'trauma', 'fall', 'arthritis', 'muscle tear', 'sprain', 'spine'], weight: 4 },
        { dept: 'Gastroenterology', keywords: ['abdominal', 'stomach', 'vomit', 'diarrhea', 'liver', 'jaundice', 'acid', 'gastric', 'bowel', 'constipation', 'ulcer', 'nausea'], weight: 4 },
        { dept: 'Dermatology', keywords: ['rash', 'skin', 'itch', 'burn', 'allergy', 'lesion', 'acne', 'eczema', 'psoriasis'], weight: 3 },
        { dept: 'ENT', keywords: ['ear', 'throat', 'lose smell', 'nose', 'sinus', 'tonsil', 'hearing', 'vertigo'], weight: 3 },

        // Conditional
        { dept: 'Gynecology', keywords: ['pregnant', 'menstru', 'vagin', 'bleed', 'labor', 'uterus', 'ovary', 'pcos', 'period'], weight: 6, condition: gender === 'Female' }
    ];

    // Apply Rules
    rules.forEach(rule => {
        if (rule.condition === false) return; // Skip if condition fails (e.g. gender)

        rule.keywords.forEach(keyword => {
            if (symptomsLower.includes(keyword) || historyLower.includes(keyword)) {
                deptScores[rule.dept] += rule.weight;
            }
        });
    });

    // Vitals Logic Adjustments
    if (heartRate > 110 || systolic >= 160) deptScores['Cardiology'] += 3;
    if (oxygen < 95) deptScores['Pulmonology'] += 4;
    if (age < 14) deptScores['Pediatrics'] += 10; // Strong bias for pediatrics
    if (age > 70) deptScores['General Medicine'] += 2; // Geriatric bias

    // Find Winner
    let bestDept = 'General Medicine';
    let maxScore = 0;

    Object.entries(deptScores).forEach(([dept, score]) => {
        if (score > maxScore) {
            maxScore = score;
            bestDept = dept;
        }
    });

    // --- 3. FINAL DECISION Logic ---

    // EMERGENCY OVERRIDE
    // If physiological risk is high OR specific critical symptoms are present -> Emergency
    const emergencyTriggers =
        symptomsLower.includes("chest pain") ||
        symptomsLower.includes("unconscious") ||
        symptomsLower.includes("stroke") ||
        symptomsLower.includes("severe bleed");

    if (criticalVitals || (emergencyTriggers && maxScore < 8) || riskLevel === 'High') {
        const primaryReason = criticalVitals ? "Critical vitals detected (NEWS2 Score High)" : "High-risk symptoms requiring immediate intervention";

        // If we have a specific high-scoring department (like Cardiology), we route to "Specialty / Emergency"
        // Otherwise just "Emergency"
        if (maxScore > 3 && bestDept !== 'General Medicine') {
            return {
                department: `${bestDept} / Emergency`, // E.g., "Cardiology / Emergency"
                reason: `${primaryReason}. Suspected ${bestDept} emergency.`,
                priorityScore: 10,
                status: "Waiting" // High priority waiting
            };
        }

        return {
            department: "Emergency / ICU",
            reason: primaryReason,
            priorityScore: 10,
            status: "Waiting"
        };
    }

    // Standard Routing
    return {
        department: bestDept,
        reason: `Clinical score: ${maxScore}. Matched based on presenting symptoms and history.`,
        priorityScore: Math.min(maxScore + physioScore, 9), // Cap at 9, 10 is reserved for emergency
        status: "Waiting"
    };
}

module.exports = { recommendDepartment };

/* updated */
