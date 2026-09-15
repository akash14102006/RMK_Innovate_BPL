import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Users, Activity, Wind, Calendar as CalendarIcon, AlertTriangle, TrendingUp, TrendingDown, Wifi, RefreshCw, Stethoscope, Clock, ChevronRight, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { useState, useEffect, useMemo } from 'react';
import { triageService, PatientRecord } from '../services/triageService';
import { apiKeyService } from '../services/apiKeyService';
import {
  getRealTimeDashboardMetrics,
  getPatientLoadTrend,
  calculatePreparednessStatus,
  getAIInsights,
  DashboardMetrics,
  PatientTrendData
} from '../services/realTimeDashboardService';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [patientTrendData, setPatientTrendData] = useState<PatientTrendData[]>([]);
  const [waitingPatients, setWaitingPatients] = useState<PatientRecord[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Load real-time data
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const hasAQI = apiKeyService.isWAQIConfigured();
      const hasWeather = apiKeyService.isWeatherConfigured();
      setIsLiveMode(hasAQI || hasWeather);

      // 1. Fetch waiting patients first
      const upcomingPatients = await triageService.getWaitingPatients();
      setWaitingPatients(upcomingPatients);

      // 2. Fetch metrics and trend using the current patient count
      const [metricsData, trendData] = await Promise.all([
        getRealTimeDashboardMetrics('chennai', upcomingPatients.length),
        getPatientLoadTrend('chennai', upcomingPatients.length)
      ]);

      setMetrics(metricsData);
      setPatientTrendData(trendData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);
  // Dynamic department distribution calculated from waiting patients
  const departmentData = useMemo(() => {
    const counts: Record<string, number> = {};
    waitingPatients.forEach(p => {
      const dep = p.assignedDepartment || p.assessment.department || 'General Medicine';
      counts[dep] = (counts[dep] || 0) + 1;
    });

    const colors = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#6366F1', '#EC4899'];

    // If no waiting patients, show a baseline distribution
    if (waitingPatients.length === 0) {
      return [
        { name: 'Emergency', value: 35, color: '#EF4444' },
        { name: 'ICU', value: 20, color: '#F59E0B' },
        { name: 'General Ward', value: 25, color: '#3B82F6' },
        { name: 'Respiratory', value: 15, color: '#8B5CF6' },
        { name: 'Pediatrics', value: 5, color: '#10B981' },
      ];
    }

    return Object.entries(counts).map(([name, value], index) => ({
      name,
      value: Math.round((value / waitingPatients.length) * 100),
      color: colors[index % colors.length]
    }));
  }, [waitingPatients]);

  // Calculate preparedness status from real metrics
  const preparednessStatus = metrics ? calculatePreparednessStatus(metrics).status : 'yellow';
  const preparednessMessage = metrics ? calculatePreparednessStatus(metrics).message : 'Loading...';

  // Get AI insights
  const aiInsights = metrics ? getAIInsights(metrics) : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-yellow-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'green': return 'Optimal';
      case 'yellow': return 'Moderate Alert';
      case 'red': return 'High Alert';
      default: return 'Unknown';
    }
  };

  // Memoized sorted priority queue
  const prioritizedQueue = useMemo(() => {
    const riskPriority: Record<string, number> = { 'High': 3, 'Medium': 2, 'Low': 1 };

    let filtered = [...waitingPatients];
    if (selectedDepartment !== 'All') {
      filtered = filtered.filter(p => p.assignedDepartment === selectedDepartment);
    }

    return filtered.sort((a, b) => {
      // 1. Sort by Risk Level (High -> Medium -> Low)
      const priorityA = riskPriority[a.assessment.riskLevel] || 0;
      const priorityB = riskPriority[b.assessment.riskLevel] || 0;
      if (priorityA !== priorityB) return priorityB - priorityA;

      // 2. Sort by Risk Score descending
      if (a.assessment.riskScore !== b.assessment.riskScore) {
        return b.assessment.riskScore - a.assessment.riskScore;
      }

      // 3. Sort by timestamp (earliest first - those waiting longest)
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [waitingPatients, selectedDepartment]);

  const departments = useMemo(() => {
    const deps = new Set<string>();
    waitingPatients.forEach(p => {
      if (p.assignedDepartment) deps.add(p.assignedDepartment);
    });
    return ['All', ...Array.from(deps).sort()];
  }, [waitingPatients]);

  const getRiskBadgeStyles = (level: string) => {
    switch (level) {
      case 'High': return 'bg-red-500 text-white border-red-600 shadow-sm shadow-red-200';
      case 'Medium': return 'bg-orange-500 text-white border-orange-600 shadow-sm shadow-orange-200';
      case 'Low': return 'bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-200';
      default: return 'bg-slate-500 text-white';
    }
  };

  const getWaitingTime = (createdAt: string) => {
    const diffMs = new Date().getTime() - new Date(createdAt).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m waiting`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}m waiting`;
  };

  // Loading state
  const handleCompletePatient = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    try {
      await triageService.updatePatientStatus(id, 'Completed');
      setWaitingPatients(prev => prev.filter(p => p._id !== id));
      toast.success(`Patient ${name} marked as completed`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading real-time dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Mode Indicator */}
      {!isLiveMode && (
        <Card className="bg-gradient-to-r from-blue-50 to-sky-50 border-blue-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-gray-900">System Mode: Demo Data</div>
                  <p className="text-sm text-gray-600">
                    All features working perfectly! Using realistic sample data for demonstrations.
                  </p>
                </div>
              </div>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                onClick={() => window.location.hash = '#settings'}
              >
                Enable Live Data
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLiveMode && (
        <Card className="bg-gradient-to-r from-green-50 to-teal-50 border-green-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <Wifi className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div>
                  <div className="text-gray-900">System Mode: Live Real-Time Data</div>
                  <p className="text-sm text-gray-600">
                    Connected to live APIs • Getting real-time pollution and weather data • Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={loadDashboardData}
                  className="p-2 hover:bg-green-200 rounded-lg transition-colors"
                  title="Refresh data"
                >
                  <RefreshCw className={`w-4 h-4 text-green-700 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <div className="flex items-center gap-2 text-xs text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  LIVE
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert Bar */}
      <div className={`${getStatusColor(preparednessStatus)} rounded-xl p-4 text-white flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6" />
          <div>
            <div className="font-semibold">Hospital Preparedness Status: {getStatusText(preparednessStatus)}</div>
            <div className="text-sm opacity-90">
              {preparednessMessage}
            </div>
          </div>
        </div>
        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
          {metrics?.festivalImpact.festivalName !== 'None' ? 'Festival Alert' : 'Normal'}
        </Badge>
      </div>

      {/* Upcoming Patients Priority Queue */}
      <Card className="border-l-4 border-l-red-500 shadow-lg shadow-red-500/5 mb-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-lg font-black tracking-tighter flex items-center gap-2">
            <button onClick={loadDashboardData} className="hover:bg-slate-100 p-1 rounded-full transition-colors" title="Refresh Queue">
              <RefreshCw className={`w-5 h-5 text-red-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
            UPCOMING PATIENTS (PRIORITY QUEUE)
          </CardTitle>
          <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-100 uppercase text-[10px] font-black">
            {waitingPatients.length} Waiting
          </Badge>
        </CardHeader>
        <CardContent>
          {/* Department Quick Filters */}
          <div className="flex flex-wrap gap-2 mb-6 p-1">
            {departments.map(dep => (
              <button
                key={dep}
                onClick={() => setSelectedDepartment(dep)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${selectedDepartment === dep
                  ? 'bg-red-600 text-white shadow-lg shadow-red-200 scale-105'
                  : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'
                  }`}
              >
                {dep}
                {dep !== 'All' && (
                  <span className="ml-2 opacity-60">
                    ({waitingPatients.filter(p => p.assignedDepartment === dep).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {prioritizedQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-tight">Queue is currently clear</p>
              <p className="text-slate-400 text-xs mt-1 max-w-[200px]">Waiting patients will appear here after you process their EHR in the Triage tab.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar p-1">
              {prioritizedQueue.map((patient) => {
                const level = patient.assessment?.riskLevel || 'Unknown';
                const score = patient.assessment?.riskScore ?? '?';

                return (
                  <div
                    key={patient._id}
                    className="group relative flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-red-200 hover:shadow-xl hover:shadow-red-500/5 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <Badge className={`h-12 w-12 rounded-xl flex flex-col items-center justify-center gap-0 border-2 ${getRiskBadgeStyles(level)}`}>
                        <span className="text-[10px] font-black leading-none opacity-80">{level.charAt(0)}</span>
                        <span className="text-lg font-black leading-none">{score}</span>
                      </Badge>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{patient.name}</h4>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{patient.age}Y</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg font-black uppercase tracking-tighter flex items-center gap-1">
                            <Stethoscope className="w-3 h-3" />
                            {patient.assessment?.department ? patient.assessment.department.split('/')[0] : 'General'}
                          </span>
                          <span className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getWaitingTime(patient.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleCompletePatient(e, patient._id, patient.name)}
                      className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-200 hover:border-emerald-500 flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-emerald-500/20 opacity-0 group-hover:opacity-100 ml-4 flex-shrink-0 transform active:scale-95"
                      title="Mark as Completed"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Metrics Cards */
      }
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-teal-500 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Predicted Patient Load</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-gray-900">{metrics?.predictedPatientLoad.value || 520}</div>
            <div className="flex items-center gap-2 mt-2">
              <TrendingUp className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-500">{metrics?.predictedPatientLoad.change || '+24% from today'}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">{metrics?.predictedPatientLoad.date || 'Feb 18, 2026'}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Staff Required</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-gray-900">{metrics?.staffRequired.value || 68}</div>
            <div className="flex items-center gap-2 mt-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-600">Current: {metrics?.staffRequired.current || 52}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">+{metrics?.staffRequired.additional || 16} additional needed</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
              Current AQI Level
              {metrics?.currentAQI.isLive && (
                <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  <Wifi className="w-3 h-3" />
                  Live
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-gray-900">{metrics?.currentAQI.value || 218}</div>
            <div className="flex items-center gap-2 mt-2">
              <Wind className="w-4 h-4 text-orange-500" />
              <span className={`text-sm ${(metrics?.currentAQI.value || 218) > 200 ? 'text-red-500' :
                (metrics?.currentAQI.value || 218) > 150 ? 'text-orange-500' :
                  'text-yellow-500'
                }`}>
                {metrics?.currentAQI.status || 'Very Unhealthy'}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">{metrics?.currentAQI.city || 'Chennai'}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Festival Impact Flag</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl ${metrics?.festivalImpact.level === 'CRITICAL' ? 'text-red-600' :
              metrics?.festivalImpact.level === 'HIGH' ? 'text-orange-600' :
                metrics?.festivalImpact.level === 'MODERATE' ? 'text-yellow-600' :
                  'text-green-600'
              }`}>
              {metrics?.festivalImpact.level || 'HIGH'}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <CalendarIcon className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-gray-600">{metrics?.festivalImpact.festivalName || 'Diwali'}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {metrics?.festivalImpact.date && metrics.festivalImpact.date !== 'N/A' && !isNaN(new Date(metrics.festivalImpact.date).getTime())
                ? new Date(metrics.festivalImpact.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'No major upcoming festival'}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Epidemic Alert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl ${metrics?.epidemicAlert.level === 'High' ? 'text-red-600' :
              metrics?.epidemicAlert.level === 'Moderate' ? 'text-yellow-600' :
                'text-green-600'
              }`}>
              {metrics?.epidemicAlert.level || 'Low'}
            </div>
            <div className="flex items-center gap-2 mt-2">
              {metrics?.epidemicAlert.level === 'High' ? (
                <TrendingUp className="w-4 h-4 text-red-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-green-500" />
              )}
              <span className={`text-sm ${metrics?.epidemicAlert.level === 'High' ? 'text-red-500' : 'text-green-500'
                }`}>
                {metrics?.epidemicAlert.status || 'Stable'}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">{metrics?.epidemicAlert.description || 'No active threats'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Load Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-600" />
                Patient Load Trend (Last 30 Days + 7 Day Forecast)
              </div>
              {isLiveMode && (
                <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  <Wifi className="w-3 h-3" />
                  Real-Time
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={patientTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="date"
                  stroke="#6B7280"
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis stroke="#6B7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="patients"
                  stroke="#009688"
                  strokeWidth={2}
                  name="Actual Patients"
                  dot={{ fill: '#009688', r: 3 }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#3A86FF"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="AI Prediction"
                  dot={{ fill: '#3A86FF', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
            {aiInsights.length > 0 && (
              <div className="mt-4 p-3 bg-teal-50 rounded-lg">
                <p className="text-sm text-teal-800">
                  <strong>AI Insights:</strong>
                </p>
                <ul className="mt-2 space-y-1 text-sm text-teal-700">
                  {aiInsights.map((insight, idx) => (
                    <li key={idx}>• {insight}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Department-Wise Load
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={(entry) => `${entry.value}%`}
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {departmentData.map((dept, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color }}></div>
                    <span className="text-gray-600">{dept.name}</span>
                  </div>
                  <span className="text-gray-900">{dept.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-gray-900 mb-1">Respiratory Cases {metrics?.currentAQI.value && metrics.currentAQI.value > 200 ? '↑' : '→'}</h3>
                <p className="text-sm text-gray-600">
                  {metrics?.currentAQI.value && metrics.currentAQI.value > 200
                    ? `Expected ${Math.round(metrics.currentAQI.value / 5)}% increase in respiratory admissions due to AQI levels at ${metrics.currentAQI.value}.`
                    : 'Respiratory admissions stable. Monitor AQI levels regularly.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-gray-900 mb-1">Staff Optimization</h3>
                <p className="text-sm text-gray-600">
                  {metrics?.staffRequired.additional
                    ? `Schedule ${metrics.staffRequired.additional} additional staff members (${Math.ceil(metrics.staffRequired.additional * 0.75)} nurses, ${Math.floor(metrics.staffRequired.additional * 0.25)} doctors) to maintain service quality.`
                    : 'Current staffing levels are adequate. Monitor patient load for changes.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-gray-900 mb-1">
                  {metrics?.festivalImpact.level === 'HIGH' || metrics?.festivalImpact.level === 'CRITICAL'
                    ? 'Inventory Alert'
                    : 'Inventory Status'}
                </h3>
                <p className="text-sm text-gray-600">
                  {metrics?.festivalImpact.level === 'HIGH' || metrics?.festivalImpact.level === 'CRITICAL'
                    ? `Stock up on oxygen cylinders, respiratory medicines, and burn treatment supplies before ${metrics.festivalImpact.festivalName}.`
                    : 'Inventory levels normal. Maintain standard stock rotation protocols.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* updated */
