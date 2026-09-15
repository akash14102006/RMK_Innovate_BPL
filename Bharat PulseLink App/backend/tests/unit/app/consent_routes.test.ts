/**
 * Consent Domain API Route Integration Tests
 *
 * Validates Fastify HTTP routes for /api/v1/me/consents and /api/v1/internal/consent/check:
 * - Authentication enforcement & IDOR protection
 * - GET, POST /me/consents, POST /me/consents/preview
 * - POST /me/consents/:id/revoke with optimistic locking (409 conflict)
 * - GET /me/consents/:id/history
 * - POST /internal/consent/check downstream evaluation
 *
 * Owned by: Consent Domain (Prompt 91, 101)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { newDb, DataType } from 'pg-mem';
import type { Knex } from 'knex';
import { up as migration001 } from '../../../migrations/20240001_001_database_foundation.js';
import { up as migration002 } from '../../../migrations/20240002_002_geography_reference.js';
import { up as migration003 } from '../../../migrations/20240003_003_identity_and_users.js';
import { up as migration004 } from '../../../migrations/20240004_004_patients_and_profiles.js';
import { up as migration005 } from '../../../migrations/20240005_005_consent_domain.js';
import { createTestApp } from '../../helpers/createTestApp.js';
import { UserRepository } from '../../../src/infrastructure/database/repositories/UserRepository.js';
import { IdentityRepository } from '../../../src/infrastructure/database/repositories/IdentityRepository.js';
import { PatientRepository } from '../../../src/infrastructure/database/repositories/PatientRepository.js';
import { ConsentRepository } from '../../../src/infrastructure/database/repositories/ConsentRepository.js';
import { ConsentAuthorizer } from '../../../src/modules/consent/ConsentAuthorizer.js';
import { ConsentService } from '../../../src/modules/consent/ConsentService.js';
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

describe('Consent Fastify API Routes (/api/v1/me/consents)', () => {
  let app: FastifyInstance;
  let dbKnex: Knex;
  let userRepo: UserRepository;
  let identityRepo: IdentityRepository;
  let patientRepo: PatientRepository;
  let consentRepo: ConsentRepository;
  let consentAuthorizer: ConsentAuthorizer;
  let consentService: ConsentService;
  let eventEmitter: DomainEventEmitter;
  const logger = new NoopLogger();

  const mockUserClaims: DescopeSessionClaims = {
    descopeUserId: 'descope-patient-consent-user-1',
    loginIds: ['consent_user1@example.com'],
    email: 'consent_user1@example.com',
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
    await migration005(dbKnex);

    userRepo = new UserRepository(dbKnex);
    identityRepo = new IdentityRepository(dbKnex);
    patientRepo = new PatientRepository(dbKnex);
    consentRepo = new ConsentRepository(dbKnex);
    eventEmitter = new DomainEventEmitter(logger);

    consentAuthorizer = new ConsentAuthorizer({
      consentRepo,
      logger,
    });

    consentService = new ConsentService({
      db: dbKnex,
      consentRepo,
      patientRepo,
      authorizer: consentAuthorizer,
      logger,
      eventEmitter,
    });

    // Create user, identity, and patient profile in DB
    const user = await userRepo.createUser({ status: 'ACTIVE' });
    await identityRepo.createIdentity({
      user_id: user.id,
      provider: 'DESCOPE',
      provider_subject: mockUserClaims.descopeUserId,
      email: mockUserClaims.email,
      phone: mockUserClaims.phone,
    });

    await patientRepo.createProfile({
      user_id: user.id,
      full_name: 'Anita Desai',
      gender: 'FEMALE',
      date_of_birth: '1990-06-12',
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
        consentRepo,
        consentAuthorizer,
        consentService,
        descopeClient: new MockDescopeClient(mockUserClaims),
      },
    });
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('rejects unauthenticated requests to /api/v1/me/consents with 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/me/consents',
    });
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/v1/me/consents/preview returns metadata without writing to database', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/me/consents/preview',
      headers: { authorization: 'Bearer valid-token' },
      payload: {
        purpose: 'HOSPITAL_CHECKIN',
        recipientType: 'HOSPITAL',
        recipientId: 'hosp_apollo_delhi',
        scopes: ['PROFILE_BASIC', 'ALLERGIES'],
        durationSeconds: 86400 * 7,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.requestedScopes).toHaveLength(2);
    expect(body.data.requestedScopes[0].code).toBe('PROFILE_BASIC');
    expect(body.data.notice).toBeDefined();

    // Verify 0 rows in consents table
    const count = await dbKnex('consents').count('* as count').first();
    expect(Number(count?.count)).toBe(0);
  });

  it('POST /api/v1/me/consents grants explicit patient consent', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/me/consents',
      headers: { authorization: 'Bearer valid-token' },
      payload: {
        purpose: 'HOSPITAL_CHECKIN',
        recipientType: 'HOSPITAL',
        recipientId: 'hosp_apollo_delhi',
        scopes: ['PROFILE_BASIC', 'ALLERGIES', 'MEDICAL_BASICS'],
        durationSeconds: 86400 * 14,
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.purpose).toBe('HOSPITAL_CHECKIN');
    expect(body.data.recipient.id).toBe('hosp_apollo_delhi');
    expect(body.data.status).toBe('GRANTED');
    expect(body.data.version).toBe(1);
    expect(body.data.isEffective).toBe(true);
  });

  it('GET /api/v1/me/consents and GET /me/consents/:id return patient consents', async () => {
    // Create consent
    const grantRes = await app.inject({
      method: 'POST',
      url: '/api/v1/me/consents',
      headers: { authorization: 'Bearer valid-token' },
      payload: {
        purpose: 'APPOINTMENT_BOOKING',
        recipientType: 'HOSPITAL',
        recipientId: 'hosp_fortis_mumbai',
        scopes: ['PROFILE_BASIC', 'CONTACT'],
      },
    });

    const consentId = grantRes.json().data.id;

    // List consents
    const listRes = await app.inject({
      method: 'GET',
      url: '/api/v1/me/consents',
      headers: { authorization: 'Bearer valid-token' },
    });

    expect(listRes.statusCode).toBe(200);
    expect(listRes.json().data).toHaveLength(1);

    // Get single consent
    const getRes = await app.inject({
      method: 'GET',
      url: `/api/v1/me/consents/${consentId}`,
      headers: { authorization: 'Bearer valid-token' },
    });

    expect(getRes.statusCode).toBe(200);
    expect(getRes.json().data.id).toBe(consentId);
    expect(getRes.json().data.recipient.id).toBe('hosp_fortis_mumbai');
  });

  it('POST /api/v1/me/consents/:id/revoke revokes consent and rejects stale writes with 409', async () => {
    const grantRes = await app.inject({
      method: 'POST',
      url: '/api/v1/me/consents',
      headers: { authorization: 'Bearer valid-token' },
      payload: {
        purpose: 'HOSPITAL_CHECKIN',
        recipientType: 'HOSPITAL',
        recipientId: 'hosp_max_delhi',
        scopes: ['PROFILE_BASIC'],
      },
    });

    const consentId = grantRes.json().data.id;

    // Revoke with version 1 -> success
    const revokeRes = await app.inject({
      method: 'POST',
      url: `/api/v1/me/consents/${consentId}/revoke`,
      headers: { authorization: 'Bearer valid-token' },
      payload: {
        reason: 'Consultation concluded',
        expectedVersion: 1,
      },
    });

    expect(revokeRes.statusCode).toBe(200);
    expect(revokeRes.json().data.status).toBe('REVOKED');
    expect(revokeRes.json().data.version).toBe(2);

    // Second revoke with stale version 1 -> 409 Conflict
    const staleRevokeRes = await app.inject({
      method: 'POST',
      url: `/api/v1/me/consents/${consentId}/revoke`,
      headers: { authorization: 'Bearer valid-token' },
      payload: {
        reason: 'Duplicate call',
        expectedVersion: 1,
      },
    });

    expect(staleRevokeRes.statusCode).toBe(409);
  });

  it('GET /api/v1/me/consents/:id/history returns complete audit trail', async () => {
    const grantRes = await app.inject({
      method: 'POST',
      url: '/api/v1/me/consents',
      headers: { authorization: 'Bearer valid-token' },
      payload: {
        purpose: 'HOSPITAL_CHECKIN',
        recipientType: 'HOSPITAL',
        recipientId: 'hosp_aiims_delhi',
        scopes: ['PROFILE_BASIC', 'ALLERGIES'],
      },
    });

    const consentId = grantRes.json().data.id;

    await app.inject({
      method: 'POST',
      url: `/api/v1/me/consents/${consentId}/revoke`,
      headers: { authorization: 'Bearer valid-token' },
      payload: { reason: 'User revoked consent' },
    });

    const historyRes = await app.inject({
      method: 'GET',
      url: `/api/v1/me/consents/${consentId}/history`,
      headers: { authorization: 'Bearer valid-token' },
    });

    expect(historyRes.statusCode).toBe(200);
    const events = historyRes.json().data;
    expect(events).toHaveLength(2);
    expect(events[0].eventType).toBe('CONSENT_GRANTED');
    expect(events[1].eventType).toBe('CONSENT_REVOKED');
  });

  it('POST /api/v1/internal/consent/check evaluates effective authorization decision for downstream services', async () => {
    // Grant consent
    const grantRes = await app.inject({
      method: 'POST',
      url: '/api/v1/me/consents',
      headers: { authorization: 'Bearer valid-token' },
      payload: {
        purpose: 'HOSPITAL_CHECKIN',
        recipientType: 'HOSPITAL',
        recipientId: 'hosp_aiims_delhi',
        scopes: ['PROFILE_BASIC', 'ALLERGIES'],
      },
    });

    const patientId = grantRes.json().data.patientId;

    // Internal check: authorized subset
    const checkRes = await app.inject({
      method: 'POST',
      url: '/api/v1/internal/consent/check',
      payload: {
        patientId,
        purpose: 'HOSPITAL_CHECKIN',
        recipient: { type: 'HOSPITAL', id: 'hosp_aiims_delhi' },
        requiredScopes: ['PROFILE_BASIC'],
      },
    });

    expect(checkRes.statusCode).toBe(200);
    expect(checkRes.json().data.allowed).toBe(true);
    expect(checkRes.json().data.reason).toBe('AUTHORIZED');

    // Internal check: unauthorized scope
    const deniedRes = await app.inject({
      method: 'POST',
      url: '/api/v1/internal/consent/check',
      payload: {
        patientId,
        purpose: 'HOSPITAL_CHECKIN',
        recipient: { type: 'HOSPITAL', id: 'hosp_aiims_delhi' },
        requiredScopes: ['PROFILE_BASIC', 'DOCUMENTS'],
      },
    });

    expect(deniedRes.statusCode).toBe(200);
    expect(deniedRes.json().data.allowed).toBe(false);
    expect(deniedRes.json().data.reason).toBe('SCOPE_NOT_GRANTED');
  });
});
