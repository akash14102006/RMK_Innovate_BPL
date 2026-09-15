/**
 * Unit & Contract Tests: GET /api/v1/hospitals/nearby
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from '../../helpers/createTestApp.js';

describe('GET /api/v1/hospitals/nearby', () => {
  let app: FastifyInstance;
  let mockFindNearbyHospitals: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    mockFindNearbyHospitals = vi.fn().mockResolvedValue([
      {
        id: 'hosp-1234-uuid',
        hospital_name: 'Dr. Maniars Ent Hospital',
        state: 'Gujarat',
        district: 'Junagadh',
        pincode: '362001',
        hospital_category: 'Private',
        hospital_care_type: 'Hospital',
        specialties: 'ENT',
        facilities: 'Ambulance',
        emergency_services: 'Yes',
        website: 'https://example.com',
        latitude: 13.0919443,
        longitude: 80.2906867,
        distance_meters: 2397,
      },
    ]);

    app = await createTestApp({
      depsOverrides: {
        hospitalRepo: {
          findNearbyHospitals: mockFindNearbyHospitals,
        } as any,
      },
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it('should return 200 with formatted nearby hospital records for valid lat/lng', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/hospitals/nearby?lat=13.0827&lng=80.2707&radius=10000&limit=5',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data).toBeInstanceOf(Array);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      id: 'hosp-1234-uuid',
      hospitalName: 'Dr. Maniars Ent Hospital',
      state: 'Gujarat',
      district: 'Junagadh',
      pincode: '362001',
      hospitalCategory: 'Private',
      hospitalCareType: 'Hospital',
      specialties: 'ENT',
      facilities: 'Ambulance',
      emergencyServices: 'Yes',
      website: 'https://example.com',
      latitude: 13.0919443,
      longitude: 80.2906867,
      distanceMeters: 2397,
    });
    expect(body.meta).toEqual({
      latitude: 13.0827,
      longitude: 80.2707,
      radiusMeters: 10000,
      limit: 5,
      count: 1,
    });
    expect(mockFindNearbyHospitals).toHaveBeenCalledWith({
      lat: 13.0827,
      lng: 80.2707,
      radius: 10000,
      limit: 5,
    });
  });

  it('should support alternative latitude/longitude query params', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/hospitals/nearby?latitude=13.0827&longitude=80.2707',
    });

    expect(res.statusCode).toBe(200);
    expect(mockFindNearbyHospitals).toHaveBeenCalledWith({
      lat: 13.0827,
      lng: 80.2707,
      radius: 10000,
      limit: 20,
    });
  });

  it('should return 400 when latitude is missing', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/hospitals/nearby?lng=80.2707',
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error).toBe('BAD_REQUEST');
  });

  it('should return 400 when longitude is missing', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/hospitals/nearby?lat=13.0827',
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error).toBe('BAD_REQUEST');
  });

  it('should return 400 when latitude is out of bounds (> 90)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/hospitals/nearby?lat=95.5&lng=80.2707',
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return 400 when longitude is out of bounds (> 180)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/hospitals/nearby?lat=13.0827&lng=185.0',
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return 400 for non-numeric latitude (NaN)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/hospitals/nearby?lat=invalid&lng=80.2707',
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return 400 for negative or zero radius', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/hospitals/nearby?lat=13.0827&lng=80.2707&radius=-500',
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return 400 for radius exceeding safe maximum (> 100,000m)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/hospitals/nearby?lat=13.0827&lng=80.2707&radius=500000',
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return 400 for limit exceeding safe maximum (> 100)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/hospitals/nearby?lat=13.0827&lng=80.2707&limit=250',
    });

    expect(res.statusCode).toBe(400);
  });

  it('should normalize placeholder values ("0", "", "N/A", null) to null in response DTO', async () => {
    mockFindNearbyHospitals.mockResolvedValueOnce([
      {
        id: 'hosp-placeholder-test',
        hospital_name: 'City Clinic',
        state: 'Maharashtra',
        district: 'Mumbai',
        pincode: '400001',
        hospital_category: '0',
        hospital_care_type: '0',
        specialties: '0',
        facilities: 'NA',
        emergency_services: '-',
        website: '0',
        latitude: 19.076,
        longitude: 72.8777,
        distance_meters: 50,
      },
    ]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/hospitals/nearby?lat=19.076&lng=72.8777',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data[0]).toMatchObject({
      id: 'hosp-placeholder-test',
      hospitalName: 'City Clinic',
      state: 'Maharashtra',
      district: 'Mumbai',
      pincode: '400001',
      hospitalCategory: null,
      hospitalCareType: null,
      specialties: null,
      facilities: null,
      emergencyServices: null,
      website: null,
      latitude: 19.076,
      longitude: 72.8777,
      distanceMeters: 50,
    });
  });

  it('should return empty data array when no hospitals within radius', async () => {
    mockFindNearbyHospitals.mockResolvedValueOnce([]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/hospitals/nearby?lat=13.0827&lng=80.2707&radius=50',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data).toEqual([]);
    expect(body.meta.count).toBe(0);
  });
});
