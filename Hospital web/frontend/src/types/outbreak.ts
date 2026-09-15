export interface OutbreakData {
  id: string;
  disease: string;
  cases: number;
  severity: 'high' | 'medium' | 'low' | 'info';
  source: string;
  location: string;
  lat: number;
  lng: number;
  headline: string;
  summary?: string;
  time: string;
  category: 'respiratory' | 'fever' | 'skin' | 'gastrointestinal' | 'covid' | 'other';
  link?: string;
}

export interface OutbreakCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
  color: string;
}

export interface MapSettings {
  liveDataEnabled: boolean;
  dataSources: {
    who: boolean;
    cdc: boolean;
    googleNews: boolean;
    indiaGov: boolean;
    customBackend: string;
  };
  refreshFrequency: '1min' | '5min' | '10min' | 'manual';
  userLocation: {
    lat: number;
    lng: number;
  } | null;
}

/* updated */
