/**
 * User API Key Service
 * Handles secure, per-user storage of API keys.
 * 
 * Architecture:
 * - Keys are stored in localStorage keyed by the User's Unique ID (UID).
 * - Format: BHARAT_PULSELINK_USER_KEYS_{uid} -> { waqi: '...', weather: '...', ... }
 * - This ensures that when User A logs in, they only load keys from their specific storage slot.
 * - User B's keys are stored in a completely different slot.
 */

import { getCurrentUser } from './authService';

interface UserApiKeys {
    waqi?: string;
    weather?: string;
    flowise?: string;
    news?: string;
    calendarific?: string;
    googleMaps?: string;
    backendUrl?: string; // Add Render/Backend URL support
}

const STORAGE_PREFIX = 'BHARAT_PULSELINK_USER_KEYS_';

const getStorageKey = (): string | null => {
    const user = getCurrentUser();
    if (!user || !user.uid) return null;
    return `${STORAGE_PREFIX}${user.uid}`;
};

export const userApiKeyService = {
    /**
     * Get all keys for the CURRENTLY logged in user.
     */
    getAllKeys: (): UserApiKeys => {
        const key = getStorageKey();
        let keys: UserApiKeys = {};

        if (key) {
            try {
                keys = JSON.parse(localStorage.getItem(key) || '{}');
            } catch (e) {
                keys = {};
            }
        }

        // Return hardcoded defaults if keys are missing
        return {
            waqi: keys.waqi || '73b5e30f960d4b49a07f165f3fa4f1b5bcbeb97a',
            weather: keys.weather || '1ec2c219f6e43da2fb7a62205987ce75',
            news: keys.news || 'e5b19d3f75244039aa349a5543ff5e73',
            calendarific: keys.calendarific || '9TjKB6NCMIWpnQTEkTcyHhyagMybJ8Tm',
            googleMaps: keys.googleMaps || 'AIzaSyBjMderwpv9DY7z2Q_72VJq6vXLudKwnVo',
            flowise: keys.flowise || '',
            backendUrl: keys.backendUrl || ''
        };
    },

    /**
     * Save a specific key for the CURRENTLY logged in user.
     */
    saveKey: (keyName: keyof UserApiKeys, value: string) => {
        const storageKey = getStorageKey();
        if (!storageKey) throw new Error('No user logged in');

        const currentKeys = userApiKeyService.getAllKeys();
        const newKeys = { ...currentKeys, [keyName]: value };

        localStorage.setItem(storageKey, JSON.stringify(newKeys));
    },

    /**
     * Get a specific key for the CURRENTLY logged in user.
     */
    getKey: (keyName: keyof UserApiKeys): string => {
        const keys = userApiKeyService.getAllKeys();
        return keys[keyName] || '';
    },

    // --- Specific Key Getters (Convenience) ---

    getWAQIKey: () => userApiKeyService.getKey('waqi'),
    getWeatherKey: () => userApiKeyService.getKey('weather'),
    getFlowiseKey: () => userApiKeyService.getKey('flowise'),
    getNewsKey: () => userApiKeyService.getKey('news'),
    getCalendarificKey: () => userApiKeyService.getKey('calendarific'),
    getGoogleMapsKey: () => userApiKeyService.getKey('googleMaps'),
    getBackendUrl: () => userApiKeyService.getKey('backendUrl'),

    // --- Validation Helpers ---

    validateWAQIKey: (key: string) => key.length > 5, // Basic check

    // --- Configuration Checkers ---
    isWAQIConfigured: () => !!userApiKeyService.getWAQIKey(),
    isWeatherConfigured: () => !!userApiKeyService.getWeatherKey(),
    isFlowiseConfigured: () => !!userApiKeyService.getFlowiseKey(),
    isNewsApiConfigured: () => !!userApiKeyService.getNewsKey(),
    isCalendarificConfigured: () => !!userApiKeyService.getCalendarificKey(),
    isGoogleMapsConfigured: () => !!userApiKeyService.getGoogleMapsKey(),
};

/* updated */
