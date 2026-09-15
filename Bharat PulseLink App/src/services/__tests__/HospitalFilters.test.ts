import { describe, it, expect, vi, beforeEach } from 'vitest';
import HospitalDiscoveryService, { DEFAULT_INDIAN_LOCATIONS } from '../HospitalDiscoveryService';
import type { HospitalFilterState } from '../../types/hospitals';

vi.mock('../secureStore', () => ({
  default: {
    set: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    remove: vi.fn().mockResolvedValue(undefined),
  },
  set: vi.fn().mockResolvedValue(undefined),
  get: vi.fn().mockResolvedValue(null),
  remove: vi.fn().mockResolvedValue(undefined),
}));

describe('Prompt 46 — Hospital Filters (Multi-dimensional & AND-semantics)', () => {
  const chennaiLoc = DEFAULT_INDIAN_LOCATIONS[0];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('filters hospitals strictly by Government ownership', async () => {
    const res = await HospitalDiscoveryService.searchHospitals({
      query: '',
      filter: 'GOVERNMENT',
      location: chennaiLoc,
    });

    expect(res.hospitals.length).toBeGreaterThan(0);
    res.hospitals.forEach((h) => {
      expect(['GOVERNMENT', 'PUBLIC_SECTOR']).toContain(h.ownership);
    });
  });

  it('filters hospitals strictly by Private ownership', async () => {
    const res = await HospitalDiscoveryService.searchHospitals({
      query: '',
      filter: 'PRIVATE',
      location: chennaiLoc,
    });

    expect(res.hospitals.length).toBeGreaterThan(0);
    res.hospitals.forEach((h) => {
      expect(['PRIVATE', 'TRUST']).toContain(h.ownership);
    });
  });

  it('applies multi-dimensional AND filter combining Private + 24x7 + Emergency', async () => {
    const advancedFilters: HospitalFilterState = {
      ownership: 'PRIVATE',
      facilities: {
        twentyFourSeven: true,
        emergency: true,
      },
    };

    const res = await HospitalDiscoveryService.searchHospitals({
      query: '',
      filter: 'ALL',
      advancedFilters,
      location: chennaiLoc,
    });

    expect(res.hospitals.length).toBeGreaterThan(0);
    res.hospitals.forEach((h) => {
      expect(['PRIVATE', 'TRUST']).toContain(h.ownership);
      expect(h.is24x7).toBe(true);
      expect(h.services.some((s) => /emergency|trauma/i.test(s))).toBe(true);
    });
  });

  it('applies maximum distance boundary filter (e.g. within 3 km)', async () => {
    const advancedFilters: HospitalFilterState = {
      maxDistanceKm: 3.0,
    };

    const res = await HospitalDiscoveryService.searchHospitals({
      query: '',
      filter: 'ALL',
      advancedFilters,
      location: chennaiLoc,
    });

    res.hospitals.forEach((h) => {
      expect(h.distanceKm).toBeLessThanOrEqual(3.0);
    });
  });

  it('filters by hospital specialty taxonomy (e.g. Cardiology)', async () => {
    const advancedFilters: HospitalFilterState = {
      specialties: ['Cardiology'],
    };

    const res = await HospitalDiscoveryService.searchHospitals({
      query: '',
      filter: 'ALL',
      advancedFilters,
      location: chennaiLoc,
    });

    res.hospitals.forEach((h) => {
      expect(h.services.some((s) => s.toLowerCase().includes('cardiology'))).toBe(true);
    });
  });

  it('returns empty result when impossible combined filter is requested', async () => {
    const advancedFilters: HospitalFilterState = {
      ownership: 'GOVERNMENT',
      maxDistanceKm: 0.1, // No hospital within 100 meters
    };

    const res = await HospitalDiscoveryService.searchHospitals({
      query: '',
      filter: 'ALL',
      advancedFilters,
      location: chennaiLoc,
    });

    expect(res.hospitals.length).toBe(0);
  });
});
