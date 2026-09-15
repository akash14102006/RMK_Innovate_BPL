import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
    Calendar,
    Search,
    FileText,
    Download,
    Filter,
    Activity,
    Users,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react';
import { triageService, PatientRecord } from '../services/triageService';
import { toast } from 'sonner';

export default function PatientHistory() {
    const [patients, setPatients] = useState<PatientRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('today'); // all, today, high_risk
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadHistory();
    }, [filter]);

    const loadHistory = async () => {
        setLoading(true);
        try {
            let data: PatientRecord[] = [];

            if (filter === 'today') {
                const today = new Date().toISOString().split('T')[0];
                data = await triageService.getHistory({ date: today });
            } else if (filter === 'all') {
                data = await triageService.getHistory({ filter: 'last7' });
            } else {
                data = await triageService.getHistory();
            }

            if (filter === 'high_risk') {
                data = data.filter(p => p.assessment?.riskLevel === 'High');
            }

            setPatients(data);
        } catch (error) {
            console.error('Failed to load history:', error);
            toast.error('Could not load patient history');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = (patient: PatientRecord) => {
        if (!patient.pdfPath) {
            toast.error('PDF report not available');
            return;
        }
        const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';
        const url = `${apiUrl}${patient.pdfPath.startsWith('/') ? '' : '/'}${patient.pdfPath}`;
        window.open(url, '_blank');
    };

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.patientId.toLowerCase().includes(search.toLowerCase())
    );

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'High': return 'bg-red-100 text-red-700 border-red-200';
            case 'Medium': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Low': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">
                        Patient Archives
                    </h2>
                    <p className="text-gray-500 mt-1">
                        Historical records and clinical assessment reports
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant={filter === 'today' ? 'default' : 'outline'}
                        onClick={() => setFilter('today')}
                        className="gap-2"
                    >
                        <Calendar className="w-4 h-4" /> Today
                    </Button>
                    <Button
                        variant={filter === 'all' ? 'default' : 'outline'}
                        onClick={() => setFilter('all')}
                        className="gap-2"
                    >
                        <Users className="w-4 h-4" /> Recent
                    </Button>
                    <Button
                        variant={filter === 'high_risk' ? 'destructive' : 'outline'}
                        onClick={() => setFilter('high_risk')}
                        className="gap-2"
                    >
                        <AlertTriangle className="w-4 h-4" /> High Risk
                    </Button>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                    placeholder="Search by name or ID..."
                    className="pl-10 h-12 text-lg bg-white shadow-sm border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <Activity className="w-10 h-10 animate-spin mb-4 text-teal-600" />
                    <p>Loading records...</p>
                </div>
            ) : filteredPatients.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No records found</h3>
                    <p className="text-gray-500">Try adjusting filters or search terms</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredPatients.map((patient) => {
                        const riskLevel = patient.assessment?.riskLevel || 'Unknown';
                        const riskColor = getRiskColor(riskLevel);

                        return (
                            <Card key={patient._id} className="hover:shadow-md transition-shadow duration-200 border-l-4 border-l-transparent hover:border-l-teal-500">
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">

                                        <div className="flex items-center gap-4 min-w-[200px]">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${patient.gender === 'Female' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'
                                                }`}>
                                                {patient.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">{patient.name}</h3>
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <span>{patient.patientId}</span>
                                                    <span>•</span>
                                                    <span>{patient.age}Y / {patient.gender}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 items-center">
                                            <Badge className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider ${riskColor} border`}>
                                                {riskLevel} Risk
                                            </Badge>

                                            <Badge variant="outline" className="px-3 py-1 bg-slate-50 text-slate-600 border-slate-200">
                                                {patient.assignedDepartment || patient.assessment?.department || 'General'}
                                            </Badge>

                                            {patient.status === 'Completed' && (
                                                <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" /> Completed
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 ml-auto md:ml-0">
                                            <div className="text-right text-sm text-gray-500 hidden sm:block">
                                                <div>{new Date(patient.createdAt).toLocaleDateString()}</div>
                                                <div className="text-xs">{new Date(patient.createdAt).toLocaleTimeString()}</div>
                                            </div>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-2 text-teal-600 border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                                                onClick={() => handleDownloadPDF(patient)}
                                                disabled={!patient.pdfPath}
                                            >
                                                <Download className="w-4 h-4" />
                                                {patient.pdfPath ? 'PDF' : 'None'}
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    );
}

/* updated */
