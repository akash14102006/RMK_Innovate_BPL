import { describe, it, expect, vi, beforeEach } from 'vitest';
import HospitalDiscoveryService, { DEFAULT_INDIAN_LOCATIONS } from '../HospitalDiscoveryService';

vi.mock('../secureStore', () => {
  const store = new Map<string, string>();
  return {
    set: vi.fn(async (k: string, v: string) => { store.set(k, v); }),
    get: vi.fn(async (k: string) => store.get(k) || null),
    remove: vi.fn(async (k: string) => { store.delete(k); }),
    default: {
      set: vi.fn(async (k: string, v: string) => { store.set(k, v); }),
      get: vi.fn(async (k: string) => store.get(k) || null),
      remove: vi.fn(async (k: string) => { store.delete(k); }),
    },
  };
});

describe('Prompt 42 — HospitalDiscoveryService & Geospatial Search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides default Indian location when none is persisted', async () => {
    const loc = await HospitalDiscoveryService.getDefaultLocation();
    expect(loc.city).toBe('Chennai');
    expect(loc.state).toBe('Tamil Nadu');
  });

  it('persists and restores custom selected location', async () => {
    const customLoc = DEFAULT_INDIAN_LOCATIONS[1]; // Bengaluru
    await HospitalDiscoveryService.saveSelectedLocation(customLoc);

    const retrieved = await HospitalDiscoveryService.getDefaultLocation();
    expect(retrieved.city).toBe('Bengaluru');
    expect(retrieved.state).toBe('Karnataka');
  });

  it('searches hospitals by query string across name and services', async () => {
    const result = await HospitalDiscoveryService.searchHospitals({
      query: 'Rajiv Gandhi',
      filter: 'ALL',
      location: DEFAULT_INDIAN_LOCATIONS[0],
    });

    expect(result.hospitals.length).toBeGreaterThan(0);
    expect(result.hospitals[0].name).toContain('Rajiv Gandhi');
    expect(result.hospitals[0].ownership).toBe('GOVERNMENT');
  });

  it('filters hospitals strictly by GOVERNMENT ownership', async () => {
    const result = await HospitalDiscoveryService.searchHospitals({
      query: '',
      filter: 'GOVERNMENT',
      location: DEFAULT_INDIAN_LOCATIONS[0],
    });

    expect(result.hospitals.length).toBeGreaterThan(0);
    result.hospitals.forEach((hosp) => {
      expect(hosp.ownership === 'GOVERNMENT' || hosp.ownership === 'PUBLIC_SECTOR').toBe(true);
    });
  });

  it('filters hospitals strictly by PRIVATE ownership', async () => {
    const result = await HospitalDiscoveryService.searchHospitals({
      query: '',
      filter: 'PRIVATE',
      location: DEFAULT_INDIAN_LOCATIONS[0],
    });

    expect(result.hospitals.length).toBeGreaterThan(0);
    result.hospitals.forEach((hosp) => {
      expect(hosp.ownership === 'PRIVATE' || hosp.ownership === 'TRUST').toBe(true);
    });
  });

  it('filters hospitals strictly by 24x7 operational readiness', async () => {
    const result = await HospitalDiscoveryService.searchHospitals({
      query: '',
      filter: '24X7',
      location: DEFAULT_INDIAN_LOCATIONS[0],
    });

    expect(result.hospitals.length).toBeGreaterThan(0);
    result.hospitals.forEach((hosp) => {
      expect(hosp.is24x7).toBe(true);
    });
  });

  it('retrieves individual hospital by ID with complete metadata', async () => {
    const hosp = await HospitalDiscoveryService.getHospitalById('hosp_chennai_02');
    expect(hosp).toBeDefined();
    expect(hosp?.name).toBe('Apollo Specialty Hospital');
    expect(hosp?.services).toContain('Cardiology');
    expect(hosp?.totalBeds).toBe(600);
  });
});
