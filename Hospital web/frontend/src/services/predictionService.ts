import { API_CONFIG } from './apiConfig';
import { calculateHealthImpact } from './pollutionService';
import { calculateFestivalImpact } from './festivalService';

export interface PredictionInput {
  city: string;
  aqi: number;
  temperature?: number;
  humidity?: number;
  festivalName?: string | null;
  epidemicActive: boolean;
  epidemicCases?: number;
  baselinePatients?: number;
  historicalData?: any[];
}

export interface PredictionOutput {
  predictedPatients: number;
  staffNeeded: number;
  surgePrediction: number;
  alertLevel: 'low' | 'moderate' | 'high' | 'critical';
  advisory: string;
  recommendations: string[];
  breakdown: {
    baselinePatients: number;
    pollutionImpact: number;
    festivalImpact: number;
    epidemicImpact: number;
  };
  timestamp: string;
}

/**
 * AI-Powered Hospital Patient Surge Prediction
 * 
 * This function combines multiple data sources to predict patient surge:
 * - Pollution/AQI levels
 * - Festival periods
 * - Epidemic outbreaks
 * - Historical patterns
 */
export async function predictPatientSurge(input: PredictionInput): Promise<PredictionOutput> {
  const {
    aqi,
    festivalName,
    epidemicActive,
    epidemicCases = 0,
    baselinePatients = 150, // Default baseline
  } = input;

  // Calculate individual impacts
  const pollutionImpact = calculateHealthImpact(aqi);
  const festivalImpact = calculateFestivalImpact(festivalName || null);
  
  // Epidemic impact calculation
  let epidemicSurge = 0;
  if (epidemicActive && epidemicCases > API_CONFIG.THRESHOLDS.EPIDEMIC_CASES) {
    epidemicSurge = 30; // 30% surge for active epidemics
  } else if (epidemicActive) {
    epidemicSurge = 15; // 15% for minor epidemics
  }

  // Combine all surge predictions
  const totalSurgePercent = 
    pollutionImpact.surgePrediction + 
    festivalImpact.surgePrediction + 
    epidemicSurge;

  const surgePrediction = Math.min(totalSurgePercent, 100); // Cap at 100%
  const additionalPatients = Math.floor((baselinePatients * surgePrediction) / 100);
  const predictedPatients = baselinePatients + additionalPatients;

  // Calculate staff needed (1 staff per 10 patients above baseline)
  const staffNeeded = Math.ceil(additionalPatients / 10);

  // Determine alert level
  let alertLevel: 'low' | 'moderate' | 'high' | 'critical';
  if (surgePrediction > 40) {
    alertLevel = 'critical';
  } else if (surgePrediction > 25) {
    alertLevel = 'high';
  } else if (surgePrediction > 15) {
    alertLevel = 'moderate';
  } else {
    alertLevel = 'low';
  }

  // Combine recommendations from all sources
  const recommendations = [
    ...pollutionImpact.recommendations,
    ...festivalImpact.recommendations,
  ];

  if (epidemicActive) {
    recommendations.push('Activate epidemic response protocol');
    recommendations.push('Setup isolation wards');
    recommendations.push('Brief staff on infectious disease protocols');
  }

  // Generate AI advisory
  const advisory = generateAdvisory({
    predictedPatients,
    staffNeeded,
    surgePrediction,
    alertLevel,
    aqi,
    festivalName,
    epidemicActive,
  });

  return {
    predictedPatients,
    staffNeeded,
    surgePrediction,
    alertLevel,
    advisory,
    recommendations: [...new Set(recommendations)], // Remove duplicates
    breakdown: {
      baselinePatients,
      pollutionImpact: Math.floor((baselinePatients * pollutionImpact.surgePrediction) / 100),
      festivalImpact: Math.floor((baselinePatients * festivalImpact.surgePrediction) / 100),
      epidemicImpact: Math.floor((baselinePatients * epidemicSurge) / 100),
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate human-readable advisory text
 */
function generateAdvisory(params: {
  predictedPatients: number;
  staffNeeded: number;
  surgePrediction: number;
  alertLevel: string;
  aqi: number;
  festivalName?: string | null;
  epidemicActive: boolean;
}): string {
  const {
    predictedPatients,
    staffNeeded,
    surgePrediction,
    alertLevel,
    aqi,
    festivalName,
    epidemicActive,
  } = params;

  let advisory = `⚕️ **Hospital Preparedness Advisory**\n\n`;
  
  advisory += `📊 Predicted patient load: **${predictedPatients} patients** (${surgePrediction}% surge)\n\n`;
  
  advisory += `👥 **Staff Allocation:** Deploy ${staffNeeded} additional staff members immediately.\n\n`;

  // Add specific warnings based on factors
  const factors = [];
  
  if (aqi > 200) {
    factors.push(`🌫️ High pollution (AQI: ${aqi}) will increase respiratory cases`);
  }
  
  if (festivalName) {
    factors.push(`🎆 ${festivalName} festival period - expect trauma and celebration-related cases`);
  }
  
  if (epidemicActive) {
    factors.push(`⚠️ Active epidemic outbreak - implement strict infection control`);
  }

  if (factors.length > 0) {
    advisory += `**Key Factors:**\n${factors.map(f => `• ${f}`).join('\n')}\n\n`;
  }

  // Alert level specific guidance
  switch (alertLevel) {
    case 'critical':
      advisory += `🚨 **CRITICAL ALERT:** Hospital at maximum capacity risk. Consider:\n`;
      advisory += `• Activate disaster management protocol\n`;
      advisory += `• Contact nearby hospitals for potential transfers\n`;
      advisory += `• Cancel non-essential procedures\n`;
      advisory += `• Deploy all available staff\n`;
      break;
    case 'high':
      advisory += `⚠️ **HIGH ALERT:** Significant surge expected. Actions required:\n`;
      advisory += `• Prepare emergency overflow areas\n`;
      advisory += `• Stock critical medical supplies\n`;
      advisory += `• Brief all staff on surge protocols\n`;
      advisory += `• Ensure ambulance availability\n`;
      break;
    case 'moderate':
      advisory += `⚡ **MODERATE ALERT:** Elevated patient load expected.\n`;
      advisory += `• Schedule additional nursing shifts\n`;
      advisory += `• Review inventory levels\n`;
      advisory += `• Prepare for extended wait times\n`;
      break;
    case 'low':
      advisory += `✅ **LOW ALERT:** Minor increase expected. Maintain standard readiness.\n`;
      break;
  }

  return advisory;
}

/**
 * Call Firebase AI Studio / Gemini API for enhanced predictions
 * This integrates with Firebase Vertex AI for more sophisticated analysis
 */
export async function callFirebaseAIPredictor(input: PredictionInput): Promise<PredictionOutput> {
  try {
    // This would call your Firebase Function endpoint
    const response = await fetch(`${API_CONFIG.PREDICTION_API_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error('Firebase AI prediction failed');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error calling Firebase AI:', error);
    // Fallback to local prediction
    return predictPatientSurge(input);
  }
}

/**
 * Call Flowise AI for predictions
 */
export async function callFlowiseAI(input: PredictionInput): Promise<PredictionOutput> {
  try {
    const response = await fetch(`${API_CONFIG.FLOWISE_API_URL}/api/v1/prediction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.FLOWISE_API_KEY}`,
      },
      body: JSON.stringify({
        question: `Predict hospital patient surge for ${input.city} with AQI: ${input.aqi}, Festival: ${input.festivalName || 'None'}, Epidemic: ${input.epidemicActive}`,
        overrideConfig: {
          aqi: input.aqi,
          festival: input.festivalName,
          epidemic: input.epidemicActive,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Flowise AI prediction failed');
    }

    const result = await response.json();
    
    // Parse Flowise response (format may vary based on your flow)
    return {
      ...result,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error calling Flowise AI:', error);
    // Fallback to local prediction
    return predictPatientSurge(input);
  }
}

/**
 * Smart prediction that tries multiple AI sources
 */
export async function getSmartPrediction(input: PredictionInput): Promise<PredictionOutput> {
  // Try Firebase AI first, then Flowise, then fallback to local
  try {
    // Check if Firebase is configured
    if (API_CONFIG.FIREBASE_CONFIG.apiKey !== 'YOUR_FIREBASE_API_KEY') {
      return await callFirebaseAIPredictor(input);
    }
  } catch (error) {
    console.error('Firebase AI failed, trying Flowise:', error);
  }

  try {
    // Try Flowise if configured
    if (API_CONFIG.FLOWISE_API_KEY !== 'YOUR_FLOWISE_API_KEY') {
      return await callFlowiseAI(input);
    }
  } catch (error) {
    console.error('Flowise AI failed, using local prediction:', error);
  }

  // Fallback to local prediction
  return predictPatientSurge(input);
}

/* updated */
