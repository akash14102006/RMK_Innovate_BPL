import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Search, Wind, MapPin, TrendingUp, AlertCircle, Activity, Filter, RefreshCw, Wifi, Cloud, Droplets, ThermometerSun } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { indianCities, getAQIColor, getAQILevel, CityData } from '../data/indianCities';
import { fetchCityAQI, generateAQIForecast, AQIData, AQIForecast } from '../services/pollutionService';
import { fetchCityWeather, WeatherData } from '../services/weatherService';
import { calculateCombinedHealthImpact, formatSurgePercentage, CombinedPrediction } from '../services/combinedPredictionService';
import { apiKeyService } from '../services/apiKeyService';
import { fetchLiveAQIForAllCities } from '../services/liveAQIService';
import { toast } from 'sonner';

export default function PollutionMonitor() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedCity, setSelectedCity] = useState<string>('chennai');
  const [realTimeData, setRealTimeData] = useState<AQIData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [forecastData, setForecastData] = useState<AQIForecast[]>([]);
  const [prediction, setPrediction] = useState<CombinedPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [liveCities, setLiveCities] = useState<CityData[]>(indianCities);

  // Check if APIs are configured
  const isAqiConfigured = apiKeyService.isWAQIConfigured();
  const isWeatherConfigured = apiKeyService.isWeatherConfigured();

  // Fetch data for a city
  const fetchCityData = async (cityName: string) => {
    setIsLoading(true);
    setSelectedCity(cityName);

    try {
      // Fetch AQI data
      const aqiData = await fetchCityAQI(cityName);
      setRealTimeData(aqiData);

      // Fetch weather data
      const weather = await fetchCityWeather(cityName);
      setWeatherData(weather);

      // Fetch forecast
      const forecast = await generateAQIForecast(cityName, 7);
      setForecastData(forecast);

      // Calculate combined prediction
      const forecastAQIs = forecast.map(f => f.aqi);
      const combinedPrediction = calculateCombinedHealthImpact(aqiData, weather, forecastAQIs);
      setPrediction(combinedPrediction);

      // Determine if we're in live mode based on API configuration
      const hasLiveAQI = isAqiConfigured && aqiData?.timestamp !== undefined;
      const hasLiveWeather = isWeatherConfigured && weather?.timestamp !== undefined;
      const isLive = hasLiveAQI || hasLiveWeather;

      setIsLiveMode(isLive);

      // Only show success toast if at least one API is configured and working
      if (isLive) {
        const cityNameCapitalized = cityName.charAt(0).toUpperCase() + cityName.slice(1);
        const aqiInfo = hasLiveAQI ? `AQI: ${aqiData?.aqi}` : '';
        const weatherInfo = hasLiveWeather ? `Temp: ${weather?.temperature}°C` : '';
        const separator = aqiInfo && weatherInfo ? ' | ' : '';

        toast.success(`Live data loaded for ${cityNameCapitalized}`, {
          description: `${aqiInfo}${separator}${weatherInfo}`
        });
      }
    } catch (error) {
      console.error('Error fetching city data:', error);
      setIsLiveMode(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load - fetch Delhi data and live city AQI values
  useEffect(() => {
    fetchCityData('chennai');

    // Fetch live AQI for all cities if API is configured
    if (isAqiConfigured) {
      fetchLiveAQIForAllCities().then(updated => {
        setLiveCities(updated);
      });
    }
  }, []);

  // Refresh live data periodically (every 5 minutes)
  useEffect(() => {
    if (!isAqiConfigured) return;

    const interval = setInterval(() => {
      fetchLiveAQIForAllCities().then(updated => {
        setLiveCities(updated);
      });
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isAqiConfigured]);

  // Handle city click
  const handleCityClick = (cityName: string) => {
    fetchCityData(cityName.toLowerCase());
  };

  // Get unique states
  const states = useMemo(() => {
    const uniqueStates = Array.from(new Set(liveCities.map(city => city.state)));
    return ['All', ...uniqueStates.sort()];
  }, [liveCities]);

  // Filter cities based on search query and selected state (use live data if available)
  const filteredCities = useMemo(() => {
    return liveCities.filter(city => {
      const matchesSearch =
        city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        city.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        city.state.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesState = selectedState === 'All' || city.state === selectedState;

      return matchesSearch && matchesState;
    });
  }, [searchQuery, selectedState, liveCities]);

  // Debounced auto-select to trigger data fetch for the state/district automatically
  useEffect(() => {
    const handler = setTimeout(() => {
      if (filteredCities.length > 0) {
        // If the current city is not in the filtered results, auto-select the first one
        const isCurrentCityInView = filteredCities.some(
          c => c.name.toLowerCase() === selectedCity.toLowerCase()
        );
        if (!isCurrentCityInView) {
          fetchCityData(filteredCities[0].name.toLowerCase());
        }
      }
    }, 400); // 400ms debounce
    return () => clearTimeout(handler);
  }, [searchQuery, selectedState]); // We don't depend on filteredCities array to avoid unnecessary triggers

  // Use real-time data if available
  const currentAQI = realTimeData?.aqi || 218;
  const currentLevel = realTimeData?.level || 'Poor';
  const currentColor = realTimeData?.color || 'bg-orange-500';
  const displayCity = realTimeData?.city || selectedCity;

  // Display data
  const displayForecastData = forecastData.length > 0 ? forecastData : [
    { day: 'Today', aqi: 218 },
    { day: 'Tomorrow', aqi: 245 },
    { day: 'Oct 20', aqi: 268 },
    { day: 'Oct 21', aqi: 285 },
    { day: 'Oct 22', aqi: 295 },
    { day: 'Oct 23', aqi: 278 },
    { day: 'Oct 24', aqi: 252 },
  ];

  // Calculate statistics
  const stats = useMemo(() => {
    const citiesCount = filteredCities.length;
    const avgAQI = Math.round(filteredCities.reduce((sum, city) => sum + city.aqi, 0) / citiesCount);
    const poorOrWorse = filteredCities.filter(city => city.aqi > 150).length;
    const maxAQI = Math.max(...filteredCities.map(city => city.aqi));

    return { citiesCount, avgAQI, poorOrWorse, maxAQI };
  }, [filteredCities]);

  return (
    <div className="space-y-6">
      {/* API Configuration Banners */}
      {!isAqiConfigured && !isWeatherConfigured && (
        <Card className="bg-gradient-to-r from-blue-50 to-sky-50 border-blue-300">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-gray-900 mb-1">Ready to Use Live Real-Time Data?</div>
                <p className="text-sm text-gray-600 mb-3">
                  Currently showing demo data. Add your free API keys in Settings to enable live pollution monitoring and weather-based predictions for 100+ Indian cities.
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
                    <MapPin className="w-3 h-3 mr-1" />
                    Set Up API Keys
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Partial Configuration */}
      {(isAqiConfigured && !isWeatherConfigured) && (
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Cloud className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-gray-900">Add Weather API for Complete Predictions</div>
                  <p className="text-sm text-gray-600">
                    Configure OpenWeather API to enhance patient surge predictions with weather data.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-blue-300 hover:bg-blue-100"
                onClick={() => window.location.hash = '#settings'}
              >
                Add Weather API
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Mode Indicator */}
      {isLiveMode && (isAqiConfigured || isWeatherConfigured) && (
        <Card className="bg-gradient-to-r from-green-50 to-teal-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Wifi className="w-4 h-4 text-white animate-pulse" />
                </div>
                <div>
                  <div className="text-gray-900">Live Real-Time Data Active</div>
                  <p className="text-sm text-gray-600">
                    {isAqiConfigured && '✓ Pollution Data'} {isWeatherConfigured && '✓ Weather Data'} •
                    Last updated: {realTimeData?.timestamp || weatherData?.timestamp || 'Just now'}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchCityData(selectedCity)}
                disabled={isLoading}
                className="border-green-300 hover:bg-green-100"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by city, district, or state..."
                className="pl-11 h-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
              <select
                className="w-full h-12 pl-11 pr-4 border border-gray-200 rounded-lg bg-white text-gray-900 appearance-none cursor-pointer hover:border-gray-300 transition-colors"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
              >
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
          </div>

          {searchQuery && (
            <div className="mt-3 text-sm text-gray-600">
              Showing {filteredCities.length} {filteredCities.length === 1 ? 'result' : 'results'} for "{searchQuery}"
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current City Header */}
      <Card className="bg-gradient-to-br from-teal-50 to-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl text-gray-900 mb-1">
                📍 {displayCity.charAt(0).toUpperCase() + displayCity.slice(1)}
              </h2>
              <p className="text-sm text-gray-600">
                Click any city below to view live predictions
              </p>
            </div>
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-teal-600">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Loading live data...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics - Real-Time Predictions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={`border-l-4 ${currentColor.replace('bg-', 'border-l-')}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
              {displayCity.charAt(0).toUpperCase() + displayCity.slice(1)} AQI
              {isLiveMode && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-gray-900">{currentAQI}</div>
            <Badge className={`mt-2 ${currentColor}`}>{currentLevel}</Badge>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Peak Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-gray-900">
              {prediction?.peakAQI || (displayForecastData.length > 0 ? Math.max(...displayForecastData.map(d => d.aqi)) : 295)}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              {prediction?.peakDate || (displayForecastData.length > 0 ? displayForecastData[displayForecastData.length - 1].day : 'Oct 25')}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Expected Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-gray-900">
              {prediction ? formatSurgePercentage(prediction.totalSurge) : '+42%'}
            </div>
            <div className="text-sm text-gray-500 mt-2">Respiratory surge</div>
            {prediction && (
              <div className="mt-2 text-xs text-gray-600">
                ~{prediction.expectedCases.toLocaleString()} patients
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">High AQI Cities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-gray-900">
              {prediction?.highRiskCities || stats.poorOrWorse}/{stats.citiesCount}
            </div>
            <div className="text-sm text-gray-500 mt-2">Moderate or worse</div>
          </CardContent>
        </Card>
      </div>

      {/* Weather Information */}
      {weatherData && (
        <Card className="bg-gradient-to-br from-blue-50 to-sky-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-blue-600" />
              Current Weather Conditions - {weatherData.city}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <ThermometerSun className="w-8 h-8 text-orange-500" />
                <div>
                  <div className="text-2xl text-gray-900">{weatherData.temperature}°C</div>
                  <div className="text-xs text-gray-500">Temperature</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <Droplets className="w-8 h-8 text-blue-500" />
                <div>
                  <div className="text-2xl text-gray-900">{weatherData.humidity}%</div>
                  <div className="text-xs text-gray-500">Humidity</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <Wind className="w-8 h-8 text-teal-500" />
                <div>
                  <div className="text-2xl text-gray-900">{weatherData.windSpeed} m/s</div>
                  <div className="text-xs text-gray-500">Wind Speed</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <Cloud className="w-8 h-8 text-gray-500" />
                <div>
                  <div className="text-xl text-gray-900">{weatherData.condition}</div>
                  <div className="text-xs text-gray-500">Conditions</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map and Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cities List - CLICKABLE */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-teal-600" />
              {isLiveMode ? (
                <>
                  <span className="flex items-center gap-2">
                    Live AQI Monitoring
                    <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      <Wifi className="w-3 h-3" />
                      Real-Time
                    </span>
                  </span>
                  <span className="text-sm text-gray-500">- {liveCities.length} Cities</span>
                </>
              ) : (
                <>AQI Monitoring - {liveCities.length} Cities</>
              )}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              💡 Click any city to view live AQI forecast & predictions
            </p>
          </CardHeader>
          <CardContent>
            <div className="relative bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl p-4 h-96 overflow-y-auto">
              <div className="space-y-3">
                {filteredCities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <Search className="w-12 h-12 mb-3 opacity-30" />
                    <p>No cities found matching your search</p>
                  </div>
                ) : (
                  filteredCities.map((city, index) => (
                    <button
                      key={index}
                      onClick={() => handleCityClick(city.name)}
                      disabled={isLoading}
                      className="w-full flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-3 h-3 rounded-full ${city.color} group-hover:scale-125 transition-transform`}></div>
                        <div className="flex-1 text-left">
                          <div className="text-gray-900">{city.name}</div>
                          <div className="text-xs text-gray-500">{city.district}, {city.state}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl text-gray-900">{city.aqi}</div>
                        <div className="text-xs text-gray-500">{city.level}</div>
                      </div>
                      {selectedCity.toLowerCase() === city.name.toLowerCase() && (
                        <div className="ml-2 w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-600">Good (0-50)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <span className="text-gray-600">Satisfactory (51-100)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-gray-600">Moderate (101-150)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-gray-600">Poor (151-200)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-gray-600">Very Poor (201-300)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-gray-600">Severe (300+)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Forecast Chart - Dynamic */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              AQI Forecast (Next 7 Days) - {displayCity.charAt(0).toUpperCase() + displayCity.slice(1)}
              {(isWeatherConfigured || isAqiConfigured) && forecastData.length > 0 && (
                <span className="flex items-center gap-1 text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
                  <Wifi className="w-3 h-3" />
                  Real-Time Forecast
                </span>
              )}
            </CardTitle>
            {(isWeatherConfigured || isAqiConfigured) && forecastData.length > 0 && (
              <p className="text-xs text-gray-600 mt-1">
                Live 7-day AQI predictions powered by OpenWeather & WAQI APIs
              </p>
            )}
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={displayForecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="day" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="aqi"
                  stroke="#F97316"
                  strokeWidth={3}
                  dot={{ fill: '#F97316', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="mt-4 p-4 bg-orange-50 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-orange-800">
                    <strong>Live Health Advisory:</strong> {prediction ? (
                      <>AQI expected to reach <strong>"{getAQILevel(prediction.peakAQI)}"</strong> levels on {prediction.peakDate}.
                        Anticipate <strong>{formatSurgePercentage(prediction.totalSurge)}</strong> increase in respiratory cases.</>
                    ) : (
                      'Configure APIs for real-time health impact predictions.'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prediction Factors Breakdown */}
      {prediction && (
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              Real-Time Prediction Factors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-white rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Pollution Impact</span>
                  <span className="text-xl text-orange-600">{prediction.factors.pollution}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${prediction.factors.pollution}%` }}></div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Weather Impact</span>
                  <span className="text-xl text-blue-600">{prediction.factors.weather}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${prediction.factors.weather}%` }}></div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Seasonal Impact</span>
                  <span className="text-xl text-purple-600">{prediction.factors.seasonal}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${prediction.factors.seasonal}%` }}></div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl">
              <h4 className="text-sm text-gray-600 mb-3">AI-Generated Recommendations:</h4>
              <ul className="space-y-2">
                {prediction.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-teal-600 mt-0.5">▸</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Health Impact Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wind className="w-5 h-5 text-blue-600" />
            Pollution & Weather Health Impact Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-red-50 rounded-xl border border-red-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center text-white">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="text-gray-900">High Risk Groups</div>
              </div>
              <ul className="text-sm text-gray-600 space-y-1 ml-1">
                <li>• Children under 5 years</li>
                <li>• Elderly above 60 years</li>
                <li>• Existing respiratory conditions</li>
                <li>• Pregnant women</li>
              </ul>
            </div>

            <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white">
                  <Activity className="w-5 h-5" />
                </div>
                <div className="text-gray-900">Expected Conditions</div>
              </div>
              <ul className="text-sm text-gray-600 space-y-1 ml-1">
                <li>• Asthma exacerbations</li>
                <li>• Bronchitis cases</li>
                <li>• COPD emergencies</li>
                <li>• Eye irritation</li>
                {weatherData && weatherData.temperature > 35 && <li>• Heat stroke risk</li>}
              </ul>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="text-gray-900">Hospital Readiness</div>
              </div>
              <ul className="text-sm text-gray-600 space-y-1 ml-1">
                <li>• Stock respiratory medications</li>
                <li>• Deploy extra pulmonologists</li>
                <li>• Prepare ICU beds</li>
                <li>• Setup air purifiers in wards</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
/* updated */
