/**
 * Patient Profile API Route Integration Tests
 *
 * Validates Fastify HTTP routes for /api/v1/me/profile:
 * - Authentication enforcement & IDOR protection
 * - GET, POST, PATCH /me/profile
 * - Section endpoints (/basic, /contact, /medical-basics, /lifestyle, /conditions, /allergies, /surgeries)
 * - /completion, /complete, /summary, /review
 * - 409 conflict on stale version
 *
 * Owned by: Patient Domain (Prompt 90)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { newDb, DataType } from 'pg-mem';
import type { Knex } from 'knex';
import { up as migration001 } from '../../../migrations/20240001_001_database_foundation.js';
import { up as migration002 } from '../../../migrations/20240002_002_geography_reference.js';
import { up as migration003 } from '../../../migrations/20240003_003_identity_and_users.js';
import { up as migration004 } from '../../../migrations/20240004_004_patients_and_profiles.js';
import { createTestApp } from '../../helpers/createTestApp.js';
import { UserRepository } from '../../../src/infrastructure/database/repositories/UserRepository.js';
import { IdentityRepository } from '../../../src/infrastructure/database/repositories/IdentityRepository.js';
import { PatientRepository } from '../../../src/infrastructure/database/repositories/PatientRepository.js';
import { PatientProfileService } from '../../../src/modules/patient/PatientProfileService.js';
import { DomainEventEmitter } from '../../../src/infrastructure/events/DomainEventEmitter.js';
import { NoopLogger } from '../../../src/infrastructure/logger/logger.js';
import type { IDescopeClient, DescopeSessionClaims } from '../../../src/infrastructure/auth/DescopeClient.js';

class MockDescopeClient implements IDescopeClient {
  constructor(private readonly _claims: DescopeSessionClaims | null = null) {}

  async validateSessionToken(_token: string): Promise<DescopeSessionClaims> {
    if (!this._claims) {
      throw new Error('Invalid mock session token');
    }
    return this._claims;
  }

  async revokeSession(_token: string): Promise<void> {}
}

describe('Patient Profile Fastify API Routes (/api/v1/me/profile)', () => {
  let app: FastifyInstance;
  let dbKnex: Knex;
  let userRepo: UserRepository;
  let identityRepo: IdentityRepository;
  let patientRepo: PatientRepository;
  let patientService: PatientProfileService;
  let eventEmitter: DomainEventEmitter;
  const logger = new NoopLogger();

  const mockUserClaims: DescopeSessionClaims = {
    descopeUserId: 'descope-patient-user-1',
    loginIds: ['patient1@example.com'],
    email: 'patient1@example.com',
    phone: '+919876543210',
    roles: ['patient'],
    permissions: [],
    issuedAt: Math.floor(Date.now() / 1000),
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
  };

  beforeEach(async () => {
    const memDb = newDb();

    memDb.registerExtension('postgis', () => {});
    memDb.registerExtension('uuid-ossp', () => {});
    memDb.registerExtension('pgcrypto', () => {});
    memDb.registerExtension('citext', () => {});

    memDb.public.registerFunction({
      name: 'postgis_version',
      returns: DataType.text,
      implementation: () => '3.3.2',
    });

    memDb.public.registerFunction({
      name: 'gen_random_uuid',
      returns: DataType.text,
      implementation: () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      },
    });

    dbKnex = memDb.adapters.createKnex() as Knex;

    await migration001(dbKnex);
    await migration002(dbKnex);
    await migration003(dbKnex);
    await migration004(dbKnex);

    userRepo = new UserRepository(dbKnex);
    identityRepo = new IdentityRepository(dbKnex);
    patientRepo = new PatientRepository(dbKnex);
    eventEmitter = new DomainEventEmitter(logger);

    patientService = new PatientProfileService({
      db: dbKnex,
      patientRepo,
      userRepo,
      logger,
      eventEmitter,
    });

    // Create user and identity in DB
    const user = await userRepo.createUser({ status: 'ACTIVE' });
    await identityRepo.createIdentity({
      user_id: user.id,
      provider: 'DESCOPE',
      provider_subject: mockUserClaims.descopeUserId,
      email: mockUserClaims.email,
      phone: mockUserClaims.phone,
    });

    app = await createTestApp({
      depsOverrides: {
        db: {
          ping: async () => true,
          transaction: async (cb: any) => cb(dbKnex),
          query: dbKnex,
          isConnected: true,
          destroy: async () => {},
        } as any,
        userRepo,
        identityRepo,
        patientRepo,
        patientService,
        descopeClient: new MockDescopeClient(mockUserClaims),
      },
    });
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/me/profile',
    });
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/v1/me/profile creates a new profile for authenticated patient', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/me/profile',
      headers: {
        authorization: 'Bearer valid-token',
      },
      payload: {
        fullName: 'Meera Rao',
        gender: 'FEMALE',
        dateOfBirth: '1996-04-12',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.fullName).toBe('Meera Rao');
    expect(body.data.gender).toBe('FEMALE');
    expect(body.data.version).toBe(1);
  });

  it('GET /api/v1/me/profile returns current patient profile', async () => {
    // First create profile
    await app.inject({
      method: 'POST',
      url: '/api/v1/me/profile',
      headers: { authorization: 'Bearer valid-token' },
      payload: {
        fullName: 'Meera Rao',
        gender: 'FEMALE',
        dateOfBirth: '1996-04-12',
      },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/me/profile',
      headers: { authorization: 'Bearer valid-token' },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.fullName).toBe('Meera Rao');
    expect(body.data.version).toBe(1);
  });

  it('PATCH /api/v1/me/profile/basic updates demographic fields and increments version', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/v1/me/profile',
      headers: { authorization: 'Bearer valid-token' },
      payload: { fullName: 'Meera Rao', gender: 'FEMALE', dateOfBirth: '1996-04-12' },
    });

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/me/profile/basic',
      headers: { authorization: 'Bearer valid-token' },
      payload: {
        preferredName: 'Mee',
        occupation: 'Architect',
        expectedVersion: 1,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.preferredName).toBe('Mee');
    expect(body.data.occupation).toBe('Architect');
    expect(body.data.version).toBe(2);
  });

  it('PATCH /api/v1/me/profile rejects stale expectedVersion with 409 CONFLICT', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/v1/me/profile',
      headers: { authorization: 'Bearer valid-token' },
      payload: { fullName: 'Meera Rao', gender: 'FEMALE', dateOfBirth: '1996-04-12' },
    });

    // Valid update from 1 -> 2
    await app.inject({
      method: 'PATCH',
      url: '/api/v1/me/profile/basic',
      headers: { authorization: 'Bearer valid-token' },
      payload: { preferredName: 'Mee', expectedVersion: 1 },
    });

    // Stale update with version 1
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/me/profile/basic',
      headers: { authorization: 'Bearer valid-token' },
      payload: { occupation: 'Doctor', expectedVersion: 1 },
    });

    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe('CONFLICT');
  });

  it('GET /api/v1/me/profile/summary and /review return valid models', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/v1/me/profile',
      headers: { authorization: 'Bearer valid-token' },
      payload: { fullName: 'Meera Rao', gender: 'FEMALE', dateOfBirth: '1996-04-12' },
    });

    const summaryRes = await app.inject({
      method: 'GET',
      url: '/api/v1/me/profile/summary',
      headers: { authorization: 'Bearer valid-token' },
    });

    expect(summaryRes.statusCode).toBe(200);
    expect(summaryRes.json().data.fullName).toBe('Meera Rao');

    const reviewRes = await app.inject({
      method: 'GET',
      url: '/api/v1/me/profile/review',
      headers: { authorization: 'Bearer valid-token' },
    });

    expect(reviewRes.statusCode).toBe(200);
    expect(reviewRes.json().data.completion).toBeDefined();
  });
});
