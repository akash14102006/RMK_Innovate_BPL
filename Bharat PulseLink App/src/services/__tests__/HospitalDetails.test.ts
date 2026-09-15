import { describe, it, expect, vi, beforeEach } from 'vitest';
import HospitalDiscoveryService from '../HospitalDiscoveryService';

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

describe('Prompt 48 — Hospital Details Data & Authoritative Normalization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retrieves full hospital details for valid ID (e.g. hosp_chennai_01)', async () => {
    const hosp = await HospitalDiscoveryService.getHospitalById('hosp_chennai_01');
    expect(hosp).not.toBeNull();
    expect(hosp?.name).toBe('Rajiv Gandhi Government General Hospital');
    expect(hosp?.ownership).toBe('GOVERNMENT');
    expect(hosp?.verified).toBe(true);
    expect(hosp?.totalBeds).toBe(2700);
    expect(hosp?.availableBeds).toBe(145);
    expect(hosp?.is24x7).toBe(true);
  });

  it('returns null cleanly for unknown or nonexistent hospital ID', async () => {
    const hosp = await HospitalDiscoveryService.getHospitalById('non_existent_hospital_999');
    expect(hosp).toBeNull();
  });

  it('provides public contact phone and emergency helpline when available', async () => {
    const hosp = await HospitalDiscoveryService.getHospitalById('hosp_chennai_02'); // Apollo
    expect(hosp).not.toBeNull();
    expect(hosp?.contactPhone).toBe('+91 44 2829 0200');
    expect(hosp?.emergencyPhone).toBe('1066');
    expect(hosp?.ownership).toBe('PRIVATE');
  });
});
