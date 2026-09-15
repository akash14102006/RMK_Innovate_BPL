/**
 * Real-Time Dashboard Service
 * Provides live data for dashboard metrics and charts
 */

import { fetchCityAQI } from './pollutionService';
import { fetchCityWeather } from './weatherService';
import { getNextMajorFestival, getFestivalByDate, INDIAN_FESTIVALS_2026 } from './festivalService';
import { predictPatientSurge } from './predictionService';
import { fetchEpidemicData } from './healthAlertsService';
import { apiKeyService } from './apiKeyService';
import { fetchFestivalsFromAPI } from './festivalService';

export interface DashboardMetrics {
  predictedPatientLoad: {
    value: number;
    change: string;
    changePercent: number;
    date: string;
    trend: 'up' | 'down';
  };
  staffRequired: {
    value: number;
    current: number;
    additional: number;
  };
  currentAQI: {
    value: number;
    status: string;
    city: string;
    isLive: boolean;
  };
  festivalImpact: {
    level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    festivalName: string;
    date: string;
    surge: string;
  };
  epidemicAlert: {
    level: 'Low' | 'Moderate' | 'High';
    status: string;
    description: string;
    activeThreats: number;
  };
}

export interface PatientTrendData {
  date: string;
  patients: number;
  predicted: number;
}

/**
 * Generate real-time dashboard metrics
 */
export async function getRealTimeDashboardMetrics(city: string = 'chennai', patientCount: number = 0): Promise<DashboardMetrics> {
  const now = new Date();
  const isLiveMode = apiKeyService.isWAQIConfigured() || apiKeyService.isWeatherConfigured();

  // Fetch real-time AQI data
  let currentAQI = 218; // Default fallback
  let aqiCity = 'Chennai';
  let isLiveAQI = false;

  if (apiKeyService.isWAQIConfigured()) {
    try {
      const aqiData = await fetchCityAQI(city);
      if (aqiData && aqiData.aqi) {
        currentAQI = aqiData.aqi;
        aqiCity = aqiData.city;
        isLiveAQI = true;
      }
    } catch (error) {
      console.error('Error fetching live AQI:', error);
    }
  }

  // Get festival data (fetch live if possible)
  let allFestivals: any[] | undefined = undefined;
  if (apiKeyService.isCalendarificConfigured()) {
    try {
      allFestivals = await fetchFestivalsFromAPI(now.getFullYear());
    } catch (e) {
      console.warn('Dashboard failed to fetch live festivals, using fallback');
    }
  }

  const nextMajorFestival = getNextMajorFestival(allFestivals);
  const todayFestival = getFestivalByDate(now, allFestivals);
  const activeFestival = todayFestival || nextMajorFestival;

  // Calculate days until next festival
  let daysUntilFestival = 0;
  if (activeFestival) {
    const festivalDate = new Date(activeFestival.date);
    daysUntilFestival = Math.ceil((festivalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Get epidemic data
  const epidemicData = await fetchEpidemicData();
  const highAlertEpidemics = epidemicData.filter(e => e.alertLevel === 'high');
  const activeThreats = epidemicData.filter(e => e.trend === 'up').length;

  // Calculate predicted patient load using prediction service
  const baselinePatients = patientCount > 0 ? patientCount * 12 : 28; // Use a more realistic clinic baseline for smaller queues
  const prediction = await predictPatientSurge({
    city: aqiCity,
    aqi: currentAQI,
    festivalName: activeFestival?.name || null,
    epidemicActive: highAlertEpidemics.length > 0,
    epidemicCases: highAlertEpidemics.length > 0 ? highAlertEpidemics[0].cases : 0,
    baselinePatients,
    historicalData: [],
  });

  // Calculate staff metrics based on current queue
  const currentStaff = Math.max(6, Math.round(patientCount * 1.5)); // Believable staff count for clinic size

  // Calculate festival impact level
  let festivalImpactLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (activeFestival) {
    if (daysUntilFestival <= 3 && activeFestival.level === 'high') {
      festivalImpactLevel = 'CRITICAL';
    } else if (activeFestival.level === 'high') {
      festivalImpactLevel = 'HIGH';
    } else if (activeFestival.level === 'moderate') {
      festivalImpactLevel = 'MODERATE';
    } else {
      festivalImpactLevel = 'LOW';
    }
  }

  // Calculate epidemic alert level
  let epidemicLevel: 'Low' | 'Moderate' | 'High' = 'Low';
  let epidemicStatus = 'Stable';
  let epidemicDescription = 'No active threats';

  if (highAlertEpidemics.length > 0) {
    epidemicLevel = 'High';
    epidemicStatus = 'Active';
    epidemicDescription = `${highAlertEpidemics[0].disease} outbreak`;
  } else if (activeThreats > 2) {
    epidemicLevel = 'Moderate';
    epidemicStatus = 'Monitoring';
    epidemicDescription = `${activeThreats} diseases trending up`;
  }

  // Get AQI status
  const aqiStatus = getAQIStatus(currentAQI);

  return {
    predictedPatientLoad: {
      value: prediction.predictedPatients,
      change: `+${prediction.surgePrediction}% from today`,
      changePercent: prediction.surgePrediction,
      date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      trend: 'up',
    },
    staffRequired: {
      value: currentStaff + prediction.staffNeeded,
      current: currentStaff,
      additional: prediction.staffNeeded,
    },
    currentAQI: {
      value: currentAQI,
      status: aqiStatus,
      city: aqiCity,
      isLive: isLiveAQI,
    },
    festivalImpact: {
      level: festivalImpactLevel,
      festivalName: activeFestival?.name || 'None',
      date: activeFestival?.date || 'N/A',
      surge: activeFestival?.surge || '0%',
    },
    epidemicAlert: {
      level: epidemicLevel,
      status: epidemicStatus,
      description: epidemicDescription,
      activeThreats,
    },
  };
}

/**
 * Generate real-time patient load trend data (last 30 days + 7 days forecast)
 */
export async function getPatientLoadTrend(city: string = 'chennai', currentQueueLength: number = 0): Promise<PatientTrendData[]> {
  const now = new Date();
  const trendData: PatientTrendData[] = [];

  // Get current AQI for prediction
  let currentAQI = 150;
  if (apiKeyService.isWAQIConfigured()) {
    try {
      const aqiData = await fetchCityAQI(city);
      if (aqiData && aqiData.aqi) {
        currentAQI = aqiData.aqi;
      }
    } catch (error) {
      console.error('Error fetching AQI for trend:', error);
    }
  }

  // Generate historical data (last 30 days)
  for (let i = 30; i >= 1; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Check if there was a festival on this date
    const festival = getFestivalByDate(date);
    const festivalSurge = festival ? parseInt(festival.surge) : 0;

    // Simulate historical AQI variation
    const historicalAQI = currentAQI + (Math.random() * 40 - 20);
    const pollutionSurge = calculatePollutionSurge(historicalAQI);

    // Simulate seasonal baseline (gradually increasing towards current)
    const seasonalBase = 280 + ((30 - i) * 4); // Increasing trend
    const totalSurge = (seasonalBase * (pollutionSurge + festivalSurge)) / 100;

    const actualPatients = Math.round(seasonalBase + totalSurge + (Math.random() * 20 - 10));

    trendData.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      patients: actualPatients,
      predicted: actualPatients + Math.round(Math.random() * 10 - 5),
    });
  }

  // Add today
  const todayBaseline = Math.max(currentQueueLength * 4, 320);
  trendData.push({
    date: 'Today',
    patients: currentQueueLength > 0 ? (currentQueueLength % 20 + 280) + currentQueueLength : 380,
    predicted: todayBaseline,
  });

  // Generate forecast (next 7 days)
  for (let i = 1; i <= 7; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);

    // Check for upcoming festivals
    const festival = getFestivalByDate(date);
    const festivalSurge = festival ? parseInt(festival.surge) : 0;

    // Forecast pollution trend (assuming current conditions persist with variation)
    const forecastAQI = currentAQI + (Math.random() * 30 - 15);
    const pollutionSurge = calculatePollutionSurge(forecastAQI);

    // Calculate forecast
    const forecastBase = todayBaseline + (i * 3); // Slight upward trend
    const totalSurge = (forecastBase * (pollutionSurge + festivalSurge)) / 100;
    const predictedPatients = Math.round(forecastBase + totalSurge);

    trendData.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      patients: null as any, // Future dates have no actual data - set to null to avoid 'drop to zero' in charts
      predicted: predictedPatients,
    });
  }

  return trendData;
}

/**
 * Calculate pollution surge percentage based on AQI
 */
function calculatePollutionSurge(aqi: number): number {
  if (aqi > 300) return 40;
  if (aqi > 200) return 30;
  if (aqi > 150) return 20;
  if (aqi > 100) return 10;
  return 5;
}

/**
 * Get AQI status label
 */
function getAQIStatus(aqi: number): string {
  if (aqi > 300) return 'Hazardous';
  if (aqi > 200) return 'Very Unhealthy';
  if (aqi > 150) return 'Unhealthy';
  if (aqi > 100) return 'Moderate';
  if (aqi > 50) return 'Good';
  return 'Excellent';
}

/**
 * Calculate preparedness status based on all metrics
 */
export function calculatePreparednessStatus(metrics: DashboardMetrics): {
  status: 'green' | 'yellow' | 'red';
  message: string;
} {
  const { predictedPatientLoad, currentAQI, festivalImpact, epidemicAlert } = metrics;

  // Critical conditions
  if (
    festivalImpact.level === 'CRITICAL' ||
    epidemicAlert.level === 'High' ||
    predictedPatientLoad.changePercent > 40 ||
    currentAQI.value > 300
  ) {
    return {
      status: 'red',
      message: 'Critical surge predicted - Maximum readiness required',
    };
  }

  // Warning conditions
  if (
    festivalImpact.level === 'HIGH' ||
    epidemicAlert.level === 'Moderate' ||
    predictedPatientLoad.changePercent > 25 ||
    currentAQI.value > 200
  ) {
    return {
      status: 'yellow',
      message: 'Elevated patient load expected - Enhanced preparedness advised',
    };
  }

  // Normal conditions
  return {
    status: 'green',
    message: 'Normal operations - Standard protocols in effect',
  };
}

/**
 * Get real-time AI insights
 */
export function getAIInsights(metrics: DashboardMetrics): string[] {
  const insights: string[] = [];

  if (metrics.festivalImpact.level === 'HIGH' || metrics.festivalImpact.level === 'CRITICAL') {
    insights.push(
      `🎆 ${metrics.festivalImpact.festivalName} approaching - Expect ${metrics.festivalImpact.surge} surge in burns, trauma, and respiratory cases`
    );
  }

  if (metrics.currentAQI.value > 200) {
    insights.push(
      `🌫️ Severe air pollution (AQI: ${metrics.currentAQI.value}) - Stock respiratory medications and oxygen supplies`
    );
  }

  if (metrics.staffRequired.additional > 15) {
    insights.push(
      `👥 Critical staffing requirement - Schedule ${metrics.staffRequired.additional} additional staff members immediately`
    );
  }

  if (metrics.epidemicAlert.level === 'High') {
    insights.push(
      `⚠️ Active epidemic outbreak: ${metrics.epidemicAlert.description} - Activate infection control protocols`
    );
  }

  return insights;
}

/* updated */
