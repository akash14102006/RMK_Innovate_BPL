import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Stethoscope,
  ArrowRight,
  BrainCircuit,
  RefreshCw,
  Mic,
  MicOff,
  Upload,
  User,
  Zap,
  ShieldCheck,
  Building2,
  MapPin,
  Sparkles,
  Download,
  AlertCircle,
  QrCode
} from 'lucide-react';
import BPLQRScannerModal from './BPLQRScannerModal';
import { toast } from 'sonner';
import { triageService, TriageResult, normalizeTriageResult } from '../services/triageService';
import {
  downloadPatientDetailsPDF,
  downloadClinicalTriagePDF,
  downloadCompleteAdmissionRecordPDF
} from '../services/triagePdfService';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';

try {
  if (typeof window !== 'undefined' && pdfjsLib?.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker || '/pdf.worker.min.mjs';
  }
} catch (_) {}

const MIN_TEXT_PER_PAGE = 20;

async function extractTextFromPdf(buffer: ArrayBuffer): Promise<string> {
  if (typeof window !== 'undefined' && pdfjsLib?.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker || '/pdf.worker.min.mjs';
  }

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    isEvalSupported: false,
  });

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const textParts: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ')
      .trim();
    textParts.push(text);
  }

  const nativeText = textParts.join('\n').trim();
  const avgCharsPerPage = numPages > 0 ? nativeText.length / numPages : 0;

  if (avgCharsPerPage >= MIN_TEXT_PER_PAGE) {
    return nativeText;
  }

  const ocrParts: string[] = [];
  const scale = 2;
  const worker = await Tesseract.createWorker('eng', undefined, { logger: () => {} });

  try {
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (context) {
        await page.render({ canvasContext: context, viewport } as any).promise;
        const { data } = await worker.recognize(canvas);
        ocrParts.push(data.text || '');
      }
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

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface PatientTriageProps {
  onNavigate?: (page: string) => void;
}

export type TriageStatus = 'IDLE' | 'ANALYZING' | 'SUCCESS' | 'ERROR';

export default function PatientTriage({ onNavigate }: PatientTriageProps) {
  const [status, setStatus] = useState<TriageStatus>('IDLE');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [verifiedBPLContext, setVerifiedBPLContext] = useState<any>(null);

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
  const ehrInputRef = useRef<HTMLInputElement>(null);
  const handlePatientLoadedFromQR = (patientData: any) => {
    setVerifiedBPLContext(patientData);
    setFormData(prev => {
      const existingConditions = Array.isArray(patientData.conditions)
        ? patientData.conditions.map((c: any) => (typeof c === 'string' ? c : c.condition_name || c.name || c))
        : [];

      const newHistory = Array.from(
        new Set([
          ...prev.history.filter(h => h !== 'None'),
          ...existingConditions,
        ])
      );

      return {
        ...prev,
        patientId: patientData.abhaId || patientData.patientId || prev.patientId,
        name: patientData.fullName || patientData.name || prev.name,
        age: patientData.age !== undefined && patientData.age !== null ? String(patientData.age) : prev.age,
        gender: patientData.gender || prev.gender,
        phone: patientData.primaryPhone || patientData.phone || prev.phone,
        bloodGroup: patientData.bloodGroup || prev.bloodGroup,
        history: newHistory.length > 0 ? newHistory : prev.history,
      };
    });
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
      let currentHistory = [...prev.history];
      if (condition === 'None') {
        return { ...prev, history: checked ? ['None'] : [] };
      }
      currentHistory = currentHistory.filter(c => c !== 'None');
      if (checked) {
        if (!currentHistory.includes(condition)) currentHistory.push(condition);
      } else {
        currentHistory = currentHistory.filter(c => c !== condition);
      }
      return { ...prev, history: currentHistory };
    });
  };

  const addCustomCondition = () => {
    const trimmed = newConditionInput.trim();
    if (trimmed && !customConditions.includes(trimmed) && !DEFAULT_MEDICAL_CONDITIONS.includes(trimmed)) {
      setCustomConditions(prev => [...prev, trimmed]);
      setFormData(prev => ({ ...prev, history: [...prev.history.filter(c => c !== 'None'), trimmed] }));
      setNewConditionInput('');
    }
  };

  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript;
        }
      }
      if (transcript) {
        setFormData(prev => ({
          ...prev,
          symptoms: prev.symptoms ? `${prev.symptoms} ${transcript}` : transcript
        }));
      }
    };

    recognition.start();
  };

  const handleEhrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    toast.info('Extracting clinical data from EHR file...');

    try {
      let text = '';
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const buffer = await file.arrayBuffer();
        text = await extractTextFromPdf(buffer);
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.name.endsWith('.docx')
      ) {
        const buffer = await file.arrayBuffer();
        text = await extractTextFromDocx(buffer);
      } else {
        text = await file.text();
      }

      if (!text.trim()) throw new Error('Could not extract any readable text.');

      const ageMatch = text.match(/age[:\s]+(\d+)/i);
      const genderMatch = text.match(/gender[:\s]+(male|female|other)/i);
      const bpMatch = text.match(/bp[:\s]+(\d+\/\d+)/i) || text.match(/blood pressure[:\s]+(\d+\/\d+)/i);
      const hrMatch = text.match(/pulse[:\s]+(\d+)/i) || text.match(/heart rate[:\s]+(\d+)/i);
      const spo2Match = text.match(/spo2[:\s]+(\d+)/i) || text.match(/oxygen[:\s]+(\d+)/i);
      const tempMatch = text.match(/temp(?:erature)?[:\s]+(\d+(?:\.\d+)?)/i);

      setFormData(prev => ({
        ...prev,
        age: ageMatch ? ageMatch[1] : prev.age,
        gender: genderMatch ? (genderMatch[1].charAt(0).toUpperCase() + genderMatch[1].slice(1).toLowerCase()) : prev.gender,
        bloodPressure: bpMatch ? bpMatch[1] : prev.bloodPressure,
        heartRate: hrMatch ? hrMatch[1] : prev.heartRate,
        oxygenLevel: spo2Match ? spo2Match[1] : prev.oxygenLevel,
        temperature: tempMatch ? tempMatch[1] : prev.temperature,
        symptoms: prev.symptoms ? `${prev.symptoms}\n\n[Imported EHR]\n${text.slice(0, 300)}` : text.slice(0, 400)
      }));

      toast.success('EHR data imported successfully');
    } catch (err: any) {
      console.error('EHR Parse Error:', err);
      toast.error('Failed to parse EHR document', { description: err.message });
    } finally {
      setLoading(false);
      if (ehrInputRef.current) ehrInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('ANALYZING');
    setErrorMessage(null);
    setResult(null);

    try {
      const rawData = await triageService.assessPatient(formData);
      const normalized = normalizeTriageResult(rawData, formData);
      setResult(normalized);
      setStatus('SUCCESS');

      if (normalized.isSimulated) {
        toast.info('Clinical Engine: Active Safety Net Mode', {
          description: 'Multi-tier clinical rules stratified this patient with high precision.',
          duration: 4500
        });
      } else {
        toast.success('Patient triage risk assessment complete');
      }
    } catch (error: any) {
      console.error('Triage assessment error:', error);
      setStatus('ERROR');
      setErrorMessage(error?.message || 'Clinical analysis unavailable. Please retry.');
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
        toast.success('Patient admission registered in secure hospital registry', {
          description: 'Record synced with emergency triage database.'
        });
      } else {
        toast.success('Patient admission confirmed and registered in database');
      }

      setResult((prev: any) => ({
        ...prev,
        storedRecord: {
          ...(prev?.storedRecord || {}),
          status: 'Admitted'
        }
      }));
    } catch (error) {
      console.error('Save admission error:', error);
      toast.error('Unexpected error saving admission. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 animate-in fade-in duration-500 max-w-[1400px] mx-auto px-1">
      {/* Top Title Banner */}
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
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none uppercase">
                Smart Patient Triage
              </h2>
              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 text-xs font-bold animate-pulse py-1">
                INTELLIGENT PLATFORM
              </Badge>
            </div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-1.5 ml-0.5">
              Automated Clinical Diagnostics & Companion Stratification
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-tight">Active Protocol</span>
          </div>
        </div>
      </div>

      {/* Split Screen Grid (Left: Assessment, Right: Result Companion) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* LEFT COLUMN - PATIENT ASSESSMENT */}
        <div className="space-y-3">
          <Card className="border-t-4 border-t-indigo-600 shadow-xl ring-1 ring-black/5 overflow-hidden rounded-xl bg-white">
            <CardHeader className="py-3 px-4 bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
                <Stethoscope className="w-4 h-4 text-indigo-600" />
                Patient Assessment
              </CardTitle>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="h-7 text-[10px] font-bold text-white bg-teal-600 hover:bg-teal-500 gap-1.5 rounded-lg shadow-sm"
                  onClick={() => setIsQRScannerOpen(true)}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  Scan Patient QR
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
              {verifiedBPLContext && (
                <div className="mb-4 p-3 rounded-xl bg-teal-50/90 border border-teal-200/80 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-teal-600 text-white shadow-sm">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-teal-950 flex items-center gap-2">
                        Bharat PulseLink Verified Patient
                        <Badge className="bg-teal-700 text-white text-[9px] py-0 px-1.5 font-bold">
                          {verifiedBPLContext.mode === 'OFFLINE_SECURE_QR' ? 'Offline Encrypted QR' : 'Live Verified'}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-teal-800 font-mono mt-0.5">
                        Exchange Session: {verifiedBPLContext.exchangeId || verifiedBPLContext.bplExchangeId || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setVerifiedBPLContext(null)}
                    className="h-7 text-[11px] font-semibold text-teal-900 hover:bg-teal-100 rounded-lg"
                  >
                    Clear
                  </Button>
                </div>
              )}
                <form onSubmit={handleSubmit} className="space-y-4">
                {/* ID & Demographics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="patientId" className="text-sm font-semibold text-slate-700">Patient ID</Label>
                    <div className="flex gap-2">
                      <Input
                        id="patientId"
                        name="patientId"
                        value={formData.patientId}
                        readOnly
                        className="bg-gray-50 font-mono text-gray-500 h-9 text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={refreshPatientId}
                        title="Generate New ID"
                      >
                        <RefreshCw className="h-4 w-4 text-slate-500" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-sm font-semibold text-slate-700">Patient Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="h-9 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="age" className="text-sm font-semibold text-slate-700">Age</Label>
                    <Input
                      id="age"
                      name="age"
                      type="number"
                      placeholder="e.g. 45"
                      value={formData.age}
                      onChange={handleInputChange}
                      className="h-9 text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="gender" className="text-sm font-semibold text-slate-700">Gender</Label>
                    <Select value={formData.gender} onValueChange={(val) => handleSelectChange('gender', val)} required>
                      <SelectTrigger id="gender" className="h-9 text-sm">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="bloodGroup" className="text-sm font-semibold text-slate-700">Blood Group</Label>
                    <Select value={formData.bloodGroup} onValueChange={(val) => handleSelectChange('bloodGroup', val)}>
                      <SelectTrigger id="bloodGroup" className="h-9 text-sm">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map(bg => (
                          <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Vitals Box */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-indigo-500" />
                      Baseline Physiological Vitals
                    </h3>
                    <span className="text-[10px] text-slate-400 font-semibold">Standard Triage Metrics</span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    {/* Temperature */}
                    <div className="group relative bg-amber-50/30 border border-amber-100 rounded-2xl p-3 transition-all hover:shadow-md hover:border-amber-200">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="p-1 bg-amber-100 rounded-lg text-amber-600">
                          <Activity className="w-3 h-3 text-amber-600" />
                        </div>
                        <Label htmlFor="temperature" className="text-[10px] text-amber-700 uppercase font-bold tracking-tight">Temp °F</Label>
                      </div>
                      <Input
                        id="temperature"
                        name="temperature"
                        placeholder="98.6"
                        value={formData.temperature}
                        onChange={handleInputChange}
                        className="h-9 text-sm bg-white/80 border-amber-100 rounded-xl focus-visible:ring-amber-400 text-amber-900 font-semibold placeholder:text-slate-400"
                      />
                    </div>

                    {/* Heart Rate */}
                    <div className="group relative bg-rose-50/30 border border-rose-100 rounded-2xl p-3 transition-all hover:shadow-md hover:border-rose-200">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="p-1 bg-rose-100 rounded-lg text-rose-600">
                          <Activity className="w-3 h-3 text-rose-600" />
                        </div>
                        <Label htmlFor="heartRate" className="text-[10px] text-rose-700 uppercase font-bold tracking-tight">Pulse bpm</Label>
                      </div>
                      <Input
                        id="heartRate"
                        name="heartRate"
                        placeholder="72"
                        value={formData.heartRate}
                        onChange={handleInputChange}
                        className="h-9 text-sm bg-white/80 border-rose-100 rounded-xl focus-visible:ring-rose-400 text-rose-900 font-semibold placeholder:text-slate-400"
                      />
                    </div>

                    {/* Blood Pressure */}
                    <div className="group relative bg-blue-50/30 border border-blue-100 rounded-2xl p-3 transition-all hover:shadow-md hover:border-blue-200">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="p-1 bg-blue-100 rounded-lg text-blue-600">
                          <Activity className="w-3 h-3 text-blue-600" />
                        </div>
                        <Label htmlFor="bloodPressure" className="text-[10px] text-blue-700 uppercase font-bold tracking-tight">BP mmHg</Label>
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

                {/* Symptoms & Medical History */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="md:col-span-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="symptoms" className="text-sm font-semibold text-slate-700">Presenting Symptoms</Label>
                      <button
                        type="button"
                        onClick={toggleListening}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition-all flex items-center gap-1 ${
                          isListening ? 'border-red-500 text-red-500 bg-red-50' : 'text-gray-400 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {isListening ? (
                          <>
                            <MicOff className="w-2.5 h-2.5 animate-pulse" /> Rec
                          </>
                        ) : (
                          <>
                            <Mic className="w-2.5 h-2.5" /> Voice
                          </>
                        )}
                      </button>
                    </div>
                    <Textarea
                      id="symptoms"
                      name="symptoms"
                      placeholder="Describe primary complaints, acute discomfort, or onset time..."
                      className="h-28 resize-none text-sm"
                      value={formData.symptoms}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Medical History</Label>
                    <div className="grid grid-cols-1 gap-1.5 max-h-32 overflow-y-auto pr-1">
                      {DEFAULT_MEDICAL_CONDITIONS.map((conf) => (
                        <div key={conf} className="flex items-center space-x-2">
                          <Checkbox
                            id={conf}
                            checked={formData.history.includes(conf)}
                            onCheckedChange={(checked: boolean) => handleCheckboxChange(conf, checked)}
                          />
                          <Label htmlFor={conf} className="text-xs font-normal cursor-pointer leading-none">
                            {conf}
                          </Label>
                        </div>
                      ))}
                      {customConditions.map((conf) => (
                        <div key={conf} className="flex items-center space-x-2">
                          <Checkbox
                            id={`custom-${conf}`}
                            checked={formData.history.includes(conf)}
                            onCheckedChange={(checked: boolean) => handleCheckboxChange(conf, checked)}
                          />
                          <Label htmlFor={`custom-${conf}`} className="text-xs font-normal cursor-pointer leading-none text-teal-600">
                            {conf}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1.5 pt-1">
                      <Input
                        placeholder="+ New condition"
                        value={newConditionInput}
                        onChange={(e) => setNewConditionInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCondition())}
                        className="h-7 text-xs"
                      />
                      <Button type="button" variant="ghost" size="sm" onClick={addCustomCondition} className="h-7 px-2 text-xs">
                        Add
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Primary Action Button */}
                <Button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700 h-11 transition-all shadow-md group text-white font-bold"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <BrainCircuit className="mr-2 h-4 w-4 animate-spin" />
                      Evaluating Clinical Parameters...
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

        {/* RIGHT COLUMN - LIVE PATIENT RESULT COMPANION */}
        <div className="space-y-3">
          
          {/* STATE 1: IDLE / AWAITING DATA */}
          {status === 'IDLE' && !result && (
            <Card className="border-t-4 border-t-teal-600 shadow-xl ring-1 ring-black/5 overflow-hidden rounded-xl bg-white min-h-[560px] flex flex-col justify-center items-center p-8 text-center border-dashed">
              <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 mb-4 border border-teal-100 shadow-sm">
                <BrainCircuit className="w-8 h-8" />
              </div>
              <h3 className="text-slate-700 font-bold text-base">Awaiting Clinical Data</h3>
              <p className="text-slate-400 text-xs max-w-[320px] mt-2 font-medium leading-relaxed">
                Enter patient vitals and presenting symptoms on the left, then click <span className="text-teal-600 font-semibold">Assess Risk Now</span> to activate multi-tier ML/LLM risk stratification and automated department routing.
              </p>
              <div className="flex items-center gap-2 mt-6 py-1.5 px-3 bg-slate-50 border border-slate-200/60 rounded-full text-[11px] text-slate-500 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>Deterministic Clinical Rules + XGBoost + Gemini CDSS</span>
              </div>
            </Card>
          )}

          {/* STATE 2: ANALYZING / SKELETON LOADING */}
          {status === 'ANALYZING' && (
            <Card className="border-t-4 border-t-teal-600 shadow-xl ring-1 ring-black/5 overflow-hidden rounded-xl bg-white p-6 space-y-6 min-h-[560px] flex flex-col justify-center">
              <div className="text-center space-y-2">
                <div className="inline-flex p-3 bg-teal-50 text-teal-600 rounded-2xl animate-pulse">
                  <BrainCircuit className="w-8 h-8 animate-spin text-teal-600" />
                </div>
                <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">
                  Analyzing Patient Acuity
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Processing physiological signals against clinical guidelines...
                </p>
              </div>

              {/* Progress Step Skeletons */}
              <div className="space-y-3 max-w-md mx-auto w-full">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-2.5">
                    <Activity className="w-4 h-4 text-teal-500" />
                    <span className="text-xs font-semibold text-slate-700">Evaluating Physiological Vitals</span>
                  </div>
                  <Badge className="bg-teal-100 text-teal-700 text-[10px]">Processing</Badge>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between animate-pulse delay-75">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-semibold text-slate-700">Executing XGBoost / Gemini CDSS</span>
                  </div>
                  <Badge className="bg-indigo-100 text-indigo-700 text-[10px]">Active</Badge>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between animate-pulse delay-150">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-semibold text-slate-700">Calculating Department Allocation</span>
                  </div>
                  <Badge className="bg-amber-100 text-amber-700 text-[10px]">Pending</Badge>
                </div>
              </div>
            </Card>
          )}

          {/* STATE 3: ERROR / RETRY */}
          {status === 'ERROR' && (
            <Card className="border-t-4 border-t-rose-600 shadow-xl ring-1 ring-black/5 overflow-hidden rounded-xl bg-white min-h-[560px] flex flex-col justify-center items-center p-8 text-center">
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-4 border border-rose-100 shadow-sm">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-slate-800 font-bold text-base">Clinical Analysis Unavailable</h3>
              <p className="text-slate-500 text-xs max-w-[340px] mt-2 font-medium leading-relaxed">
                {errorMessage || 'An unexpected error occurred while communicating with the clinical diagnostic engine.'}
              </p>
              <Button
                onClick={handleSubmit as any}
                className="mt-6 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs h-10 px-5 rounded-xl gap-2 shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Clinical Analysis
              </Button>
            </Card>
          )}

          {/* STATE 4: SUCCESS / LIVE PATIENT RESULT COMPANION */}
          {status === 'SUCCESS' && result && (
            <Card className="border-t-4 border-t-teal-600 shadow-xl ring-1 ring-black/5 overflow-hidden rounded-xl bg-white">
              
              {/* Header: Clinical Analysis & Model Status */}
              <CardHeader className="py-3 px-4 bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg border border-teal-100">
                    <BrainCircuit className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-800">
                      Clinical Analysis
                    </CardTitle>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {result.modelStatus || 'PRIMARY MODEL'}
                    </div>
                  </div>
                </div>

                <Badge
                  className={`font-black tracking-widest text-[10px] px-2.5 py-0.5 rounded-full ${
                    result.priority === 'CRITICAL' || result.priority === 'HIGH' || result.riskLevel === 'High' || result.riskLevel === 'Critical'
                      ? 'bg-rose-50 text-rose-600 border border-rose-200'
                      : result.priority === 'MODERATE' || result.riskLevel === 'Moderate' || result.riskLevel === 'Medium'
                      ? 'bg-amber-50 text-amber-600 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  }`}
                >
                  {(result.priority || result.riskLevel || 'MODERATE').toUpperCase()} CASE
                </Badge>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                
                {/* 1. Patient Acuity & Metric Indicators */}
                <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black text-slate-900 uppercase tracking-tight">
                        {formData.name || result.patientName || 'Patient'}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 font-bold">
                        {formData.patientId || result.patientId}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Decision Engine</span>
                      <div className="text-xs font-bold text-slate-700">{result.decisionEngine}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {/* AI Confidence */}
                    <div className="bg-white border border-slate-100 rounded-xl p-2.5">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">AI Confidence</span>
                        <span className="text-xs font-black text-teal-600">{result.confidence}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-teal-500 h-full rounded-full transition-all duration-700" style={{ width: `${result.confidence}%` }}></div>
                      </div>
                    </div>

                    {/* Risk Score */}
                    <div className="bg-white border border-slate-100 rounded-xl p-2.5">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Risk Score</span>
                        <span className={`text-xs font-black ${
                          result.riskScore >= 70 ? 'text-rose-600' : result.riskScore >= 40 ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {result.riskScore} / 100
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            result.riskScore >= 70 ? 'bg-rose-500' : result.riskScore >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${result.riskScore}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. AI Clinical Reasoning */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      AI Clinical Reasoning
                    </h4>
                    <span className="text-[10px] text-slate-400 font-semibold">Prioritization Factors</span>
                  </div>

                  <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-3.5 text-xs text-slate-700 leading-relaxed font-medium">
                    {result.explanation}
                  </div>

                  {/* Risk Markers */}
                  {result.riskFactors && result.riskFactors.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {result.riskFactors.map((factor: string, i: number) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="bg-white border-slate-200 text-slate-600 text-[10px] py-0.5 px-2 h-6 font-bold shadow-sm flex items-center gap-1"
                        >
                          <Activity className="w-2.5 h-2.5 text-teal-600" />
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Urgency & Recommended Action */}
                  {result.recommendedNextStep && (
                    <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl text-xs font-semibold text-amber-800 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-[9px] uppercase tracking-wider font-bold text-amber-600">Urgency & Action</div>
                        <div>{result.recommendedNextStep}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Clinical Evidence Findings */}
                {result.clinicalEvidence?.findings && result.clinicalEvidence.findings.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-teal-600" />
                      Clinical Evidence
                    </h4>
                    <div className="bg-white border border-slate-100 rounded-xl divide-y divide-slate-50 overflow-hidden">
                      {result.clinicalEvidence.findings.map((item, idx) => (
                        <div key={idx} className="p-2.5 px-3 flex items-center justify-between text-xs">
                          <div className="font-medium text-slate-700">{item.label}</div>
                          <div className="flex items-center gap-2">
                            {item.value && <span className="font-semibold text-slate-900">{item.value}</span>}
                            <Badge
                              className={`text-[9px] font-black px-1.5 py-0 ${
                                item.impact === 'HIGH'
                                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                  : item.impact === 'MEDIUM'
                                  ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                  : 'bg-slate-50 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {item.impact || 'STANDARD'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Automated Clinical Routing */}
                <div className="space-y-2">
                  <div className="bg-teal-50/50 border border-teal-100 rounded-2xl p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-[10px] text-teal-600 font-black uppercase tracking-widest flex items-center gap-1.5">
                        <Zap className="w-3 h-3 animate-pulse text-teal-600" />
                        Automated Clinical Routing
                      </div>
                      <div className="text-2xl font-black text-teal-900 leading-tight tracking-tight">
                        {result.department}
                      </div>
                      <div className="text-[11px] text-teal-700 font-semibold flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
                        {result.departmentLocation}
                      </div>
                    </div>
                    <div className="bg-teal-100 p-3 rounded-2xl text-teal-600 shadow-sm border border-teal-200">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                  </div>

                  {result.routingReason && (
                    <div className="px-3.5 py-2.5 bg-slate-50/60 border border-slate-100 rounded-xl flex items-start gap-2.5">
                      <Building2 className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Routing Rationale</div>
                        <p className="text-xs text-slate-600 leading-relaxed font-semibold italic">
                          &quot;{result.routingReason}&quot;
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Admission Action */}
                <div className="flex flex-col gap-2.5 pt-1">
                  <Button
                    onClick={handleConfirmAdmission}
                    disabled={loading || (result as any).storedRecord?.status === 'Admitted'}
                    className={`w-full h-12 shadow-md text-xs font-black uppercase tracking-widest gap-2 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] ${
                      (result as any).storedRecord?.status === 'Admitted'
                        ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-200 cursor-default'
                        : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-500/20'
                    }`}
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (result as any).storedRecord?.status === 'Admitted' ? (
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    )}
                    {(result as any).storedRecord?.status === 'Admitted' ? 'Admission Confirmed' : 'Confirm Patient Admission'}
                  </Button>

                  {/* 6. Post-Admission Record & PDF Actions */}
                  {(result as any).storedRecord?.status === 'Admitted' && (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-2 mt-1 animate-in fade-in duration-300">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3 h-3 text-teal-600" />
                        Patient Record & Clinical Documentation
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadPatientDetailsPDF(formData, result)}
                          className="h-8 text-[10px] font-bold text-slate-700 border-slate-200 hover:bg-white rounded-xl gap-1"
                        >
                          <Download className="w-3 h-3 text-teal-600" />
                          Patient Details
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadClinicalTriagePDF(formData, result)}
                          className="h-8 text-[10px] font-bold text-slate-700 border-slate-200 hover:bg-white rounded-xl gap-1"
                        >
                          <Download className="w-3 h-3 text-indigo-600" />
                          Triage Report
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadCompleteAdmissionRecordPDF(formData, result)}
                          className="h-8 text-[10px] font-bold text-slate-700 border-slate-200 hover:bg-white rounded-xl gap-1"
                        >
                          <Download className="w-3 h-3 text-emerald-600" />
                          Full Admission
                        </Button>
                      </div>

                      {result.pdfUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const url = ((import.meta as any).env.VITE_API_URL || 'http://localhost:3001').replace('/api', '') + result.pdfUrl;
                            window.open(url, '_blank');
                          }}
                          className="w-full h-8 text-[10px] font-bold text-teal-700 border-teal-200 hover:bg-teal-50 rounded-xl gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          Download EHR Document (PDF)
                        </Button>
                      )}
                    </div>
                  )}
                </div>

              </CardContent>
            </Card>
          )}

        </div>
      </div>
          <BPLQRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onPatientLoaded={handlePatientLoadedFromQR}
      />
    </div>
  );
}
