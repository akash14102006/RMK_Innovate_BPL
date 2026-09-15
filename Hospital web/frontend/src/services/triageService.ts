import { getCurrentUser } from './authService';
import { userApiKeyService } from './userApiKeyService';

export interface ExplainableFactor {
    factor: string;
    finding: string;
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
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

export interface TriageAssessmentResult {
    priority: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
    priorityScore: number;
    riskLevel?: string;
    riskScore?: number;
    department: string;
    departmentReason: string;
    recommendedDepartment?: string;
    routingReason?: string;
    clinicalSummary: string;
    keyRiskFactors: string[];
    riskFactors?: string[];
    riskMarkers?: string[];
    explanation: ExplainableFactor[] | string;
    recommendedNextStep?: string;
    confidence: number;
    modelUsed: 'XGBoost' | 'Gemini' | 'Clinical Rules';
    engine?: string;
    modelStatus?: 'PRIMARY MODEL' | 'FALLBACK ACTIVE' | 'LOCAL FALLBACK';
    modelPath?: string[];
    disclaimer?: string;
    isSimulated?: boolean;
    dbId?: string;
    pdfUrl?: string;
    storedRecord?: any;
}

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
    assessment: TriageAssessmentResult;
    status: 'Waiting' | 'Admitted' | 'Completed';
    assignedDepartment?: string;
    routingReason?: string;
    routingPriorityScore?: number;
    departmentQueueStatus?: 'Waiting' | 'In Progress' | 'Completed';
    pdfPath?: string;
    ownerEmail: string;
    createdAt: string;
}

const getApiBase = () => {
    const userUrl = userApiKeyService.getBackendUrl();
    if (userUrl) return userUrl.replace(/\/api\/?$/, '');

    return ((import.meta as any).env.VITE_API_URL || ((import.meta as any).env.DEV ? 'http://localhost:3001' : '')).replace(/\/api\/?$/, '');
};

const getOwnerEmail = () => {
    return getCurrentUser()?.email || '';
};

// --- SIMULATION LOGIC FOR OFFLINE / ISOLATED DEMO ---

const SIMULATED_DELAY = 1200;
const STORAGE_KEY = 'BHARAT_PULSELINK_SIMULATED_DATA';

const getSimulatedData = (): PatientRecord[] => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
};

const saveSimulatedData = (data: PatientRecord[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const simulateAssessment = (patientData: any, patientContext: Partial<PatientContextData> = {}): TriageAssessmentResult => {
    const symptoms = String(patientData.symptoms || '').toLowerCase();
    const history = Array.isArray(patientData.history) ? patientData.history.map((h: string) => String(h).toLowerCase()) : [];
    const age = parseInt(patientData.age) || 30;

    let riskScore = 0;
    let riskFactors: string[] = [];
    let explanation: ExplainableFactor[] = [];
    let department = 'General Medicine';

    // 1. Oxygen Saturation
    const spo2 = parseFloat(patientData.oxygenLevel) || 98;
    if (spo2 < 88) {
        riskScore += 55;
        riskFactors.push('Critical Hypoxia (<88%)');
        explanation.push({ factor: 'Oxygen Saturation', finding: `SpO₂ ${spo2}%`, impact: 'HIGH' });
        department = 'Emergency Medicine';
    } else if (spo2 < 93) {
        riskScore += 30;
        riskFactors.push('Hypoxemia Symptoms');
        explanation.push({ factor: 'Oxygen Saturation', finding: `SpO₂ ${spo2}%`, impact: 'MEDIUM' });
        department = 'Pulmonology';
    } else {
        explanation.push({ factor: 'Oxygen Saturation', finding: `SpO₂ ${spo2}% (Normal)`, impact: 'LOW' });
    }

    // 2. Blood Pressure
    const bp = String(patientData.bloodPressure || '');
    const systolic = bp.includes('/') ? parseInt(bp.split('/')[0]) : parseInt(bp) || 120;
    const diastolic = bp.includes('/') ? parseInt(bp.split('/')[1]) : 80;

    if (systolic >= 185 || diastolic >= 115) {
        riskScore += 65;
        riskFactors.push('Hypertensive Crisis');
        explanation.push({ factor: 'Blood Pressure', finding: `${systolic}/${diastolic} mmHg`, impact: 'HIGH' });
        department = 'Emergency Medicine';
    } else if (systolic >= 160 || diastolic >= 105) {
        riskScore += 35;
        riskFactors.push('Severe Hypertension');
        explanation.push({ factor: 'Blood Pressure', finding: `${systolic}/${diastolic} mmHg`, impact: 'MEDIUM' });
        if (department === 'General Medicine') department = 'Cardiology';
    } else {
        explanation.push({ factor: 'Blood Pressure', finding: `${systolic}/${diastolic} mmHg`, impact: 'LOW' });
    }

    // 3. Temperature
    const temp = parseFloat(patientData.temperature) || 98.6;
    if (temp >= 104) {
        riskScore += 35;
        riskFactors.push('Critical Hyperpyrexia');
        explanation.push({ factor: 'Temperature', finding: `${temp}°F (Severe Fever)`, impact: 'HIGH' });
    } else if (temp >= 100.4) {
        riskScore += 15;
        riskFactors.push('Mild Pyrexia');
        explanation.push({ factor: 'Temperature', finding: `${temp}°F`, impact: 'LOW' });
    }

    // 4. Heart Rate
    const hr = parseInt(patientData.heartRate) || 72;
    if (hr > 130 || hr < 40) {
        riskScore += 35;
        riskFactors.push('Critical Pulse Abnormality');
        explanation.push({ factor: 'Heart Rate', finding: `${hr} bpm`, impact: 'HIGH' });
        if (department === 'General Medicine') department = 'Cardiology';
    } else if (hr > 105) {
        riskScore += 15;
        riskFactors.push('Tachycardia');
        explanation.push({ factor: 'Heart Rate', finding: `${hr} bpm`, impact: 'MEDIUM' });
    }

    // 5. Symptom Analysis
    const symptomWeights: Record<string, { weight: number, dept: string, factor: string, title: string }> = {
        'chest pain': { weight: 50, dept: 'Cardiology', factor: 'Potential Acute Coronary Syndrome', title: 'Chest Symptoms' },
        'heart': { weight: 20, dept: 'Cardiology', factor: 'Cardiac Involvement', title: 'Cardiac History' },
        'breath': { weight: 45, dept: 'Pulmonology', factor: 'Respiratory Distress', title: 'Respiratory Signs' },
        'stroke': { weight: 60, dept: 'Neurology', factor: 'Acute Neuro Event', title: 'Neurological Deficit' },
        'bleed': { weight: 40, dept: 'Trauma / ER', factor: 'Hemorrhage Risk', title: 'Active Bleeding' },
        'abdominal': { weight: 25, dept: 'Gastroenterology', factor: 'Abdominal Distress', title: 'Abdominal Symptoms' },
        'fracture': { weight: 35, dept: 'Orthopedics', factor: 'Structural Injury', title: 'Orthopedic Trauma' },
        'cancer': { weight: 40, dept: 'Oncology', factor: 'Oncology Concern', title: 'Malignancy Context' },
    };

    Object.entries(symptomWeights).forEach(([key, val]) => {
        if (symptoms.includes(key)) {
            riskScore += val.weight;
            if (val.weight > 20) riskFactors.push(val.factor);
            explanation.push({ factor: val.title, finding: `Matched keyword "${key}"`, impact: val.weight >= 40 ? 'HIGH' : 'MEDIUM' });
            if (department === 'General Medicine' || val.weight >= 40) department = val.dept;
        }
    });

    // 6. Medical Context
    if (history.includes('cancer')) { riskScore += 30; riskFactors.push('H/O Cancer'); if (department === 'General Medicine') department = 'Oncology'; }
    if (history.includes('heart disease')) { riskScore += 20; riskFactors.push('H/O Cardiac Disease'); if (department === 'General Medicine') department = 'Cardiology'; }
    if (history.includes('diabetes')) {
        riskScore += 15;
        explanation.push({ factor: 'Medical Context', finding: 'Documented diabetes history adds vulnerability', impact: 'MEDIUM' });
    }

    const priorityScore = Math.min(100, Math.max(18, Math.floor(riskScore)));
    const priority: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' =
        priorityScore >= 75 ? 'CRITICAL' : (priorityScore >= 50 ? 'HIGH' : (priorityScore >= 30 ? 'MODERATE' : 'LOW'));
    const riskLevel = priority === 'CRITICAL' || priority === 'HIGH' ? 'High' : (priority === 'LOW' ? 'Low' : 'Medium');

    const topFindings = explanation.slice(0, 3).map(e => `${e.factor}: ${e.finding}`).join('. ');
    const clinicalSummary = `Multiple physiological signals indicate ${priority} acuity. ${topFindings}.`;

    return {
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
        keyRiskFactors: riskFactors.length > 0 ? riskFactors.slice(0, 5) : ['Baseline vitals stable within clinical parameters'],
        explanation: explanation.slice(0, 5),
        recommendedNextStep: priorityScore >= 75 ? 'Immediate resuscitation bay admission and physician review.' : 'Bedside clinical triage observation.',
        modelUsed: 'Clinical Rules',
        engine: 'Clinical Decision Support Rules',
        modelStatus: 'LOCAL FALLBACK',
        modelPath: [
            'XGBoost Triage Model (Unavailable/Offline)',
            'Gemini Clinical Reasoning (Key Missing/Offline)',
            'Clinical Decision Support Rules (Local Engine)'
        ],
        disclaimer: 'Decision support only; final clinical decision remains with qualified hospital staff.',
        isSimulated: true
    };
};

export const triageService = {
    async getHistory(filters: { date?: string; startDate?: string; endDate?: string; filter?: string } = {}): Promise<PatientRecord[]> {
        const email = getOwnerEmail();
        try {
            const query = new URLSearchParams();
            if (filters.filter) query.append('filter', filters.filter);
            if (filters.date) query.append('date', filters.date);
            if (filters.startDate) query.append('startDate', filters.startDate);
            if (filters.endDate) query.append('endDate', filters.endDate);
            query.append('ownerEmail', email);

            const response = await fetch(`${getApiBase()}/api/triage?${query.toString()}`);
            if (!response.ok) throw new Error('Server unreachable');
            return response.json();
        } catch (err) {
            console.warn('[Triage] Server unreachable, using simulated local storage');
            let data = getSimulatedData().filter(p => p.ownerEmail === email);

            if (filters.filter === 'today' || (filters as any).date) {
                const today = new Date().toDateString();
                data = data.filter(p => new Date(p.createdAt).toDateString() === today);
            } else if (filters.filter === 'last7') {
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
            const response = await fetch(`${getApiBase()}/api/triage?ownerEmail=${email}&filter=today`, { cache: 'no-store' });
            if (!response.ok) throw new Error('Server unreachable');
            const data: PatientRecord[] = await response.json();
            return data.filter(p => p.status === 'Waiting' || p.status === 'Admitted');
        } catch (err) {
            return getSimulatedData().filter(p =>
                p.ownerEmail === email &&
                (p.status === 'Waiting' || p.status === 'Admitted') &&
                new Date(p.createdAt).toDateString() === new Date().toDateString()
            );
        }
    },

    async assessPatient(patientData: any, patientContext: Partial<PatientContextData> = {}): Promise<TriageAssessmentResult> {
        const payload = {
            ...patientData,
            patientContext,
            ownerEmail: getOwnerEmail()
        };

        // Try /api/triage/analyze first, then fall back to /api/triage/assess
        try {
            let response = await fetch(`${getApiBase()}/api/triage/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok && response.status === 404) {
                response = await fetch(`${getApiBase()}/api/triage/assess`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            if (!response.ok) throw new Error(`Server returned ${response.status}`);
            return response.json();
        } catch (err) {
            console.log('[Triage] Remote analysis failed/unreachable. Falling back to local clinical engine...');
            await new Promise(r => setTimeout(r, SIMULATED_DELAY));
            return simulateAssessment(patientData, patientContext);
        }
    },

    async savePatient(patientData: any, assessment: any, patientContext: Partial<PatientContextData> = {}): Promise<any> {
        try {
            const response = await fetch(`${getApiBase()}/api/triage/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patientData, assessment, patientContext, ownerEmail: getOwnerEmail() })
            });
            if (!response.ok) throw new Error('Server unreachable');
            return response.json();
        } catch (err) {
            const localData = getSimulatedData();
            const newRecord: PatientRecord = {
                _id: `mock-${Date.now()}`,
                ...patientData,
                allergies: patientContext.allergies || [],
                medications: patientContext.medications || [],
                chronicConditions: patientContext.chronicConditions || patientData.history || [],
                lastVisit: patientContext.lastVisit || '',
                emergencyContact: patientContext.emergencyContact || null,
                patientContext: {
                    allergies: patientContext.allergies || [],
                    medications: patientContext.medications || [],
                    chronicConditions: patientContext.chronicConditions || patientData.history || [],
                    lastVisit: patientContext.lastVisit || '',
                    emergencyContact: patientContext.emergencyContact || null,
                },
                assessment,
                status: 'Admitted',
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
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (!response.ok) throw new Error('Server unreachable');
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
