import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, InfoWindow, Marker } from '@react-google-maps/api';
import { OutbreakData, MapSettings } from '../types/outbreak';
import { RealTimeOutbreakService } from '../services/realTimeOutbreakService';
import { OutbreakFeed } from './OutbreakFeed';
import { SettingsModal } from './SettingsModal';
import { Search, Layers, Menu, Settings, MapPin } from 'lucide-react';

const containerStyle = {
  width: '100%',
  height: '100vh'
};

const center = {
  lat: 22.5,
  lng: 79.0
};

const mapStyles = [
  {
    featureType: 'all',
    elementType: 'geometry',
    stylers: [{ color: '#f5f5f5' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#e9e9e9' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9e9e9e' }]
  }
];

export function RealTimeHealthMap() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyBREpJ-lUCdweU4n239MRvIEM8PPFhF1aM'
  });

  const [outbreaks, setOutbreaks] = useState<OutbreakData[]>([]);
  const [selectedOutbreak, setSelectedOutbreak] = useState<OutbreakData | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [regionOutbreaks, setRegionOutbreaks] = useState<OutbreakData[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showFeed, setShowFeed] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<MapSettings>({
    liveDataEnabled: true,
    dataSources: {
      who: true,
      cdc: true,
      googleNews: true,
      indiaGov: true,
      customBackend: ''
    },
    refreshFrequency: '5min',
    userLocation: null
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const outbreakService = RealTimeOutbreakService.getInstance();

  useEffect(() => {
    const unsubscribe = outbreakService.subscribe((data) => {
      setOutbreaks(data);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (settings.liveDataEnabled) {
      const interval = setInterval(() => {
        fetchRealTimeData();
      }, getRefreshInterval());
      return () => clearInterval(interval);
    }
  }, [settings]);

  const getRefreshInterval = () => {
    switch (settings.refreshFrequency) {
      case '1min': return 60000;
      case '5min': return 300000;
      case '10min': return 600000;
      default: return Infinity;
    }
  };

  const fetchRealTimeData = async () => {
    setIsLoading(true);
    try {
      await outbreakService.refreshData(settings);
    } catch (error) {
      console.error('Failed to fetch real-time data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkerClick = (outbreak: OutbreakData) => {
    const regionOutbreaksData = outbreaks.filter(o => o.location === outbreak.location);
    setSelectedRegion(outbreak.location);
    setRegionOutbreaks(regionOutbreaksData);
    setSelectedOutbreak(outbreak);
  };

  const getMarkerColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#ef4444';
      case 'medium': return '#f97316';
      case 'low': return '#eab308';
      case 'info': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getMarkerIcon = (outbreak: OutbreakData) => {
    if (typeof window === 'undefined' || !window.google) return undefined;
    
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: getMarkerColor(outbreak.severity),
      fillOpacity: 0.8,
      strokeWeight: 2,
      strokeColor: '#ffffff',
      scale: outbreak.cases > 100 ? 12 : outbreak.cases > 50 ? 10 : 8,
    };
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading HealthMap...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white shadow-md">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl text-gray-900">HealthMap</h1>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search diseases, locations..."
                className="bg-transparent outline-none text-sm w-64"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setShowFeed(!showFeed)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        {/* Alert Banner */}
        <div className="px-4 py-2 bg-blue-50 border-t border-blue-100">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              {outbreaks.length} alerts for all diseases, current location, in the past week
            </p>
            {isLoading && (
              <span className="text-xs text-blue-600 animate-pulse">Updating...</span>
            )}
          </div>
        </div>
      </div>

      {/* Map */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={5}
        options={{
          styles: mapStyles,
          zoomControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM
          },
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false
        }}
        onLoad={(map) => {
          mapRef.current = map;
        }}
      >
        {/* Outbreak Markers */}
        {outbreaks.map((outbreak) => (
          <Marker
            key={outbreak.id}
            position={{ lat: outbreak.lat, lng: outbreak.lng }}
            icon={getMarkerIcon(outbreak)}
            onClick={() => handleMarkerClick(outbreak)}
            title={outbreak.location}
          />
        ))}

        {selectedOutbreak && selectedRegion && (
          <InfoWindow
            position={{ lat: selectedOutbreak.lat, lng: selectedOutbreak.lng }}
            onCloseClick={() => {
              setSelectedOutbreak(null);
              setSelectedRegion(null);
            }}
          >
            <div className="p-2 max-w-sm">
              <h3 className="mb-2 text-gray-900">{selectedRegion}</h3>
              <div className="max-h-64 overflow-y-auto space-y-3">
                {regionOutbreaks.map((outbreak) => (
                  <div key={outbreak.id} className="border-b pb-2 last:border-b-0">
                    <p className="text-xs text-gray-500">{outbreak.time}</p>
                    <p className="text-sm text-gray-900 mt-1">{outbreak.headline}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        outbreak.severity === 'high' ? 'bg-red-100 text-red-700' :
                        outbreak.severity === 'medium' ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {outbreak.cases} cases
                      </span>
                      <span className="text-xs text-gray-500">{outbreak.source}</span>
                    </div>
                    {outbreak.summary && (
                      <p className="text-xs text-gray-600 mt-1">{outbreak.summary}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Map Controls */}
      <div className="absolute top-24 left-4 flex flex-col gap-2 z-10">
        <button className="p-3 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <Search className="w-5 h-5 text-gray-600" />
        </button>
        <button className="p-3 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <Layers className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Right Sidebar */}
      {showFeed && (
        <OutbreakFeed
          outbreaks={outbreaks}
          onClose={() => setShowFeed(false)}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onClose={() => setShowSettings(false)}
          onSave={(newSettings) => {
            setSettings(newSettings);
            setShowSettings(false);
            if (newSettings.liveDataEnabled) {
              fetchRealTimeData();
            }
          }}
          onFetchData={fetchRealTimeData}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

/* updated */
