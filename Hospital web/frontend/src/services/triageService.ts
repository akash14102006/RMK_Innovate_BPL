import { getCurrentUser } from './authService';
import { userApiKeyService } from './userApiKeyService';

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
    assessment: {
        riskLevel: string;
        riskScore: number;
        confidence: number;
        department: string;
        explanation: string;
        riskFactors: string[];
        engine: string;
    };
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

// --- SIMULATION LOGIC FOR NETLIFY/OFFLINE DEMO ---

const SIMULATED_DELAY = 1500;
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

const simulateAssessment = (patientData: any) => {
    const symptoms = String(patientData.symptoms || '').toLowerCase();
    const history = Array.isArray(patientData.history) ? patientData.history.map((h: string) => String(h).toLowerCase()) : [];
    const age = parseInt(patientData.age) || 30;

    let riskScore = 0;
    let riskFactors: string[] = [];
    let department = 'General Medicine';

    // 1. Vital Signs Scoring (High Weight)
    const temp = parseFloat(patientData.temperature) || 98.6;
    if (temp >= 104) { riskScore += 35; riskFactors.push('Critical Hyperpyrexia'); }
    else if (temp >= 102) { riskScore += 20; riskFactors.push('High Fever'); }
    else if (temp >= 100.4) { riskScore += 10; riskFactors.push('Mild Pyrexia'); }

    const spo2 = parseFloat(patientData.oxygenLevel) || 98;
    if (spo2 < 88) { riskScore += 55; riskFactors.push('Critical Hypoxia (<88%)'); department = 'Emergency / ICU'; }
    else if (spo2 < 93) { riskScore += 30; riskFactors.push('Hypoxemia Symptoms'); department = 'Pulmonology'; }

    const hr = parseInt(patientData.heartRate) || 72;
    if (hr > 130 || hr < 40) { riskScore += 35; riskFactors.push('Maladaptive Heart Rate'); department = 'Cardiology'; }
    else if (hr > 105) { riskScore += 15; riskFactors.push('Tachycardia'); }

    const bp = String(patientData.bloodPressure || '');
    const systolic = bp.includes('/') ? parseInt(bp.split('/')[0]) : parseInt(bp) || 120;
    const diastolic = bp.includes('/') ? parseInt(bp.split('/')[1]) : 80;

    if (systolic >= 185 || diastolic >= 115) { riskScore += 65; riskFactors.push('Hypertensive Crisis'); department = 'Emergency Medicine'; }
    else if (systolic >= 160) { riskScore += 35; riskFactors.push('Severe Hypertension'); department = 'Cardiology'; }
    else if (systolic >= 140) { riskScore += 15; riskFactors.push('Hypertension Stage 1'); }

    // 2. Comprehensive Symptom Logic (Dynamic weights)
    const symptomWeights: Record<string, { weight: number, dept: string, factor: string }> = {
        'chest pain': { weight: 50, dept: 'Cardiology', factor: 'Potential Acute Coronary' },
        'heart': { weight: 20, dept: 'Cardiology', factor: 'Cardiac Involvement' },
        'breath': { weight: 45, dept: 'Pulmonology', factor: 'Respiratory Distress' },
        'stroke': { weight: 60, dept: 'Neurology', factor: 'Acute Neuro Event' },
        'paralysis': { weight: 60, dept: 'Neurology', factor: 'Focal Deficit' },
        'slurred': { weight: 50, dept: 'Neurology', factor: 'Speech Impairment' },
        'bleed': { weight: 40, dept: 'Trauma / ER', factor: 'Hemorrhage Risk' },
        'abdominal': { weight: 25, dept: 'Gastroenterology', factor: 'Abdominal Distress' },
        'stomach': { weight: 15, dept: 'Gastroenterology', factor: 'Gastric Issue' },
        'fracture': { weight: 35, dept: 'Orthopedics', factor: 'Structural Injury' },
        'bone': { weight: 20, dept: 'Orthopedics', factor: 'Orthopedic Trauma' },
        'skin': { weight: 10, dept: 'Dermatology', factor: 'Dermatological Issue' },
        'rash': { weight: 12, dept: 'Dermatology', factor: 'Skin Lesion/Rash' },
        'ear': { weight: 10, dept: 'ENT', factor: 'Auditory Symptom' },
        'throat': { weight: 10, dept: 'ENT', factor: 'Throat Discomfort' },
        'vision': { weight: 30, dept: 'Ophthalmology', factor: 'Visual Deficit' },
        'kidney': { weight: 25, dept: 'Nephrology', factor: 'Renal Marker' },
        'urine': { weight: 15, dept: 'Urology', factor: 'Urinary Marker' },
        'cancer': { weight: 40, dept: 'Oncology', factor: 'Oncology Concern' },
        'tumor': { weight: 40, dept: 'Oncology', factor: 'Potential Malignancy' },
        'anxiety': { weight: 15, dept: 'Psychiatry', factor: 'Mental Health Context' }
    };

    Object.entries(symptomWeights).forEach(([key, val]) => {
        if (symptoms.includes(key)) {
            riskScore += val.weight;
            if (val.weight > 20) riskFactors.push(val.factor);
            if (department === 'General Medicine' || val.weight >= 40) department = val.dept;
        }
    });

    // 3. History Context
    if (history.includes('cancer')) { riskScore += 30; riskFactors.push('H/O Cancer'); if (department === 'General Medicine') department = 'Oncology'; }
    if (history.includes('heart disease')) { riskScore += 20; riskFactors.push('H/O Cardiac Disease'); if (department === 'General Medicine') department = 'Cardiology'; }
    if (history.includes('diabetes')) riskScore += 15;
    if (age >= 80) riskScore += 20;

    // Safety: Cap Risk levels and adjust confidence
    const riskLevel = riskScore >= 75 ? 'Critical' : (riskScore >= 55 ? 'High' : (riskScore >= 25 ? 'Medium' : 'Low'));
    const dynamicConfidence = 0.95 + (Math.random() * 0.04); // Simulated AI variance

    return {
        riskLevel: riskLevel === 'Critical' ? 'High' : riskLevel,
        riskScore: Math.min(100, Math.floor(riskScore)),
        confidence: parseFloat(dynamicConfidence.toFixed(2)),
        department: riskScore >= 70 && !department.includes('Emergency') ? `${department} / ER` : department,
        explanation: `Autonomous Diagnostic (v.2.1-PRO): Analysis based on ${riskFactors.length} clinical indicators. Evidence: ${riskFactors.length > 0 ? riskFactors.slice(0, 4).join(', ') : 'Vitals baseline stable'}.`,
        riskFactors: riskFactors.slice(0, 6).map(f => `[AUTO] ${f}`),
        engine: 'Bharat PulseLink Autonomous Engine 2.1'
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
            // Fetch both Waiting and Admitted patients for the real-time priority queue
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

    async assessPatient(patientData: any): Promise<any> {
        try {
            const response = await fetch(`${getApiBase()}/api/triage/assess`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...patientData, ownerEmail: getOwnerEmail() })
            });
            if (!response.ok) throw new Error('Server unreachable');
            return response.json();
        } catch (err) {
            console.log('[Triage] Falling back to local clinical engine...');
            await new Promise(r => setTimeout(r, SIMULATED_DELAY));
            return {
                ...simulateAssessment(patientData),
                isSimulated: true
            };
        }
    },

    async savePatient(patientData: any, assessment: any): Promise<any> {
        try {
            const response = await fetch(`${getApiBase()}/api/triage/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patientData, assessment, ownerEmail: getOwnerEmail() })
            });
            if (!response.ok) throw new Error('Server unreachable');
            return response.json();
        } catch (err) {
            const localData = getSimulatedData();
            const newRecord: PatientRecord = {
                _id: `mock-${Date.now()}`,
                ...patientData,
                assessment,
                status: 'Waiting',
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

/* updated */
