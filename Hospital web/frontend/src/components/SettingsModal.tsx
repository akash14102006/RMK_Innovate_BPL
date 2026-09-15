import React, { useState } from 'react';
import { MapSettings } from '../types/outbreak';
import { X, MapPin, Database, RefreshCw, Check, AlertCircle } from 'lucide-react';

interface SettingsModalProps {
  settings: MapSettings;
  onClose: () => void;
  onSave: (settings: MapSettings) => void;
  onFetchData: () => void;
  isLoading: boolean;
}

export function SettingsModal({ settings, onClose, onSave, onFetchData, isLoading }: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<MapSettings>(settings);

  const handleSave = () => {
    onSave(localSettings);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl text-gray-900">Enable Live Real-Time Data</h2>
              <p className="text-sm text-gray-500">Configure automatic outbreak data fetching</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Live Data Toggle */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-900">Live Real-Time Updates</p>
                  <p className="text-xs text-gray-600">Fetch automatic real-time global outbreak data</p>
                </div>
              </div>
              <button
                onClick={() => setLocalSettings({
                  ...localSettings,
                  liveDataEnabled: !localSettings.liveDataEnabled
                })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localSettings.liveDataEnabled ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localSettings.liveDataEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Data Sources */}
          <div className="space-y-3">
            <h3 className="text-sm text-gray-900 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Data Sources (All FREE APIs)
            </h3>
            
            <div className="space-y-2">
              {[
                { key: 'who', label: 'WHO Disease Outbreak News', url: 'https://who.int' },
                { key: 'cdc', label: 'CDC Public Health Feed', url: 'https://cdc.gov' },
                { key: 'googleNews', label: 'Google News Disease Alerts', url: 'https://news.google.com' },
                { key: 'indiaGov', label: 'India Government Health Bulletins', url: 'https://mohfw.gov.in' }
              ].map((source) => (
                <label
                  key={source.key}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={localSettings.dataSources[source.key as keyof typeof localSettings.dataSources] as boolean}
                      onChange={(e) => setLocalSettings({
                        ...localSettings,
                        dataSources: {
                          ...localSettings.dataSources,
                          [source.key]: e.target.checked
                        }
                      })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-sm text-gray-900">{source.label}</p>
                      <p className="text-xs text-gray-500">{source.url}</p>
                    </div>
                  </div>
                  {localSettings.dataSources[source.key as keyof typeof localSettings.dataSources] && (
                    <Check className="w-4 h-4 text-green-600" />
                  )}
                </label>
              ))}

              {/* Custom Backend */}
              <div className="p-3 bg-white border border-gray-200 rounded-lg">
                <label className="block">
                  <p className="text-sm text-gray-900 mb-2">Custom Backend API (Optional)</p>
                  <input
                    type="text"
                    value={localSettings.dataSources.customBackend}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      dataSources: {
                        ...localSettings.dataSources,
                        customBackend: e.target.value
                      }
                    })}
                    placeholder="https://your-backend.com/api/outbreaks"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Refresh Frequency */}
          <div className="space-y-3">
            <h3 className="text-sm text-gray-900 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh Frequency
            </h3>
            
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: '1min', label: 'Every 1 minute' },
                { value: '5min', label: 'Every 5 minutes' },
                { value: '10min', label: 'Every 10 minutes' },
                { value: 'manual', label: 'Manual Fetch' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setLocalSettings({
                    ...localSettings,
                    refreshFrequency: option.value as any
                  })}
                  className={`p-3 border rounded-lg text-sm transition-all ${
                    localSettings.refreshFrequency === option.value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fetch Data Card */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg text-gray-900 mb-2">Get Real-Time Disease Data Map</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Fetch live outbreaks from WHO, CDC, Google News, and your backend. 
                  Displays new markers on the map in real time.
                </p>
                
                <button
                  onClick={onFetchData}
                  disabled={isLoading || !localSettings.liveDataEnabled}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Fetching Real-Time Data...
                    </>
                  ) : (
                    <>
                      <Database className="w-5 h-5" />
                      Fetch Real-Time Disease Data
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Using Google Maps API: AIzaSyBR...F1aM
                </p>
              </div>
            </div>
          </div>

          {/* Info Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-900 mb-1">Data Source Information</p>
              <p className="text-xs text-gray-600">
                All data sources are publicly available and free to use. WHO, CDC, and government health feeds 
                provide official outbreak information. Google News aggregates disease-related news from verified sources.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
          >
            <Check className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

/* updated */
