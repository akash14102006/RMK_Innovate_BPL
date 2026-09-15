import React from 'react';
import { OutbreakData } from '../types/outbreak';
import { X, Newspaper, AlertCircle } from 'lucide-react';

interface OutbreakFeedProps {
  outbreaks: OutbreakData[];
  onClose: () => void;
}

export function OutbreakFeed({ outbreaks, onClose }: OutbreakFeedProps) {
  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return dateStr;
  };

  return (
    <div className="absolute top-0 right-0 h-full w-full md:w-96 bg-white shadow-2xl z-20 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-lg text-gray-900">Disease Outbreak Alerts</h2>
          <button
            onClick={onClose}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Outbreak List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {outbreaks.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No outbreaks reported</p>
          </div>
        ) : (
          outbreaks.map((outbreak) => (
            <div
              key={outbreak.id}
              className="p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  outbreak.severity === 'high' ? 'bg-red-500' :
                  outbreak.severity === 'medium' ? 'bg-orange-500' :
                  outbreak.severity === 'low' ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-sm text-gray-900 line-clamp-2">
                      {outbreak.headline}
                    </h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {getRelativeTime(outbreak.time)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                      {outbreak.disease}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      outbreak.severity === 'high' ? 'bg-red-100 text-red-700' :
                      outbreak.severity === 'medium' ? 'bg-orange-100 text-orange-700' :
                      outbreak.severity === 'low' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {outbreak.cases} cases
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Newspaper className="w-3 h-3" />
                      <span>{outbreak.source}</span>
                    </div>
                    <span className="text-xs text-gray-500">{outbreak.location}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t bg-gray-50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl text-blue-600">{outbreaks.length}</p>
            <p className="text-xs text-gray-600">Total Alerts</p>
          </div>
          <div>
            <p className="text-2xl text-red-600">
              {outbreaks.filter(o => o.severity === 'high').length}
            </p>
            <p className="text-xs text-gray-600">High Severity</p>
          </div>
          <div>
            <p className="text-2xl text-gray-900">
              {outbreaks.reduce((sum, o) => sum + o.cases, 0)}
            </p>
            <p className="text-xs text-gray-600">Total Cases</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* updated */
