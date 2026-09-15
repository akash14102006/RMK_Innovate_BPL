/**
 * Backend API Service
 * Centralized API client for Bharat PulseLink backend
 * All API keys are managed on the backend - never exposed to frontend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
    return localStorage.getItem('authToken');
};

// Generic API caller with authentication
const callApi = async <T = any>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers,
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || `API request failed with status ${response.status}`);
    }

    return data;
};

export interface User {
    id: string;
    email: string;
    name: string;
    createdAt?: string;
}

export interface AuthResponse {
    success: boolean;
    token: string;
    user: User;
}

export interface PollutionData {
    city: string;
    aqi: number;
    dominantPollutant: string;
    time: string;
    timezone: string;
    pollutants: {
        pm25: number | null;
        pm10: number | null;
        o3: number | null;
        no2: number | null;
        so2: number | null;
        co: number | null;
    };
    location: {
        lat: number;
        lng: number;
    };
}

export interface WeatherData {
    city: string;
    country: string;
    temperature: number;
    feelsLike: number;
    humidity: number;
    pressure: number;
    description: string;
    main: string;
    icon: string;
    windSpeed: number;
    cloudiness: number;
    sunrise: string;
    sunset: string;
    location: {
        lat: number;
        lng: number;
    };
}

export interface NewsArticle {
    title: string;
    description: string;
    source: string;
    url: string;
    publishedAt: string;
    image: string;
    author?: string;
}

export interface Festival {
    name: string;
    date: string;
    day: number;
    month: number;
    year: number;
    description: string;
    type: string[];
    locations?: string;
}

export const backendApi = {
    // ==================
    // Authentication
    // ==================

    async signup(email: string, password: string, name: string): Promise<AuthResponse> {
        return callApi('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ email, password, name }),
        });
    },

    async login(email: string, password: string): Promise<AuthResponse> {
        return callApi('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    },

    async verifyToken(): Promise<{ valid: boolean; user: User }> {
        return callApi('/auth/verify');
    },

    // ==================
    // Pollution API
    // ==================

    async getPollution(city: string): Promise<PollutionData> {
        return callApi(`/pollution/live/${city}`);
    },

    async getCitiesPollution(): Promise<{ cities: PollutionData[]; count: number }> {
        return callApi('/pollution/cities');
    },

    // ==================
    // Weather API
    // ==================

    async getWeather(city: string): Promise<WeatherData> {
        return callApi(`/weather/current/${city}`);
    },

    async getWeatherForecast(city: string): Promise<any> {
        return callApi(`/weather/forecast/${city}`);
    },

    // ==================
    // News API
    // ==================

    async getHealthAlerts(): Promise<{ articles: NewsArticle[]; totalResults: number; count: number }> {
        return callApi('/news/health-alerts');
    },

    async searchNews(query: string, pageSize: number = 10): Promise<{ articles: NewsArticle[]; count: number }> {
        return callApi(`/news/search?q=${encodeURIComponent(query)}&pageSize=${pageSize}`);
    },

    // ==================
    // Festival API
    // ==================

    async getUpcomingFestivals(): Promise<{ festivals: Festival[]; count: number; year: number }> {
        return callApi('/festivals/upcoming');
    },

    async getAllFestivals(year: number): Promise<{ festivals: Festival[]; count: number; year: number }> {
        return callApi(`/festivals/all/${year}`);
    },

    // ==================
    // Bharat PulseLink Interoperability Bridge
    // ==================

    async resolveBPLQR(qrPayload: string): Promise<{
        success: boolean;
        data: {
            exchangeId: string;
            status: string;
            authorizedScopes: string[];
            patient: {
                fullName: string;
                gender: string;
                dateOfBirth?: string | null;
                age?: number;
                bloodGroup?: string | null;
                primaryPhone?: string | null;
                abhaId?: string | null;
                emergencyContact?: {
                    name: string;
                    relationship: string;
                    isPrimary: boolean;
                } | null;
                allergies: string[];
                conditions: string[];
                surgeries: string[];
            };
            hospitalId: string;
            facilityId: string;
            verifiedAt: string;
        };
    }> {
        return callApi('/integration/bpl/resolve-qr', {
            method: 'POST',
            body: JSON.stringify({ qrPayload }),
        });
    },

    // ==================
    // Health Check
    // ==================

    async healthCheck(): Promise<{ status: string; timestamp: string; environment: string }> {
        const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
        return response.json();
    },
};

/* updated */
