import { describe, it, expect, vi } from 'vitest';
import { HospitalDiscoveryService } from '../../../src/modules/hospitals/HospitalDiscoveryService.js';
import { HospitalRepository } from '../../../src/infrastructure/database/repositories/HospitalRepository.js';

describe('HospitalDiscoveryService — PostGIS Geospatial Discovery Engine', () => {
  it('validates coordinate boundaries and rejects invalid values', async () => {
    const mockRepo = {} as HospitalRepository;
    const service = new HospitalDiscoveryService(mockRepo);

    await expect(service.findNearby({ latitude: 100, longitude: 80 })).rejects.toThrow('Invalid latitude value');
    await expect(service.findNearby({ latitude: 13, longitude: 200 })).rejects.toThrow('Invalid longitude value');
    await expect(service.findNearby({ latitude: 0, longitude: 0 })).rejects.toThrow('Null island coordinates');
  });

  it('performs nearby hospital search with deterministic distance ordering', async () => {
    const mockRepo = {
      findNearby: vi.fn().mockResolvedValue([
        {
          id: 'fac-001',
          name: 'Chennai General Hospital',
          display_name: 'Chennai General Hospital, George Town',
          facility_type: 'GOVERNMENT',
          ownership_type: 'STATE_GOVT',
          address_line_1: 'EVR Periyar Salai',
          locality: 'George Town',
          city_name: 'Chennai',
          district_name: 'Chennai',
          state_name: 'Tamil Nadu',
          pincode: '600001',
          latitude: 13.0827,
          longitude: 80.2707,
          emergency_available: true,
          distance_meters: 450,
        },
        {
          id: 'fac-002',
          name: 'Apollo Hospital Greams Road',
          display_name: 'Apollo Hospital, Greams Road',
          facility_type: 'PRIVATE',
          ownership_type: 'CORPORATE',
          address_line_1: '21 Greams Lane',
          locality: 'Thousand Lights',
          city_name: 'Chennai',
          district_name: 'Chennai',
          state_name: 'Tamil Nadu',
          pincode: '600006',
          latitude: 13.0604,
          longitude: 80.2496,
          emergency_available: true,
          distance_meters: 3200,
        },
      ]),
    } as unknown as HospitalRepository;

    const service = new HospitalDiscoveryService(mockRepo);
    const res = await service.findNearby({
      latitude: 13.0827,
      longitude: 80.2707,
      radiusMeters: 10000,
      limit: 5,
    });

    expect(res.status).toBe('SUCCESS');
    expect(res.totalFound).toBe(2);
    expect(res.hospitals[0].id).toBe('fac-001');
    expect(res.hospitals[0].distanceMeters).toBe(450);
    expect(res.hospitals[0].distanceKm).toBe(0.45);
    expect(res.hospitals[1].id).toBe('fac-002');
    expect(res.hospitals[1].distanceMeters).toBe(3200);

    expect(mockRepo.findNearby).toHaveBeenCalledWith({
      latitude: 13.0827,
      longitude: 80.2707,
      radiusMeters: 10000,
      emergencyOnly: undefined,
      serviceCode: undefined,
      limit: 5,
    });
  });

  it('handles zero nearby hospitals gracefully without throwing', async () => {
    const mockRepo = {
      findNearby: vi.fn().mockResolvedValue([]),
    } as unknown as HospitalRepository;

    const service = new HospitalDiscoveryService(mockRepo);
    const res = await service.findNearby({
      latitude: 13.0827,
      longitude: 80.2707,
      radiusMeters: 5000,
    });

    expect(res.status).toBe('NO_HOSPITALS_FOUND');
    expect(res.totalFound).toBe(0);
    expect(res.hospitals).toEqual([]);
  });
});
