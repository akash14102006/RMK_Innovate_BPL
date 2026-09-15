import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Map, RefreshCw, AlertTriangle, TrendingUp, Info, MapPin, Activity } from 'lucide-react';
import { diseaseMapService, DiseaseLocation } from '../services/diseaseMapService';
import { apiKeyService } from '../services/apiKeyService';
import { toast } from 'sonner';

export default function DiseaseHeatMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  
  const [diseaseData, setDiseaseData] = useState<DiseaseLocation[]>([]);
  const [filteredData, setFilteredData] = useState<DiseaseLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [selectedDiseases, setSelectedDiseases] = useState<string[]>([]);
  const [availableDiseases, setAvailableDiseases] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Load disease data
  const loadDiseaseData = async () => {
    setIsLoading(true);
    try {
      const data = await diseaseMapService.fetchAggregatedDiseaseData();
      setDiseaseData(data);
      
      // Get unique diseases
      const diseases = diseaseMapService.getUniqueDiseases(data);
      setAvailableDiseases(diseases);
      
      // If no filters selected, show all
      if (selectedDiseases.length === 0) {
        setFilteredData(data);
      } else {
        const filtered = diseaseMapService.filterByDisease(data, selectedDiseases);
        setFilteredData(filtered);
      }
      
      setLastUpdated(new Date());
      
      const googleMapsKey = apiKeyService.getGoogleMapsKey();
      if (googleMapsKey && googleMapsKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
        toast.success('Disease data updated', {
          description: `${data.length} disease hotspots loaded`
        });
      }
    } catch (error) {
      console.error('Error loading disease data:', error);
      toast.error('Failed to load disease data');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize Google Maps
  const initializeMap = () => {
    const googleMapsKey = apiKeyService.getGoogleMapsKey();
    
    if (!googleMapsKey || googleMapsKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      console.log('Google Maps API key not configured');
      return;
    }

    if (!mapRef.current) return;

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsKey}&libraries=visualization`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (!mapRef.current) return;
      
      // Center on India
      const indiaCenter = { lat: 20.5937, lng: 78.9629 };
      
      const map = new google.maps.Map(mapRef.current, {
        center: indiaCenter,
        zoom: 5,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ],
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });
      
      mapInstanceRef.current = map;
      infoWindowRef.current = new google.maps.InfoWindow();
      setIsMapLoaded(true);
    };
    
    script.onerror = () => {
      toast.error('Failed to load Google Maps', {
        description: 'Please check your API key configuration'
      });
    };
    
    document.head.appendChild(script);
  };

  // Update markers on map
  const updateMarkers = () => {
    if (!mapInstanceRef.current || !isMapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    filteredData.forEach(location => {
      if (!mapInstanceRef.current) return;

      const marker = new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: mapInstanceRef.current,
        title: `${location.disease} - ${location.region}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: getMarkerColor(location.riskLevel),
          fillOpacity: 0.8,
          strokeColor: '#fff',
          strokeWeight: 2,
          scale: getMarkerSize(location.cases)
        },
        animation: google.maps.Animation.DROP
      });

      // Add click listener for info window
      marker.addListener('click', () => {
        if (!infoWindowRef.current) return;
        
        const content = createInfoWindowContent(location);
        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open(mapInstanceRef.current, marker);
      });

      markersRef.current.push(marker);
    });
  };

  // Get marker color based on risk level
  const getMarkerColor = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'high':
        return '#ef4444'; // red
      case 'moderate':
        return '#f59e0b'; // yellow/orange
      case 'low':
        return '#10b981'; // green
      default:
        return '#6b7280'; // gray
    }
  };

  // Get marker size based on cases
  const getMarkerSize = (cases: number): number => {
    if (cases > 1000) return 16;
    if (cases > 500) return 12;
    if (cases > 200) return 8;
    return 6;
  };

  // Create info window content
  const createInfoWindowContent = (location: DiseaseLocation): string => {
    const trendIcon = location.weeklyTrend.startsWith('+') ? '↑' : 
                      location.weeklyTrend.startsWith('-') ? '↓' : '→';
    const trendColor = location.weeklyTrend.startsWith('+') ? '#ef4444' : 
                       location.weeklyTrend.startsWith('-') ? '#10b981' : '#6b7280';
    
    const riskColor = location.riskLevel === 'high' ? '#ef4444' :
                      location.riskLevel === 'moderate' ? '#f59e0b' : '#10b981';
    
    return `
      <div style="font-family: system-ui; max-width: 300px; padding: 12px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">
          ${location.disease}
        </h3>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 13px; color: #6b7280;">Current Cases:</span>
            <span style="font-size: 18px; font-weight: 600; color: #111827;">
              ${location.cases.toLocaleString()}
            </span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 13px; color: #6b7280;">Weekly Trend:</span>
            <span style="font-size: 14px; font-weight: 600; color: ${trendColor};">
              ${trendIcon} ${location.weeklyTrend}
            </span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 13px; color: #6b7280;">Alert Level:</span>
            <span style="font-size: 13px; font-weight: 600; color: ${riskColor}; 
                         text-transform: uppercase; background-color: ${riskColor}20; 
                         padding: 2px 8px; border-radius: 4px;">
              ${location.riskLevel}
            </span>
          </div>
          <div style="margin-top: 4px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
            <div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;">
              📍 ${location.region}
            </div>
            ${location.description ? `
              <div style="font-size: 12px; color: #6b7280; margin-top: 6px;">
                ${location.description}
              </div>
            ` : ''}
          </div>
          <div style="margin-top: 6px; padding-top: 8px; border-top: 1px solid #e5e7eb; 
                      display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; color: #9ca3af;">
              Source: ${location.source}
            </span>
            <span style="font-size: 11px; color: #9ca3af;">
              ${new Date(location.lastUpdated).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
        </div>
      </div>
    `;
  };

  // Toggle disease filter
  const toggleDiseaseFilter = (disease: string) => {
    setSelectedDiseases(prev => {
      if (prev.includes(disease)) {
        return prev.filter(d => d !== disease);
      } else {
        return [...prev, disease];
      }
    });
  };

  // Initialize map on mount
  useEffect(() => {
    initializeMap();
    loadDiseaseData();
    
    // Auto-refresh every 10 minutes
    const interval = setInterval(() => {
      loadDiseaseData();
    }, 10 * 60 * 1000);
    
    return () => {
      clearInterval(interval);
      // Cleanup markers
      markersRef.current.forEach(marker => marker.setMap(null));
    };
  }, []);

  // Update filtered data when disease selection changes
  useEffect(() => {
    if (selectedDiseases.length === 0) {
      setFilteredData(diseaseData);
    } else {
      const filtered = diseaseMapService.filterByDisease(diseaseData, selectedDiseases);
      setFilteredData(filtered);
    }
  }, [selectedDiseases, diseaseData]);

  // Update markers when filtered data changes
  useEffect(() => {
    if (isMapLoaded) {
      updateMarkers();
    }
  }, [filteredData, isMapLoaded]);

  const googleMapsKey = apiKeyService.getGoogleMapsKey();
  const isConfigured = googleMapsKey && googleMapsKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE';

  if (!isConfigured) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Live Disease Heat Map */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-teal-400 rounded-xl flex items-center justify-center">
                <Map className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Live Disease Heat Map
                  <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    <Activity className="w-3 h-3" />
                    Real-Time
                  </span>
                </CardTitle>
                <p className="text-xs text-gray-600 mt-1">
                  Last updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {' • '}Auto-refreshes every 10 minutes
                </p>
              </div>
            </div>
            <Button 
              onClick={loadDiseaseData}
              disabled={isLoading}
              size="sm"
              className="bg-teal-600 hover:bg-teal-700"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-4">
            {/* Sidebar Filters */}
            <div className="lg:col-span-1 bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 p-4">
              <div className="space-y-6">
                {/* Disease Filters */}
                <div>
                  <h4 className="text-sm text-gray-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-teal-600" />
                    Filter by Disease
                  </h4>
                  <div className="space-y-2">
                    {availableDiseases.map(disease => (
                      <div key={disease} className="flex items-center space-x-2">
                        <Checkbox
                          id={`disease-${disease}`}
                          checked={selectedDiseases.includes(disease)}
                          onCheckedChange={() => toggleDiseaseFilter(disease)}
                        />
                        <Label 
                          htmlFor={`disease-${disease}`}
                          className="text-sm text-gray-700 cursor-pointer"
                        >
                          {disease}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {selectedDiseases.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedDiseases([])}
                      className="mt-2 text-xs w-full"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>

                {/* Legend */}
                <div>
                  <h4 className="text-sm text-gray-900 mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4 text-teal-600" />
                    Risk Levels
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-500"></div>
                      <span className="text-xs text-gray-700">High Risk</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                      <span className="text-xs text-gray-700">Moderate Risk</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-500"></div>
                      <span className="text-xs text-gray-700">Low Risk</span>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div className="bg-white rounded-lg border border-gray-200 p-3">
                  <h4 className="text-xs text-gray-600 mb-2">Active Hotspots</h4>
                  <div className="text-2xl text-gray-900">{filteredData.length}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {selectedDiseases.length > 0 
                      ? `Filtered: ${selectedDiseases.join(', ')}`
                      : 'All diseases shown'
                    }
                  </div>
                </div>

                {/* Data Sources */}
                <div>
                  <h4 className="text-xs text-gray-600 mb-2">Data Sources</h4>
                  <div className="space-y-1">
                    {['WHO', 'News API', 'Gov Health', 'Custom Backend'].map(source => {
                      const count = filteredData.filter(d => d.source === source).length;
                      if (count === 0) return null;
                      return (
                        <div key={source} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">{source}</span>
                          <Badge variant="outline" className="text-xs">
                            {count}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Map Container */}
            <div className="lg:col-span-3">
              <div 
                ref={mapRef} 
                className="w-full h-[600px] bg-gray-100"
                style={{ minHeight: '600px' }}
              >
                {!isMapLoaded && (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <RefreshCw className="w-6 h-6 text-teal-600 animate-spin" />
                      </div>
                      <p className="text-sm text-gray-600">Loading disease heat map...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disease Hotspots List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-600" />
            Critical Disease Hotspots
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredData.slice(0, 5).map(location => (
              <div 
                key={location.id}
                className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className={`w-3 h-3 rounded-full ${
                      location.riskLevel === 'high' ? 'bg-red-500' :
                      location.riskLevel === 'moderate' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                  ></div>
                  <div>
                    <div className="text-gray-900">{location.disease}</div>
                    <div className="text-xs text-gray-500">📍 {location.region}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg text-gray-900">{location.cases.toLocaleString()}</div>
                    <div className={`text-xs flex items-center gap-1 ${
                      location.weeklyTrend.startsWith('+') ? 'text-red-500' :
                      location.weeklyTrend.startsWith('-') ? 'text-green-500' :
                      'text-gray-500'
                    }`}>
                      <TrendingUp className={`w-3 h-3 ${
                        location.weeklyTrend.startsWith('-') ? 'rotate-180' : ''
                      }`} />
                      {location.weeklyTrend}
                    </div>
                  </div>
                  <Badge 
                    className={
                      location.riskLevel === 'high' ? 'bg-red-500' :
                      location.riskLevel === 'moderate' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }
                  >
                    {location.riskLevel}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
/* updated */
