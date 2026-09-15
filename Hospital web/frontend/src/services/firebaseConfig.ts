/**
 * Firebase Configuration and Setup
 * 
 * This file initializes the real Firebase SDK for Authentication and Firestore.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { API_CONFIG } from './apiConfig';

// Firebase configuration object
const firebaseConfig = API_CONFIG.FIREBASE_CONFIG;

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  auth = getAuth(app);
  db = getFirestore(app);

  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  // Fallback for development if config is missing/invalid
  // This prevents app crash but auth won't work
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
}

// Export instances
export { app, auth, db };

// Export providers
export const googleProvider = new GoogleAuthProvider();

/**
 * Helper to check if Firebase is configured
 */
export const isFirebaseConfigured = (): boolean => {
  return (
    firebaseConfig.apiKey !== 'YOUR_FIREBASE_API_KEY' &&
    firebaseConfig.projectId !== 'YOUR_PROJECT_ID'
  );
};


/* updated */
