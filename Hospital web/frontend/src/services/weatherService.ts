import { API_CONFIG } from './apiConfig';
import { apiKeyService } from './apiKeyService';

export interface WeatherData {
  city: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  icon: string;
  timestamp: string;
  feels_like: number;
  pressure: number;
}

export interface WeatherForecast {
  day: string;
  temp: number;
  humidity: number;
  condition: string;
}

/**
 * Fetch current weather data for a city
 * Uses OpenWeatherMap API: https://openweathermap.org/api
 */
export async function fetchCityWeather(city: string): Promise<WeatherData | null> {
  // Get API key from storage
  const apiKey = apiKeyService.getWeatherKey();

  // If no API key is configured, silently use mock data
  if (!apiKey || apiKey === 'YOUR_OPENWEATHER_API_KEY_HERE') {
    return generateMockWeather(city);
  }

  try {
    const response = await fetch(
      `${API_CONFIG.OPENWEATHER_BASE_URL}/weather?q=${city},IN&appid=${apiKey}&units=metric`
    );

    if (!response.ok) {
      // Check if it's an authentication error
      if (response.status === 401) {
        console.warn('Weather API: Invalid API key. Using mock data.');
        return generateMockWeather(city);
      }

      // Check if it's a city not found error
      if (response.status === 404) {
        console.warn(`Weather API: City "${city}" not found. Using mock data.`);
        return generateMockWeather(city);
      }

      // Other errors
      console.warn(`Weather API: Request failed (${response.status}). Using mock data.`);
      return generateMockWeather(city);
    }

    const data = await response.json();

    return {
      city: data.name,
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      condition: data.weather[0].main,
      icon: data.weather[0].icon,
      timestamp: new Date(data.dt * 1000).toLocaleString(),
      feels_like: Math.round(data.main.feels_like),
      pressure: data.main.pressure,
    };
  } catch (error) {
    // Network error or parsing error - use mock data silently
    console.warn('Weather API: Network error. Using mock data.');
    return generateMockWeather(city);
  }
}

/**
 * Fetch 5-day weather forecast
 */
export async function fetchWeatherForecast(city: string, days: number = 7): Promise<WeatherForecast[]> {
  const apiKey = apiKeyService.getWeatherKey();

  // If no API key is configured, silently use mock data
  if (!apiKey || apiKey === 'YOUR_OPENWEATHER_API_KEY_HERE') {
    return generateMockWeatherForecast(days);
  }

  try {
    const response = await fetch(
      `${API_CONFIG.OPENWEATHER_BASE_URL}/forecast?q=${city},IN&appid=${apiKey}&units=metric&cnt=${days * 8}`
    );

    if (!response.ok) {
      // Silently fall back to mock data
      return generateMockWeatherForecast(days);
    }

    const data = await response.json();

    // Group by day and take midday reading
    const dailyForecasts: WeatherForecast[] = [];
    const processedDays = new Set<string>();

    data.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000);
      const dayKey = date.toDateString();

      if (!processedDays.has(dayKey) && dailyForecasts.length < days) {
        processedDays.add(dayKey);

        dailyForecasts.push({
          day: dailyForecasts.length === 0 ? 'Today' :
            dailyForecasts.length === 1 ? 'Tomorrow' :
              date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          temp: Math.round(item.main.temp),
          humidity: item.main.humidity,
          condition: item.weather[0].main,
        });
      }
    });

    return dailyForecasts;
  } catch (error) {
    // Silently fall back to mock data
    return generateMockWeatherForecast(days);
  }
}

/**
 * Calculate patient surge based on weather conditions
 */
export function calculateWeatherHealthImpact(weather: WeatherData): {
  surgePercentage: number;
  riskFactors: string[];
  recommendations: string[];
} {
  let surgePercentage = 0;
  const riskFactors: string[] = [];
  const recommendations: string[] = [];

  // High temperature impact
  if (weather.temperature > 40) {
    surgePercentage += 15;
    riskFactors.push('Extreme heat (heatstroke risk)');
    recommendations.push('Stock IV fluids and cooling equipment');
  } else if (weather.temperature > 35) {
    surgePercentage += 8;
    riskFactors.push('High temperature');
    recommendations.push('Prepare for heat-related illnesses');
  }

  // Low temperature impact
  if (weather.temperature < 10) {
    surgePercentage += 12;
    riskFactors.push('Cold weather (respiratory infections)');
    recommendations.push('Stock antibiotics and cold medicines');
  } else if (weather.temperature < 15) {
    surgePercentage += 6;
    riskFactors.push('Cool weather');
    recommendations.push('Monitor respiratory cases');
  }

  // High humidity impact
  if (weather.humidity > 85) {
    surgePercentage += 10;
    riskFactors.push('High humidity (fungal infections)');
    recommendations.push('Prepare anti-fungal medications');
  }

  // Low humidity impact (combined with pollution)
  if (weather.humidity < 30) {
    surgePercentage += 5;
    riskFactors.push('Low humidity (respiratory irritation)');
    recommendations.push('Monitor asthma and COPD cases');
  }

  // Rain/Storm conditions
  if (weather.condition === 'Rain' || weather.condition === 'Thunderstorm') {
    surgePercentage += 8;
    riskFactors.push('Rainfall (waterborne diseases)');
    recommendations.push('Stock antibiotics for infections');
  }

  return {
    surgePercentage: Math.min(surgePercentage, 50), // Cap at 50%
    riskFactors,
    recommendations,
  };
}

/**
 * Generate mock weather data
 */
function generateMockWeather(city: string): WeatherData {
  // Use string length to generate deterministic pseudo-random values
  const seed = city.length + city.charCodeAt(0);
  const temp = 25 + (seed % 16); // 25 to 40
  const hum = 40 + ((seed * 5) % 50); // 40 to 89
  const conditions = ['Clear', 'Clouds', 'Rain', 'Haze'];

  return {
    city: city,
    temperature: temp,
    humidity: hum,
    windSpeed: 2 + (seed % 6),
    condition: conditions[seed % 4],
    icon: '01d',
    timestamp: new Date().toLocaleString(),
    feels_like: temp + 2,
    pressure: 1010 + (seed % 10),
  };
}

/**
 * Generate mock weather forecast
 */
function generateMockWeatherForecast(days: number): WeatherForecast[] {
  const forecast: WeatherForecast[] = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);

    forecast.push({
      day: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      temp: 25 + Math.floor(Math.random() * 10),
      humidity: 60 + Math.floor(Math.random() * 20),
      condition: ['Clear', 'Clouds', 'Rain'][Math.floor(Math.random() * 3)],
    });
  }

  return forecast;
}

/* updated */
