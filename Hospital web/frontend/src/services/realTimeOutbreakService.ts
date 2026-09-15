import { OutbreakData } from '../types/outbreak';

// Mock real-time outbreak data for demonstration
export const mockOutbreakData: OutbreakData[] = [
  {
    id: '1',
    disease: 'Dengue',
    cases: 10000,
    severity: 'info',
    source: 'Google News',
    location: 'India (Multi-site)',
    lat: 20.5937,
    lng: 78.9629,
    headline: 'Dengue vaccine DengiAll enters final stage human trials',
    summary: 'India-developed vaccine candidate tested on 10,000 volunteers. Results anticipated later this year.',
    time: '06 Mar 2026',
    category: 'fever',
    link: 'https://news.google.com'
  },
  {
    id: '2',
    disease: 'Nipah Virus',
    cases: 0,
    severity: 'low',
    source: 'WHO',
    location: 'West Bengal',
    lat: 22.9868,
    lng: 87.8550,
    headline: 'Nipah outbreak in West Bengal declared contained',
    summary: 'All 196 contacts of January confirmed cases tested negative. Surveillance remains enhanced in Barasat.',
    time: '05 Mar 2026',
    category: 'other',
    link: 'https://who.int'
  },
  {
    id: '3',
    disease: 'Influenza',
    cases: 142,
    severity: 'medium',
    source: 'Times of India',
    location: 'Mumbai, Maharashtra',
    lat: 19.0760,
    lng: 72.8777,
    headline: 'Seasonal flu cases surge in Mumbai hospitals',
    summary: 'Standard seasonal uptick reported. Health authorities recommend vaccination and masks in crowded areas.',
    time: '04 Mar 2026',
    category: 'respiratory',
    link: 'https://timesofindia.com'
  },
  {
    id: '4',
    disease: 'Malaria',
    cases: 34,
    severity: 'medium',
    source: 'CDC',
    location: 'Odisha',
    lat: 20.9517,
    lng: 85.0985,
    headline: 'Malaria surveillance increased in Odisha districts',
    summary: 'New vector control measures implemented as cases show slight rise in tribal regions.',
    time: '03 Mar 2026',
    category: 'fever',
    link: 'https://cdc.gov'
  },
  {
    id: '5',
    disease: 'Typhoid',
    cases: 56,
    severity: 'medium',
    source: 'India Health Ministry',
    location: 'Delhi',
    lat: 28.7041,
    lng: 77.1025,
    headline: 'Water-borne illness cases reported in Delhi NCR',
    summary: 'Dozens of typhoid cases linked to local water contamination in East Delhi.',
    time: '02 Mar 2026',
    category: 'gastrointestinal',
    link: 'https://mohfw.gov.in'
  }
];

export class RealTimeOutbreakService {
  private static instance: RealTimeOutbreakService;
  private outbreaks: OutbreakData[] = [...mockOutbreakData];
  private listeners: ((outbreaks: OutbreakData[]) => void)[] = [];

  static getInstance(): RealTimeOutbreakService {
    if (!RealTimeOutbreakService.instance) {
      RealTimeOutbreakService.instance = new RealTimeOutbreakService();
    }
    return RealTimeOutbreakService.instance;
  }

  subscribe(callback: (outbreaks: OutbreakData[]) => void) {
    this.listeners.push(callback);
    callback(this.outbreaks);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  getOutbreaks(): OutbreakData[] {
    return this.outbreaks;
  }

  async fetchRealTimeData(sources: any): Promise<OutbreakData[]> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // In production, this would fetch from WHO, CDC, Google News APIs
    // For now, return mock data with slight variations
    return this.outbreaks;
  }

  async refreshData(settings: any): Promise<void> {
    // Simulate fetching new data
    const newData = await this.fetchRealTimeData(settings.dataSources);
    this.outbreaks = newData;
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.outbreaks));
  }

  getOutbreaksByCategory(category: string): OutbreakData[] {
    return this.outbreaks.filter(o => o.category === category);
  }

  getOutbreaksBySeverity(severity: string): OutbreakData[] {
    return this.outbreaks.filter(o => o.severity === severity);
  }

  getNearbyOutbreaks(lat: number, lng: number, radiusKm: number = 500): OutbreakData[] {
    return this.outbreaks.filter(outbreak => {
      const distance = this.calculateDistance(lat, lng, outbreak.lat, outbreak.lng);
      return distance <= radiusKm;
    });
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

/* updated */
