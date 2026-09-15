/**
 * Disease Alert Service (Frontend)
 * Fetches and manages disease outbreak alerts for the logged-in user
 */

export interface DiseaseAlert {
    title: string;
    disease: string;
    cases: number;
    source: string;
    location: string;
    lat: number;
    lng: number;
    daysAgo: number;
    link?: string;
    severity?: 'low' | 'medium' | 'high';
}

/**
 * Mock disease alerts for demonstration
 * In production, this would fetch from /api/disease-alerts
 */
const MOCK_ALERTS: DiseaseAlert[] = [
    {
        title: "Dengue vaccine DengiAll enters final stage human trials",
        disease: "Dengue",
        cases: 10000,
        source: "Google News",
        location: "India",
        lat: 20.5937,
        lng: 78.9629,
        daysAgo: 1,
        severity: 'high'
    },
    {
        title: "Nipah outbreak in West Bengal declared contained",
        disease: "Nipah",
        cases: 0,
        source: "WHO",
        location: "West Bengal",
        lat: 22.9868,
        lng: 87.8550,
        daysAgo: 2,
        severity: 'low'
    },
    {
        title: "Seasonal flu cases surge in Mumbai hospitals",
        disease: "Influenza",
        cases: 142,
        source: "Times of India",
        location: "Mumbai",
        lat: 19.0760,
        lng: 72.8777,
        daysAgo: 3,
        severity: 'medium'
    },
    {
        title: "Malaria surveillance increased in Odisha districts",
        disease: "Malaria",
        cases: 34,
        source: "CDC",
        location: "Odisha",
        lat: 20.9517,
        lng: 85.0985,
        daysAgo: 4,
        severity: 'medium'
    },
    {
        title: "Water-borne illness cases reported in Delhi NCR",
        disease: "Typhoid",
        cases: 56,
        source: "Google News",
        location: "Delhi",
        lat: 28.7041,
        lng: 77.1025,
        daysAgo: 5,
        severity: 'medium'
    }
];

/**
 * Classify severity based on case count
 */
function classifySeverity(cases: number): 'low' | 'medium' | 'high' {
    if (cases >= 150) return 'high';
    if (cases >= 50) return 'medium';
    return 'low';
}

export const diseaseAlertService = {
    /**
     * Fetch disease alerts from backend
     * In production: GET /api/disease-alerts
     */
    async fetchAlerts(): Promise<DiseaseAlert[]> {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            // TODO: Replace with real API call when backend is deployed
            // const response = await fetch('/api/disease-alerts');
            // const data = await response.json();
            // return data.alerts;

            // For now, return mock data
            return MOCK_ALERTS.map(alert => ({
                ...alert,
                severity: alert.severity || classifySeverity(alert.cases)
            }));
        } catch (error) {
            console.error('Failed to fetch disease alerts:', error);
            return MOCK_ALERTS;
        }
    },

    /**
     * Filter alerts by disease type
     */
    filterByDisease(alerts: DiseaseAlert[], disease: string): DiseaseAlert[] {
        if (!disease) return alerts;
        return alerts.filter(alert =>
            alert.disease.toLowerCase() === disease.toLowerCase()
        );
    },

    /**
     * Filter alerts by location
     */
    filterByLocation(alerts: DiseaseAlert[], location: string): DiseaseAlert[] {
        if (!location) return alerts;
        return alerts.filter(alert =>
            alert.location.toLowerCase().includes(location.toLowerCase())
        );
    },

    /**
     * Get recent alerts (last N days)
     */
    getRecentAlerts(alerts: DiseaseAlert[], days: number): DiseaseAlert[] {
        return alerts.filter(alert => alert.daysAgo <= days);
    },

    /**
     * Sort alerts by severity
     */
    sortBySeverity(alerts: DiseaseAlert[]): DiseaseAlert[] {
        const severityOrder = { high: 0, medium: 1, low: 2 };
        return [...alerts].sort((a, b) => {
            const aOrder = severityOrder[a.severity || 'low'];
            const bOrder = severityOrder[b.severity || 'low'];
            return aOrder - bOrder;
        });
    },

    /**
     * Get total case count
     */
    getTotalCases(alerts: DiseaseAlert[]): number {
        return alerts.reduce((sum, alert) => sum + alert.cases, 0);
    },

    /**
     * Get unique diseases
     */
    getUniqueDiseases(alerts: DiseaseAlert[]): string[] {
        return [...new Set(alerts.map(alert => alert.disease))];
    }
};

/* updated */
