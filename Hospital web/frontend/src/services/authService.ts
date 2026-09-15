/**
 * Authentication Service (System-Locked)
 * Handles user authentication and triggers System API Locking on first login.
 */

import { User } from 'firebase/auth';
import { initializeSystemAPIs, isSystemInitialized, getSystemAPIs } from './systemSetupService';

// Mock User Interface
export interface AuthUser {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string | null;
    role: string;
}

export interface AuthResponse {
    user: AuthUser | null;
    success: boolean;
    error?: string;
    isFirstLogin?: boolean;
}

const MOCK_DELAY = 1000;

/**
 * Sign up with email and password
 * Triggers System Initialization if first user.
 */
export const signUpWithEmail = async (email: string, password: string, name: string): Promise<AuthResponse> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulate successful signup
            const newUser: AuthUser = {
                uid: 'user-' + Date.now(),
                email,
                displayName: name,
                photoURL: null,
                role: 'admin'
            };

            // CHECK: Is this the first ever login?
            let firstLogin = false;
            if (!isSystemInitialized()) {
                console.log('🚀 First User Detected. Initializing System...');
                initializeSystemAPIs();
                firstLogin = true;
            } else {
                console.log('🔒 System already locked. Logging in standard user.');
            }

            // Save user to local storage to simulate session
            localStorage.setItem('BHARAT_PULSELINK_USER', JSON.stringify(newUser));

            resolve({
                user: newUser,
                success: true,
                isFirstLogin: firstLogin
            });
        }, MOCK_DELAY);
    });
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulate successful login
            const user: AuthUser = {
                uid: 'user-existing',
                email,
                displayName: 'Dr. ' + email.split('@')[0],
                photoURL: null,
                role: 'admin'
            };

            localStorage.setItem('BHARAT_PULSELINK_USER', JSON.stringify(user));

            resolve({
                user,
                success: true
            });
        }, MOCK_DELAY);
    });
};

/**
 * Complete Google Sign-In with real user data from GIS
 */
export const completeGoogleSignIn = (userData: { email: string; name: string; picture: string; uid: string }): AuthResponse => {
    const user: AuthUser = {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.name,
        photoURL: userData.picture,
        role: 'admin'
    };

    // Initialize system if it's the first login
    let firstLogin = false;
    if (!isSystemInitialized()) {
        console.log('🚀 First User Detected (Google). Initializing System...');
        initializeSystemAPIs();
        firstLogin = true;
    }

    localStorage.setItem('BHARAT_PULSELINK_USER', JSON.stringify(user));

    // Trigger a storage event so AuthContext updates in the same tab
    window.dispatchEvent(new Event('storage'));

    return {
        user,
        success: true,
        isFirstLogin: firstLogin
    };
};

/**
 * Legacy Sign in with Google (Mocked)
 */
export const signInWithGoogle = async (): Promise<AuthResponse> => {
    // This is now just a fallback or for demo buttons
    return completeGoogleSignIn({
        uid: 'google-user-123',
        email: 'demo@gmail.com',
        name: 'Demo User',
        picture: ''
    });
};

/**
 * Sign out
 */
export const logout = async (): Promise<boolean> => {
    localStorage.removeItem('BHARAT_PULSELINK_USER'); localStorage.removeItem('HEALTHPULSE_USER');
    return true;
};

/**
 * Get current user
 */
export const getCurrentUser = (): AuthUser | null => {
    const data = localStorage.getItem('BHARAT_PULSELINK_USER') || localStorage.getItem('HEALTHPULSE_USER');
    return data ? JSON.parse(data) : null;
};

/* updated */
