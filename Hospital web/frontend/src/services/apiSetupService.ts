/**
 * API Configuration Check Service
 * Determines if the user has completed the required API setup
 */

import { userApiKeyService } from './userApiKeyService';

export interface ApiSetupStatus {
    isConfigured: boolean;
    missingKeys: string[];
    configuredKeys: string[];
    requiredKeys: string[];
}

// Essential APIs required for the dashboard to function
const REQUIRED_API_KEYS = [
    { key: 'waqi', name: 'Pollution API (WAQI)' },
    { key: 'weather', name: 'Weather API (OpenWeather)' },
    { key: 'news', name: 'News API' },
    { key: 'calendarific', name: 'Calendarific API' },
    { key: 'googleMaps', name: 'Google Maps API' },
];

export const apiSetupService = {
    /**
     * Check if all required APIs are configured
     */
    checkSetupStatus(): ApiSetupStatus {
        const allKeys = userApiKeyService.getAllKeys();

        const configuredKeys: string[] = [];
        const missingKeys: string[] = [];

        REQUIRED_API_KEYS.forEach(({ key, name }) => {
            if (allKeys[key as keyof typeof allKeys] && allKeys[key as keyof typeof allKeys].length > 0) {
                configuredKeys.push(name);
            } else {
                missingKeys.push(name);
            }
        });

        return {
            isConfigured: missingKeys.length === 0,
            missingKeys,
            configuredKeys,
            requiredKeys: REQUIRED_API_KEYS.map(k => k.name)
        };
    },

    /**
     * Check if at least one API is configured
     */
    hasAnyApiConfigured(): boolean {
        const allKeys = userApiKeyService.getAllKeys();
        return Object.values(allKeys).some(key => key && key.length > 0);
    },

    /**
     * Get configuration percentage (for progress bar)
     */
    getConfigurationProgress(): number {
        const status = this.checkSetupStatus();
        return Math.round((status.configuredKeys.length / status.requiredKeys.length) * 100);
    },

    /**
     * Mark setup as completed (for user preferences)
     */
    markSetupComplete(): void {
        localStorage.setItem('API_SETUP_COMPLETED', 'true');
    },

    /**
     * Check if user has seen the setup screen before
     */
    hasSeenSetup(): boolean {
        return localStorage.getItem('API_SETUP_COMPLETED') === 'true';
    }
};

/* updated */
