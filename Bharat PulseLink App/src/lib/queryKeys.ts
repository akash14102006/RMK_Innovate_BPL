/**
 * Centralized, type-safe Query Key Factory for TanStack Query v5.
 *
 * Rule: TanStack Query is the ONLY owner of server state in Bharat PulseLink.
 * All query keys MUST be generated using this factory to guarantee predictable
 * cache invalidation, prefetching, and offline persistence boundaries.
 */

export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    session: () => ['auth', 'session'] as const,
    userProfile: () => ['auth', 'userProfile'] as const,
  },
  patient: {
    all: ['patient'] as const,
    profile: () => ['patient', 'profile'] as const,
    vitals: () => ['patient', 'vitals'] as const,
    emergencyContact: () => ['patient', 'emergencyContact'] as const,
  },
  hospitals: {
    all: ['hospitals'] as const,
    nearby: (params?: { latitude?: number; longitude?: number; radiusKm?: number }) =>
      ['hospitals', 'nearby', params] as const,
    detail: (hospitalId: string) => ['hospitals', 'detail', hospitalId] as const,
    doctors: (hospitalId: string) => ['hospitals', 'doctors', hospitalId] as const,
    services: (hospitalId: string) => ['hospitals', 'services', hospitalId] as const,
  },
  appointments: {
    all: ['appointments'] as const,
    list: (status?: 'UPCOMING' | 'COMPLETED' | 'CANCELLED') => ['appointments', 'list', status] as const,
    detail: (appointmentId: string) => ['appointments', 'detail', appointmentId] as const,
  },
  healthRecords: {
    all: ['healthRecords'] as const,
    summary: () => ['healthRecords', 'summary'] as const,
    visits: () => ['healthRecords', 'visits'] as const,
    visitDetail: (visitId: string) => ['healthRecords', 'visit', visitId] as const,
    reports: (category?: string) => ['healthRecords', 'reports', category] as const,
    prescriptions: () => ['healthRecords', 'prescriptions'] as const,
    medications: () => ['healthRecords', 'medications'] as const,
    documents: () => ['healthRecords', 'documents'] as const,
  },
  checkin: {
    all: ['checkin'] as const,
    active: () => ['checkin', 'active'] as const,
    history: () => ['checkin', 'history'] as const,
  },
  home: {
    all: ['home'] as const,
    dashboard: (userId?: string) => ['home', 'dashboard', userId || 'default'] as const,
  },
  security: {
    all: ['security'] as const,
    consentLogs: () => ['security', 'consentLogs'] as const,
    accessHistory: () => ['security', 'accessHistory'] as const,
  },
};

export default queryKeys;
