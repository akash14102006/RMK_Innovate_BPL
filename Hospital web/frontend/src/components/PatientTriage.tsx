import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Activity, AlertTriangle, CheckCircle2, FileText, Stethoscope, ArrowRight, BrainCircuit, RefreshCw, Mic, MicOff, Upload, Plus, X, User, Zap, ShieldCheck, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { getCurrentUser } from '../services/authService';
import { triageService } from '../services/triageService';
import BPLQRScannerModal from './BPLQRScannerModal';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';

// PDF.js worker setup (must not throw or app can show blank screen)
try {
    if (typeof window !== 'undefined' && pdfjsLib?.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    }
} catch (_) {
    // ignore so app still loads
}

/** Minimum average characters per page to consider PDF "text-based". Below this we use OCR (scanned). */
const MIN_TEXT_PER_PAGE = 20;

/** Extract text from a PDF: uses native text layer first; falls back to OCR for scanned/image PDFs. */
async function extractTextFromPdf(buffer: ArrayBuffer): Promise<string> {
    const pdf = await pdfjsLib.getDocument({ data: buffer, useSystemFonts: true }).promise;
    const numPages = pdf.numPages;
    const textParts: string[] = [];

    // 1) Try native text extraction (works for digital/uploaded PDFs with selectable text)
    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const text = textContent.items.map((item: any) => item.str || '').join(' ').trim();
        textParts.push(text);
    }

    const nativeText = textParts.join('\n').trim();
    const avgCharsPerPage = nativeText.length / numPages;

    if (avgCharsPerPage >= MIN_TEXT_PER_PAGE) {
        return nativeText;
    }

    // 2) Likely scanned PDF: render each page to image and run OCR
    const ocrParts: string[] = [];
    const scale = 2; // Better quality for OCR
    const worker = await Tesseract.createWorker('eng', undefined, { logger: () => { } });

    try {
        for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) continue;
            const renderTask = (page as any).render({
                canvasContext: ctx,
                viewport,
                canvas: canvas,
            });
            await (renderTask.promise || renderTask);
            const { data } = await worker.recognize(canvas);
            ocrParts.push(data.text || '');
        }
    } finally {
        await worker.terminate();
    }

    const ocrText = ocrParts.join('\n').trim();
    return ocrText.length > nativeText.length ? ocrText : nativeText;
}

async function extractTextFromDocx(buffer: ArrayBuffer): Promise<string> {
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value;
}

// Define types for Web Speech API
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

interface PatientTriageProps {
    onNavigate?: (page: string) => void;
}

export default function PatientTriage({ onNavigate }: PatientTriageProps) {
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [result, setResult] = useState<any>(null);

    const [formData, setFormData] = useState({
        patientId: '',
        name: '',
        age: '',
        gender: '',
        phone: '',
        bloodGroup: '',
        temperature: '',
        heartRate: '',
        bloodPressure: '',
        oxygenLevel: '',
        symptoms: '',
        history: [] as string[]
    });

    const DEFAULT_MEDICAL_CONDITIONS = ['Diabetes', 'Hypertension', 'Asthma', 'Heart Disease', 'None'];
    const [customConditions, setCustomConditions] = useState<string[]>([]);
    const [newConditionInput, setNewConditionInput] = useState('');
    const [showBPLQRModal, setShowBPLQRModal] = useState(false);
    const [bplPatientInfo, setBplPatientInfo] = useState<{
        exchangeId?: string;
        abhaId?: string;
        emergencyContact?: { name: string; relationship: string };
        verifiedAt?: string;
    } | null>(null);
    const ehrInputRef = useRef<HTMLInputElement>(null);

    const handleBPLPatientLoaded = (patient: any) => {
        // Safely normalize conditions and allergies
        const rawConditions = Array.isArray(patient.conditions) ? patient.conditions : [];
        const rawAllergies = Array.isArray(patient.allergies) ? patient.allergies : [];

        const conditions = rawConditions.map((c: any) => {
            if (typeof c === 'string') return c;
            return c.condition_name || c.conditionName || c.name || '';
        }).filter(Boolean);

        const allergies = rawAllergies.map((a: any) => {
            if (typeof a === 'string') return a;
            const sub = a.substance || a.allergen || a.name || '';
            const sev = a.severity ? ` (${a.severity})` : '';
            return sub ? `${sub}${sev}` : '';
        }).filter(Boolean);

        const conditionHistory = [...conditions];
        const extraConditions = conditions.filter((c: string) => !DEFAULT_MEDICAL_CONDITIONS.includes(c));
        if (extraConditions.length > 0) {
            setCustomConditions(prev => Array.from(new Set([...prev, ...extraConditions])));
        }

        setBplPatientInfo({
            exchangeId: patient.exchangeId || patient.bplExchangeId,
            abhaId: patient.abhaId,
            emergencyContact: patient.emergencyContact,
            verifiedAt: new Date().toLocaleTimeString(),
        });

        setFormData(prev => ({
            ...prev,
            name: patient.fullName || prev.name,
            age: patient.age ? String(patient.age) : prev.age,
            gender: patient.gender ? (patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1).toLowerCase()) : prev.gender,
            phone: patient.primaryPhone || prev.phone,
            bloodGroup: patient.bloodGroup || prev.bloodGroup,
            history: conditionHistory.length > 0 ? conditionHistory : prev.history,
            symptoms: prev.symptoms || (allergies.length > 0 ? `Known Allergies: ${allergies.join(', ')}` : ''),
        }));

        toast.success(`Loaded verified patient: ${patient.fullName}`);
    };

    const generatePatientId = () => {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `PID-${timestamp}-${random}`;
    };

    useEffect(() => {
        setFormData(prev => ({ ...prev, patientId: generatePatientId() }));
    }, []);

    const refreshPatientId = () => {
        setFormData(prev => ({ ...prev, patientId: generatePatientId() }));
        toast.info("New Patient ID generated");
    };

    type ExtractedEHR = {
        name?: string; age?: string; gender?: string; phone?: string; bloodGroup?: string;
        temperature?: string; heartRate?: string; bloodPressure?: string; oxygenLevel?: string;
        symptoms?: string; conditions?: string[];
    };

    const parseEhrFile = (content: string, filename: string): ExtractedEHR | null => {
        const ext = filename.split('.').pop()?.toLowerCase();
        if (ext === 'json') {
            try {
                const data = JSON.parse(content);
                const conditions = [
                    ...(Array.isArray(data.conditions) ? data.conditions : []),
                    ...(Array.isArray(data.medicalHistory) ? data.medicalHistory : []),
                    ...(Array.isArray(data.pastHistory) ? data.pastHistory : []),
                    ...(data.preExistingConditions ? (Array.isArray(data.preExistingConditions) ? data.preExistingConditions : [data.preExistingConditions]) : []),
                ].filter(Boolean).map((c: unknown) => String(c).trim());
                return {
                    name: data.name ?? data.patientName ?? data.patient_name,
                    age: data.age != null ? String(data.age) : undefined,
                    gender: data.gender ?? data.sex,
                    phone: data.phone ?? data.mobile ?? data.contact,
                    bloodGroup: data.bloodGroup ?? data.blood_group ?? data.bloodType,
                    temperature: data.temperature != null ? String(data.temperature) : undefined,
                    heartRate: data.heartRate != null ? String(data.heartRate) : data.heart_rate,
                    bloodPressure: data.bloodPressure ?? data.blood_pressure ?? data.bp,
                    oxygenLevel: data.oxygenLevel != null ? String(data.oxygenLevel) : data.spo2,
                    symptoms: data.symptoms ?? data.complaints ?? data.presentingComplaint,
                    conditions: conditions.length ? conditions : undefined,
                };
            } catch {
                return null;
            }
        }

        if (ext === 'txt' || !ext) {
            const text = content;

            // --- 1. DIRECT REGEX EXTRACTION (High Precision) ---
            // This stops greedy matching by looking ahead for the next common label or newline
            const extract = (pattern: RegExp) => {
                const match = text.match(pattern);
                return match ? match[1].trim() : undefined;
            };

            // Non-greedy matches stopping at common field boundaries
            const boundary = "(?=\\s*(?:Patient|Name|ID|Age|DOB|Gender|Sex|Phone|Contact|Blood|Temp|HR|BP|Pulse|SpO2|Symptoms|History|Past|Pre-existing|Diagnosis|Conditions|Med|Visit|Date|$))";

            const regexExtracted: ExtractedEHR = {
                name: extract(new RegExp(`Patient\\s*Name:\\s*(.*?)${boundary}`, 'i')) ||
                    extract(new RegExp(`Name:\\s*(.*?)${boundary}`, 'i')),
                age: extract(new RegExp(`(?:Age|DOB|Date of Birth):\\s*(.*?)${boundary}`, 'i')),
                gender: extract(new RegExp(`(?:Gender|Sex):\\s*(.*?)${boundary}`, 'i')),
                phone: extract(new RegExp(`(?:Phone|Mobile|Contact|Contact No):\\s*(.*?)${boundary}`, 'i')),
                bloodGroup: extract(new RegExp(`(?:Blood Group|Blood Type):\\s*(.*?)${boundary}`, 'i')),
                temperature: extract(new RegExp(`(?:Temp|Temperature):\\s*(.*?)${boundary}`, 'i')),
                heartRate: extract(new RegExp(`(?:Pulse|Heart Rate|HR):\\s*(.*?)${boundary}`, 'i')),
                bloodPressure: extract(new RegExp(`(?:BP|Blood Pressure):\\s*(.*?)${boundary}`, 'i')),
                oxygenLevel: extract(new RegExp(`(?:SpO2|Oxygen|O2):\\s*(.*?)${boundary}`, 'i')),
                symptoms: extract(new RegExp(`(?:Symptoms|Complaint|Reason for Visit):\\s*(.*?)${boundary}`, 'i')),
            };

            // --- 2. WATERFALL PARTITIONING (Fallback/Comprehensive) ---
            const markers = [
                { id: 'name', labels: ['Patient Name', 'Full Name', 'Name'] },
                { id: 'age', labels: ['Age', 'DOB', 'Date of Birth', 'Birth Date'] },
                { id: 'gender', labels: ['Gender', 'Sex'] },
                { id: 'phone', labels: ['Phone', 'Mobile', 'Contact', 'Contact No'] },
                { id: 'blood', labels: ['Blood Group', 'Blood Type', 'Blood'] },
                { id: 'temp', labels: ['Temperature', 'Temp'] },
                { id: 'hr', labels: ['Heart Rate', 'Pulse', 'HR'] },
                { id: 'bp', labels: ['Blood Pressure', 'BP'] },
                { id: 'spo2', labels: ['SpO2', 'Oxygen', 'O2 Level'] },
                { id: 'symptoms', labels: ['Chief Complaint', 'Presenting Symptoms', 'Symptoms', 'Complaints'] },
                { id: 'history', labels: ['Past Medical History', 'Medical History', 'Problem List', 'History', 'Conditions', 'Pre-existing Conditions', 'Chronic Illness'] },
            ];

            const found: { id: string, index: number, labelLength: number }[] = [];
            markers.forEach(m => {
                m.labels.forEach(label => {
                    const r = new RegExp(`\\b(${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\s*[:\\-]+`, 'i');
                    const match = text.match(r);
                    if (match && match.index !== undefined) {
                        found.push({ id: m.id, index: match.index, labelLength: match[0].length });
                    }
                });
            });

            found.sort((a, b) => a.index - b.index);
            const uniqueFound = found.filter((m, i) => found.findIndex(f => f.id === m.id) === i);
            const waterfall: Record<string, string> = {};

            uniqueFound.forEach((m, i) => {
                const start = m.index + m.labelLength;
                const end = (i + 1 < uniqueFound.length) ? uniqueFound[i + 1].index : text.length;
                waterfall[m.id] = text.substring(start, end).replace(/^[:\-\s]+/, '').trim();
            });

            // Merge Logic: Regex results (Precise) > Waterfall results (Broad)
            const final: ExtractedEHR = {
                name: regexExtracted.name || waterfall.name,
                age: regexExtracted.age || waterfall.age,
                gender: regexExtracted.gender || waterfall.gender,
                phone: regexExtracted.phone || waterfall.phone,
                bloodGroup: regexExtracted.bloodGroup || waterfall.blood,
                temperature: regexExtracted.temperature?.match(/[\d.]+/)?.[0] || waterfall.temp?.match(/[\d.]+/)?.[0],
                heartRate: regexExtracted.heartRate?.match(/\d+/)?.[0] || waterfall.hr?.match(/\d+/)?.[0],
                bloodPressure: regexExtracted.bloodPressure || waterfall.bp,
                oxygenLevel: regexExtracted.oxygenLevel?.match(/\d+/)?.[0] || waterfall.spo2?.match(/\d+/)?.[0],
                symptoms: regexExtracted.symptoms || waterfall.symptoms,
            };

            // Process History separately from waterfall as it's often a list
            // We search for multiple possible history headers
            const historyMarkers = ['Past Medical History', 'Medical History', 'Pre-existing Conditions', 'Chronic Conditions', 'History', 'Conditions'];
            let historyText = waterfall.history;

            if (!historyText) {
                for (const marker of historyMarkers) {
                    const r = new RegExp(`${marker}:\\s*(.*?)${boundary}`, 'is');
                    const match = text.match(r);
                    if (match) {
                        historyText = match[1].trim();
                        break;
                    }
                }
            }

            const conditions: string[] = [];
            if (historyText) {
                historyText.split(/[,;\n\-|•*]+/).map(s => s.trim()).filter(s => s.length > 2).forEach(s => {
                    if (s.length > 50 || /vitals|temp|bp|pulse|hr|normal|none|nil/i.test(s)) return;

                    const lower = s.toLowerCase();
                    if (lower.includes('diabetes') || lower.includes('sugar') || lower.includes('dm')) conditions.push('Diabetes');
                    else if (lower.includes('hypertension') || lower.includes('htn') || lower.includes('high bp') || lower.includes('bp high')) conditions.push('Hypertension');
                    else if (lower.includes('asthma') || lower.includes('wheez')) conditions.push('Asthma');
                    else if (lower.includes('heart') || lower.includes('cardiac') || lower.includes('cad') || lower.includes('chd')) conditions.push('Heart Disease');
                    else if (lower.includes('cancer') || lower.includes('tumor') || lower.includes('malignancy')) conditions.push('Cancer');
                    else if (conditions.length < 15) conditions.push(s.charAt(0).toUpperCase() + s.slice(1));
                });
            }
            final.conditions = conditions.length ? Array.from(new Set(conditions)) : undefined;

            return final;
        }
        return null;
    };

    const applyExtracted = (extracted: ExtractedEHR | null) => {
        if (!extracted) {
            toast.error('Could not read EHR file. Check file format.');
            return;
        }

        const sanitizeField = (value: string | undefined): string | undefined => {
            if (!value) return undefined;
            // Stronger sanitation: remove field labels that might have leaked
            const labelsRegex = /(?:Patient\s*Name|PID|MRN|Name|Age|DOB|Date\s*of\s*Birth|Gender|Sex|Phone|Mobile|Contact|Blood\s*Group|Temp|Heart|HR|BP|Pulse|Pressure|SpO2|Oxygen|Symptoms|History|Complaint|Dx|Diagnosis|Visit|Date):\s*/gi;
            let current = value.trim();
            const parts = current.split(labelsRegex);
            if (parts.length > 1) current = parts[0].trim();
            return current.replace(/[,;\-:\s]+$/, '').trim() || undefined;
        };



        const updates: Partial<typeof formData> = {};
        if (extracted.name) updates.name = sanitizeField(extracted.name);
        if (extracted.age) updates.age = sanitizeField(extracted.age);
        if (extracted.gender) updates.gender = (sanitizeField(extracted.gender) || '').toLowerCase();
        if (extracted.phone) updates.phone = sanitizeField(extracted.phone);
        if (extracted.bloodGroup) updates.bloodGroup = sanitizeField(extracted.bloodGroup);
        if (extracted.temperature) updates.temperature = sanitizeField(extracted.temperature);
        if (extracted.heartRate) updates.heartRate = sanitizeField(extracted.heartRate);
        if (extracted.bloodPressure) updates.bloodPressure = sanitizeField(extracted.bloodPressure);
        if (extracted.oxygenLevel) updates.oxygenLevel = sanitizeField(extracted.oxygenLevel);
        if (extracted.symptoms) updates.symptoms = sanitizeField(extracted.symptoms);
        const historySet = new Set<string>([...formData.history]);
        const newCustom: string[] = [...customConditions];
        if (extracted.conditions?.length) {
            extracted.conditions.forEach(c => {
                let normalized = c.trim();
                // Check if it matches a default condition (case-insensitive)
                const defaultMatch = DEFAULT_MEDICAL_CONDITIONS.find(dc => dc.toLowerCase() === normalized.toLowerCase());
                if (defaultMatch) {
                    normalized = defaultMatch;
                } else {
                    // Title case for new custom conditions
                    normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
                }

                if (!normalized) return;
                historySet.add(normalized);

                if (!DEFAULT_MEDICAL_CONDITIONS.includes(normalized) && !newCustom.includes(normalized)) {
                    newCustom.push(normalized);
                }
            });
        }

        // Final polish for history: If we have real conditions, uncheck 'None'
        let finalHistory = Array.from(historySet);
        if (finalHistory.length > 1 && finalHistory.includes('None')) {
            finalHistory = finalHistory.filter(h => h !== 'None');
        }

        setCustomConditions(newCustom);
        setFormData(prev => ({ ...prev, ...updates, history: finalHistory }));
        toast.success('EHR record loaded. Form auto-filled.');
    };

    const handleEhrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const ext = file.name.split('.').pop()?.toLowerCase();
        e.target.value = '';

        if (ext === 'pdf') {
            toast.info('Extracting text from PDF…', { duration: 3000 });
            const apiOrigin = ((import.meta as any).env.VITE_API_URL || ((import.meta as any).env.DEV ? '' : 'http://localhost:3001')).replace(/\/api\/?$/, '');
            let text = '';
            try {
                const form = new FormData();
                form.append('file', file);
                const res = await fetch(`${apiOrigin || ''}/api/ehr/extract-pdf`, {
                    method: 'POST',
                    body: form,
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    console.error('Backend extraction failed:', errData);
                    throw new Error(errData.details || errData.error || 'Failed to extract text from PDF');
                }

                const data = await res.json();
                text = (data.text || '').trim();

                // If we have AI structured data, merge it with regex results for best coverage
                if (data.structuredData && Object.keys(data.structuredData).length > 0) {
                    const aiStr = data.structuredData as any;
                    const regexExtracted = parseEhrFile(text, 'ehr.txt') || {};

                    const isVal = (v: any) => v && v !== 'null' && v !== 'N/A' && v !== 'Unknown' && v !== 'None';

                    // Merge: AI takes precedence, but Regex fills gaps.
                    const merged: ExtractedEHR = {
                        name: (isVal(aiStr.name) ? aiStr.name : regexExtracted.name),
                        age: (isVal(aiStr.age) ? String(aiStr.age) : regexExtracted.age),
                        gender: (isVal(aiStr.gender) ? aiStr.gender : regexExtracted.gender),
                        phone: (isVal(aiStr.phone) ? aiStr.phone : regexExtracted.phone),
                        bloodGroup: (isVal(aiStr.bloodGroup) ? aiStr.bloodGroup : regexExtracted.bloodGroup),
                        temperature: (isVal(aiStr.temperature) ? String(aiStr.temperature) : regexExtracted.temperature),
                        heartRate: (isVal(aiStr.heartRate) ? String(aiStr.heartRate) : regexExtracted.heartRate),
                        bloodPressure: (isVal(aiStr.bloodPressure) ? aiStr.bloodPressure : regexExtracted.bloodPressure),
                        oxygenLevel: (isVal(aiStr.oxygenLevel) ? String(aiStr.oxygenLevel) : regexExtracted.oxygenLevel),
                        symptoms: isVal(aiStr.symptoms) ? aiStr.symptoms : regexExtracted.symptoms,
                        conditions: Array.from(new Set([
                            ...(Array.isArray(aiStr.history) ? aiStr.history : []),
                            ...(regexExtracted.conditions || [])
                        ].filter(isVal)))
                    };

                    applyExtracted(merged);
                    return;
                }
            } catch (err: any) {
                console.warn('Backend extraction error:', err.message);
                toast.info('Falling back to local browser extraction…', { duration: 2000 });
            }

            if (!text) {
                try {
                    const buffer = await file.arrayBuffer();
                    text = (await extractTextFromPdf(buffer)).trim();
                } catch (err) {
                    console.error('PDF extraction failed:', err);
                    toast.error('Could not extract text. (1) Start backend and run: pip install pymupdf  (2) Or upload a .txt or .docx file.');
                    return;
                }
            }
            if (text) {
                const extracted = parseEhrFile(text, 'ehr.txt');
                if (extracted) {
                    applyExtracted(extracted);
                } else {
                    setFormData(prev => ({ ...prev, symptoms: prev.symptoms ? `${prev.symptoms}\n\n${text.slice(0, 2000)}` : text.slice(0, 2000) }));
                    toast.success('Text extracted. Form partially filled; check Symptoms field.');
                }
            } else {
                toast.error('No text found in PDF. Try a text-based PDF or upload as .txt / .docx.');
            }
            return;
        }
        if (ext === 'docx' || ext === 'doc') {
            const buffer = await file.arrayBuffer();
            try {
                const text = await extractTextFromDocx(buffer);
                const apiOrigin = ((import.meta as any).env.VITE_API_URL || ((import.meta as any).env.DEV ? '' : 'http://localhost:3001')).replace(/\/api\/?$/, '');

                // Try AI parsing first
                try {
                    const res = await fetch(`${apiOrigin}/api/ehr/parse-text`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text }),
                    });
                    const data = res.ok ? await res.json() : {};
                    if (data.structuredData && Object.keys(data.structuredData).length > 0) {
                        const structured = data.structuredData as ExtractedEHR;
                        if ((data.structuredData as any).history) structured.conditions = (data.structuredData as any).history;
                        applyExtracted(structured);
                        return;
                    }
                } catch (e) {
                    console.warn('AI parsing failed for docx, falling back to regex', e);
                }

                applyExtracted(parseEhrFile(text, 'ehr.txt'));
            } catch (err) {
                console.error(err);
                toast.error('Could not read DOC/DOCX. Try saving as .docx or .txt.');
            }
            return;
        }
        if (ext === 'json' || ext === 'txt') {
            const reader = new FileReader();
            reader.onload = async () => {
                const content = String(reader.result);
                if (ext === 'json') {
                    applyExtracted(parseEhrFile(content, file.name));
                } else {
                    const apiOrigin = ((import.meta as any).env.VITE_API_URL || ((import.meta as any).env.DEV ? '' : 'http://localhost:3001')).replace(/\/api\/?$/, '');
                    // Try AI parsing for text files
                    try {
                        const res = await fetch(`${apiOrigin}/api/ehr/parse-text`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ text: content }),
                        });
                        const data = res.ok ? await res.json() : {};
                        if (data.structuredData && Object.keys(data.structuredData).length > 0) {
                            const structured = data.structuredData as ExtractedEHR;
                            if ((data.structuredData as any).history) structured.conditions = (data.structuredData as any).history;
                            applyExtracted(structured);
                            return;
                        }
                    } catch (e) {
                        console.warn('AI parsing failed for txt, falling back to regex', e);
                    }
                    applyExtracted(parseEhrFile(content, file.name));
                }
            };
            reader.readAsText(file);
            return;
        }
        toast.error('Unsupported format. Use PDF, DOC, DOCX, .txt or .json.');
    };

    const addCustomCondition = () => {
        const cond = newConditionInput.trim();
        if (!cond) return;
        if (DEFAULT_MEDICAL_CONDITIONS.includes(cond) || customConditions.includes(cond)) {
            toast.info('Condition already in list');
            return;
        }
        setCustomConditions(prev => [...prev, cond]);
        setFormData(prev => ({ ...prev, history: [...prev.history, cond] }));
        setNewConditionInput('');
        toast.success(`Added "${cond}"`);
    };

    const removeCustomCondition = (cond: string) => {
        setCustomConditions(prev => prev.filter(c => c !== cond));
        setFormData(prev => ({ ...prev, history: prev.history.filter(h => h !== cond) }));
    };

    const toggleListening = () => {
        if (isListening) {
            setIsListening(false);
            window.speechSynthesis.cancel(); // Stop any pending speech
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            toast.error("Your browser doesn't support speech recognition.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
            toast.info("Listening... Speak now.");
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setFormData(prev => ({
                ...prev,
                symptoms: prev.symptoms ? `${prev.symptoms} ${transcript}` : transcript
            }));
            toast.success("Voice captured successfully");
            setIsListening(false);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
            toast.error("Error occurred in recognition: " + event.error);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (condition: string, checked: boolean) => {
        setFormData(prev => {
            const currentHistory = [...prev.history];
            if (checked) {
                currentHistory.push(condition);
            } else {
                const index = currentHistory.indexOf(condition);
                if (index > -1) {
                    currentHistory.splice(index, 1);
                }
            }
            return { ...prev, history: currentHistory };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        try {
            const data = await triageService.assessPatient(formData);
            setResult(data);

            if (data.isSimulated) {
                toast.info('Clinical Engine: Running in Local Hybrid Mode', {
                    description: 'Remote AI server unreachable. Analysis performed via local clinical logic.',
                    duration: 5000
                });
            } else {
                toast.success('Patient triage analysis complete');
            }
        } catch (error) {
            console.error('Triage error:', error);
            toast.error('Clinical analysis failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmAdmission = async () => {
        if (!result) return;
        setLoading(true);

        try {
            const saveResult = await triageService.savePatient(formData, result);

            if (saveResult.isSimulated) {
                toast.success('Patient admission stored in local secure vault', {
                    description: 'Record will be synced once clinical server is reachable.'
                });
            } else {
                toast.success('Patient admission confirmed and stored in database');
            }

            // Update local state to reflect admission immediately
            setResult((prev: any) => ({
                ...prev,
                storedRecord: {
                    ...(prev?.storedRecord || {}),
                    status: 'Admitted'
                }
            }));
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Unexpected error while saving admission. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-3 animate-in fade-in duration-500 max-w-[1400px] mx-auto px-1">
            <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-100/60 mb-1">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="bg-gradient-to-br from-indigo-600 to-teal-500 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-white"
                            >
                                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                <circle cx="12" cy="12" r="2" fill="white" className="animate-pulse" />
                                <circle cx="18" cy="12" r="1" fill="white" opacity="0.6" />
                                <circle cx="6" cy="12" r="1" fill="white" opacity="0.6" />
                            </svg>
                        </div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none uppercase">Smart Patient Triage</h2>
                            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 text-xs font-bold animate-pulse py-1">INTELLIGENT PLATFORM</Badge>
                        </div>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-1.5 ml-0.5">Automated Clinical Diagnostics</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-tight">Active Protocol</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Input Form */}
                <div className="space-y-3">
                    <Card className="border-t-4 border-t-indigo-600 shadow-xl ring-1 ring-black/5 overflow-hidden">
                        <CardHeader className="py-3 px-4 bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
                                <Stethoscope className="w-4 h-4 text-indigo-600" />
                                Patient Assessment
                            </CardTitle>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    className="h-7 text-[10px] font-bold bg-teal-600 hover:bg-teal-500 text-white gap-1.5 rounded-lg shadow-sm"
                                    onClick={() => setShowBPLQRModal(true)}
                                >
                                    <QrCode className="w-3 h-3" />
                                    Scan Bharat PulseLink QR
                                </Button>
                                <input
                                    ref={ehrInputRef}
                                    type="file"
                                    accept=".json,.txt,.pdf,.doc,.docx"
                                    className="hidden"
                                    onChange={handleEhrUpload}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[10px] font-bold text-indigo-600 border-indigo-200 hover:bg-indigo-50 gap-1.5 rounded-lg shadow-sm"
                                    onClick={() => ehrInputRef.current?.click()}
                                >
                                    <Upload className="w-3 h-3" />
                                    Import EHR
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <form onSubmit={handleSubmit} className="space-y-4">

                                {/* Bharat PulseLink Verified Intake Banner */}
                                {bplPatientInfo && (
                                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-teal-500/10 border-2 border-teal-500/30 flex flex-col gap-2 shadow-sm animate-in fade-in duration-300">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-teal-800 font-bold text-xs">
                                                <ShieldCheck className="w-4 h-4 text-teal-600" />
                                                Verified via Bharat PulseLink QR
                                            </div>
                                            <span className="text-[10px] text-teal-600 font-mono bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                                                {bplPatientInfo.exchangeId || 'VERIFIED'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-600">
                                            {bplPatientInfo.abhaId && (
                                                <div>
                                                    <span className="font-semibold text-slate-700">ABHA: </span>
                                                    <span className="font-mono text-teal-700">{bplPatientInfo.abhaId}</span>
                                                </div>
                                            )}
                                            {bplPatientInfo.emergencyContact && (
                                                <div className="col-span-2">
                                                    <span className="font-semibold text-slate-700">Emergency: </span>
                                                    <span className="text-slate-800">{bplPatientInfo.emergencyContact.name} ({bplPatientInfo.emergencyContact.relationship})</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ID & Demographics */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="patientId" className="text-sm">Patient ID</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="patientId"
                                                name="patientId"
                                                value={formData.patientId}
                                                readOnly
                                                className="bg-gray-50 font-mono text-gray-500 h-9 text-sm"
                                            />
                                            <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={refreshPatientId} title="Generate New ID text-sm">
                                                <RefreshCw className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="name" className="text-sm">Patient Name</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            placeholder="e.g. John Doe"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="h-9 text-sm"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="age" className="text-sm">Age</Label>
                                        <Input
                                            id="age"
                                            name="age"
                                            type="number"
                                            placeholder="25"
                                            value={formData.age}
                                            onChange={handleInputChange}
                                            className="h-9 text-sm"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="gender" className="text-sm">Gender</Label>
                                        <Select value={formData.gender || undefined} onValueChange={(val: string) => handleSelectChange('gender', val)}>
                                            <SelectTrigger className="h-9 text-sm">
                                                <SelectValue placeholder="Sex" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="male">Male</SelectItem>
                                                <SelectItem value="female">Female</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="phone" className="text-sm">Phone</Label>
                                        <Input id="phone" name="phone" placeholder="Contact" value={formData.phone} onChange={handleInputChange} className="h-9 text-sm" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="bloodGroup" className="text-sm">Blood</Label>
                                        <Input id="bloodGroup" name="bloodGroup" placeholder="O+" value={formData.bloodGroup} onChange={handleInputChange} className="h-9 text-sm" />
                                    </div>
                                </div>

                                {/* Vitals - Modern Curved Design */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-teal-600" />
                                            Clinical Vitals
                                        </Label>
                                        <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full">Real-time Data</span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {/* Temperature */}
                                        <div className="group relative bg-orange-50/30 border border-orange-100 rounded-2xl p-3 transition-all hover:shadow-md hover:border-orange-200">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div className="p-1 bg-orange-100 rounded-lg text-orange-600">
                                                    <Activity className="w-3 h-3" />
                                                </div>
                                                <Label htmlFor="temperature" className="text-[10px] text-orange-700 uppercase font-bold tracking-tight">Temp (°F)</Label>
                                            </div>
                                            <Input
                                                id="temperature"
                                                name="temperature"
                                                placeholder="98.6"
                                                value={formData.temperature}
                                                onChange={handleInputChange}
                                                className="h-9 text-sm bg-white/80 border-orange-100 rounded-xl focus-visible:ring-orange-400 text-orange-900 font-semibold placeholder:text-slate-400"
                                            />
                                        </div>

                                        {/* Heart Rate */}
                                        <div className="group relative bg-red-50/30 border border-red-100 rounded-2xl p-3 transition-all hover:shadow-md hover:border-red-200">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div className="p-1 bg-red-100 rounded-lg text-red-600 animate-pulse">
                                                    <Activity className="w-3 h-3" />
                                                </div>
                                                <Label htmlFor="heartRate" className="text-[10px] text-red-700 uppercase font-bold tracking-tight">Pulse</Label>
                                            </div>
                                            <Input
                                                id="heartRate"
                                                name="heartRate"
                                                placeholder="72"
                                                value={formData.heartRate}
                                                onChange={handleInputChange}
                                                className="h-9 text-sm bg-white/80 border-red-100 rounded-xl focus-visible:ring-red-400 text-red-900 font-semibold placeholder:text-slate-400"
                                            />
                                        </div>

                                        {/* BP */}
                                        <div className="group relative bg-blue-50/30 border border-blue-100 rounded-2xl p-3 transition-all hover:shadow-md hover:border-blue-200">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div className="p-1 bg-blue-100 rounded-lg text-blue-600">
                                                    <Activity className="w-3 h-3" />
                                                </div>
                                                <Label htmlFor="bloodPressure" className="text-[10px] text-blue-700 uppercase font-bold tracking-tight">BP (mmHg)</Label>
                                            </div>
                                            <Input
                                                id="bloodPressure"
                                                name="bloodPressure"
                                                placeholder="120/80"
                                                value={formData.bloodPressure}
                                                onChange={handleInputChange}
                                                className="h-9 text-sm bg-white/80 border-blue-100 rounded-xl focus-visible:ring-blue-400 text-blue-900 font-semibold placeholder:text-slate-400"
                                            />
                                        </div>

                                        {/* SpO2 */}
                                        <div className="group relative bg-emerald-50/30 border border-emerald-100 rounded-2xl p-3 transition-all hover:shadow-md hover:border-emerald-200">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div className="p-1 bg-emerald-100 rounded-lg text-emerald-600">
                                                    <AlertTriangle className="w-3 h-3 text-emerald-600" />
                                                </div>
                                                <Label htmlFor="oxygenLevel" className="text-[10px] text-emerald-700 uppercase font-bold tracking-tight">SpO2 %</Label>
                                            </div>
                                            <Input
                                                id="oxygenLevel"
                                                name="oxygenLevel"
                                                placeholder="98"
                                                value={formData.oxygenLevel}
                                                onChange={handleInputChange}
                                                className="h-9 text-sm bg-white/80 border-emerald-100 rounded-xl focus-visible:ring-emerald-400 text-emerald-900 font-semibold placeholder:text-slate-400"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Symptoms & History */}
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
                                    <div className="md:col-span-3 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="symptoms" className="text-sm">Presenting Symptoms</Label>
                                            <button
                                                type="button"
                                                onClick={toggleListening}
                                                className={`text-[10px] px-2 py-0.5 rounded-full border transition-all flex items-center gap-1 ${isListening ? 'border-red-500 text-red-500 bg-red-50' : 'text-gray-400 border-gray-200 hover:bg-gray-50'}`}
                                            >
                                                {isListening ? <><MicOff className="w-2.5 h-2.5 animate-pulse" /> Rec</> : <><Mic className="w-2.5 h-2.5" /> Voice</>}
                                            </button>
                                        </div>
                                        <Textarea
                                            id="symptoms"
                                            name="symptoms"
                                            placeholder="Describe complaints..."
                                            className="h-28 resize-none text-sm"
                                            value={formData.symptoms}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <Label className="text-sm">Medical History</Label>
                                        <div className="grid grid-cols-1 gap-1.5 max-h-32 overflow-y-auto pr-1">
                                            {DEFAULT_MEDICAL_CONDITIONS.map((conf) => (
                                                <div key={conf} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={conf}
                                                        checked={formData.history.includes(conf)}
                                                        onCheckedChange={(checked: boolean) => handleCheckboxChange(conf, checked)}
                                                    />
                                                    <Label htmlFor={conf} className="text-xs font-normal cursor-pointer leading-none">{conf}</Label>
                                                </div>
                                            ))}
                                            {customConditions.map((conf) => (
                                                <div key={conf} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`custom-${conf}`}
                                                        checked={formData.history.includes(conf)}
                                                        onCheckedChange={(checked: boolean) => handleCheckboxChange(conf, checked)}
                                                    />
                                                    <Label htmlFor={`custom-${conf}`} className="text-xs font-normal cursor-pointer leading-none text-teal-600">{conf}</Label>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-1.5 pt-1">
                                            <Input
                                                placeholder="+ New"
                                                value={newConditionInput}
                                                onChange={(e) => setNewConditionInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCondition())}
                                                className="h-7 text-xs"
                                            />
                                            <Button type="button" variant="ghost" size="sm" onClick={addCustomCondition} className="h-7 px-2 text-xs">Add</Button>
                                        </div>
                                    </div>
                                </div>

                                <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 h-11 transition-all shadow-md group" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <BrainCircuit className="mr-2 h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            Assess Risk Now
                                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Results Panel */}
                <div className="h-fit">
                    {!result ? (
                        <div className="h-full min-h-[480px] bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 text-center">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 border border-slate-100">
                                <BrainCircuit className="w-6 h-6 text-teal-500" />
                            </div>
                            <h3 className="text-slate-600 font-semibold italic text-sm">Awaiting Clinical Data</h3>
                            <p className="text-[10px] text-slate-400 mt-1 max-w-[150px]">Report will appear here after assessment</p>
                        </div>
                    ) : (
                        <Card className="border-0 shadow-xl overflow-hidden bg-white ring-1 ring-black/5 flex flex-col h-full">

                            <CardContent className="flex-grow p-6 space-y-6 flex flex-col pt-4 bg-slate-50/50 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/20 via-slate-50/10 to-teal-100/20">
                                <div className={`p-6 rounded-3xl border shadow-sm backdrop-blur-md transition-all ${result.riskLevel === 'High' ? 'bg-red-500/10 border-red-200 shadow-red-500/5' :
                                    result.riskLevel === 'Medium' ? 'bg-yellow-500/10 border-yellow-200 shadow-yellow-500/5' :
                                        'bg-green-500/10 border-green-200 shadow-green-500/5'
                                    }`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${result.riskLevel === 'High' ? 'bg-red-500' : result.riskLevel === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${result.riskLevel === 'High' ? 'text-red-600' :
                                                        result.riskLevel === 'Medium' ? 'text-yellow-700' :
                                                            'text-green-700'
                                                        }`}>Clinical Analysis</span>
                                                    <Badge variant="outline" className={`text-[8px] h-4 font-black px-1.5 ${result.isSimulated ? 'border-amber-200 text-amber-600 bg-amber-50' : 'border-teal-200 text-teal-600 bg-teal-50 animate-pulse'}`}>
                                                        {result.isSimulated ? 'LOCAL FALLBACK' : 'AI Trained Model'}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <h2 className="text-2xl font-black text-slate-900 tracking-tighter leading-tight uppercase mb-1">
                                                {formData.name || 'Anonymous Patient'}
                                            </h2>
                                            <h3 className={`text-4xl font-black uppercase tracking-tighter leading-tight ${result.riskLevel === 'High' ? 'text-red-600' :
                                                result.riskLevel === 'Medium' ? 'text-yellow-600' :
                                                    'text-green-600'
                                                }`}>
                                                {result.riskLevel} Case
                                            </h3>
                                        </div>
                                        <div className={`p-4 rounded-3xl border ${result.riskLevel === 'High' ? 'bg-red-600 text-white animate-pulse shadow-xl shadow-red-200 border-red-400' :
                                            result.riskLevel === 'Medium' ? 'bg-yellow-500 text-white border-yellow-300 shadow-yellow-200' :
                                                'bg-green-500 text-white border-green-300 shadow-green-200'
                                            }`}>
                                            <Zap className={`w-6 h-6 fill-current ${!result.isSimulated && 'animate-bounce'}`} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-black/5">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">AI Confidence</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-black text-slate-800 leading-none">{(result.confidence * 100).toFixed(0)}</span>
                                                <span className="text-xs font-bold text-slate-300">%</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Risk Index</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-black text-slate-800 leading-none">{result.riskScore}</span>
                                                <span className="text-xs font-bold text-slate-300">/100</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Findings Section */}
                                {result.riskFactors && result.riskFactors.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-2">
                                            <div className="w-4 h-[1px] bg-slate-200"></div>
                                            Primary Risk Markers
                                        </h4>
                                        <div className="flex flex-wrap gap-1.5">
                                            {result.riskFactors.map((factor: string, i: number) => (
                                                <Badge key={i} variant="outline" className="bg-white border-slate-200 text-slate-600 text-[10px] py-0.5 px-2 h-6 font-bold shadow-sm">
                                                    {factor}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Summary Box */}
                                {result.explanation && (
                                    <div className="space-y-2">
                                        <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-2">
                                            <div className="w-4 h-[1px] bg-slate-200"></div>
                                            Clinical AI Overview
                                        </h4>
                                        <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 text-[13px] text-slate-600 leading-relaxed font-medium">
                                            {result.explanation}
                                        </div>
                                    </div>
                                )}

                                {/* Department Callout */}
                                <div className="space-y-3">
                                    <div className="bg-teal-50/50 border border-teal-100 rounded-2xl p-4 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <div className="text-[10px] text-teal-600 font-black uppercase tracking-widest flex items-center gap-2">
                                                <Zap className="w-3 h-3 animate-pulse" />
                                                Automated Clinical Routing
                                            </div>
                                            <div className="text-2xl font-black text-teal-900 leading-tight tracking-tight">
                                                {result.recommendedDepartment || result.department}
                                            </div>
                                        </div>
                                        <div className="bg-teal-100 p-3 rounded-2xl text-teal-600 shadow-sm border border-teal-200">
                                            <Stethoscope className="w-6 h-6" />
                                        </div>
                                    </div>

                                    {result.routingReason && (
                                        <div className="px-4 py-3 bg-white border border-slate-100 rounded-2xl flex items-start gap-3">
                                            <Activity className="w-4 h-4 text-slate-400 mt-0.5" />
                                            <div>
                                                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Routing Rationale</div>
                                                <p className="text-xs text-slate-600 leading-relaxed font-semibold italic">
                                                    &quot;{result.routingReason}&quot;
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-3">
                                    <Button
                                        onClick={handleConfirmAdmission}
                                        disabled={loading || (result as any).storedRecord?.status === 'Admitted'}
                                        className={`w-full h-14 shadow-xl text-xs font-black uppercase tracking-widest gap-2 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] ${(result as any).storedRecord?.status === 'Admitted'
                                            ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-100 cursor-default'
                                            : 'bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-teal-500/20'
                                            }`}
                                    >
                                        {loading ? (
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                        ) : (result as any).storedRecord?.status === 'Admitted' ? (
                                            <ShieldCheck className="w-5 h-5" />
                                        ) : (
                                            <CheckCircle2 className="w-5 h-5 text-teal-200" />
                                        )}
                                        {(result as any).storedRecord?.status === 'Admitted' ? 'Admission Confirmed' : 'Confirm Patient Admission'}
                                    </Button>

                                    {(result as any).pdfUrl && (
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                const url = ((import.meta as any).env.VITE_API_URL || 'http://localhost:3001').replace('/api', '') + (result as any).pdfUrl;
                                                window.open(url, '_blank');
                                            }}
                                            className="w-full h-10 border-teal-200 text-teal-700 hover:bg-teal-50 text-[10px] font-black uppercase tracking-widest gap-2 rounded-xl transition-all"
                                        >
                                            <FileText className="w-4 h-4" />
                                            Download EHR Document (PDF)
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            <BPLQRScannerModal
                isOpen={showBPLQRModal}
                onClose={() => setShowBPLQRModal(false)}
                onPatientLoaded={handleBPLPatientLoaded}
            />
        </div>
    );
}

/* updated */
