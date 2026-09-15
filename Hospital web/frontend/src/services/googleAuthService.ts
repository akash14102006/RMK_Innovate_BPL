/**
 * Google Identity Services (GIS) Authentication Service
 * 
 * This service handles direct integration with Google's new Identity Services library.
 * It replaces the Firebase Google Sign-In flow.
 */

const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '16015111956-u63el706kb1h8fjlecf943vdrkdht4vf.apps.googleusercontent.com';

export interface GoogleUser {
    email: string;
    name: string;
    picture: string;
    sub: string; // Google User ID
}

declare global {
    interface Window {
        google: any;
    }
}

/**
 * Initialize Google Identity Services
 */
export const initializeGoogleAuth = (callback: (response: any) => void) => {
    if (!window.google) {
        console.error('Google Identity Services script not loaded');
        return;
    }

    window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: callback,
        auto_select: false,
        cancel_on_tap_outside: true,
    });
};

/**
 * Render the Google Sign-In Button
 */
export const renderGoogleButton = (elementId: string) => {
    if (!window.google) return;

    const element = document.getElementById(elementId);
    if (element) {
        window.google.accounts.id.renderButton(element, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'continue_with',
            shape: 'pill',
        });
    }
};

/**
 * Decode JWT Token (Client-side helper)
 * Note: You should verify the token on the backend for security!
 */
export const decodeJwt = (token: string): GoogleUser | null => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Failed to decode JWT:', error);
        return null;
    }
};

/* updated */
