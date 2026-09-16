import { getCurrentUser } from "./authService";
import { userApiKeyService } from "./userApiKeyService";

export interface ExplainableFactor {
    factor: string;
    finding: string;
    impact: "HIGH" | "MEDIUM" | "LOW";
}

export interface ClinicalFinding {
    label: string;
    value?: string;
    impact: "HIGH" | "MEDIUM" | "LOW";
}

export interface PatientContextData {
    allergies: string[];
    medications: string[];
    chronicConditions: string[];
    lastVisit: string;
    emergencyContact: {
        name: string;
        relationship: string;
        phone?: string;
    } | null;
}

export interface TriageResult {
    patientId: string;
    patientName?: string;
    riskLevel: "Critical" | "High" | "Moderate" | "Low" | string;
    priority: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
    confidence: number;
    riskScore: number;
    decisionEngine: string;
    modelStatus: string;
    modelUsed?: string;

    riskFactors: string[];

    explanation: string;
    prioritizationSummary?: string;
    recommendedNextStep?: string;

    department: string;
    departmentLocation: string;
    routingReason: string;

    clinicalEvidence: {
        findings: Array<{
            label: string;
            value?: string;
            impact: "HIGH" | "MEDIUM" | "LOW";
        }>;
        recommendedChecks: string[];
    };

    isSimulated?: boolean;
    pdfUrl?: string;
    dbId?: string;

    storedRecord?: {
        status?: string;
        [key: string]: any;
    };
}

export type TriageAssessmentResult = TriageResult;

export interface PatientRecord {
    _id: string;
    patientId: string;
    name: string;
    age: number;
    gender: string;
    phone: string;
    bloodGroup: string;
    vitals: {
        temperature: string;
        heartRate: string;
        bloodPressure: string;
        oxygenLevel: string;
    };
    symptoms: string;
    history: string[];
    allergies?: string[];
    medications?: string[];
    chronicConditions?: string[];
    lastVisit?: string;
    emergencyContact?: {
        name: string;
        relationship: string;
        phone?: string;
    } | null;
    patientContext?: PatientContextData;
    assessment: TriageResult;
    status: "Waiting" | "Admitted" | "Completed";
    assignedDepartment?: string;
    routingReason?: string;
    routingPriorityScore?: number;
    departmentQueueStatus?: "Waiting" | "In Progress" | "Completed";
    pdfPath?: string;
    ownerEmail: string;
    createdAt: string;
}

export function getDepartmentLocation(dept: string): string {
    const d = (dept || "").toLowerCase().trim();
    if (d.includes("emergency") || d.includes("trauma") || d.includes("resuscitation") || d === "er" || d.startsWith("er ") || d.endsWith(" er")) {
        return "Ground Floor - Emergency Wing / Bay 01-04";
    }
    if (d.includes("cardio") || d.includes("heart")) {
        return "Wing B - 2nd Floor / Cardiac Care Unit (CCU)";
    }
    if (d.includes("pulmon") || d.includes("respiratory") || d.includes("chest")) {
        return "Wing C - 3rd Floor / Respiratory Care Ward";
    }
    if (d.includes("neuro") || d.includes("stroke") || d.includes("brain")) {
        return "Wing A - 4th Floor / Neurovascular Unit";
    }
    if (d.includes("gastro") || d.includes("digestive") || d.includes("abdominal")) {
        return "Wing D - 2nd Floor / Gastroenterology Clinic";
    }
    if (d.includes("ortho") || d.includes("bone") || d.includes("fracture")) {
        return "Wing B - 1st Floor / Musculoskeletal & Ortho OPD";
    }
    if (d.includes("oncol") || d.includes("cancer")) {
        return "Cancer Care Pavilion - 5th Floor";
    }
    return "Main Hospital Building - General OPD Floor 1";
}

/**
 * Normalizes any backend or simulated triage output into the canonical TriageResult shape
 */
export function normalizeTriageResult(raw: any, patientData?: any): TriageResult {
    if (!raw) {
        throw new Error("Invalid empty triage response");
    }

    const priority = (raw.priority || (raw.riskLevel === "High" ? "HIGH" : raw.riskLevel === "Low" ? "LOW" : "MODERATE")).toUpperCase() as "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
    const riskLevel = raw.riskLevel || (priority === "CRITICAL" ? "Critical" : priority === "HIGH" ? "High" : priority === "LOW" ? "Low" : "Moderate");

    const riskScore = typeof raw.riskScore === "number" ? raw.riskScore : (typeof raw.priorityScore === "number" ? raw.priorityScore : (priority === "CRITICAL" ? 88 : priority === "HIGH" ? 68 : priority === "MODERATE" ? 42 : 18));
    const confidence = typeof raw.confidence === "number" ? raw.confidence : (typeof raw.aiConfidence === "number" ? raw.aiConfidence : 94);

    const decisionEngine = raw.engine || raw.decisionEngine || raw.modelUsed || "Clinical Decision Support Rules";
    const modelStatus = raw.modelStatus || (raw.isSimulated ? "LOCAL ENGINE" : "PRIMARY MODEL");

    let riskFactors: string[] = [];
    if (Array.isArray(raw.riskFactors)) {
        riskFactors = raw.riskFactors.map((f: any) => typeof f === "string" ? f : (f?.factor || f?.label || JSON.stringify(f)));
    } else if (Array.isArray(raw.keyRiskFactors)) {
        riskFactors = raw.keyRiskFactors.map((f: any) => typeof f === "string" ? f : (f?.factor || f?.label || JSON.stringify(f)));
    } else if (Array.isArray(raw.riskMarkers)) {
        riskFactors = raw.riskMarkers.map((f: any) => typeof f === "string" ? f : (f?.factor || f?.label || JSON.stringify(f)));
    } else if (typeof raw.riskFactors === "string") {
        riskFactors = [raw.riskFactors];
    }

    let findings: Array<{ label: string; value?: string; impact: "HIGH" | "MEDIUM" | "LOW" }> = [];
    if (raw.clinicalEvidence?.findings && Array.isArray(raw.clinicalEvidence.findings)) {
        findings = raw.clinicalEvidence.findings;
    } else if (Array.isArray(raw.explanation)) {
        findings = raw.explanation.map((item: any) => ({
            label: item.factor || item.title || item.label || "Clinical Parameter",
            value: item.finding || item.value || item.desc || "",
            impact: (item.impact || (priority === "CRITICAL" || priority === "HIGH" ? "HIGH" : "MEDIUM")) as "HIGH" | "MEDIUM" | "LOW"
        }));
    }

    if (findings.length === 0 && patientData) {
        if (patientData.oxygenLevel && Number(patientData.oxygenLevel) < 95) {
            findings.push({ label: "Oxygen Saturation", value: `SpO₂ ${patientData.oxygenLevel}%`, impact: Number(patientData.oxygenLevel) < 90 ? "HIGH" : "MEDIUM" });
        }
        if (patientData.heartRate && (Number(patientData.heartRate) > 100 || Number(patientData.heartRate) < 50)) {
            findings.push({ label: "Heart Rate", value: `${patientData.heartRate} bpm`, impact: "MEDIUM" });
        }
        if (patientData.bloodPressure) {
            findings.push({ label: "Blood Pressure", value: `${patientData.bloodPressure} mmHg`, impact: "MEDIUM" });
        }
        if (patientData.symptoms) {
            findings.push({ label: "Reported Symptoms", value: patientData.symptoms, impact: "LOW" });
        }
    }

    let explanationText = "";
    if (typeof raw.explanation === "string" && raw.explanation.trim().length > 0) {
        explanationText = raw.explanation;
    } else if (typeof raw.clinicalSummary === "string" && raw.clinicalSummary.trim().length > 0) {
        explanationText = raw.clinicalSummary;
    } else if (typeof raw.summary === "string" && raw.summary.trim().length > 0) {
        explanationText = raw.summary;
    } else if (Array.isArray(raw.explanation) && raw.explanation.length > 0) {
        explanationText = raw.explanation.map((e: any) => `${e.factor || e.title || "Finding"}: ${e.finding || e.desc || ""}`).join(". ");
    } else {
        explanationText = `Clinical analysis indicates ${priority.toLowerCase()} acuity based on presenting vitals and symptom pattern.`;
    }

    const department = raw.recommendedDepartment || raw.department || raw.assignedDepartment || "General Medicine";
    const departmentLocation = raw.departmentLocation || getDepartmentLocation(department);
    const routingReason = raw.routingReason || raw.departmentReason || raw.reason || `Assigned to ${department} based on clinical guidelines and presenting symptoms.`;

    const recommendedChecks = raw.clinicalEvidence?.recommendedChecks || raw.recommendedChecks || (
        priority === "CRITICAL" || priority === "HIGH"
            ? ["Continuous 12-lead ECG monitoring", "Stat Arterial Blood Gas (ABG)", "Point-of-Care Troponin & Blood Chemistry"]
            : priority === "MODERATE"
            ? ["Bedside Vital Signs Tracking q30m", "Standard Blood Panel (CBC, Electrolytes)"]
            : ["Routine outpatient triage follow-up"]
    );

    return {
        patientId: raw.patientId || patientData?.patientId || "PID-GEN",
        patientName: raw.name || patientData?.name || "Patient",
        riskLevel,
        priority,
        confidence,
        riskScore,
        decisionEngine,
        modelStatus,
        modelUsed: raw.modelUsed || decisionEngine,
        riskFactors,
        explanation: explanationText,
        prioritizationSummary: raw.prioritizationSummary || explanationText,
        recommendedNextStep: raw.recommendedNextStep || (priority === "CRITICAL" || priority === "HIGH" ? "Immediate resuscitation bay admission and clinician review." : "Bedside clinical triage observation."),
        department,
        departmentLocation,
        routingReason,
        clinicalEvidence: {
            findings,
            recommendedChecks
        },
        isSimulated: !!raw.isSimulated,
        pdfUrl: raw.pdfUrl || raw.pdfPath,
        dbId: raw.dbId || raw._id,
        storedRecord: raw.storedRecord
    };
}

const getApiBase = () => {
    const userUrl = userApiKeyService.getBackendUrl();
    if (userUrl) return userUrl.replace(/\/api\/?$/, "");

    return ((import.meta as any).env.VITE_API_URL || ((import.meta as any).env.DEV ? "http://localhost:3001" : "")).replace(/\/api\/?$/, "");
};

const getOwnerEmail = () => {
    return getCurrentUser()?.email || "";
};

const SIMULATED_DELAY = 1000;
const STORAGE_KEY = "BHARAT_PULSELINK_SIMULATED_DATA";

const getSimulatedData = (): PatientRecord[] => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
        return [];
    }
};

const saveSimulatedData = (data: PatientRecord[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const simulateAssessment = (patientData: any, patientContext: Partial<PatientContextData> = {}): TriageResult => {
    const symptoms = String(patientData.symptoms || "").toLowerCase();
    const history = Array.isArray(patientData.history) ? patientData.history.map((h: string) => String(h).toLowerCase()) : [];
    const age = parseInt(patientData.age) || 30;

    let riskScore = 0;
    let riskFactors: string[] = [];
    let explanation: ExplainableFactor[] = [];
    let department = "General Medicine";

    const spo2 = parseFloat(patientData.oxygenLevel) || 98;
    if (spo2 < 88) {
        riskScore += 55;
        riskFactors.push("Critical Hypoxia (<88%)");
        explanation.push({ factor: "Oxygen Saturation", finding: `SpO₂ ${spo2}%`, impact: "HIGH" });
        department = "Emergency Medicine";
    } else if (spo2 < 93) {
        riskScore += 30;
        riskFactors.push("Hypoxemia Symptoms");
        explanation.push({ factor: "Oxygen Saturation", finding: `SpO₂ ${spo2}%`, impact: "MEDIUM" });
        department = "Pulmonology";
    } else {
        explanation.push({ factor: "Oxygen Saturation", finding: `SpO₂ ${spo2}% (Normal)`, impact: "LOW" });
    }

    const bp = String(patientData.bloodPressure || "");
    const systolic = bp.includes("/") ? parseInt(bp.split("/")[0], 10) : parseInt(bp, 10) || 120;
    const diastolic = bp.includes("/") ? parseInt(bp.split("/")[1], 10) : 80;

    if (systolic >= 185 || diastolic >= 115) {
        riskScore += 65;
        riskFactors.push("Hypertensive Crisis (Systolic >= 185)");
        explanation.push({ factor: "Blood Pressure", finding: `${systolic}/${diastolic} mmHg`, impact: "HIGH" });
        department = "Emergency Medicine";
    } else if (systolic >= 160 || diastolic >= 105) {
        riskScore += 40;
        riskFactors.push("Severe Hypertension (Stage 2)");
        explanation.push({ factor: "Blood Pressure", finding: `${systolic}/${diastolic} mmHg`, impact: "MEDIUM" });
        if (department === "General Medicine") department = "Cardiology";
    } else if (systolic >= 140) {
        riskScore += 15;
        riskFactors.push("Hypertension Stage 1");
        explanation.push({ factor: "Blood Pressure", finding: `${systolic}/${diastolic} mmHg`, impact: "LOW" });
    } else {
        explanation.push({ factor: "Blood Pressure", finding: `${systolic}/${diastolic} mmHg (Normal)`, impact: "LOW" });
    }

    const temp = parseFloat(patientData.temperature) || 98.6;
    if (temp >= 104) {
        riskScore += 35;
        riskFactors.push("Critical Hyperpyrexia (>=104°F)");
        explanation.push({ factor: "Body Temperature", finding: `${temp}°F`, impact: "HIGH" });
    } else if (temp >= 102) {
        riskScore += 20;
        riskFactors.push("High Fever (>102°F)");
        explanation.push({ factor: "Body Temperature", finding: `${temp}°F`, impact: "MEDIUM" });
    }

    const hr = parseInt(patientData.heartRate) || 72;
    if (hr > 130 || hr < 40) {
        riskScore += 35;
        riskFactors.push("Critical Heart Rate Abnormality");
        explanation.push({ factor: "Heart Rate", finding: `${hr} bpm`, impact: "HIGH" });
        if (department === "General Medicine") department = "Cardiology";
    } else if (hr > 105) {
        riskScore += 15;
        riskFactors.push("Tachycardia");
        explanation.push({ factor: "Heart Rate", finding: `${hr} bpm`, impact: "MEDIUM" });
    }

    const symptomMap = [
        { keys: ["chest pain", "crushing", "arm pain"], weight: 50, dept: "Cardiology", factor: "Potential Acute Coronary Syndrome", title: "Cardiac Presentation" },
        { keys: ["breath", "shortness", "suffocat", "wheez"], weight: 45, dept: "Pulmonology", factor: "Respiratory Distress", title: "Respiratory Profile" },
        { keys: ["stroke", "paralysis", "facial drooping", "slurred"], weight: 65, dept: "Neurology", factor: "Acute Neurovascular Event (Stroke)", title: "Neurological Deficit" },
        { keys: ["bleed", "hemorrhage", "cut"], weight: 40, dept: "Trauma / ER", factor: "Active Hemorrhage Risk", title: "Hemorrhage Risk" },
        { keys: ["abdominal", "stomach", "vomit"], weight: 25, dept: "Gastroenterology", factor: "Acute Abdominal Syndrome", title: "Gastrointestinal Presentation" },
        { keys: ["fracture", "broken", "fall", "bone"], weight: 35, dept: "Orthopedics", factor: "Orthopedic Trauma", title: "Musculoskeletal Injury" },
        { keys: ["cancer", "chem", "tumor"], weight: 40, dept: "Oncology", factor: "Oncology Complication", title: "Malignancy Profile" },
        { keys: ["confusion", "conscious", "fainting"], weight: 45, dept: "Neurology", factor: "Altered Mental Status", title: "Consciousness Level" }
    ];

    symptomMap.forEach(item => {
        if (item.keys.some(k => symptoms.includes(k))) {
            riskScore += item.weight;
            riskFactors.push(item.factor);
            explanation.push({ factor: item.title, finding: `Reported symptoms: "${patientData.symptoms}"`, impact: item.weight >= 40 ? "HIGH" : "MEDIUM" });
            if (department === "General Medicine" || item.weight >= 40) department = item.dept;
        }
    });

    if (history.includes("cancer")) {
        riskScore += 25;
        riskFactors.push("History of Malignancy");
        if (department === "General Medicine") department = "Oncology";
    }
    if (history.includes("heart disease")) {
        riskScore += 20;
        riskFactors.push("Cardiac History");
        if (department === "General Medicine") department = "Cardiology";
    }
    if (history.includes("diabetes")) {
        riskScore += 15;
        riskFactors.push("Diabetes Comorbidity");
    }

    if (age >= 80) riskScore += 20;
    else if (age <= 2) riskScore += 15;

    const priorityScore = Math.min(100, Math.max(15, Math.floor(riskScore)));
    const priority = priorityScore >= 75 ? "CRITICAL" : (priorityScore >= 50 ? "HIGH" : (priorityScore >= 28 ? "MODERATE" : "LOW"));
    const riskLevel = priority === "CRITICAL" || priority === "HIGH" ? "High" : (priority === "LOW" ? "Low" : "Moderate");

    const topFindings = explanation.slice(0, 3).map(e => `${e.factor}: ${e.finding}`).join(". ");
    const clinicalSummary = `Multiple physiological signals indicate ${priority} acuity. ${topFindings}.`;

    return normalizeTriageResult({
        priority,
        priorityScore,
        riskLevel,
        riskScore: priorityScore,
        confidence: 94,
        department,
        departmentReason: `Assigned to ${department} based on presenting symptoms and physiological abnormalities.`,
        recommendedDepartment: department,
        routingReason: `Assigned to ${department} based on presenting symptoms and physiological abnormalities.`,
        clinicalSummary,
        keyRiskFactors: riskFactors.length > 0 ? riskFactors.slice(0, 5) : ["Baseline vitals stable within clinical parameters"],
        explanation: explanation.slice(0, 5),
        recommendedNextStep: priorityScore >= 75 ? "Immediate resuscitation bay admission and physician review." : "Bedside clinical triage observation.",
        modelUsed: "Clinical Decision Support Rules",
        engine: "Clinical Decision Support Rules",
        modelStatus: "LOCAL ENGINE",
        disclaimer: "Decision support only; final clinical decision remains with qualified hospital staff.",
        isSimulated: true
    }, patientData);
};

export const triageService = {
    async getHistory(filters: { date?: string; startDate?: string; endDate?: string; filter?: string } = {}): Promise<PatientRecord[]> {
        const email = getOwnerEmail();
        try {
            const query = new URLSearchParams();
            if (filters.filter) query.append("filter", filters.filter);
            if (filters.date) query.append("date", filters.date);
            if (filters.startDate) query.append("startDate", filters.startDate);
            if (filters.endDate) query.append("endDate", filters.endDate);
            query.append("ownerEmail", email);

            const response = await fetch(`${getApiBase()}/api/triage?${query.toString()}`);
            if (!response.ok) throw new Error("Server unreachable");
            return response.json();
        } catch (err) {
            console.warn("[Triage] Server unreachable, using simulated local storage");
            let data = getSimulatedData().filter(p => p.ownerEmail === email);

            if (filters.filter === "today" || (filters as any).date) {
                const today = new Date().toDateString();
                data = data.filter(p => new Date(p.createdAt).toDateString() === today);
            } else if (filters.filter === "last7") {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                data = data.filter(p => new Date(p.createdAt) >= sevenDaysAgo);
            }

            return data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
    },

    async getWaitingPatients(): Promise<PatientRecord[]> {
        const email = getOwnerEmail();
        try {
            const response = await fetch(`${getApiBase()}/api/triage?ownerEmail=${email}&filter=today`, { cache: "no-store" });
            if (!response.ok) throw new Error("Server unreachable");
            const data: PatientRecord[] = await response.json();
            return data.filter(p => p.status === "Waiting" || p.status === "Admitted");
        } catch (err) {
            return getSimulatedData().filter(p =>
                p.ownerEmail === email &&
                (p.status === "Waiting" || p.status === "Admitted") &&
                new Date(p.createdAt).toDateString() === new Date().toDateString()
            );
        }
    },

    async assessPatient(patientData: any, patientContext: Partial<PatientContextData> = {}): Promise<TriageResult> {
        const payload = {
            ...patientData,
            patientContext,
            ownerEmail: getOwnerEmail()
        };

        try {
            let response = await fetch(`${getApiBase()}/api/triage/analyze`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok && response.status === 404) {
                response = await fetch(`${getApiBase()}/api/triage/assess`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
            }

            if (!response.ok) throw new Error(`Server returned ${response.status}`);
            const raw = await response.json();
            return normalizeTriageResult(raw, patientData);
        } catch (err) {
            console.log("[Triage] Remote analysis failed/unreachable. Falling back to local clinical engine...");
            await new Promise(r => setTimeout(r, SIMULATED_DELAY));
            return simulateAssessment(patientData, patientContext);
        }
    },

    async savePatient(patientData: any, assessment: any, patientContext: Partial<PatientContextData> = {}): Promise<any> {
        try {
            const response = await fetch(`${getApiBase()}/api/triage/save`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ patientData, assessment, patientContext, ownerEmail: getOwnerEmail() })
            });
            if (!response.ok) throw new Error("Server unreachable");
            return response.json();
        } catch (err) {
            const localData = getSimulatedData();
            const newRecord: PatientRecord = {
                _id: `mock-${Date.now()}`,
                ...patientData,
                allergies: patientContext.allergies || [],
                medications: patientContext.medications || [],
                chronicConditions: patientContext.chronicConditions || patientData.history || [],
                lastVisit: patientContext.lastVisit || "",
                emergencyContact: patientContext.emergencyContact || null,
                patientContext: {
                    allergies: patientContext.allergies || [],
                    medications: patientContext.medications || [],
                    chronicConditions: patientContext.chronicConditions || patientData.history || [],
                    lastVisit: patientContext.lastVisit || "",
                    emergencyContact: patientContext.emergencyContact || null,
                },
                assessment,
                status: "Admitted",
                ownerEmail: getOwnerEmail(),
                createdAt: new Date().toISOString(),
                vitals: {
                    temperature: patientData.temperature,
                    heartRate: patientData.heartRate,
                    bloodPressure: patientData.bloodPressure,
                    oxygenLevel: patientData.oxygenLevel
                }
            };
            localData.push(newRecord);
            saveSimulatedData(localData);
            return { success: true, id: newRecord._id, isSimulated: true };
        }
    },

    async updatePatientStatus(id: string, status: string): Promise<void> {
        try {
            const response = await fetch(`${getApiBase()}/api/triage/${id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });
            if (!response.ok) throw new Error("Server unreachable");
        } catch (err) {
            const localData = getSimulatedData();
            const index = localData.findIndex(p => p._id === id);
            if (index !== -1) {
                localData[index].status = status as any;
                saveSimulatedData(localData);
            }
        }
    }
};
