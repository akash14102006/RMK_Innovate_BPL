/**
 * API Key Management Service
 * Handles secure storage and retrieval of API keys
 */

const API_KEY_STORAGE = {
  WAQI: 'pulselink_waqi_api_key',
  FLOWISE: 'pulselink_flowise_api_key',
  WEATHER: 'pulselink_weather_api_key',
  NEWS_API: 'pulselink_news_api_key',
  CALENDARIFIC: 'pulselink_calendarific_api_key',
  GOOGLE_CALENDAR: 'pulselink_google_calendar_api_key',
  GOOGLE_MAPS: 'pulselink_google_maps_api_key',
  WHO_API: 'pulselink_who_api_key',
  GOV_HEALTH_API: 'pulselink_gov_health_api_key',
  CUSTOM_BACKEND: 'pulselink_custom_backend_endpoint',
};

export const apiKeyService = {
  // Save WAQI API Key
  saveWAQIKey(key: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(API_KEY_STORAGE.WAQI, key);
    }
  },

  // Get WAQI API Key
  getWAQIKey(): string | null {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(API_KEY_STORAGE.WAQI);
      if (stored && stored !== 'YOUR_WAQI_API_KEY_HERE') return stored;
    }
    return '73b5e30f960d4b49a07f165f3fa4f1b5bcbeb97a';
  },

  // Save Flowise API Key
  saveFlowiseKey(key: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(API_KEY_STORAGE.FLOWISE, key);
    }
  },

  // Get Flowise API Key
  getFlowiseKey(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(API_KEY_STORAGE.FLOWISE);
    }
    return null;
  },

  // Save Weather API Key
  saveWeatherKey(key: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(API_KEY_STORAGE.WEATHER, key);
    }
  },

  // Get Weather API Key
  getWeatherKey(): string | null {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(API_KEY_STORAGE.WEATHER);
      if (stored && stored !== 'YOUR_OPENWEATHER_API_KEY_HERE') return stored;
    }
    return '1ec2c219f6e43da2fb7a62205987ce75';
  },

  // Check if WAQI API is configured
  isWAQIConfigured(): boolean {
    const key = this.getWAQIKey();
    return key !== null && key.length > 0 && key !== 'YOUR_WAQI_API_KEY_HERE';
  },

  // Check if Weather API is configured
  isWeatherConfigured(): boolean {
    const key = this.getWeatherKey();
    return key !== null && key.length > 0 && key !== 'YOUR_OPENWEATHER_API_KEY_HERE';
  },

  // Clear all API keys
  clearAllKeys(): void {
    if (typeof window !== 'undefined') {
      Object.values(API_KEY_STORAGE).forEach(key => {
        localStorage.removeItem(key);
      });
    }
  },

  // Save News API Key
  saveNewsApiKey(key: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(API_KEY_STORAGE.NEWS_API, key);
    }
  },

  // Get News API Key
  getNewsApiKey(): string | null {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(API_KEY_STORAGE.NEWS_API);
      if (stored && stored !== 'YOUR_NEWS_API_KEY_HERE') return stored;
    }
    return 'e5b19d3f75244039aa349a5543ff5e73';
  },

  // Save Calendarific API Key
  saveCalendarificKey(key: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(API_KEY_STORAGE.CALENDARIFIC, key);
    }
  },

  // Get Calendarific API Key
  getCalendarificKey(): string | null {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(API_KEY_STORAGE.CALENDARIFIC);
      if (stored && stored !== 'YOUR_CALENDARIFIC_API_KEY_HERE') return stored;
    }
    return '9TjKB6NCMIWpnQTEkTcyHhyagMybJ8Tm';
  },

  // Save Google Calendar API Key
  saveGoogleCalendarKey(key: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(API_KEY_STORAGE.GOOGLE_CALENDAR, key);
    }
  },

  // Get Google Calendar API Key
  getGoogleCalendarKey(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(API_KEY_STORAGE.GOOGLE_CALENDAR);
    }
    return null;
  },

  // Check if News API is configured
  isNewsApiConfigured(): boolean {
    const key = this.getNewsApiKey();
    return key !== null && key.length > 0 && key !== 'YOUR_NEWS_API_KEY_HERE';
  },

  // Check if Calendarific API is configured
  isCalendarificConfigured(): boolean {
    const key = this.getCalendarificKey();
    return key !== null && key.length > 0 && key !== 'YOUR_CALENDARIFIC_API_KEY_HERE';
  },

  // Check if Google Calendar API is configured
  isGoogleCalendarConfigured(): boolean {
    const key = this.getGoogleCalendarKey();
    return key !== null && key.length > 0 && key !== 'YOUR_GOOGLE_CALENDAR_API_KEY_HERE';
  },

  // Validate WAQI API Key format
  validateWAQIKey(key: string): boolean {
    // WAQI keys are typically long alphanumeric strings
    return key.length >= 20 && /^[a-zA-Z0-9]+$/.test(key);
  },

  // Google Maps API Key
  saveGoogleMapsKey(key: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(API_KEY_STORAGE.GOOGLE_MAPS, key);
    }
  },

  getGoogleMapsKey(): string | null {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(API_KEY_STORAGE.GOOGLE_MAPS);
      if (stored && stored !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE') return stored;
    }
    return 'AIzaSyBjMderwpv9DY7z2Q_72VJq6vXLudKwnVo';
  },

  isGoogleMapsConfigured(): boolean {
    const key = this.getGoogleMapsKey();
    return key !== null && key.length > 0 && key !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE';
  },

  // WHO API Key
  saveWHOApiKey(key: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(API_KEY_STORAGE.WHO_API, key);
    }
  },

  getWHOApiKey(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(API_KEY_STORAGE.WHO_API);
    }
    return null;
  },

  isWHOApiConfigured(): boolean {
    const key = this.getWHOApiKey();
    return key !== null && key.length > 0 && key !== 'YOUR_WHO_API_KEY_HERE';
  },

  // Gov Health API Key
  saveGovHealthApiKey(key: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(API_KEY_STORAGE.GOV_HEALTH_API, key);
    }
  },

  getGovHealthApiKey(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(API_KEY_STORAGE.GOV_HEALTH_API);
    }
    return null;
  },

  isGovHealthApiConfigured(): boolean {
    const key = this.getGovHealthApiKey();
    return key !== null && key.length > 0 && key !== 'YOUR_GOV_HEALTH_API_KEY_HERE';
  },

  // Custom Backend Endpoint
  saveCustomBackendEndpoint(endpoint: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(API_KEY_STORAGE.CUSTOM_BACKEND, endpoint);
    }
  },

  getCustomBackendEndpoint(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(API_KEY_STORAGE.CUSTOM_BACKEND);
    }
    return null;
  },

  isCustomBackendConfigured(): boolean {
    const endpoint = this.getCustomBackendEndpoint();
    return endpoint !== null && endpoint.length > 0 && endpoint !== 'https://your-backend.com/api/diseases';
  }
};
/* updated */
