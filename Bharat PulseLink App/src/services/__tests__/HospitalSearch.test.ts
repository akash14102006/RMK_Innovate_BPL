import { describe, it, expect, vi, beforeEach } from 'vitest';
import HospitalDiscoveryService, { DEFAULT_INDIAN_LOCATIONS } from '../HospitalDiscoveryService';

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

describe('Prompt 47 — Hospital Search (Multi-dimension & Privacy Safe)', () => {
  const chennaiLoc = DEFAULT_INDIAN_LOCATIONS[0];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('searches by partial hospital name (e.g. "Rajiv")', async () => {
    const res = await HospitalDiscoveryService.searchHospitals({
      query: 'Rajiv',
      filter: 'ALL',
      location: chennaiLoc,
    });

    expect(res.hospitals.length).toBeGreaterThan(0);
    expect(res.hospitals[0].name).toContain('Rajiv Gandhi');
  });

  it('searches by medical department & specialty (e.g. "Cardiology")', async () => {
    const res = await HospitalDiscoveryService.searchHospitals({
      query: 'Cardiology',
      filter: 'ALL',
      location: chennaiLoc,
    });

    expect(res.hospitals.length).toBeGreaterThan(0);
    res.hospitals.forEach((h) => {
      expect(h.services.some((s) => s.toLowerCase().includes('cardiology'))).toBe(true);
    });
  });

  it('searches by Indian postal pincode (e.g. "600003")', async () => {
    const res = await HospitalDiscoveryService.searchHospitals({
      query: '600003',
      filter: 'ALL',
      location: chennaiLoc,
    });

    expect(res.hospitals.length).toBeGreaterThan(0);
    expect(res.hospitals[0].pincode).toBe('600003');
  });

  it('searches by locality / area string (e.g. "Park Town")', async () => {
    const res = await HospitalDiscoveryService.searchHospitals({
      query: 'Park Town',
      filter: 'ALL',
      location: chennaiLoc,
    });

    expect(res.hospitals.length).toBeGreaterThan(0);
    expect(res.hospitals[0].address).toContain('Park Town');
  });

  it('handles case-insensitivity and leading/trailing whitespace cleanly', async () => {
    const res1 = await HospitalDiscoveryService.searchHospitals({
      query: '  apollo  ',
      filter: 'ALL',
      location: chennaiLoc,
    });

    const res2 = await HospitalDiscoveryService.searchHospitals({
      query: 'APOLLO',
      filter: 'ALL',
      location: chennaiLoc,
    });

    expect(res1.hospitals.length).toBe(res2.hospitals.length);
    expect(res1.hospitals[0].name).toBe(res2.hospitals[0].name);
  });

  it('returns empty result set with 0 count when term does not exist', async () => {
    const res = await HospitalDiscoveryService.searchHospitals({
      query: 'NonExistentXYZHospital123',
      filter: 'ALL',
      location: chennaiLoc,
    });

    expect(res.hospitals.length).toBe(0);
    expect(res.totalCount).toBe(0);
  });
});
