import { AQIData } from './pollutionService';
import { WeatherData, calculateWeatherHealthImpact } from './weatherService';

export interface CombinedPrediction {
  city: string;
  totalSurge: number;
  peakAQI: number;
  peakDate: string;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  affectedPopulation: number;
  expectedCases: number;
  highRiskCities: number;
  factors: {
    pollution: number;
    weather: number;
    seasonal: number;
  };
  recommendations: string[];
}

/**
 * Calculate combined health impact from pollution and weather
 */
export function calculateCombinedHealthImpact(
  aqiData: AQIData | null,
  weatherData: WeatherData | null,
  forecastAQI: number[]
): CombinedPrediction {

  const currentAQI = aqiData?.aqi || 150;
  const city = aqiData?.city || weatherData?.city || 'Unknown';

  // Calculate pollution impact (0-50%)
  let pollutionSurge = 0;
  if (currentAQI > 300) {
    pollutionSurge = 40;
  } else if (currentAQI > 200) {
    pollutionSurge = 30;
  } else if (currentAQI > 150) {
    pollutionSurge = 20;
  } else if (currentAQI > 100) {
    pollutionSurge = 10;
  } else {
    pollutionSurge = 5;
  }

  // Calculate weather impact (0-50%)
  let weatherSurge = 0;
  if (weatherData) {
    const weatherImpact = calculateWeatherHealthImpact(weatherData);
    weatherSurge = weatherImpact.surgePercentage;
  }

  // Seasonal impact (0-20%)
  const month = new Date().getMonth();
  let seasonalSurge = 0;

  // Festival season (Oct-Nov) - Diwali pollution spike
  if (month === 9 || month === 10) {
    seasonalSurge = 15;
  }
  // Winter (Dec-Jan) - Respiratory infections peak
  else if (month === 11 || month === 0) {
    seasonalSurge = 12;
  }
  // Spring (Feb-Mar) - Pollen and allergies
  else if (month === 1 || month === 2) {
    seasonalSurge = 6;
  }
  // Summer (Apr-Jun) - Heat-related illnesses
  else if (month >= 3 && month <= 5) {
    seasonalSurge = 10;
  }
  // Monsoon (Jul-Sep) - Waterborne diseases
  else if (month >= 6 && month <= 8) {
    seasonalSurge = 8;
  }

  // Combined surge calculation (weighted average)
  const totalSurge = Math.round(
    (pollutionSurge * 0.5) + (weatherSurge * 0.3) + (seasonalSurge * 0.2)
  );

  // Determine risk level
  let riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  if (totalSurge >= 35) riskLevel = 'critical';
  else if (totalSurge >= 25) riskLevel = 'high';
  else if (totalSurge >= 15) riskLevel = 'moderate';
  else riskLevel = 'low';

  // Calculate peak AQI from forecast
  const peakAQI = forecastAQI.length > 0 ? Math.max(...forecastAQI) : currentAQI + 50;
  const peakIndex = forecastAQI.indexOf(peakAQI);
  const today = new Date();
  const peakDate = new Date(today.setDate(today.getDate() + peakIndex));
  const peakDateStr = peakDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Calculate affected population (assuming 1 million population)
  const affectedPopulation = Math.round(1000000 * (totalSurge / 100));

  // Calculate expected cases (assuming 5% of affected seek medical care)
  const expectedCases = Math.round(affectedPopulation * 0.05);

  // Generate recommendations based on all factors
  const recommendations: string[] = [];

  if (currentAQI > 200) {
    recommendations.push('🫁 Deploy additional pulmonologists and respiratory specialists');
    recommendations.push('💊 Stock respiratory medications (bronchodilators, corticosteroids)');
    recommendations.push('🏥 Prepare extra oxygen cylinders and ICU beds');
  }

  if (weatherData) {
    const weatherImpact = calculateWeatherHealthImpact(weatherData);
    recommendations.push(...weatherImpact.recommendations);
  }

  if (seasonalSurge > 10) {
    if (month === 9 || month === 10) {
      recommendations.push('🎆 Prepare for post-Diwali pollution spike');
      recommendations.push('😷 Setup air purifiers in hospital wards');
    } else if (month === 11 || month === 0) {
      recommendations.push('❄️ Stock cold and flu medications');
      recommendations.push('🦠 Monitor for seasonal respiratory infections');
    }
  }

  if (totalSurge > 30) {
    recommendations.push('🚨 Activate emergency response protocols');
    recommendations.push('📞 Recall off-duty medical staff');
  }

  return {
    city,
    totalSurge,
    peakAQI,
    peakDate: peakDateStr,
    riskLevel,
    affectedPopulation,
    expectedCases,
    highRiskCities: calculateHighRiskCities(currentAQI),
    factors: {
      pollution: Math.round(pollutionSurge),
      weather: Math.round(weatherSurge),
      seasonal: Math.round(seasonalSurge),
    },
    recommendations,
  };
}

/**
 * Calculate number of high-risk cities (estimated)
 */
function calculateHighRiskCities(baseAQI: number): number {
  // Simulate regional pollution patterns
  // If Delhi has high AQI, nearby NCR cities likely affected
  if (baseAQI > 200) return 15;
  if (baseAQI > 150) return 10;
  if (baseAQI > 100) return 5;
  return 2;
}

/**
 * Format surge percentage with sign
 */
export function formatSurgePercentage(surge: number): string {
  return surge > 0 ? `+${surge}%` : `${surge}%`;
}

/**
 * Get risk color class
 */
export function getRiskColorClass(riskLevel: string): string {
  switch (riskLevel) {
    case 'critical': return 'bg-red-600';
    case 'high': return 'bg-orange-500';
    case 'moderate': return 'bg-yellow-500';
    case 'low': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
}

/* updated */
