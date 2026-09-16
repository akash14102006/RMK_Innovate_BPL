/**
 * Live PostGIS Integration Tests: GET /api/v1/hospitals/nearby
 * Tested directly against local PostgreSQL bharat_pulselink_dev database.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import knex from 'knex';
import { HospitalRepository } from '../../../src/infrastructure/database/repositories/HospitalRepository.js';

describe('HospitalRepository.findNearbyHospitals (Live PostGIS & public.hospitals)', () => {
  let db: import('knex').Knex;
  let repo: HospitalRepository;
  let isDbConnected = false;

  beforeAll(async () => {
    db = knex({
      client: 'pg',
      connection: 'postgresql://bpl_user:bpl_local_dev_only@localhost:5432/bharat_pulselink_dev',
    });
    try {
      await db.raw('SELECT 1');
      isDbConnected = true;
    } catch {
      isDbConnected = false;
    }
    repo = new HospitalRepository(db);
  });

  afterAll(async () => {
    await db.destroy();
  });

  it('should query legitimate nearby hospitals around Mumbai (19.0760, 72.8777) ordered by distance', async (ctx) => {
    if (!isDbConnected) {
      ctx.skip();
      return;
    }
    const results = await repo.findNearbyHospitals({
      lat: 19.076,
      lng: 72.8777,
      radius: 10000,
      limit: 5,
    });

    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(5);

    // Verify ordering
    for (let i = 0; i < results.length - 1; i++) {
      expect(Number(results[i].distance_meters)).toBeLessThanOrEqual(Number(results[i + 1].distance_meters));
    }

    // Verify state alignment
    for (const hosp of results) {
      expect(hosp.state).toBe('Maharashtra');
    }
  });

  it('should exclude LOW_CONFIDENCE / STATE_MISMATCH records from nearby search results', async (ctx) => {
    if (!isDbConnected) {
      ctx.skip();
      return;
    }
    // Chennai test: the raw data had Dr. Maniars (Gujarat) & Saravana Hospital (Kerala) erroneously in Chennai
    const results = await repo.findNearbyHospitals({
      lat: 13.0827,
      lng: 80.2707,
      radius: 10000,
      limit: 20,
    });

    // Verify that none of the known cross-state anomaly hospitals are returned
    const names = results.map((r) => r.hospital_name);
    expect(names).not.toContain('Dr. Maniars Ent Hospital');
    expect(names).not.toContain('Saravana Hospital');
    expect(names).not.toContain('Chitranjan Sevasadan General');
    expect(names).not.toContain('Popular Hospital');
  });

  it('should return empty list when radius is 1 meter', async (ctx) => {
    if (!isDbConnected) {
      ctx.skip();
      return;
    }
    const results = await repo.findNearbyHospitals({
      lat: 13.0827,
      lng: 80.2707,
      radius: 1,
      limit: 5,
    });

    expect(results).toEqual([]);
  });
});
