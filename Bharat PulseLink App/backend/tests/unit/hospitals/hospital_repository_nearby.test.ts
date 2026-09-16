/**
 * Unit & PostGIS Tests: HospitalRepository.findNearbyHospitals
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Knex } from 'knex';
import { createInMemoryPostgres } from '../../../src/infrastructure/database/memoryDatabase.js';
import { HospitalRepository } from '../../../src/infrastructure/database/repositories/HospitalRepository.js';
import { createLogger } from '../../../src/infrastructure/logger/logger.js';

describe('HospitalRepository.findNearbyHospitals PostGIS Unit Tests', () => {
  let db: Knex;
  let repo: HospitalRepository;

  beforeAll(async () => {
    const logger = createLogger({ level: 'silent', service: 'test' });
    db = await createInMemoryPostgres(logger);
    repo = new HospitalRepository(db);

    // Seed a couple of active facilities with real PostGIS Point locations
    // 1. Chennai General Hospital (13.0818, 80.2785)
    await db('facilities').insert({
      id: '018f0000-0000-7000-8000-000000000101',
      name: 'Rajiv Gandhi Government General Hospital',
      display_name: 'Rajiv Gandhi Government General Hospital',
      facility_type: 'TEACHING_HOSPITAL',
      ownership_type: 'GOVERNMENT',
      status: 'ACTIVE',
      publication_status: 'PUBLISHED',
      verification_status: 'VERIFIED',
      address_line_1: 'EVR Periyar Salai, Park Town',
      locality: 'Park Town',
      pincode: '600003',
      latitude: 13.0818,
      longitude: 80.2785,
      coordinate_source: 'GOVT_REGISTRY',
      emergency_available: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // 2. Chennai Apollo Hospital (13.0583, 80.2505)
    await db('facilities').insert({
      id: '018f0000-0000-7000-8000-000000000102',
      name: 'Apollo Specialty Hospital',
      display_name: 'Apollo Specialty Hospital',
      facility_type: 'SUPER_SPECIALTY',
      ownership_type: 'PRIVATE',
      status: 'ACTIVE',
      publication_status: 'PUBLISHED',
      verification_status: 'VERIFIED',
      address_line_1: 'Greams Lane, Thousand Lights',
      locality: 'Thousand Lights',
      pincode: '600006',
      latitude: 13.0583,
      longitude: 80.2505,
      coordinate_source: 'GOVT_REGISTRY',
      emergency_available: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Update location column with PostGIS POINT text for pg-mem
    await db('facilities')
      .where({ id: '018f0000-0000-7000-8000-000000000101' })
      .update({ location: 'POINT(80.2785 13.0818)' });

    await db('facilities')
      .where({ id: '018f0000-0000-7000-8000-000000000102' })
      .update({ location: 'POINT(80.2505 13.0583)' });
  });

  afterAll(async () => {
    await db.destroy();
  });

  it('should find nearby facilities around Park Town Chennai (13.0827, 80.2707) sorted nearest first', async () => {
    const results = await repo.findNearbyHospitals({
      lat: 13.0827,
      lng: 80.2707,
      radius: 10000,
      limit: 10,
    });

    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].hospital_name).toBe('Rajiv Gandhi Government General Hospital');
    expect(results[0].distance_meters).toBeGreaterThan(0);
    expect(results[0].latitude).toBeCloseTo(13.0818, 2);
    expect(results[0].longitude).toBeCloseTo(80.2785, 2);
  });

  it('should return empty list when searching with a 1 meter radius', async () => {
    const results = await repo.findNearbyHospitals({
      lat: 13.0827,
      lng: 80.2707,
      radius: 1,
      limit: 10,
    });

    expect(results).toEqual([]);
  });

  it('should reject invalid coordinates (out of bounds) gracefully without throwing', async () => {
    const results = await repo.findNearbyHospitals({
      lat: 999,
      lng: 80.2707,
      radius: 10000,
      limit: 10,
    });

    expect(results).toEqual([]);
  });
});
