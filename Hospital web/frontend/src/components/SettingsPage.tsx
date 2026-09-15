import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Settings, User, Building2, MapPin, Key, Database, Mail, MessageSquare, Save, Sun, Moon, Sunset, Check, CheckCircle, Eye, EyeOff, Cloud, Bell, Calendar as CalendarIcon, Map, ExternalLink, Copy, AlertTriangle } from 'lucide-react';
import { userApiKeyService } from '../services/userApiKeyService';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark' | 'night'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark' | 'night') || 'light';
    }
    return 'light';
  });

  const [waqiApiKey, setWaqiApiKey] = useState<string>('');
  const [weatherApiKey, setWeatherApiKey] = useState<string>('');
  const [flowiseApiKey, setFlowiseApiKey] = useState<string>('');
  const [newsApiKey, setNewsApiKey] = useState<string>('');
  const [calendarificApiKey, setCalendarificApiKey] = useState<string>('');
  const [showWaqiKey, setShowWaqiKey] = useState(false);
  const [showWeatherKey, setShowWeatherKey] = useState(false);
  const [showNewsKey, setShowNewsKey] = useState(false);
  const [showCalendarKey, setShowCalendarKey] = useState(false);
  const [googleMapsKey, setGoogleMapsKey] = useState<string>('');
  const [showGoogleMapsKey, setShowGoogleMapsKey] = useState(false);
  const [backendUrl, setBackendUrl] = useState<string>('');
  const [showBackendUrl, setShowBackendUrl] = useState(false);

  // Load saved API keys on mount (User Specific)
  useEffect(() => {
    if (user) {
      const savedWaqiKey = userApiKeyService.getWAQIKey();
      if (savedWaqiKey) setWaqiApiKey(savedWaqiKey);

      const savedWeatherKey = userApiKeyService.getWeatherKey();
      if (savedWeatherKey) setWeatherApiKey(savedWeatherKey);

      const savedFlowiseKey = userApiKeyService.getFlowiseKey();
      if (savedFlowiseKey) setFlowiseApiKey(savedFlowiseKey);

      const savedNewsKey = userApiKeyService.getNewsKey();
      if (savedNewsKey) setNewsApiKey(savedNewsKey);

      const savedCalendarKey = userApiKeyService.getCalendarificKey();
      if (savedCalendarKey) setCalendarificApiKey(savedCalendarKey);

      const savedGoogleMapsKey = userApiKeyService.getGoogleMapsKey();
      if (savedGoogleMapsKey) setGoogleMapsKey(savedGoogleMapsKey);

      const savedBackendUrl = userApiKeyService.getBackendUrl();
      if (savedBackendUrl) setBackendUrl(savedBackendUrl);
    }
  }, [user]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'night');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleSaveApiKeys = () => {
    if (!user) {
      toast.error('You must be logged in to save API keys.');
      return;
    }

    try {
      let savedCount = 0;

      // Save WAQI API Key
      if (waqiApiKey) {
        if (!userApiKeyService.validateWAQIKey(waqiApiKey)) {
          toast.error('Invalid WAQI API Key format. Please check your key.');
          return;
        }
        userApiKeyService.saveKey('waqi', waqiApiKey);
        savedCount++;
      }

      // Save Weather API Key
      if (weatherApiKey) {
        userApiKeyService.saveKey('weather', weatherApiKey);
        savedCount++;
      }

      // Save Flowise API Key
      if (flowiseApiKey) {
        userApiKeyService.saveKey('flowise', flowiseApiKey);
        savedCount++;
      }

      // Save News API Key
      if (newsApiKey) {
        userApiKeyService.saveKey('news', newsApiKey);
        savedCount++;
      }

      // Save Calendarific API Key
      if (calendarificApiKey) {
        userApiKeyService.saveKey('calendarific', calendarificApiKey);
        savedCount++;
      }

      // Save Google Maps API Key
      if (googleMapsKey) {
        userApiKeyService.saveKey('googleMaps', googleMapsKey);
        savedCount++;
      }

      // Save Backend URL
      if (backendUrl) {
        userApiKeyService.saveKey('backendUrl', backendUrl);
        savedCount++;
      }

      if (savedCount > 0) {
        toast.success(`${savedCount} API key(s) saved securely to your account!`, {
          description: 'Refreshing to apply changes...',
        });

        // Check if all required keys are now configured
        const { apiSetupService } = require('../services/apiSetupService');
        const setupStatus = apiSetupService.checkSetupStatus();

        if (setupStatus.isConfigured) {
          // Mark setup as complete and refresh
          apiSetupService.markSetupComplete();
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      } else {
        toast.warning('No API keys to save. Please enter at least one key.');
      }
    } catch (error) {
      toast.error('Failed to save API keys. Please try again.');
      console.error('Error saving API keys:', error);
    }
  };

  const themeOptions = [
    {
      value: 'light' as const,
      label: 'Light Mode',
      description: 'Clean and bright interface',
      icon: Sun,
      gradient: 'from-yellow-400 to-orange-400',
      bg: 'bg-white',
      preview: 'bg-gradient-to-br from-gray-50 to-blue-50'
    },
    {
      value: 'dark' as const,
      label: 'Dark Mode',
      description: 'Easy on the eyes',
      icon: Moon,
      gradient: 'from-gray-700 to-gray-900',
      bg: 'bg-gray-900',
      preview: 'bg-gradient-to-br from-gray-800 to-gray-950'
    },
    {
      value: 'night' as const,
      label: 'Night Mode',
      description: 'Pure black for OLED',
      icon: Sunset,
      gradient: 'from-purple-900 to-black',
      bg: 'bg-black',
      preview: 'bg-gradient-to-br from-slate-950 to-black'
    }
  ];

  return (
    <div className="space-y-6">
      {/* User Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-teal-600" />
            User Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fullname">Full Name</Label>
              <Input id="fullname" defaultValue="Dr. Amit Sharma" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" defaultValue="amit.sharma@aiims.edu" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" defaultValue="+91 98765 43210" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" defaultValue="Hospital Administrator" disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hospital Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Hospital Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="hospitalname">Hospital Name</Label>
              <Input id="hospitalname" defaultValue="Bharat PulseLink General Hospital" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <select id="region" className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900">
                <option>Chennai</option>
                <option>Delhi NCR</option>
                <option>Mumbai</option>
                <option>Bangalore</option>
                <option>Chennai</option>
                <option>Kolkata</option>
                <option>Hyderabad</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="beds">Total Bed Capacity</Label>
              <Input id="beds" type="number" defaultValue="2500" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff">Total Staff Count</Label>
              <Input id="staff" type="number" defaultValue="3200" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Hospital Address</Label>
              <Input id="address" defaultValue="21, Greams Lane, Off Greams Road, Chennai - 600006" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* API Configuration */}
      <Card id="api-configuration" className="border-2 border-blue-200 bg-gradient-to-br from-blue-50/50 to-transparent scroll-mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-600" />
            Enable Live Real-Time Data
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            System is working perfectly with demo data! Add your free API keys below to unlock live pollution monitoring, weather conditions, festival calendar, and health alerts for 100+ Indian cities.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pollution API */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-orange-600" />
                </div>
                <h4 className="text-gray-900">Pollution API (WAQI)</h4>
              </div>
              {userApiKeyService.isWAQIConfigured() && (
                <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  Connected
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pollutionapi">API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="pollutionapi"
                  type={showWaqiKey ? "text" : "password"}
                  placeholder="Enter your WAQI API key"
                  value={waqiApiKey}
                  onChange={(e) => setWaqiApiKey(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowWaqiKey(!showWaqiKey)}
                  className="flex-shrink-0"
                >
                  {showWaqiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <p className="text-blue-800 mb-2">
                  <strong>📝 How to get your API key:</strong>
                </p>
                <ol className="text-blue-700 space-y-1 ml-4 list-decimal">
                  <li>Visit <a href="https://aqicn.org/data-platform/token/" className="text-teal-600 hover:underline font-medium" target="_blank" rel="noopener noreferrer">aqicn.org/data-platform/token/</a></li>
                  <li>Fill out the form with your name and email</li>
                  <li>Copy your API token and paste it above</li>
                  <li>Click "Save API Configuration" below</li>
                </ol>
              </div>
            </div>
          </div>

          <Separator />

          {/* Weather API */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Cloud className="w-4 h-4 text-blue-600" />
                </div>
                <h4 className="text-gray-900">Weather API (OpenWeather)</h4>
              </div>
              {userApiKeyService.isWeatherConfigured() && (
                <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  Connected
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="weatherapi">API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="weatherapi"
                  type={showWeatherKey ? "text" : "password"}
                  placeholder="Enter your OpenWeather API key"
                  value={weatherApiKey}
                  onChange={(e) => setWeatherApiKey(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowWeatherKey(!showWeatherKey)}
                  className="flex-shrink-0"
                >
                  {showWeatherKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <p className="text-blue-800 mb-2">
                  <strong>📝 How to get your API key:</strong>
                </p>
                <ol className="text-blue-700 space-y-1 ml-4 list-decimal">
                  <li>Visit <a href="https://openweathermap.org/api" className="text-teal-600 hover:underline font-medium" target="_blank" rel="noopener noreferrer">openweathermap.org/api</a></li>
                  <li>Sign up for a free account</li>
                  <li>Go to "API Keys" section in your profile</li>
                  <li>Copy your API key and paste it above</li>
                  <li>Click "Save API Configuration" below</li>
                </ol>
              </div>
            </div>
          </div>

          <Separator />

          {/* News API for Health Alerts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-4 h-4 text-red-600" />
                </div>
                <h4 className="text-gray-900">News API (Health Alerts)</h4>
              </div>
              {userApiKeyService.isNewsApiConfigured() && (
                <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  Connected
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newsapi">API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="newsapi"
                  type={showNewsKey ? "text" : "password"}
                  placeholder="Enter your News API key"
                  value={newsApiKey}
                  onChange={(e) => setNewsApiKey(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewsKey(!showNewsKey)}
                  className="flex-shrink-0"
                >
                  {showNewsKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <p className="text-blue-800 mb-2">
                  <strong>📝 How to get your API key:</strong>
                </p>
                <ol className="text-blue-700 space-y-1 ml-4 list-decimal">
                  <li>Visit <a href="https://newsapi.org/register" className="text-teal-600 hover:underline font-medium" target="_blank" rel="noopener noreferrer">newsapi.org/register</a></li>
                  <li>Sign up for a free account (Developer plan)</li>
                  <li>Copy your API key from the dashboard</li>
                  <li>Paste it above and click "Save API Configuration"</li>
                </ol>
              </div>
            </div>
          </div>

          <Separator />

          {/* Calendarific API for Festivals */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4 text-purple-600" />
                </div>
                <h4 className="text-gray-900">Calendarific API (Festivals)</h4>
              </div>
              {userApiKeyService.isCalendarificConfigured() && (
                <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  Connected
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="calendarapi">API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="calendarapi"
                  type={showCalendarKey ? "text" : "password"}
                  placeholder="Enter your Calendarific API key"
                  value={calendarificApiKey}
                  onChange={(e) => setCalendarificApiKey(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCalendarKey(!showCalendarKey)}
                  className="flex-shrink-0"
                >
                  {showCalendarKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <p className="text-blue-800 mb-2">
                  <strong>📝 How to get your API key:</strong>
                </p>
                <ol className="text-blue-700 space-y-1 ml-4 list-decimal">
                  <li>Visit <a href="https://calendarific.com/signup" className="text-teal-600 hover:underline font-medium" target="_blank" rel="noopener noreferrer">calendarific.com/signup</a></li>
                  <li>Sign up for a free account</li>
                  <li>Get your API key from the dashboard</li>
                  <li>Paste it above and click "Save API Configuration"</li>
                </ol>
              </div>
            </div>
          </div>

          <Separator />

          {/* Google Maps API for Disease Maps */}
          <div className="space-y-3" id="disease-map-config">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Map className="w-4 h-4 text-green-600" />
                </div>
                <h4 className="text-gray-900">Google Maps API (Disease Maps)</h4>
              </div>
              {userApiKeyService.isGoogleMapsConfigured() && (
                <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  Connected
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="googlemapsapi">API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="googlemapsapi"
                  type={showGoogleMapsKey ? "text" : "password"}
                  placeholder="Enter your Google Maps API key"
                  value={googleMapsKey}
                  onChange={(e) => setGoogleMapsKey(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowGoogleMapsKey(!showGoogleMapsKey)}
                  className="flex-shrink-0"
                >
                  {showGoogleMapsKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
                <div className="flex items-start gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-900 mb-1"><strong>Real-Time Global Disease Outbreak Map (HealthMap Style)</strong></p>
                    <p className="text-yellow-800 text-xs">Interactive Google Maps visualization with live outbreak data from WHO, CDC, and News APIs</p>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-yellow-200">
                  <p className="text-gray-900 mb-2"><strong>Setup Guide</strong></p>
                  <p className="text-xs text-gray-600 mb-3">
                    To enable the real-time disease heat map, you need to configure Google Maps API in Google Cloud Console.
                  </p>
                  <div className="space-y-3">
                    {/* Step 1 */}
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 bg-blue-600 rounded-full text-white flex items-center justify-center flex-shrink-0 text-xs">1</div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-900 mb-1"><strong>Go to Google Cloud Console</strong></p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open('https://console.cloud.google.com/google/maps-apis/credentials', '_blank')}
                          className="gap-1 h-7 text-xs"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Open Console
                        </Button>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 bg-blue-600 rounded-full text-white flex items-center justify-center flex-shrink-0 text-xs">2</div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-900 mb-1"><strong>Enable Maps JavaScript API</strong></p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open('https://console.cloud.google.com/apis/library/maps-backend.googleapis.com', '_blank')}
                          className="gap-1 h-7 text-xs"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Enable APIs
                        </Button>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 bg-blue-600 rounded-full text-white flex items-center justify-center flex-shrink-0 text-xs">3</div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-900 mb-1"><strong>Configure API Key Restrictions</strong></p>
                        <p className="text-xs text-gray-600 mb-2">Add the following HTTP referrer:</p>
                        <div className="bg-gray-50 rounded p-2 border border-gray-200 flex items-center gap-2">
                          <code className="text-xs text-gray-900 flex-1">https://*.figma.site/*</code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              navigator.clipboard.writeText('https://*.figma.site/*');
                              toast.success('Copied to clipboard!');
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 bg-blue-600 rounded-full text-white flex items-center justify-center flex-shrink-0 text-xs">4</div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-900 mb-1"><strong>Copy Your API Key</strong></p>
                        <p className="text-xs text-gray-600">Paste your API key above and click \"Save API Configuration\"</p>
                      </div>
                    </div>

                    {/* Step 5 */}
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 bg-green-600 rounded-full text-white flex items-center justify-center flex-shrink-0 text-xs">5</div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-900 mb-1"><strong>Save and Test</strong></p>
                        <p className="text-xs text-gray-600">Save your changes and refresh to test the map</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-2"><strong>Additional Resources:</strong></p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open('https://developers.google.com/maps/documentation/javascript/get-api-key', '_blank')}
                        className="gap-1 h-7 text-xs"
                      >
                        <ExternalLink className="w-3 h-3" />
                        API Key Docs
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open('https://console.cloud.google.com/billing', '_blank')}
                        className="gap-1 h-7 text-xs"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Enable Billing
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Backend URL (Render/Localhost) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Database className="w-4 h-4 text-indigo-600" />
                </div>
                <h4 className="text-gray-900">Clinical AI Backend (Render)</h4>
              </div>
              {userApiKeyService.getBackendUrl() && (
                <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  Live Configured
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="backendurl">Server URL</Label>
              <div className="flex gap-2">
                <Input
                  id="backendurl"
                  placeholder="https://your-backend.onrender.com"
                  value={backendUrl}
                  onChange={(e) => setBackendUrl(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
              <p className="text-xs text-gray-500">
                Point your Bharat PulseLink frontend to your live backend for AI Clinical Analysis.
              </p>
            </div>
          </div>

          <Separator />

          {/* Flowise AI */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                <Database className="w-4 h-4 text-teal-600" />
              </div>
              <h4 className="text-gray-900">Flowise AI Backend</h4>
            </div>
            <div className="space-y-2">
              <Label htmlFor="flowiseurl">Backend URL</Label>
              <Input
                id="flowiseurl"
                placeholder="https://your-flowise-instance.com"
                defaultValue="https://flowise.bharatpulselink.in"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flowisekey">API Key</Label>
              <Input
                id="flowisekey"
                type="password"
                placeholder="Enter Flowise API key"
                value={flowiseApiKey}
                onChange={(e) => setFlowiseApiKey(e.target.value)}
              />
            </div>
          </div>

          {/* Save API Keys Button */}
          <div className="pt-4">
            <Button
              onClick={handleSaveApiKeys}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Save API Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Other API Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            Additional Services (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Twilio SMS */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-blue-600" />
              </div>
              <h4 className="text-gray-900">Twilio SMS Alerts</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="twiliosid">Account SID</Label>
                <Input
                  id="twiliosid"
                  placeholder="Enter Twilio Account SID"
                  defaultValue="AC••••••••••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twiliotoken">Auth Token</Label>
                <Input
                  id="twiliotoken"
                  type="password"
                  placeholder="Enter Auth Token"
                  defaultValue="••••••••••••••••"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="twilionum">Twilio Phone Number</Label>
              <Input
                id="twilionum"
                placeholder="+1 234 567 8900"
                defaultValue="+1 555 123 4567"
              />
            </div>
          </div>

          <Separator />

          {/* Email Alerts */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Mail className="w-4 h-4 text-green-600" />
              </div>
              <h4 className="text-gray-900">Email Alert Setup</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtphost">SMTP Host</Label>
                <Input
                  id="smtphost"
                  placeholder="smtp.gmail.com"
                  defaultValue="smtp.gmail.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpport">SMTP Port</Label>
                <Input
                  id="smtpport"
                  placeholder="587"
                  defaultValue="587"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtpemail">Email Address</Label>
                <Input
                  id="smtpemail"
                  type="email"
                  placeholder="alerts@bharatpulselink.in"
                  defaultValue="alerts@bharatpulselink.in"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtppass">Password</Label>
                <Input
                  id="smtppass"
                  type="password"
                  placeholder="Enter email password"
                  defaultValue="••••••••••••••••"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Firebase */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Database className="w-4 h-4 text-yellow-600" />
              </div>
              <h4 className="text-gray-900">Firebase Connection</h4>
            </div>
            <div className="space-y-2">
              <Label htmlFor="firebasekey">Firebase API Key</Label>
              <Input
                id="firebasekey"
                type="password"
                placeholder="Enter Firebase API key"
                defaultValue="••••••••••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firebaseproject">Project ID</Label>
              <Input
                id="firebaseproject"
                placeholder="bharat-pulselink"
                defaultValue="bharat-pulselink-2026"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-600" />
            Advanced Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-900">Enable AI Predictions</div>
                <div className="text-sm text-gray-500">Allow system to make predictive forecasts</div>
              </div>
              <label className="relative inline-block w-12 h-6">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-full h-full bg-gray-200 rounded-full peer peer-checked:bg-teal-600 transition-colors"></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
              </label>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-900">Auto-Send Alerts</div>
                <div className="text-sm text-gray-500">Automatically send alerts when thresholds are exceeded</div>
              </div>
              <label className="relative inline-block w-12 h-6">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-full h-full bg-gray-200 rounded-full peer peer-checked:bg-teal-600 transition-colors"></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
              </label>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-900">Data Sync with Firebase</div>
                <div className="text-sm text-gray-500">Sync predictions and reports to cloud storage</div>
              </div>
              <label className="relative inline-block w-12 h-6">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-full h-full bg-gray-200 rounded-full peer peer-checked:bg-teal-600 transition-colors"></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button variant="outline">
          Reset to Default
        </Button>
        <Button className="bg-teal-600 hover:bg-teal-700">
          <Save className="w-4 h-4 mr-2" />
          Save All Changes
        </Button>
      </div>
    </div>
  );
}
/* updated */
