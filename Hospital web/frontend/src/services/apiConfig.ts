/**
 * Dynamic API Configuration
 * All API keys are loaded from the logged-in user's settings.
 * NO static/hardcoded keys are stored here.
 */

import { userApiKeyService } from './userApiKeyService';

/**
 * Get real-time API configuration from the logged-in user's account
 */
export const getApiConfig = () => {
  const userKeys = userApiKeyService.getAllKeys();

  return {
    // Pollution API (WAQI - World Air Quality Index)
    WAQI_API_KEY: userKeys.waqi || '',
    WAQI_BASE_URL: 'https://api.waqi.info',

    // Weather API (OpenWeatherMap)
    OPENWEATHER_API_KEY: userKeys.weather || '',
    OPENWEATHER_BASE_URL: 'https://api.openweathermap.org/data/2.5',

    // Festival Calendar API (Calendarific)
    CALENDARIFIC_API_KEY: userKeys.calendarific || '',
    CALENDARIFIC_BASE_URL: 'https://calendarific.com/api/v2',

    // News API (for health alerts)
    NEWS_API_KEY: userKeys.news || '',
    NEWS_API_BASE_URL: 'https://newsapi.org/v2',

    // Google Maps API
    GOOGLE_MAPS_API_KEY: userKeys.googleMaps || '',

    // Flowise AI Backend (optional)
    FLOWISE_API_KEY: userKeys.flowise || '',
    FLOWISE_API_URL: 'https://flowise.bharatpulselink.in',

    // Firebase & Prediction API
    PREDICTION_API_URL: (userKeys as any).predictionApiUrl || '',
    FIREBASE_CONFIG: {
      apiKey: (userKeys as any).firebaseApiKey || 'YOUR_FIREBASE_API_KEY',
      authDomain: (userKeys as any).firebaseAuthDomain || '',
      projectId: (userKeys as any).firebaseProjectId || 'YOUR_PROJECT_ID',
      storageBucket: (userKeys as any).firebaseStorageBucket || '',
      messagingSenderId: (userKeys as any).firebaseMessagingSenderId || '',
      appId: (userKeys as any).firebaseAppId || '',
    },

    // Alert Thresholds (static, no API key needed)
    THRESHOLDS: {
      PATIENT_LOAD: 150,
      AQI_ALERT: 200,
      EPIDEMIC_CASES: 1000,
    },
  };
};

/**
 * Check if a specific API is configured by the user
 */
export const isApiConfigured = (apiName: 'waqi' | 'weather' | 'calendarific' | 'news' | 'googleMaps'): boolean => {
  const config = getApiConfig();

  switch (apiName) {
    case 'waqi':
      return !!config.WAQI_API_KEY && config.WAQI_API_KEY.length > 0;
    case 'weather':
      return !!config.OPENWEATHER_API_KEY && config.OPENWEATHER_API_KEY.length > 0;
    case 'calendarific':
      return !!config.CALENDARIFIC_API_KEY && config.CALENDARIFIC_API_KEY.length > 0;
    case 'news':
      return !!config.NEWS_API_KEY && config.NEWS_API_KEY.length > 0;
    case 'googleMaps':
      return !!config.GOOGLE_MAPS_API_KEY && config.GOOGLE_MAPS_API_KEY.length > 0;
    default:
      return false;
  }
};

/**
 * Check if all required APIs are configured
 */
export const areAllApisConfigured = (): boolean => {
  return (
    isApiConfigured('waqi') &&
    isApiConfigured('weather') &&
    isApiConfigured('calendarific') &&
    isApiConfigured('news') &&
    isApiConfigured('googleMaps')
  );
};

// Legacy export for backward compatibility (deprecated - use getApiConfig() instead)
export const API_CONFIG = getApiConfig();

/* updated */
