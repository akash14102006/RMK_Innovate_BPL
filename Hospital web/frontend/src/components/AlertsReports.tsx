import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Bell, Send, FileDown, Clock, AlertTriangle, CheckCircle, Info, Loader2, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { generateComprehensivePDFReport, ComprehensiveReportData } from '../services/comprehensiveReportService';
import { predictPatientSurge } from '../services/predictionService';
import { fetchEpidemicData, fetchHealthAlertsFromNewsAPI } from '../services/healthAlertsService';
import { fetchFestivalsFromAPI, getFestivalsByMonth, INDIAN_FESTIVALS_2026 } from '../services/festivalService';
import { toast } from 'sonner';
import ReportGenerator from './ReportGenerator';
import { generateRealTimeAlerts, getAlertStatistics, RealTimeAlert } from '../services/realTimeAlertService';

export default function AlertsReports() {
  const [showSendModal, setShowSendModal] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [alerts, setAlerts] = useState<RealTimeAlert[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Load real-time alerts
  const loadAlerts = () => {
    const newAlerts = generateRealTimeAlerts();
    setAlerts(newAlerts);
    setLastUpdate(new Date());
    toast.success('Alerts refreshed', {
      description: `${newAlerts.length} active notifications loaded`
    });
  };

  // Load alerts on mount
  useEffect(() => {
    loadAlerts();
  }, []);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const newAlerts = generateRealTimeAlerts();
      setAlerts(newAlerts);
      setLastUpdate(new Date());
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, []);

  // Get alert statistics
  const stats = getAlertStatistics(alerts);

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'success':
        return 'bg-green-500';
      case 'info':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getAlertBorderColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'border-l-red-500';
      case 'warning':
        return 'border-l-yellow-500';
      case 'success':
        return 'border-l-green-500';
      case 'info':
        return 'border-l-blue-500';
      default:
        return 'border-l-gray-500';
    }
  };

  // Handle PDF generation
  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);

    try {
      toast.info('🔄 Fetching latest data from all modules...');

      // Fetch real-time data from all services
      const [prediction, epidemicData, healthAlerts] = await Promise.all([
        predictPatientSurge({
          city: 'Chennai',
          aqi: 218,
          temperature: 29,
          humidity: 45,
          festivalName: 'Diwali',
          epidemicActive: true,
          epidemicCases: 1284,
          baselinePatients: 420,
        }),
        fetchEpidemicData(),
        fetchHealthAlertsFromNewsAPI()
      ]);

      // Get upcoming festivals
      const today = new Date();
      const next30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      const upcomingFestivals = INDIAN_FESTIVALS_2026.filter(festival => {
        const festivalDate = new Date(festival.date);
        return festivalDate >= today && festivalDate <= next30Days;
      });

      // Get current festival
      const currentFestival = INDIAN_FESTIVALS_2026.find(festival => {
        const festivalDate = new Date(festival.date);
        const diffDays = Math.abs((festivalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      });

      // State-wise disease data
      const stateWiseData = [
        { state: 'Maharashtra', cases: 2847, severity: 'high' as const },
        { state: 'Delhi', cases: 1956, severity: 'high' as const },
        { state: 'Karnataka', cases: 1423, severity: 'moderate' as const },
        { state: 'Tamil Nadu', cases: 1189, severity: 'moderate' as const },
        { state: 'Uttar Pradesh', cases: 1856, severity: 'moderate' as const },
      ];

      // Prepare comprehensive report data
      const reportData: ComprehensiveReportData = {
        hospitalName: 'Bharat PulseLink Hospital',
        city: 'Chennai',
        region: 'Chennai',
        aqi: 218,
        aqiLevel: 'Poor',
        pm25: 125,
        pm10: 234,
        temperature: 29,
        humidity: 45,
        weatherCondition: 'Hazy',
        upcomingFestivals: upcomingFestivals,
        currentFestival: currentFestival,
        prediction: prediction,
        epidemicActive: true,
        epidemicData: epidemicData,
        healthAlerts: healthAlerts.slice(0, 5),
        stateWiseData: stateWiseData,
        generatedBy: 'Bharat PulseLink System',
        generatedAt: new Date().toISOString(),
      };

      toast.success('📄 Generating comprehensive PDF report...');

      // Generate PDF
      generateComprehensivePDFReport(reportData);

      toast.success('✅ PDF report generated and downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('❌ Failed to generate PDF report. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          className="bg-teal-600 hover:bg-teal-700"
          onClick={() => setShowSendModal(true)}
        >
          <Send className="w-4 h-4 mr-2" />
          Send Alert
        </Button>
        <Button
          variant="outline"
          onClick={handleGeneratePDF}
          disabled={isGeneratingPDF}
        >
          {isGeneratingPDF ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileDown className="w-4 h-4 mr-2" />
              Generate PDF Report
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={loadAlerts}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Alerts
        </Button>
      </div>

      {/* Alert Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Critical Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-gray-900">{stats.critical}</div>
            <div className="text-sm text-gray-500 mt-1">Requires immediate action</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Active Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-gray-900">{stats.warning}</div>
            <div className="text-sm text-gray-500 mt-1">Monitor closely</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Info Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-gray-900">{stats.info}</div>
            <div className="text-sm text-gray-500 mt-1">For your awareness</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Resolved Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-gray-900">{stats.resolved}</div>
            <div className="text-sm text-gray-500 mt-1">Successfully handled</div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-600" />
            Recent Alerts & Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.map((alert) => {
              const Icon = alert.icon;
              return (
                <div
                  key={alert.id}
                  className={`p-4 border-l-4 ${getAlertBorderColor(alert.type)} bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 ${getAlertColor(alert.type)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-gray-900">{alert.title}</h3>
                        <Badge
                          variant="outline"
                          className={alert.status === 'resolved' ? 'bg-green-50 text-green-700' : 'bg-gray-50'}
                        >
                          {alert.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{alert.timestamp}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Report Generator Card */}
      <ReportGenerator variant="card" />

      {/* Report Generation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileDown className="w-5 h-5 text-blue-600" />
              Quick Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-teal-400 transition-all">
                <div className="text-gray-900 mb-1">Daily Patient Load Summary</div>
                <div className="text-sm text-gray-500">Current stats and predictions for today</div>
              </button>

              <button className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-teal-400 transition-all">
                <div className="text-gray-900 mb-1">Weekly Trend Analysis</div>
                <div className="text-sm text-gray-500">7-day patient load and predictions</div>
              </button>

              <button className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-teal-400 transition-all">
                <div className="text-gray-900 mb-1">Festival Impact Report</div>
                <div className="text-sm text-gray-500">Diwali preparation and forecast</div>
              </button>

              <button className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-teal-400 transition-all">
                <div className="text-gray-900 mb-1">Pollution & Health Analysis</div>
                <div className="text-sm text-gray-500">AQI impact on patient admissions</div>
              </button>

              <button className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-teal-400 transition-all">
                <div className="text-gray-900 mb-1">Epidemic Surveillance Report</div>
                <div className="text-sm text-gray-500">Active diseases and response plan</div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Alert Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-600" />
              Alert Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-gray-900 mb-3">Alert Channels</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm text-gray-700">SMS Notifications</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm text-gray-700">Email Alerts</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-gray-700">WhatsApp Messages</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm text-gray-700">In-App Notifications</span>
                  </label>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-gray-900 mb-3">Alert Thresholds</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600">Patient Load Threshold</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        defaultValue="150"
                        className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                      <span className="text-sm text-gray-500">patients</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">AQI Alert Level</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        defaultValue="200"
                        className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                      <span className="text-sm text-gray-500">AQI</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Epidemic Case Threshold</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        defaultValue="1000"
                        className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                      <span className="text-sm text-gray-500">cases</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                Save Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Send Alert Modal Simulation */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5 text-teal-600" />
                Send Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600">Alert Type</label>
                  <select className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg">
                    <option>Critical</option>
                    <option>Warning</option>
                    <option>Info</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Message</label>
                  <textarea
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg"
                    rows={4}
                    placeholder="Enter alert message..."
                  ></textarea>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Recipients</label>
                  <div className="space-y-2 mt-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm text-gray-700">All Administrators</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm text-gray-700">Department Heads</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm text-gray-700">Emergency Staff</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-teal-600 hover:bg-teal-700"
                    onClick={() => setShowSendModal(false)}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Now
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowSendModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
/* updated */
