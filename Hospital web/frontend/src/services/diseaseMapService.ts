/**
 * Disease Map Service
 * Aggregates disease data from multiple sources for heat-map visualization
 */

import { apiKeyService } from './apiKeyService';

export interface DiseaseLocation {
  id: string;
  disease: string;
  lat: number;
  lng: number;
  region: string;
  cases: number;
  weeklyTrend: string; // e.g., "+18%", "-5%", "stable"
  riskLevel: 'low' | 'moderate' | 'high';
  source: 'WHO' | 'News API' | 'Gov Health' | 'Custom Backend';
  lastUpdated: string;
  description?: string;
}

// Mock disease locations for demonstration
const mockDiseaseData: DiseaseLocation[] = [
  {
    id: '1',
    disease: 'Dengue',
    lat: 19.0760,
    lng: 72.8777,
    region: 'Mumbai, Maharashtra',
    cases: 1284,
    weeklyTrend: '+18%',
    riskLevel: 'high',
    source: 'WHO',
    lastUpdated: new Date(Date.now() - 5 * 60000).toISOString(),
    description: 'Significant surge in dengue cases due to monsoon conditions'
  },
  {
    id: '2',
    disease: 'Dengue',
    lat: 28.7041,
    lng: 77.1025,
    region: 'Delhi NCR',
    cases: 956,
    weeklyTrend: '+22%',
    riskLevel: 'high',
    source: 'News API',
    lastUpdated: new Date(Date.now() - 10 * 60000).toISOString(),
    description: 'Rapid increase in dengue cases across multiple districts'
  },
  {
    id: '3',
    disease: 'Influenza',
    lat: 12.9716,
    lng: 77.5946,
    region: 'Bangalore, Karnataka',
    cases: 423,
    weeklyTrend: '+8%',
    riskLevel: 'moderate',
    source: 'Gov Health',
    lastUpdated: new Date(Date.now() - 15 * 60000).toISOString(),
    description: 'Seasonal flu outbreak reported in urban areas'
  },
  {
    id: '4',
    disease: 'Malaria',
    lat: 9.9312,
    lng: 76.2673,
    region: 'Kochi, Kerala',
    cases: 178,
    weeklyTrend: '-5%',
    riskLevel: 'low',
    source: 'WHO',
    lastUpdated: new Date(Date.now() - 20 * 60000).toISOString(),
    description: 'Declining cases with effective vector control measures'
  },
  {
    id: '5',
    disease: 'Dengue',
    lat: 17.3850,
    lng: 78.4867,
    region: 'Hyderabad, Telangana',
    cases: 687,
    weeklyTrend: '+12%',
    riskLevel: 'moderate',
    source: 'Custom Backend',
    lastUpdated: new Date(Date.now() - 8 * 60000).toISOString(),
    description: 'Moderate increase in dengue cases in residential areas'
  },
  {
    id: '6',
    disease: 'Chikungunya',
    lat: 22.5726,
    lng: 88.3639,
    region: 'Kolkata, West Bengal',
    cases: 234,
    weeklyTrend: '+15%',
    riskLevel: 'moderate',
    source: 'News API',
    lastUpdated: new Date(Date.now() - 12 * 60000).toISOString(),
    description: 'Chikungunya outbreak in eastern districts'
  },
  {
    id: '7',
    disease: 'Tuberculosis',
    lat: 23.0225,
    lng: 72.5714,
    region: 'Ahmedabad, Gujarat',
    cases: 456,
    weeklyTrend: 'stable',
    riskLevel: 'moderate',
    source: 'Gov Health',
    lastUpdated: new Date(Date.now() - 25 * 60000).toISOString(),
    description: 'Stable TB cases with ongoing treatment programs'
  },
  {
    id: '8',
    disease: 'Dengue',
    lat: 26.9124,
    lng: 75.7873,
    region: 'Jaipur, Rajasthan',
    cases: 312,
    weeklyTrend: '+10%',
    riskLevel: 'moderate',
    source: 'WHO',
    lastUpdated: new Date(Date.now() - 18 * 60000).toISOString(),
    description: 'Growing dengue cases in urban and semi-urban areas'
  },
  {
    id: '9',
    disease: 'Influenza',
    lat: 13.0827,
    lng: 80.2707,
    region: 'Chennai, Tamil Nadu',
    cases: 389,
    weeklyTrend: '+6%',
    riskLevel: 'moderate',
    source: 'Custom Backend',
    lastUpdated: new Date(Date.now() - 7 * 60000).toISOString(),
    description: 'Seasonal influenza cases on the rise'
  },
  {
    id: '10',
    disease: 'Malaria',
    lat: 21.1458,
    lng: 79.0882,
    region: 'Nagpur, Maharashtra',
    cases: 145,
    weeklyTrend: '-3%',
    riskLevel: 'low',
    source: 'News API',
    lastUpdated: new Date(Date.now() - 30 * 60000).toISOString(),
    description: 'Malaria cases declining with preventive measures'
  },
  {
    id: '11',
    disease: 'Dengue',
    lat: 25.5941,
    lng: 85.1376,
    region: 'Patna, Bihar',
    cases: 523,
    weeklyTrend: '+16%',
    riskLevel: 'high',
    source: 'Gov Health',
    lastUpdated: new Date(Date.now() - 14 * 60000).toISOString(),
    description: 'High alert for dengue in multiple regions'
  },
  {
    id: '12',
    disease: 'Chikungunya',
    lat: 15.2993,
    lng: 74.1240,
    region: 'Goa',
    cases: 89,
    weeklyTrend: '+5%',
    riskLevel: 'low',
    source: 'WHO',
    lastUpdated: new Date(Date.now() - 22 * 60000).toISOString(),
    description: 'Low-level chikungunya activity reported'
  }
];

export const diseaseMapService = {
  /**
   * Fetch disease data from WHO Feed
   */
  async fetchWHOData(): Promise<DiseaseLocation[]> {
    const apiKey = apiKeyService.getWHOApiKey();
    
    if (!apiKey || apiKey === 'YOUR_WHO_API_KEY_HERE') {
      console.log('WHO API not configured, using mock data');
      return mockDiseaseData.filter(d => d.source === 'WHO');
    }

    try {
      // TODO: Replace with actual WHO API endpoint when key is configured
      // const response = await fetch(`https://who-api-endpoint.com/diseases?key=${apiKey}`);
      // const data = await response.json();
      // return this.normalizeWHOData(data);
      
      return mockDiseaseData.filter(d => d.source === 'WHO');
    } catch (error) {
      console.error('Error fetching WHO data:', error);
      return [];
    }
  },

  /**
   * Fetch disease data from News Health Alerts API
   */
  async fetchNewsHealthData(): Promise<DiseaseLocation[]> {
    const apiKey = apiKeyService.getNewsApiKey();
    
    if (!apiKey || apiKey === 'YOUR_NEWS_API_KEY_HERE') {
      console.log('News API not configured for disease mapping, using mock data');
      return mockDiseaseData.filter(d => d.source === 'News API');
    }

    try {
      // TODO: Parse news API for health-related disease data
      return mockDiseaseData.filter(d => d.source === 'News API');
    } catch (error) {
      console.error('Error fetching News API health data:', error);
      return [];
    }
  },

  /**
   * Fetch disease data from Government Health Ministry API
   */
  async fetchGovHealthData(): Promise<DiseaseLocation[]> {
    const apiKey = apiKeyService.getGovHealthApiKey();
    
    if (!apiKey || apiKey === 'YOUR_GOV_HEALTH_API_KEY_HERE') {
      console.log('Gov Health API not configured, using mock data');
      return mockDiseaseData.filter(d => d.source === 'Gov Health');
    }

    try {
      // TODO: Replace with actual Gov Health API endpoint
      // const response = await fetch(`https://gov-health-api.in/diseases?key=${apiKey}`);
      // const data = await response.json();
      // return this.normalizeGovHealthData(data);
      
      return mockDiseaseData.filter(d => d.source === 'Gov Health');
    } catch (error) {
      console.error('Error fetching Gov Health data:', error);
      return [];
    }
  },

  /**
   * Fetch disease data from Custom Backend
   */
  async fetchCustomBackendData(): Promise<DiseaseLocation[]> {
    const endpoint = apiKeyService.getCustomBackendEndpoint();
    
    if (!endpoint || endpoint === 'https://your-backend.com/api/diseases') {
      console.log('Custom backend not configured, using mock data');
      return mockDiseaseData.filter(d => d.source === 'Custom Backend');
    }

    try {
      // TODO: Fetch from custom backend when configured
      // const response = await fetch(endpoint);
      // const data = await response.json();
      // return this.normalizeCustomBackendData(data);
      
      return mockDiseaseData.filter(d => d.source === 'Custom Backend');
    } catch (error) {
      console.error('Error fetching custom backend data:', error);
      return [];
    }
  },

  /**
   * Aggregate all disease data from multiple sources
   */
  async fetchAggregatedDiseaseData(): Promise<DiseaseLocation[]> {
    try {
      const [whoData, newsData, govData, customData] = await Promise.all([
        this.fetchWHOData(),
        this.fetchNewsHealthData(),
        this.fetchGovHealthData(),
        this.fetchCustomBackendData()
      ]);

      const aggregatedData = [...whoData, ...newsData, ...govData, ...customData];
      
      // Sort by risk level and cases
      return aggregatedData.sort((a, b) => {
        const riskOrder = { high: 3, moderate: 2, low: 1 };
        const riskDiff = riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
        if (riskDiff !== 0) return riskDiff;
        return b.cases - a.cases;
      });
    } catch (error) {
      console.error('Error aggregating disease data:', error);
      return mockDiseaseData;
    }
  },

  /**
   * Filter disease data by disease type
   */
  filterByDisease(data: DiseaseLocation[], diseases: string[]): DiseaseLocation[] {
    if (diseases.length === 0) return data;
    return data.filter(location => diseases.includes(location.disease));
  },

  /**
   * Get all unique disease types
   */
  getUniqueDiseases(data: DiseaseLocation[]): string[] {
    const diseases = new Set(data.map(d => d.disease));
    return Array.from(diseases).sort();
  }
};

/* updated */
