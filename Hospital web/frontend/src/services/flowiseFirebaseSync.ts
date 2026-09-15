/**
 * Flowise AI + Firebase Real-Time Sync Service
 * 
 * This service connects Flowise AI predictions with Firebase Cloud Database
 * enabling real-time data synchronization across your dashboard.
 */

import { getFirestore } from './firebaseConfig';
import { callFlowiseAI } from './predictionService';

export interface FlowisePrediction {
  id: string;
  timestamp: Date;
  input: {
    city: string;
    aqi: number;
    weather: any;
    festivals: any[];
  };
  prediction: {
    patientLoad: number;
    surge: number;
    confidence: number;
    recommendations: string[];
  };
  status: 'pending' | 'completed' | 'error';
  syncedToFirebase: boolean;
}

export interface RealtimeListener {
  unsubscribe: () => void;
}

/**
 * Save Flowise AI prediction to Firebase Realtime Database
 */
export async function savePredictionToFirebase(prediction: FlowisePrediction): Promise<string> {
  try {
    const db = getFirestore();
    const predictionsCollection = db.collection('flowise_predictions');
    
    const docRef = await predictionsCollection.add({
      ...prediction,
      timestamp: new Date().toISOString(),
      syncedAt: new Date().toISOString(),
      version: '1.0',
    });

    console.log('✅ Prediction saved to Firebase:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error saving prediction to Firebase:', error);
    throw error;
  }
}

/**
 * Get Flowise AI prediction and automatically sync to Firebase
 */
export async function getPredictionWithSync(input: {
  city: string;
  aqi: number;
  weather: any;
  festivals: any[];
  epidemics: any[];
}): Promise<FlowisePrediction> {
  try {
    // Call Flowise AI
    console.log('🤖 Calling Flowise AI for prediction...');
    const flowiseResult = await callFlowiseAI(input);

    // Create prediction object
    const prediction: FlowisePrediction = {
      id: `pred_${Date.now()}`,
      timestamp: new Date(),
      input: {
        city: input.city,
        aqi: input.aqi,
        weather: input.weather,
        festivals: input.festivals,
      },
      prediction: {
        patientLoad: flowiseResult.predictedPatientLoad,
        surge: flowiseResult.surgePrediction,
        confidence: flowiseResult.confidence || 0.85,
        recommendations: flowiseResult.recommendations,
      },
      status: 'completed',
      syncedToFirebase: false,
    };

    // Sync to Firebase in background
    savePredictionToFirebase(prediction)
      .then(() => {
        prediction.syncedToFirebase = true;
        console.log('✅ Prediction synced to Firebase');
      })
      .catch(error => {
        console.error('⚠️ Firebase sync failed (prediction still valid):', error);
      });

    return prediction;
  } catch (error) {
    console.error('❌ Error getting prediction:', error);
    
    // Return error prediction
    return {
      id: `pred_error_${Date.now()}`,
      timestamp: new Date(),
      input: {
        city: input.city,
        aqi: input.aqi,
        weather: input.weather,
        festivals: input.festivals,
      },
      prediction: {
        patientLoad: 0,
        surge: 0,
        confidence: 0,
        recommendations: ['Error occurred. Please try again.'],
      },
      status: 'error',
      syncedToFirebase: false,
    };
  }
}

/**
 * Subscribe to real-time prediction updates from Firebase
 */
export function subscribeToRealtimePredictions(
  callback: (predictions: FlowisePrediction[]) => void,
  city?: string
): RealtimeListener {
  try {
    const db = getFirestore();
    let query = db.collection('flowise_predictions');

    // Filter by city if provided
    if (city) {
      query = query.where('input.city', '==', city);
    }

    // Sort by timestamp (most recent first)
    query = query.orderBy('timestamp', 'desc').limit(50);

    // Set up real-time listener
    const unsubscribe = query.onSnapshot((snapshot: any) => {
      const predictions: FlowisePrediction[] = [];
      
      snapshot.forEach((doc: any) => {
        predictions.push({
          id: doc.id,
          ...doc.data(),
          timestamp: new Date(doc.data().timestamp),
        });
      });

      callback(predictions);
      console.log(`🔄 Received ${predictions.length} real-time predictions from Firebase`);
    });

    return { unsubscribe };
  } catch (error) {
    console.error('❌ Error setting up real-time listener:', error);
    return {
      unsubscribe: () => console.log('No active subscription to unsubscribe'),
    };
  }
}

/**
 * Get historical predictions from Firebase
 */
export async function getHistoricalPredictions(
  city?: string,
  limit: number = 100
): Promise<FlowisePrediction[]> {
  try {
    const db = getFirestore();
    let query = db.collection('flowise_predictions');

    if (city) {
      query = query.where('input.city', '==', city);
    }

    query = query.orderBy('timestamp', 'desc').limit(limit);

    const snapshot = await query.get();
    const predictions: FlowisePrediction[] = [];

    snapshot.docs.forEach((doc: any) => {
      predictions.push({
        id: doc.id,
        ...doc.data(),
        timestamp: new Date(doc.data().timestamp),
      });
    });

    console.log(`📊 Retrieved ${predictions.length} historical predictions`);
    return predictions;
  } catch (error) {
    console.error('❌ Error getting historical predictions:', error);
    return [];
  }
}

/**
 * Update prediction status in Firebase
 */
export async function updatePredictionStatus(
  predictionId: string,
  status: 'pending' | 'completed' | 'error',
  additionalData?: any
): Promise<void> {
  try {
    const db = getFirestore();
    const docRef = db.collection('flowise_predictions').doc(predictionId);

    await docRef.set({
      status,
      updatedAt: new Date().toISOString(),
      ...additionalData,
    }, { merge: true });

    console.log(`✅ Prediction ${predictionId} status updated to: ${status}`);
  } catch (error) {
    console.error('❌ Error updating prediction status:', error);
    throw error;
  }
}

/**
 * Batch save multiple predictions to Firebase
 */
export async function batchSavePredictions(predictions: FlowisePrediction[]): Promise<void> {
  try {
    const db = getFirestore();
    const batch = db.batch();

    predictions.forEach(prediction => {
      const docRef = db.collection('flowise_predictions').doc(prediction.id);
      batch.set(docRef, {
        ...prediction,
        timestamp: prediction.timestamp.toISOString(),
        batchSyncedAt: new Date().toISOString(),
      });
    });

    await batch.commit();
    console.log(`✅ Batch saved ${predictions.length} predictions to Firebase`);
  } catch (error) {
    console.error('❌ Error batch saving predictions:', error);
    throw error;
  }
}

/**
 * Delete old predictions (cleanup)
 */
export async function cleanupOldPredictions(daysToKeep: number = 30): Promise<number> {
  try {
    const db = getFirestore();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const query = db.collection('flowise_predictions')
      .where('timestamp', '<', cutoffDate.toISOString());

    const snapshot = await query.get();
    const deleteCount = snapshot.docs.length;

    // Delete in batches
    const batches = [];
    let currentBatch = db.batch();
    let operationCount = 0;

    snapshot.docs.forEach((doc: any) => {
      currentBatch.delete(doc.ref);
      operationCount++;

      if (operationCount === 500) {
        batches.push(currentBatch.commit());
        currentBatch = db.batch();
        operationCount = 0;
      }
    });

    if (operationCount > 0) {
      batches.push(currentBatch.commit());
    }

    await Promise.all(batches);
    console.log(`🗑️ Cleaned up ${deleteCount} old predictions from Firebase`);
    return deleteCount;
  } catch (error) {
    console.error('❌ Error cleaning up old predictions:', error);
    return 0;
  }
}

/**
 * Get prediction statistics from Firebase
 */
export async function getPredictionStatistics(): Promise<{
  totalPredictions: number;
  todayPredictions: number;
  averageConfidence: number;
  citiesTracked: string[];
  lastUpdated: Date;
}> {
  try {
    const db = getFirestore();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all predictions
    const allSnapshot = await db.collection('flowise_predictions').get();
    const totalPredictions = allSnapshot.docs.length;

    // Get today's predictions
    const todaySnapshot = await db.collection('flowise_predictions')
      .where('timestamp', '>=', today.toISOString())
      .get();
    const todayPredictions = todaySnapshot.docs.length;

    // Calculate average confidence
    let totalConfidence = 0;
    const cities = new Set<string>();

    allSnapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      totalConfidence += data.prediction?.confidence || 0;
      if (data.input?.city) {
        cities.add(data.input.city);
      }
    });

    const averageConfidence = totalPredictions > 0 
      ? totalConfidence / totalPredictions 
      : 0;

    return {
      totalPredictions,
      todayPredictions,
      averageConfidence,
      citiesTracked: Array.from(cities),
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error('❌ Error getting prediction statistics:', error);
    return {
      totalPredictions: 0,
      todayPredictions: 0,
      averageConfidence: 0,
      citiesTracked: [],
      lastUpdated: new Date(),
    };
  }
}

/**
 * Enable real-time sync for all predictions
 * This keeps your dashboard automatically updated
 */
export function enableRealtimeSync(
  onUpdate: (data: { type: string; prediction: FlowisePrediction }) => void
): RealtimeListener {
  console.log('🔄 Enabling real-time Firebase sync...');
  
  return subscribeToRealtimePredictions((predictions) => {
    predictions.forEach(prediction => {
      onUpdate({
        type: 'prediction_update',
        prediction,
      });
    });
  });
}

// Export all functions
export default {
  savePredictionToFirebase,
  getPredictionWithSync,
  subscribeToRealtimePredictions,
  getHistoricalPredictions,
  updatePredictionStatus,
  batchSavePredictions,
  cleanupOldPredictions,
  getPredictionStatistics,
  enableRealtimeSync,
};

/* updated */
