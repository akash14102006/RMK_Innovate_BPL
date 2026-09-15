/**
 * System Setup Service
 * Handles the "First Login = One Time Fixed APIs" logic.
 */

interface ApiConfiguration {
    baseUrl: string;
    authEndpoints: {
        login: string;
        signup: string;
        logout: string;
        user: string;
    };
    healthEndpoints: {
        pollution: string;
        weather: string;
        patients: string;
    };
    systemId: string;
    generatedAt: string;
    isLocked: boolean;
}

const STORAGE_KEYS = {
    SYSTEM_CONFIG: 'BHARAT_PULSELINK_SYSTEM_CONFIG',
    IS_LOCKED: 'BHARAT_PULSELINK_API_LOCKED',
};

/**
 * Checks if this is the first time the system is being accessed.
 */
export const isSystemInitialized = (): boolean => {
    return localStorage.getItem(STORAGE_KEYS.IS_LOCKED) === 'true';
};

/**
 * Generates and Locks API Configuration (Run ONLY once)
 */
export const initializeSystemAPIs = (): ApiConfiguration => {
    if (isSystemInitialized()) {
        throw new Error('CRITICAL: Attempted to regenerate APIs after system lock.');
    }

    console.log('🔒 Initiating First-Time System Setup...');

    // 1. Generate Unique System ID
    const systemId = 'SYS-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    // 2. Define Immutable API Structure
    const apiConfig: ApiConfiguration = {
        baseUrl: 'https://api.bharatpulselink.in/v1',
        authEndpoints: {
            login: `/auth/${systemId}/login`,
            signup: `/auth/${systemId}/signup`,
            logout: `/auth/${systemId}/logout`,
            user: `/auth/${systemId}/me`,
        },
        healthEndpoints: {
            pollution: `/data/${systemId}/pollution`,
            weather: `/data/${systemId}/weather`,
            patients: `/data/${systemId}/patients`,
        },
        systemId: systemId,
        generatedAt: new Date().toISOString(),
        isLocked: true,
    };

    // 3. Persist and Lock
    localStorage.setItem(STORAGE_KEYS.SYSTEM_CONFIG, JSON.stringify(apiConfig));
    localStorage.setItem(STORAGE_KEYS.IS_LOCKED, 'true');

    console.log('✅ System APIs Generated and PERMANENTLY LOCKED.');
    console.log('🔑 System ID:', systemId);

    return apiConfig;
};

/**
 * Retrieves the locked API configuration.
 */
export const getSystemAPIs = (): ApiConfiguration | null => {
    const data = localStorage.getItem(STORAGE_KEYS.SYSTEM_CONFIG);
    if (!data) return null;
    return JSON.parse(data);
};

/**
 * Middleware-like check to ensure APIs are loaded
 */
export const ensureSystemIntegrity = () => {
    if (!isSystemInitialized()) {
        console.warn('⚠️ System not initialized. Waiting for first login...');
        return false;
    }
    const config = getSystemAPIs();
    if (!config || !config.isLocked) {
        console.error('❌ CRITICAL SECURITY ALERT: System lock bypassed or corrupted.');
        return false;
    }
    return true;
};

/* updated */
