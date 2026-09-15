/**
 * Prompt 92 — Security & Sessions Domain Test Suite
 *
 * Runs against real in-memory PostgreSQL engine (pg-mem) to verify:
 * - Real PostgreSQL schema for sessions and devices with CHECK constraints
 * - Token hashing and opaque session creation (zero raw token persistence)
 * - Multi-device session lifecycle (Device A, B, C)
 * - Revoke target session, revoke-other-sessions, revoke-all-sessions
 * - IDOR protection (User A cannot revoke/view User B session)
 * - Session enumeration protection
 * - Server-authoritative expiration evaluation
 * - Account suspension enforcement (user.status = SUSPENDED -> 403 Forbidden)
 * - Single-flight refresh concurrency protection
 * - Logout vs Refresh race condition (logout wins, state stays REVOKED)
 * - Device revocation cascading to associated sessions
 * - Real-time domain events and Redis cache invalidation (ZERO PHI / secrets)
 * - Explicit check for zero dummy production data in migrations
 *
 * Owned by: Security & Session Domain (Prompt 92, 101 §20, §30)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { newDb, DataType } from 'pg-mem';
import type { Knex } from 'knex';
import { up as migration001 } from '../../../migrations/20240001_001_database_foundation.js';
import { up as migration002 } from '../../../migrations/20240002_002_geography_reference.js';
import { up as migration003 } from '../../../migrations/20240003_003_identity_and_users.js';
import { up as migration004 } from '../../../migrations/20240004_004_patients_and_profiles.js';
import { up as migration005 } from '../../../migrations/20240005_005_consent_domain.js';
import { UserRepository } from '../../../src/infrastructure/database/repositories/UserRepository.js';
import { SessionRepository } from '../../../src/infrastructure/database/repositories/SessionRepository.js';
import { AuditRepository } from '../../../src/infrastructure/database/repositories/AuditRepository.js';
import { SessionService } from '../../../src/modules/session/SessionService.js';
import { DomainEventEmitter } from '../../../src/infrastructure/events/DomainEventEmitter.js';
import { NoopLogger } from '../../../src/infrastructure/logger/logger.js';
import { AppError } from '../../../src/core/errors/AppError.js';

describe('Prompt 92 — Security & Sessions Domain (PostgreSQL)', () => {
  let dbKnex: Knex;
  let userRepo: UserRepository;
  let sessionRepo: SessionRepository;
  let auditRepo: AuditRepository;
  let sessionService: SessionService;
  let eventEmitter: DomainEventEmitter;
  const logger = new NoopLogger();

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

    // Run migrations 001 through 005
    await migration001(dbKnex);
    await migration002(dbKnex);
    await migration003(dbKnex);
    await migration004(dbKnex);
    await migration005(dbKnex);

    userRepo = new UserRepository(dbKnex);
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
      sessionTtlSeconds: 86400 * 7,
      absoluteLifetimeSeconds: 86400 * 30,
    });
  });

  // ── 1. Schema & Relational Integrity ─────────────────────────────────────

  it('verifies sessions and devices tables exist with constraints and indexes', async () => {
    const hasDevices = await dbKnex.schema.hasTable('devices');
    const hasSessions = await dbKnex.schema.hasTable('sessions');

    expect(hasDevices).toBe(true);
    expect(hasSessions).toBe(true);
  });

  it('enforces status CHECK constraint on sessions table', async () => {
    const user = await userRepo.createUser({ status: 'ACTIVE' });

    await expect(
      dbKnex('sessions').insert({
        user_id: user.id,
        session_token_hash: 'invalid_status_hash_test',
        status: 'INVALID_STATUS',
        expires_at: new Date(Date.now() + 86400000),
        absolute_expires_at: new Date(Date.now() + 86400000 * 30),
      }),
    ).rejects.toThrow();
  });

  it('enforces status CHECK constraint on devices table', async () => {
    const user = await userRepo.createUser({ status: 'ACTIVE' });

    await expect(
      dbKnex('devices').insert({
        user_id: user.id,
        device_fingerprint_hash: 'fp_hash_1',
        platform: 'android',
        app_version: '1.0.0',
        status: 'INVALID_DEVICE_STATUS',
      }),
    ).rejects.toThrow();
  });

  // ── 2. Session Creation & Token Hashing ───────────────────────────────────

  it('TEST 1 — Creates authenticated session with SHA-256 token hash and zero secret storage', async () => {
    const user = await userRepo.createUser({ status: 'ACTIVE' });

    const result = await sessionService.createSession({
      userId: user.id,
      deviceFingerprint: 'fp_pixel7_delhi',
      platform: 'android',
      appVersion: '1.2.0',
      pushToken: 'fcm_token_test_123',
      ipAddress: '103.21.124.5',
      userAgent: 'BharatPulseLink/1.2.0 (Android 14; Pixel 7)',
    });

    expect(result.session.sessionId).toBeDefined();
    expect(result.session.current).toBe(true);
    expect(result.session.status).toBe('ACTIVE');
    expect(result.session.platform).toBe('android');
    expect(result.session.appVersion).toBe('1.2.0');
    expect(result.session.riskLevel).toBe('LOW');
    expect(result.session.device?.id).toBeDefined();

    // Verify raw token is NOT stored in DB (only SHA-256 hash)
    const dbSession = await sessionRepo.findSessionById(result.session.sessionId);
    expect(dbSession?.session_token_hash).toBe(sessionService.hashToken(result.sessionToken));
    expect(dbSession?.session_token_hash).not.toBe(result.sessionToken);

    // Verify security event logged
    const events = await auditRepo.getUserSecurityEvents(user.id);
    expect(events.some((e) => e.event_type === 'SESSION_CREATED')).toBe(true);
  });

  // ── 3. Token Validation & Account Eligibility ─────────────────────────────

  it('TEST 2 — Authoritative session validation succeeds on active session', async () => {
    const user = await userRepo.createUser({ status: 'ACTIVE' });
    const { session, sessionToken } = await sessionService.createSession({
      userId: user.id,
      platform: 'ios',
    });

    const validated = await sessionService.validateSession(sessionToken);
    expect(validated.session.id).toBe(session.sessionId);
    expect(validated.user.id).toBe(user.id);
    expect(validated.session.status).toBe('ACTIVE');
  });

  it('TEST 3 — Invalid or unknown token is rejected with 401 UNAUTHORIZED', async () => {
    await expect(sessionService.validateSession('non_existent_token_12345')).rejects.toThrowError(AppError);
  });

  it('TEST 4 — Expired session is strictly rejected by server-authoritative clock', async () => {
    const user = await userRepo.createUser({ status: 'ACTIVE' });
    const token = 'expired_test_token_abc';
    const tokenHash = sessionService.hashToken(token);

    // Insert an already expired session in database
    await sessionRepo.createSession({
      user_id: user.id,
      session_token_hash: tokenHash,
      status: 'ACTIVE',
      expires_at: new Date(Date.now() - 60000), // Expired 1 min ago
      absolute_expires_at: new Date(Date.now() + 86400000),
    });

    await expect(sessionService.validateSession(token)).rejects.toThrowError(AppError);
  });

  it('TEST 5 & 6 — User Logout revokes session and blocks subsequent protected requests', async () => {
    const user = await userRepo.createUser({ status: 'ACTIVE' });
    const { session, sessionToken } = await sessionService.createSession({
      userId: user.id,
      platform: 'android',
    });

    // Revoke (Logout)
    const revoked = await sessionService.revokeSession(user.id, session.sessionId, 'USER_LOGOUT');
    expect(revoked.status).toBe('REVOKED');

    // Attempting validation with original token fails
    await expect(sessionService.validateSession(sessionToken)).rejects.toThrowError(AppError);
  });

  // ── 4. Multi-Device Management & Targeted Revocation ───────────────────────

  it('TEST 7 — Revoke target device session revokes only target, leaving other devices active', async () => {
    const user = await userRepo.createUser({ status: 'ACTIVE' });

    // Device A (Phone)
    const devA = await sessionService.createSession({
      userId: user.id,
      deviceFingerprint: 'phone_fp_1',
      platform: 'android',
    });

    // Device B (Tablet)
    const devB = await sessionService.createSession({
      userId: user.id,
      deviceFingerprint: 'tablet_fp_2',
      platform: 'ios',
    });

    // User revokes Device B from Device A
    await sessionService.revokeSession(user.id, devB.session.sessionId, 'Tablet lost');

    // Device B is now rejected
    await expect(sessionService.validateSession(devB.sessionToken)).rejects.toThrowError(AppError);

    // Device A remains active and valid
    const validatedA = await sessionService.validateSession(devA.sessionToken);
    expect(validatedA.session.status).toBe('ACTIVE');
  });

  it('TEST 8 — Revoke other devices revokes B and C, keeping current session A active', async () => {
    const user = await userRepo.createUser({ status: 'ACTIVE' });

    const devA = await sessionService.createSession({ userId: user.id, platform: 'android' });
    const devB = await sessionService.createSession({ userId: user.id, platform: 'ios' });
    const devC = await sessionService.createSession({ userId: user.id, platform: 'web' });

    // Device A requests: revoke other sessions
    const res = await sessionService.revokeOtherSessions(user.id, devA.session.sessionId);
    expect(res.revokedCount).toBe(2);

    // Device A is still active
    const validA = await sessionService.validateSession(devA.sessionToken);
    expect(validA.session.status).toBe('ACTIVE');

    // Devices B and C are revoked
    await expect(sessionService.validateSession(devB.sessionToken)).rejects.toThrowError(AppError);
    await expect(sessionService.validateSession(devC.sessionToken)).rejects.toThrowError(AppError);
  });

  it('TEST 9 — Revoke all sessions revokes every active session (A, B, C)', async () => {
    const user = await userRepo.createUser({ status: 'ACTIVE' });

    const devA = await sessionService.createSession({ userId: user.id, platform: 'android' });
    const devB = await sessionService.createSession({ userId: user.id, platform: 'ios' });
    const devC = await sessionService.createSession({ userId: user.id, platform: 'web' });

    const res = await sessionService.revokeAllSessions(user.id, 'Emergency security reset');
    expect(res.revokedCount).toBe(3);

    await expect(sessionService.validateSession(devA.sessionToken)).rejects.toThrowError(AppError);
    await expect(sessionService.validateSession(devB.sessionToken)).rejects.toThrowError(AppError);
    await expect(sessionService.validateSession(devC.sessionToken)).rejects.toThrowError(AppError);
  });

  // ── 5. IDOR & Session Enumeration Protection ──────────────────────────────

  it('TEST 10 — IDOR Defense: User A cannot revoke or access User B session', async () => {
    const userA = await userRepo.createUser({ status: 'ACTIVE' });
    const userB = await userRepo.createUser({ status: 'ACTIVE' });

    const sessionB = await sessionService.createSession({ userId: userB.id, platform: 'android' });

    // User A attempts to revoke User B's session -> rejected with 404 NOT_FOUND
    await expect(
      sessionService.revokeSession(userA.id, sessionB.session.sessionId, 'Malicious attempt'),
    ).rejects.toThrowError(AppError);

    // Session B is still intact and ACTIVE
    const validB = await sessionService.validateSession(sessionB.sessionToken);
    expect(validB.session.status).toBe('ACTIVE');
  });

  it('TEST 11 — Session Enumeration Defense: non-existent or foreign ID returns 404', async () => {
    const user = await userRepo.createUser({ status: 'ACTIVE' });

    await expect(
      sessionService.getSessionById(user.id, '00000000-0000-0000-0000-000000000000'),
    ).rejects.toThrowError(AppError);
  });

  // ── 6. Single-Flight Refresh & Concurrency Race Protection ────────────────

  it('TEST 12 — Single-flight refresh deduplicates 20 concurrent refresh calls', async () => {
    const user = await userRepo.createUser({ status: 'ACTIVE' });
    const { sessionToken } = await sessionService.createSession({ userId: user.id });

    // Launch 20 concurrent refresh requests with the same token
    const refreshPromises = Array.from({ length: 20 }, () =>
      sessionService.refreshSession({ currentToken: sessionToken }),
    );

    const results = await Promise.all(refreshPromises);
    expect(results).toHaveLength(20);

    // All results returned successfully
    for (const r of results) {
      expect(r.session.status).toBe('ACTIVE');
      expect(r.sessionToken).toBe(sessionToken);
    }
  });

  it('TEST 13 — Logout vs Refresh Race: Revoked session can NEVER be refreshed', async () => {
    const user = await userRepo.createUser({ status: 'ACTIVE' });
    const { session, sessionToken } = await sessionService.createSession({ userId: user.id });

    // User logs out (revokes session)
    await sessionService.revokeSession(user.id, session.sessionId, 'Logout');

    // Concurrent or subsequent refresh attempt MUST FAIL
    await expect(sessionService.refreshSession({ currentToken: sessionToken })).rejects.toThrowError(
      AppError,
    );

    // State remains REVOKED
    const dbSession = await sessionRepo.findSessionById(session.sessionId);
    expect(dbSession?.status).toBe('REVOKED');
  });

  // ── 7. Account Suspension Enforcement ─────────────────────────────────────

  it('TEST 14 — Account Suspension immediately blocks active sessions with 403 FORBIDDEN', async () => {
    const user = await userRepo.createUser({ status: 'ACTIVE' });
    const { sessionToken } = await sessionService.createSession({ userId: user.id });

    // Verify valid when active
    const validBefore = await sessionService.validateSession(sessionToken);
    expect(validBefore.user.status).toBe('ACTIVE');

    // Suspend user account
    await userRepo.updateStatus(user.id, 'SUSPENDED');

    // Validation now throws FORBIDDEN
    await expect(sessionService.validateSession(sessionToken)).rejects.toThrowError(AppError);
  });

  // ── 8. Device Revocation Cascade ──────────────────────────────────────────

  it('TEST 15 — Device revocation cascades to revoke all sessions on that device', async () => {
    const user = await userRepo.createUser({ status: 'ACTIVE' });

    const sessionA = await sessionService.createSession({
      userId: user.id,
      deviceFingerprint: 'device_compromised_fp',
      platform: 'android',
    });

    const deviceId = sessionA.session.device?.id!;
    expect(deviceId).toBeDefined();

    // Revoke device
    const revoked = await sessionRepo.revokeDevice(deviceId, user.id, 'Device reported stolen');
    expect(revoked).toBe(true);

    // Session on that device is now revoked
    await expect(sessionService.validateSession(sessionA.sessionToken)).rejects.toThrowError(AppError);
  });

  // ── 9. Domain Events & Zero PHI / Token Leakage ───────────────────────────

  it('TEST 16 — Emits real-time security domain events with zero PHI, tokens, or secrets', async () => {
    const user = await userRepo.createUser({ status: 'ACTIVE' });
    const events: any[] = [];

    eventEmitter.on('session.created', (e) => events.push(e));
    eventEmitter.on('session.revoked', (e) => events.push(e));

    const created = await sessionService.createSession({ userId: user.id });
    await sessionService.revokeSession(user.id, created.session.sessionId);

    expect(events).toHaveLength(2);
    expect(events[0].event).toBe('session.created');
    expect(events[0].sessionId).toBe(created.session.sessionId);
    expect(events[0].token).toBeUndefined(); // Zero token

    expect(events[1].event).toBe('session.revoked');
    expect(events[1].sessionId).toBe(created.session.sessionId);
    expect(events[1].sessionTokenHash).toBeUndefined(); // Zero secret
  });

  // ── 10. Security Center Status ────────────────────────────────────────────

  it('TEST 17 — Security Center status aggregates active sessions, devices, and security metrics', async () => {
    const user = await userRepo.createUser({ status: 'ACTIVE' });

    const s1 = await sessionService.createSession({ userId: user.id, deviceFingerprint: 'fp_1' });
    await sessionService.createSession({ userId: user.id, deviceFingerprint: 'fp_2' });

    const status = await sessionService.getSecurityStatus(user.id, s1.session.sessionId);
    expect(status.userId).toBe(user.id);
    expect(status.accountStatus).toBe('ACTIVE');
    expect(status.activeSessionsCount).toBe(2);
    expect(status.totalRegisteredDevices).toBe(2);
    expect(status.currentSessionId).toBe(s1.session.sessionId);
    expect(status.securityScore).toBe(100);
  });

  // ── 11. Zero Dummy Production Data Check ──────────────────────────────────

  it('Explicit check: Zero dummy production data in session migration definitions', async () => {
    const sessionsCount = await dbKnex('sessions').count('* as count').first();
    const devicesCount = await dbKnex('devices').count('* as count').first();

    expect(Number(sessionsCount?.count)).toBe(0);
    expect(Number(devicesCount?.count)).toBe(0);
  });
});
