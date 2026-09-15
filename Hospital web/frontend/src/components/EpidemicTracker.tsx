import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { AlertTriangle, TrendingUp, Shield, Bell, Map, Wifi, RefreshCw, ExternalLink, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchEpidemicData, fetchHealthAlertsFromNewsAPI, isHealthAlertsConfigured, EpidemicData, HealthAlert } from '../services/healthAlertsService';
import { apiKeyService } from '../services/apiKeyService';
import { toast } from 'sonner';
import { RealTimeHealthMap } from './RealTimeHealthMap';
import { GoogleMapsSetupGuide } from './GoogleMapsSetupGuide';

export default function EpidemicTracker() {
  const [diseases, setDiseases] = useState<EpidemicData[]>([]);
  const [healthAlerts, setHealthAlerts] = useState<HealthAlert[]>([]);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showHealthMap, setShowHealthMap] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [stateData, setStateData] = useState([
    { state: 'Maharashtra', cases: 2847, severity: 'high' as const },
    { state: 'Delhi', cases: 1956, severity: 'high' as const },
    { state: 'Karnataka', cases: 1423, severity: 'moderate' as const },
    { state: 'Tamil Nadu', cases: 1189, severity: 'moderate' as const },
    { state: 'Uttar Pradesh', cases: 1856, severity: 'moderate' as const },
    { state: 'Kerala', cases: 876, severity: 'moderate' as const },
    { state: 'West Bengal', cases: 1234, severity: 'moderate' as const },
    { state: 'Gujarat', cases: 654, severity: 'low' as const },
    { state: 'Rajasthan', cases: 523, severity: 'low' as const },
    { state: 'Punjab', cases: 412, severity: 'low' as const },
  ]);

  // Load epidemic data
  const loadEpidemicData = async () => {
    setIsLoading(true);
    try {
      const isConfigured = isHealthAlertsConfigured();
      setIsLiveMode(isConfigured);

      const epidemicData = await fetchEpidemicData();
      setDiseases(epidemicData);

      const alerts = await fetchHealthAlertsFromNewsAPI();
      setHealthAlerts(alerts.slice(0, 3));

      // Update state-wise data when live mode is enabled
      if (isConfigured) {
        // Simulate dynamic state data updates based on real-time sources
        setStateData(prevData => prevData.map(state => ({
          ...state,
          cases: state.cases + Math.floor(Math.random() * 50) - 25, // Random variation
        })));

        toast.success('Live health alerts loaded', {
          description: `${alerts.length} alerts from News API & WHO feeds`
        });
      }
    } catch (error) {
      console.error('Error loading epidemic data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadEpidemicData();
  }, []);

  // Auto-refresh health alerts every 15 minutes when live mode is enabled
  useEffect(() => {
    if (!isLiveMode) return;

    const interval = setInterval(() => {
      loadEpidemicData();
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(interval);
  }, [isLiveMode]);

  const getAlertBadge = (level: string) => {
    switch (level) {
      case 'high':
        return <Badge className="bg-red-500">High Alert</Badge>;
      case 'moderate':
        return <Badge className="bg-yellow-500">Moderate</Badge>;
      case 'low':
        return <Badge className="bg-green-500">Low Risk</Badge>;
      default:
        return null;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'down':
        return <TrendingUp className="w-4 h-4 text-green-500 rotate-180" />;
      case 'stable':
        return <div className="w-4 h-0.5 bg-gray-400"></div>;
      default:
        return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500';
      case 'moderate':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* API Configuration Banner */}
      {!isLiveMode && (
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-300">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-gray-900 mb-1">🌐 Enable Live Health Alerts from News API & WHO</div>
                <p className="text-sm text-gray-600 mb-3">
                  Get real-time epidemic tracking with verified health alerts from News API and WHO feeds. Updates every 15 minutes with disease surveillance data.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      window.location.hash = '#settings';
                      setTimeout(() => {
                        document.getElementById('api-configuration')?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                  >
                    <Bell className="w-3 h-3 mr-1" />
                    Configure News API
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert Banner */}
      <div className="bg-red-500 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <div className="font-semibold flex items-center gap-2">
                Active Epidemic Alert - Dengue Outbreak
                {isLiveMode && (
                  <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                    <Wifi className="w-3 h-3" />
                    Live
                  </span>
                )}
              </div>
              <div className="text-sm opacity-90">
                Maharashtra and Delhi showing significant surge. Implement vector control measures immediately.
              </div>
            </div>
          </div>
          <button
            onClick={loadEpidemicData}
            disabled={isLoading}
            className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Latest Health Alerts */}
      {healthAlerts.length > 0 && (
        <Card className={`border-blue-200 ${isLiveMode ? 'bg-gradient-to-br from-blue-50 to-teal-50' : 'bg-blue-50'}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Bell className="w-4 h-4 text-blue-600" />
                Latest Health Alerts from News API & WHO
                {isLiveMode && (
                  <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    <Wifi className="w-3 h-3" />
                    Live Updates
                  </span>
                )}
              </CardTitle>
              <button
                onClick={loadEpidemicData}
                disabled={isLoading}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            {isLiveMode && (
              <p className="text-xs text-gray-600 mt-1">
                Real-time health alerts from verified sources • Updates every 15 minutes
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthAlerts.map((alert) => (
                <div key={alert.id} className="bg-white rounded-lg p-3 border border-blue-200 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-start gap-2 mb-1">
                        <h4 className="text-sm text-gray-900 flex-1">{alert.title}</h4>
                        {alert.severity === 'high' && (
                          <Badge className="bg-red-500 text-xs">High Priority</Badge>
                        )}
                        {alert.severity === 'moderate' && (
                          <Badge className="bg-yellow-500 text-xs">Moderate</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{alert.description}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{alert.source}</span>
                        <span>•</span>
                        <span>📍 {alert.region}</span>
                        <span>•</span>
                        <span>{new Date(alert.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {alert.diseases.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {alert.diseases.map((disease, idx) => (
                            <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              {disease}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <a
                      href={alert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 flex-shrink-0"
                      title="Read full article"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
            {!isLiveMode && (
              <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                <p className="text-xs text-blue-800">
                  💡 <strong>Enable Live Updates:</strong> Configure News API in Settings to get real-time health alerts from trusted sources including WHO, health ministries, and verified news outlets.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Total Active Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-gray-900">7,559</div>
            <div className="flex items-center gap-2 mt-2">
              <TrendingUp className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-500">+8.2% this week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">High Alert Diseases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-gray-900">1</div>
            <div className="text-sm text-gray-500 mt-2">Dengue outbreak</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Affected States</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-gray-900">10</div>
            <div className="text-sm text-gray-500 mt-2">Across India</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-teal-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">AI Alerts Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-gray-900">142</div>
            <div className="text-sm text-gray-500 mt-2">Last 7 days</div>
          </CardContent>
        </Card>
      </div>

      {/* Disease Tracking Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Active Disease Surveillance
              {isLiveMode && (
                <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  <Wifi className="w-3 h-3" />
                  Real-Time Data
                </span>
              )}
            </CardTitle>
            <Button className="bg-teal-600 hover:bg-teal-700">
              <Bell className="w-4 h-4 mr-2" />
              Enable AI Predictive Alerts
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Disease Name</TableHead>
                <TableHead>Affected Regions</TableHead>
                <TableHead>Current Cases</TableHead>
                <TableHead>Trend</TableHead>
                <TableHead>Weekly Change</TableHead>
                <TableHead>Alert Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {diseases.map((disease, index) => (
                <TableRow key={index} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="text-gray-900">{disease.disease}</div>
                    {isLiveMode && disease.source && (
                      <div className="text-xs text-teal-600 mt-0.5">{disease.source}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">{disease.region}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-gray-900">{disease.cases.toLocaleString()}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(disease.trend)}
                      <span className="text-sm capitalize text-gray-600">{disease.trend}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm ${disease.trend === 'up' ? 'text-red-500' :
                        disease.trend === 'down' ? 'text-green-500' :
                          'text-gray-500'
                      }`}>
                      {disease.weeklyChange}
                    </span>
                  </TableCell>
                  <TableCell>
                    {getAlertBadge(disease.alertLevel)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4 p-4 bg-teal-50 rounded-lg">
            <p className="text-sm text-teal-800">
              <strong>AI Prediction:</strong> Dengue cases expected to peak in next 2 weeks due to monsoon conditions.
              Recommend increasing stock of IV fluids, platelet concentrates, and deploying extra infectious disease specialists.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Real-Time HealthMap Section */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                Real-Time Global Disease Outbreak Map (HealthMap Style)
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Interactive Google Maps visualization with live outbreak data from WHO, CDC, and News APIs
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSetupGuide(!showSetupGuide)}
                className="gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                Setup Guide
              </Button>
              <Button
                size="sm"
                onClick={() => setShowHealthMap(!showHealthMap)}
                className="bg-purple-600 hover:bg-purple-700 gap-2"
              >
                <MapPin className="w-4 h-4" />
                {showHealthMap ? 'Hide Map' : 'Show Live Map'}
              </Button>
            </div>
          </div>
        </CardHeader>
        {showSetupGuide && (
          <CardContent>
            <GoogleMapsSetupGuide />
          </CardContent>
        )}
        {showHealthMap && (
          <CardContent className="p-0">
            <div className="h-[600px] rounded-b-lg overflow-hidden">
              <RealTimeHealthMap />
            </div>
          </CardContent>
        )}
        {!showHealthMap && !showSetupGuide && (
          <CardContent>
            <div className="text-center py-8">
              <MapPin className="w-16 h-16 text-purple-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Click "Show Live Map" to view the real-time disease outbreak visualization
              </p>
              <div className="flex justify-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>High Severity</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span>Moderate</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>Low Risk</span>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>




    </div>
  );
}// test 123

/* updated */
