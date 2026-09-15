import { API_CONFIG } from './apiConfig';
import { apiKeyService } from './apiKeyService';

export interface AQIData {
  city: string;
  aqi: number;
  level: string;
  color: string;
  timestamp: string;
  pollutants?: {
    pm25?: number;
    pm10?: number;
    no2?: number;
    so2?: number;
    co?: number;
    o3?: number;
  };
}

export interface AQIForecast {
  day: string;
  aqi: number;
}

/**
 * Fetch AQI data for a specific city
 * Uses WAQI API: https://aqicn.org/api/
 */
export async function fetchCityAQI(city: string): Promise<AQIData | null> {
  try {
    // Get API key from storage
    const apiKey = apiKeyService.getWAQIKey();
    
    if (!apiKey || apiKey === 'YOUR_WAQI_API_KEY_HERE') {
      // Using mock data until API is configured
      return null;
    }

    const response = await fetch(
      `${API_CONFIG.WAQI_BASE_URL}/feed/${city}/?token=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch AQI data');
    }

    const data = await response.json();
    
    if (data.status !== 'ok') {
      throw new Error('Invalid API response');
    }

    const aqi = data.data.aqi;
    const iaqi = data.data.iaqi || {};
    
    return {
      city: data.data.city.name,
      aqi: aqi,
      level: getAQILevel(aqi),
      color: getAQIColor(aqi),
      timestamp: data.data.time.s,
      pollutants: {
        pm25: iaqi.pm25?.v,
        pm10: iaqi.pm10?.v,
        no2: iaqi.no2?.v,
        so2: iaqi.so2?.v,
        co: iaqi.co?.v,
        o3: iaqi.o3?.v,
      }
    };
  } catch (error) {
    // Silently fallback to mock data - API may not be configured
    return null;
  }
}

/**
 * Fetch AQI for multiple Indian cities
 */
export async function fetchMultipleCitiesAQI(cities: string[]): Promise<AQIData[]> {
  const promises = cities.map(city => fetchCityAQI(city));
  const results = await Promise.all(promises);
  return results.filter((data): data is AQIData => data !== null);
}

/**
 * Generate AQI forecast using OpenWeather Air Pollution API
 * Falls back to pattern-based prediction if API not configured
 */
export async function generateAQIForecast(city: string, days: number = 7): Promise<AQIForecast[]> {
  try {
    // Try to get real forecast from OpenWeather API
    const weatherApiKey = apiKeyService.getWeatherKey();
    
    if (weatherApiKey && weatherApiKey !== 'YOUR_OPENWEATHER_API_KEY_HERE') {
      const realForecast = await fetchOpenWeatherAQIForecast(city, days);
      if (realForecast.length > 0) {
        return realForecast;
      }
    }

    // Fallback: Use current data + patterns
    const currentData = await fetchCityAQI(city);
    if (!currentData) {
      return [];
    }

    // Pattern-based forecast using current AQI with realistic variation
    const forecast: AQIForecast[] = [];
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      // Realistic forecast logic based on seasonal patterns
      const month = date.getMonth();
      const festivalBonus = (month === 9 || month === 10) ? 30 : 0; // Oct/Nov
      const winterBonus = (month === 11 || month === 0 || month === 1) ? 40 : 0; // Dec/Jan/Feb
      const variation = Math.floor(Math.random() * 70) - 20;
      const predictedAQI = Math.max(50, currentData.aqi + variation + festivalBonus + winterBonus);
      
      forecast.push({
        day: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        aqi: Math.min(500, predictedAQI), // Cap at 500
      });
    }
    
    return forecast;
  } catch (error) {
    return [];
  }
}

/**
 * Fetch real AQI forecast from OpenWeather Air Pollution API
 */
async function fetchOpenWeatherAQIForecast(city: string, days: number = 7): Promise<AQIForecast[]> {
  try {
    const weatherApiKey = apiKeyService.getWeatherKey();
    if (!weatherApiKey) return [];

    // First get city coordinates
    const geoResponse = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${city},IN&limit=1&appid=${weatherApiKey}`
    );
    
    if (!geoResponse.ok) return [];
    
    const geoData = await geoResponse.json();
    if (!geoData || geoData.length === 0) return [];
    
    const { lat, lon } = geoData[0];

    // Fetch air pollution forecast
    const aqiResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${weatherApiKey}`
    );
    
    if (!aqiResponse.ok) return [];
    
    const aqiData = await aqiResponse.json();
    
    // Process forecast data - group by day and average
    const dailyForecasts: AQIForecast[] = [];
    const today = new Date();
    const seenDays = new Set<string>();
    
    for (const item of aqiData.list) {
      const date = new Date(item.dt * 1000);
      const dayKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      if (seenDays.size >= days) break;
      
      if (!seenDays.has(dayKey)) {
        seenDays.add(dayKey);
        
        // Convert OpenWeather AQI (1-5 scale) to Indian AQI (0-500 scale)
        const owAqi = item.main.aqi;
        const pm25 = item.components.pm2_5;
        const pm10 = item.components.pm10;
        
        // Calculate AQI from PM2.5 (using US EPA formula, close to Indian AQI)
        let aqi = convertPM25ToAQI(pm25);
        
        const daysSinceToday = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const label = daysSinceToday === 0 ? 'Today' : 
                      daysSinceToday === 1 ? 'Tomorrow' : dayKey;
        
        dailyForecasts.push({
          day: label,
          aqi: Math.round(aqi)
        });
      }
    }
    
    return dailyForecasts;
  } catch (error) {
    return [];
  }
}

/**
 * Convert PM2.5 concentration to AQI
 * Using US EPA breakpoints (similar to Indian AQI)
 */
function convertPM25ToAQI(pm25: number): number {
  // AQI breakpoints for PM2.5
  const breakpoints = [
    { cLow: 0, cHigh: 12, aqiLow: 0, aqiHigh: 50 },
    { cLow: 12.1, cHigh: 35.4, aqiLow: 51, aqiHigh: 100 },
    { cLow: 35.5, cHigh: 55.4, aqiLow: 101, aqiHigh: 150 },
    { cLow: 55.5, cHigh: 150.4, aqiLow: 151, aqiHigh: 200 },
    { cLow: 150.5, cHigh: 250.4, aqiLow: 201, aqiHigh: 300 },
    { cLow: 250.5, cHigh: 500, aqiLow: 301, aqiHigh: 500 },
  ];
  
  for (const bp of breakpoints) {
    if (pm25 >= bp.cLow && pm25 <= bp.cHigh) {
      const aqi = ((bp.aqiHigh - bp.aqiLow) / (bp.cHigh - bp.cLow)) * (pm25 - bp.cLow) + bp.aqiLow;
      return aqi;
    }
  }
  
  return pm25 > 500 ? 500 : 50; // Default
}

/**
 * Get AQI level description
 */
export function getAQILevel(aqi: number): string {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 150) return 'Moderate';
  if (aqi <= 200) return 'Poor';
  if (aqi <= 300) return 'Very Poor';
  return 'Severe';
}

/**
 * Get AQI color code
 */
export function getAQIColor(aqi: number): string {
  if (aqi <= 50) return 'bg-green-500';
  if (aqi <= 100) return 'bg-yellow-400';
  if (aqi <= 150) return 'bg-yellow-500';
  if (aqi <= 200) return 'bg-orange-500';
  if (aqi <= 300) return 'bg-red-500';
  return 'bg-purple-500';
}

/**
 * Calculate health impact based on AQI
 */
export function calculateHealthImpact(aqi: number): {
  surgePrediction: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  recommendations: string[];
} {
  let surgePrediction = 0;
  let riskLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';
  const recommendations: string[] = [];

  if (aqi > 200) {
    surgePrediction = Math.floor((aqi - 200) * 0.2) + 25; // 25-35% surge
    riskLevel = aqi > 300 ? 'critical' : 'high';
    recommendations.push('Deploy additional pulmonologists');
    recommendations.push('Stock respiratory medications');
    recommendations.push('Prepare extra oxygen cylinders');
    recommendations.push('Setup air purifiers in wards');
  } else if (aqi > 150) {
    surgePrediction = 15;
    riskLevel = 'moderate';
    recommendations.push('Monitor respiratory cases closely');
    recommendations.push('Stock asthma medications');
  } else {
    surgePrediction = 5;
    riskLevel = 'low';
    recommendations.push('Maintain standard protocols');
  }

  return { surgePrediction, riskLevel, recommendations };
}

/* updated */
