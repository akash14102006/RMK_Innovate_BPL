/**
 * Session Domain & Security Center API Route Integration Tests
 *
 * Validates Fastify HTTP routes for /api/v1/me/sessions and /api/v1/me/security:
 * - Authentication enforcement & IDOR protection
 * - GET /me/sessions, GET /me/sessions/:id
 * - POST /me/sessions/:id/revoke
 * - POST /me/sessions/revoke-others
 * - POST /me/sessions/revoke-all
 * - GET /me/security/status, GET /me/security/events
 *
 * Owned by: Security & Session Domain (Prompt 92, 101)
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
import { SessionRepository } from '../../../src/infrastructure/database/repositories/SessionRepository.js';
import { AuditRepository } from '../../../src/infrastructure/database/repositories/AuditRepository.js';
import { SessionService } from '../../../src/modules/session/SessionService.js';
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

describe('Session & Security Fastify API Routes (/api/v1/me/sessions)', () => {
  let app: FastifyInstance;
  let dbKnex: Knex;
  let userRepo: UserRepository;
  let identityRepo: IdentityRepository;
  let patientRepo: PatientRepository;
  let sessionRepo: SessionRepository;
  let auditRepo: AuditRepository;
  let sessionService: SessionService;
  let eventEmitter: DomainEventEmitter;
  let currentUserId: string;
  const logger = new NoopLogger();

  const mockUserClaims: DescopeSessionClaims = {
    descopeUserId: 'descope-security-user-1',
    loginIds: ['security_user1@example.com'],
    email: 'security_user1@example.com',
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
    sessionRepo = new SessionRepository(dbKnex);
    auditRepo = new AuditRepository(dbKnex);
    eventEmitter = new DomainEventEmitter(logger);

    sessionService = new SessionService({
      db: dbKnex,
      sessionRepo,
      userRepo,
      auditRepo,
      logger,
      eventEmitter,
    });

    // Create user & identity
    const user = await userRepo.createUser({ status: 'ACTIVE' });
    currentUserId = user.id;

    await identityRepo.createIdentity({
      user_id: user.id,
      provider: 'DESCOPE',
      provider_subject: mockUserClaims.descopeUserId,
      email: mockUserClaims.email,
      phone: mockUserClaims.phone,
    });

    await patientRepo.createProfile({
      user_id: user.id,
      full_name: 'Priyanka Sharma',
      gender: 'FEMALE',
      date_of_birth: '1992-08-14',
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
        sessionRepo,
        auditRepo,
        sessionService,
        descopeClient: new MockDescopeClient(mockUserClaims),
      },
    });
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('rejects unauthenticated requests to /api/v1/me/sessions with 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/me/sessions',
    });
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/v1/me/sessions returns list of user sessions', async () => {
    // Provision 2 sessions
    const s1 = await sessionService.createSession({ userId: currentUserId, platform: 'android' });
    expect(s1.session.sessionId).toBeDefined();
    await sessionService.createSession({ userId: currentUserId, platform: 'ios' });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/me/sessions',
      headers: { authorization: 'Bearer valid-token' },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.data[0].sessionId).toBeDefined();
    expect(body.data[0].token).toBeUndefined(); // Zero token leakage
  });

  it('GET /api/v1/me/sessions/:id returns session details and protects against IDOR', async () => {
    const session = await sessionService.createSession({ userId: currentUserId, platform: 'android' });

    // User A accessing own session -> 200
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/me/sessions/${session.session.sessionId}`,
      headers: { authorization: 'Bearer valid-token' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.sessionId).toBe(session.session.sessionId);

    // Foreign session lookup -> 404
    const foreignRes = await app.inject({
      method: 'GET',
      url: '/api/v1/me/sessions/11111111-1111-1111-1111-111111111111',
      headers: { authorization: 'Bearer valid-token' },
    });

    expect(foreignRes.statusCode).toBe(404);
  });

  it('POST /api/v1/me/sessions/:id/revoke revokes a specific session', async () => {
    const session = await sessionService.createSession({ userId: currentUserId, platform: 'android' });

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/me/sessions/${session.session.sessionId}/revoke`,
      headers: { authorization: 'Bearer valid-token' },
      payload: { reason: 'Lost device' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.status).toBe('REVOKED');
  });

  it('POST /api/v1/me/sessions/revoke-others revokes all sessions except current', async () => {
    await sessionService.createSession({ userId: currentUserId, platform: 'android' });
    await sessionService.createSession({ userId: currentUserId, platform: 'ios' });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/me/sessions/revoke-others',
      headers: { authorization: 'Bearer valid-token' },
      payload: { reason: 'Security reset' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.revokedCount).toBe(2);
  });

  it('POST /api/v1/me/sessions/revoke-all revokes every active session', async () => {
    await sessionService.createSession({ userId: currentUserId, platform: 'android' });
    await sessionService.createSession({ userId: currentUserId, platform: 'ios' });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/me/sessions/revoke-all',
      headers: { authorization: 'Bearer valid-token' },
      payload: { reason: 'Forced account logout everywhere' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.revokedCount).toBe(2);
  });

  it('GET /api/v1/me/security/status and /security/events return sanitized security overview', async () => {
    await sessionService.createSession({ userId: currentUserId, deviceFingerprint: 'fp_1' });

    const statusRes = await app.inject({
      method: 'GET',
      url: '/api/v1/me/security/status',
      headers: { authorization: 'Bearer valid-token' },
    });

    expect(statusRes.statusCode).toBe(200);
    expect(statusRes.json().data.activeSessionsCount).toBe(1);
    expect(statusRes.json().data.securityScore).toBe(100);

    const eventsRes = await app.inject({
      method: 'GET',
      url: '/api/v1/me/security/events',
      headers: { authorization: 'Bearer valid-token' },
    });

    expect(eventsRes.statusCode).toBe(200);
    expect(Array.isArray(eventsRes.json().data)).toBe(true);
  });
});
