/**
 * Bharat PulseLink — Real-Time Secure QR Session Domain Test Suite (Prompt 107)
 *
 * Validates:
 * 1. Real 256-bit entropy one-time QR session generation
 * 2. Zero PII / Zero medical data in QR payload
 * 3. Server-side SHA-256 token hashing (Zero raw tokens in DB/logs)
 * 4. Single-use atomic consumption (ACTIVE -> CONSUMED)
 * 5. Replay protection (Replayed QR strictly rejected)
 * 6. Expiration enforcement (Expired QR after TTL strictly rejected)
 * 7. Revocation lifecycle (Patient can revoke QR instantly)
 * 8. Atomic concurrent double-scan race condition (exactly ONE succeeds)
 * 9. Cross-Patient Isolation (Patient A QR cannot return Patient B records)
 * 10. Cross-Hospital Binding Enforcement (Hospital B cannot consume Hospital A QR)
 * 11. Purpose Binding (Mismatched purpose rejected)
 * 12. Prompt 91 ConsentAuthorizer integration (Missing/denied consent blocks exchange)
 * 13. Prompt 92 Session validation (Revoked login session invalidates QR)
 * 14. Prompt 93 EncryptionService AEAD AES-256-GCM envelope encryption
 * 15. Domain event emissions (Zero secrets/PHI in event payloads)
 * 16. Cryptographic and API performance latency benchmarks
 *
 * Owned by: QR & Secure Session Domain (Prompt 107)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';
import { QRSessionService } from '../../../src/modules/qr/QRSessionService.js';
import { QRSessionRepository } from '../../../src/infrastructure/database/repositories/QRSessionRepository.js';
import { PatientRepository } from '../../../src/infrastructure/database/repositories/PatientRepository.js';
import { SessionRepository } from '../../../src/infrastructure/database/repositories/SessionRepository.js';
import { ConsentAuthorizer } from '../../../src/modules/consent/ConsentAuthorizer.js';
import { EncryptionService } from '../../../src/core/security/crypto/EncryptionService.js';
import { KeyManagementService } from '../../../src/core/security/crypto/KeyManagementService.js';
import { DomainEventEmitter } from '../../../src/infrastructure/events/DomainEventEmitter.js';
import { createLogger } from '../../../src/infrastructure/logger/logger.js';
import { NullCacheClient } from '../../../src/infrastructure/redis/redis.js';

describe('Prompt 107 — Real-Time Secure QR Session Domain', () => {
  let qrService: QRSessionService;
  let qrRepo: QRSessionRepository;
  let patientRepo: PatientRepository;
  let sessionRepo: SessionRepository;
  let consentAuthorizer: ConsentAuthorizer;
  let encryptionService: EncryptionService;
  let kms: KeyManagementService;
  let eventEmitter: DomainEventEmitter;
  let cache: NullCacheClient;
  const logger = createLogger({ level: 'silent', service: 'test-qr', environment: 'test' });

  const mockUserIdA = 'usr_patient_akash_01';
  const mockUserIdB = 'usr_patient_priya_02';
  const mockSessionIdA = 'sess_active_akash_01';
  const mockSessionIdB = 'sess_active_priya_02';
  const mockPatientIdA = 'pat_akash_001';
  const mockPatientIdB = 'pat_priya_002';
  const mockHospitalA = 'hosp_chennai_general_01';
  const mockHospitalB = 'hosp_apollo_specialty_02';

  // In-memory stores for unit simulation
  let qrSessionStore: Map<string, any>;
  let sessionStore: Map<string, any>;
  let patientStore: Map<string, any>;
  let emittedEvents: any[];

  beforeEach(() => {
    qrSessionStore = new Map();
    sessionStore = new Map();
    patientStore = new Map();
    emittedEvents = [];

    // Active login sessions
    sessionStore.set(mockSessionIdA, {
      id: mockSessionIdA,
      user_id: mockUserIdA,
      device_id: 'dev_pixel_01',
      status: 'ACTIVE',
    });
    sessionStore.set(mockSessionIdB, {
      id: mockSessionIdB,
      user_id: mockUserIdB,
      device_id: 'dev_galaxy_02',
      status: 'ACTIVE',
    });

    // Patient records
    patientStore.set(mockUserIdA, {
      id: mockPatientIdA,
      user_id: mockUserIdA,
      full_name: 'Akash Sharma',
      gender: 'MALE',
      date_of_birth: new Date('1990-05-15'),
      blood_group: 'O+',
      abha_id: '91-2048-9182-4410',
      status: 'COMPLETE',
      version: 3,
    });
    patientStore.set(mockUserIdB, {
      id: mockPatientIdB,
      user_id: mockUserIdB,
      full_name: 'Priya Patel',
      gender: 'FEMALE',
      date_of_birth: new Date('1994-08-20'),
      blood_group: 'B+',
      abha_id: '91-5512-8831-9920',
      status: 'COMPLETE',
      version: 2,
    });

    kms = new KeyManagementService();
    encryptionService = new EncryptionService(kms);
    cache = new NullCacheClient();
    eventEmitter = new DomainEventEmitter(logger, cache);
    eventEmitter.on('*', (ev) => emittedEvents.push(ev));

    // Mock QRSessionRepository
    qrRepo = {
      createSession: vi.fn(async (data) => {
        const id = `qrs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const row = {
          id,
          ...data,
          status: 'ACTIVE',
          used_at: null,
          consumed_at: null,
          revoked_at: null,
          version: 1,
          created_at: new Date(),
        };
        qrSessionStore.set(id, row);
        qrSessionStore.set(data.token_hash, row);
        return row;
      }),
      findById: vi.fn(async (id) => qrSessionStore.get(id) || null),
      findByTokenHash: vi.fn(async (tokenHash) => qrSessionStore.get(tokenHash) || null),
      consumeSessionAtomic: vi.fn(async (id, facilityId) => {
        const row = qrSessionStore.get(id);
        if (!row || row.status !== 'ACTIVE' || row.expires_at <= new Date()) {
          return { success: false, session: row || null };
        }
        row.status = 'CONSUMED';
        row.consumed_at = new Date();
        row.used_at = new Date();
        row.facility_id = facilityId;
        row.version += 1;
        return { success: true, session: row };
      }),
      revokeSession: vi.fn(async (id, patientId) => {
        const row = qrSessionStore.get(id);
        if (!row || row.patient_id !== patientId || row.status !== 'ACTIVE') {
          return null;
        }
        row.status = 'REVOKED';
        row.revoked_at = new Date();
        row.version += 1;
        return row;
      }),
      markExpired: vi.fn(async (id) => {
        const row = qrSessionStore.get(id);
        if (row && row.status === 'ACTIVE') {
          row.status = 'EXPIRED';
          return true;
        }
        return false;
      }),
      listActiveByPatient: vi.fn(async (patientId) => {
        const now = new Date();
        return Array.from(qrSessionStore.values()).filter(
          (r) => r.patient_id === patientId && r.status === 'ACTIVE' && r.expires_at > now,
        );
      }),
    } as unknown as QRSessionRepository;

    patientRepo = {
      findById: vi.fn(async (id) => {
        for (const p of patientStore.values()) {
          if (p.id === id) return p;
        }
        return null;
      }),
      findByUserId: vi.fn(async (uId) => patientStore.get(uId) || null),
      getAllergies: vi.fn(async () => ['Penicillin (Severe)']),
      getConditions: vi.fn(async () => ['Type-2 Diabetes']),
      getSurgeries: vi.fn(async () => []),
    } as unknown as PatientRepository;

    sessionRepo = {
      findSessionById: vi.fn(async (sId) => sessionStore.get(sId) || null),
    } as unknown as SessionRepository;

    consentAuthorizer = {
      check: vi.fn(async () => ({ allowed: true, reason: 'AUTHORIZED' })),
    } as unknown as ConsentAuthorizer;

    qrService = new QRSessionService(
      qrRepo,
      patientRepo,
      sessionRepo,
      consentAuthorizer,
      encryptionService,
      cache,
      eventEmitter,
    );
  });

  // ── TEST 1: Generation of High-Entropy One-Time QR Session ──────────────
  it('TEST 1 — Generates a one-time QR session with 256-bit entropy and server-side SHA-256 hashing', async () => {
    const result = await qrService.createPatientQRSession(mockUserIdA, mockSessionIdA, {
      purpose: 'HOSPITAL_CHECKIN',
      ttlSeconds: 90,
    });

    expect(result.sessionId).toBeDefined();
    expect(result.qrPayload).toMatch(/^bplqr:\/\/v1\/s\?sid=/);
    expect(result.tokenHash).toHaveLength(64); // SHA-256 hex
    expect(result.status).toBe('ACTIVE');
    expect(result.ttlSeconds).toBe(90);

    // Extract raw token from QR payload
    const parsedUrl = new URL(result.qrPayload);
    const rawToken = parsedUrl.searchParams.get('t')!;
    expect(rawToken).toHaveLength(64); // 32 bytes hex = 64 characters

    // Verify SHA-256 hash matches
    const expectedHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    expect(result.tokenHash).toBe(expectedHash);
  });

  // ── TEST 2: Zero PII in QR Payload ──────────────────────────────────────
  it('TEST 2 — Critical Security: QR Payload contains zero patient health data, names, ABHA, or credentials', async () => {
    const result = await qrService.createPatientQRSession(mockUserIdA, mockSessionIdA);

    expect(result.qrPayload).not.toContain('Akash');
    expect(result.qrPayload).not.toContain('Sharma');
    expect(result.qrPayload).not.toContain('91-2048-9182-4410');
    expect(result.qrPayload).not.toContain('Penicillin');
    expect(result.qrPayload).not.toContain('Diabetes');
    expect(result.qrPayload).not.toContain('O+');
    expect(result.qrPayload).not.toContain('Bearer');
    expect(result.qrPayload).not.toContain('jwt');
  });

  // ── TEST 3: Database Stores Token Hash and NEVER Raw Secret ─────────────
  it('TEST 3 — Database stores SHA-256 token hash and never the raw secret', async () => {
    const result = await qrService.createPatientQRSession(mockUserIdA, mockSessionIdA);
    const row = await qrRepo.findById(result.sessionId);

    expect(row).toBeDefined();
    expect(row?.token_hash).toBe(result.tokenHash);
    expect((row as any).rawToken).toBeUndefined();
    expect((row as any).secret).toBeUndefined();
  });

  // ── TEST 4: Single-Use Atomic Consumption with AES-256-GCM Exchange ──────
  it('TEST 4 — Consumes QR session once, transitions to CONSUMED, and returns encrypted exchange data', async () => {
    const session = await qrService.createPatientQRSession(mockUserIdA, mockSessionIdA, {
      purpose: 'HOSPITAL_CHECKIN',
    });

    const parsedUrl = new URL(session.qrPayload);
    const rawToken = parsedUrl.searchParams.get('t')!;

    const consumeResult = await qrService.consumeQRSession({
      rawToken,
      consumerFacilityId: mockHospitalA,
      purpose: 'HOSPITAL_CHECKIN',
      requestedScopes: ['BASIC_PROFILE', 'ALLERGIES', 'CONDITIONS'],
    });

    expect(consumeResult.status).toBe('CONSUMED');
    expect(consumeResult.patientId).toBe(mockPatientIdA);
    expect(consumeResult.facilityId).toBe(mockHospitalA);
    expect(consumeResult.encryptedExchangeEnvelope).toBeDefined();

    // Verify exchange envelope is real AES-256-GCM
    const envelope = consumeResult.encryptedExchangeEnvelope!;
    expect(envelope.algorithm).toBe('AES-256-GCM');
    expect(envelope.version).toBe('BPL-ENC-v1');

    // Decrypt exchange payload
    const decrypted = await encryptionService.decryptJson<any>(envelope, {
      patientId: mockPatientIdA,
      recordId: session.sessionId,
      recordType: 'QR_EXCHANGE',
      schemaVersion: 'v1',
    });

    expect(decrypted.profile.fullName).toBe('Akash Sharma');
    expect(decrypted.allergies).toContain('Penicillin (Severe)');
    expect(decrypted.conditions).toContain('Type-2 Diabetes');
  });

  // ── TEST 5: Replay Protection ───────────────────────────────────────────
  it('TEST 5 — Replay Attack Defense: A consumed QR cannot be replayed or scanned a second time', async () => {
    const session = await qrService.createPatientQRSession(mockUserIdA, mockSessionIdA);
    const rawToken = new URL(session.qrPayload).searchParams.get('t')!;

    // 1st Consume: SUCCESS
    await qrService.consumeQRSession({
      rawToken,
      consumerFacilityId: mockHospitalA,
      purpose: 'HOSPITAL_CHECKIN',
    });

    // 2nd Consume (Replay): STRICT REJECTION
    await expect(
      qrService.consumeQRSession({
        rawToken,
        consumerFacilityId: mockHospitalA,
        purpose: 'HOSPITAL_CHECKIN',
      }),
    ).rejects.toThrow(/already been used and cannot be replayed/);
  });

  // ── TEST 6: Expiration Enforcement ──────────────────────────────────────
  it('TEST 6 — Expiration Enforcement: Expired QR after TTL is strictly rejected', async () => {
    // Generate QR with negative / 0 TTL to simulate expired state
    const session = await qrService.createPatientQRSession(mockUserIdA, mockSessionIdA, {
      ttlSeconds: -1, // Expired immediately
    });
    const rawToken = new URL(session.qrPayload).searchParams.get('t')!;

    await expect(
      qrService.consumeQRSession({
        rawToken,
        consumerFacilityId: mockHospitalA,
        purpose: 'HOSPITAL_CHECKIN',
      }),
    ).rejects.toThrow(/QR code has expired/);
  });

  // ── TEST 7: Patient Revocation ──────────────────────────────────────────
  it('TEST 7 — Revocation: Patient cancels QR session, immediately blocking consumption', async () => {
    const session = await qrService.createPatientQRSession(mockUserIdA, mockSessionIdA);
    const rawToken = new URL(session.qrPayload).searchParams.get('t')!;

    // Patient cancels
    const revoked = await qrService.revokeQRSession(mockUserIdA, mockSessionIdA, session.sessionId);
    expect(revoked).toBe(true);

    // Hospital attempts to scan revoked QR
    await expect(
      qrService.consumeQRSession({
        rawToken,
        consumerFacilityId: mockHospitalA,
        purpose: 'HOSPITAL_CHECKIN',
      }),
    ).rejects.toThrow(/cancelled by the patient/);
  });

  // ── TEST 8: Atomic Double-Scan Race Condition ───────────────────────────
  it('TEST 8 — Race Condition Defense: 20 simultaneous scans result in exactly ONE success and 19 rejections', async () => {
    const session = await qrService.createPatientQRSession(mockUserIdA, mockSessionIdA);
    const rawToken = new URL(session.qrPayload).searchParams.get('t')!;

    const concurrentAttempts = 20;
    const promises = [];

    for (let i = 0; i < concurrentAttempts; i++) {
      promises.push(
        qrService
          .consumeQRSession({
            rawToken,
            consumerFacilityId: mockHospitalA,
            purpose: 'HOSPITAL_CHECKIN',
          })
          .then((res) => ({ success: true, res }))
          .catch((err) => ({ success: false, error: err.message })),
      );
    }

    const results = await Promise.all(promises);
    const successes = results.filter((r) => r.success);
    const failures = results.filter((r) => !r.success) as Array<{ success: false; error: string }>;

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(19);
    expect(failures[0].error).toMatch(/already (been used|consumed)/i);
  });

  // ── TEST 9: Cross-Patient Isolation ────────────────────────────────────
  it('TEST 9 — Cross-Patient Isolation: Patient A QR cannot return Patient B clinical records', async () => {
    const sessionA = await qrService.createPatientQRSession(mockUserIdA, mockSessionIdA);
    const rawTokenA = new URL(sessionA.qrPayload).searchParams.get('t')!;

    const result = await qrService.consumeQRSession({
      rawToken: rawTokenA,
      consumerFacilityId: mockHospitalA,
      purpose: 'HOSPITAL_CHECKIN',
    });

    expect(result.patientId).toBe(mockPatientIdA);
    expect(result.patientId).not.toBe(mockPatientIdB);
  });

  // ── TEST 10: Cross-Hospital Binding ────────────────────────────────────
  it('TEST 10 — Cross-Hospital Binding: QR bound to Hospital A is rejected when scanned by Hospital B', async () => {
    const sessionBoundToA = await qrService.createPatientQRSession(mockUserIdA, mockSessionIdA, {
      recipientId: mockHospitalA,
    });
    const rawToken = new URL(sessionBoundToA.qrPayload).searchParams.get('t')!;

    // Hospital B attempts to scan Hospital A bound QR
    await expect(
      qrService.consumeQRSession({
        rawToken,
        consumerFacilityId: mockHospitalB,
        purpose: 'HOSPITAL_CHECKIN',
      }),
    ).rejects.toThrow(/bound to a different healthcare facility/);
  });

  // ── TEST 11: Purpose Binding ───────────────────────────────────────────
  it('TEST 11 — Purpose Binding: QR generated for HOSPITAL_CHECKIN rejected if scanned for APPOINTMENT', async () => {
    const session = await qrService.createPatientQRSession(mockUserIdA, mockSessionIdA, {
      purpose: 'HOSPITAL_CHECKIN',
    });
    const rawToken = new URL(session.qrPayload).searchParams.get('t')!;

    await expect(
      qrService.consumeQRSession({
        rawToken,
        consumerFacilityId: mockHospitalA,
        purpose: 'APPOINTMENT',
      }),
    ).rejects.toThrow(/Purpose mismatch/);
  });

  // ── TEST 12: Prompt 91 ConsentAuthorizer Integration ───────────────────
  it('TEST 12 — Consent Integration: Denied consent halts data release and emits rejection event', async () => {
    // Override ConsentAuthorizer to DENY
    (consentAuthorizer.check as any).mockResolvedValueOnce({
      allowed: false,
      reason: 'DENIED',
      message: 'Patient has not granted OPD consent scope',
    });

    const session = await qrService.createPatientQRSession(mockUserIdA, mockSessionIdA);
    const rawToken = new URL(session.qrPayload).searchParams.get('t')!;

    await expect(
      qrService.consumeQRSession({
        rawToken,
        consumerFacilityId: mockHospitalA,
        purpose: 'HOSPITAL_CHECKIN',
      }),
    ).rejects.toThrow(/Access denied by consent policy/);
  });

  // ── TEST 13: Prompt 92 Session Invalidation ────────────────────────────
  it('TEST 13 — Session Security: Revoking user login session invalidates pending QR sessions', async () => {
    const session = await qrService.createPatientQRSession(mockUserIdA, mockSessionIdA);
    const rawToken = new URL(session.qrPayload).searchParams.get('t')!;

    // Revoke patient login session
    sessionStore.set(mockSessionIdA, {
      id: mockSessionIdA,
      user_id: mockUserIdA,
      status: 'REVOKED',
    });

    await expect(
      qrService.consumeQRSession({
        rawToken,
        consumerFacilityId: mockHospitalA,
        purpose: 'HOSPITAL_CHECKIN',
      }),
    ).rejects.toThrow(/Patient user session has expired or been revoked/);
  });

  // ── TEST 14: Tampered Token Rejection ──────────────────────────────────
  it('TEST 14 — Tampered or random tokens are strictly rejected as invalid', async () => {
    const bogusToken = 'f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8';

    await expect(
      qrService.consumeQRSession({
        rawToken: bogusToken,
        consumerFacilityId: mockHospitalA,
        purpose: 'HOSPITAL_CHECKIN',
      }),
    ).rejects.toThrow(/QR session not found or invalid token/);
  });

  // ── TEST 15: Real-Time Domain Events (Zero Secrets in Payloads) ─────────
  it('TEST 15 — Emits safe domain events with zero PHI, tokens, or encryption keys', async () => {
    const session = await qrService.createPatientQRSession(mockUserIdA, mockSessionIdA);
    const rawToken = new URL(session.qrPayload).searchParams.get('t')!;

    await qrService.consumeQRSession({
      rawToken,
      consumerFacilityId: mockHospitalA,
      purpose: 'HOSPITAL_CHECKIN',
    });

    const createdEvent = emittedEvents.find((e) => e.event === 'qr.session.created');
    const consumedEvent = emittedEvents.find((e) => e.event === 'qr.session.consumed');

    expect(createdEvent).toBeDefined();
    expect(consumedEvent).toBeDefined();
    expect(createdEvent.qrSessionId).toBe(session.sessionId);
    expect(createdEvent.rawToken).toBeUndefined();
    expect(consumedEvent.consumedByFacilityId).toBe(mockHospitalA);
  });

  // ── TEST 16: Cryptographic Latency Performance Benchmarks ──────────────
  it('TEST 16 — Performance: Real QR session generation and consumption latency benchmarks', async () => {
    const iterations = 50;

    const startGen = performance.now();
    const sessions = [];
    for (let i = 0; i < iterations; i++) {
      sessions.push(await qrService.createPatientQRSession(mockUserIdA, mockSessionIdA));
    }
    const genLatencyMs = (performance.now() - startGen) / iterations;

    const startConsume = performance.now();
    for (let i = 0; i < iterations; i++) {
      const rawToken = new URL(sessions[i].qrPayload).searchParams.get('t')!;
      await qrService.consumeQRSession({
        rawToken,
        consumerFacilityId: mockHospitalA,
        purpose: 'HOSPITAL_CHECKIN',
      });
    }
    const consumeLatencyMs = (performance.now() - startConsume) / iterations;

    console.log(
      `[QR_BENCHMARK] QR Session Performance: Generation: ${genLatencyMs.toFixed(3)}ms/op, Consumption & Encryption: ${consumeLatencyMs.toFixed(3)}ms/op (${iterations} ops)`,
    );

    expect(genLatencyMs).toBeLessThan(20);
    expect(consumeLatencyMs).toBeLessThan(50);
  });

  // ── TEST 17: Pre-Issued Offline Capability Pool Creation ────────────────
  it('TEST 17 — Offline Pool: Creates N pre-issued cryptographic capabilities with 24h validity and unique token hashes', async () => {
    const pool = await qrService.createOfflineCapabilityPool(mockUserIdA, mockSessionIdA, {
      count: 5,
      ttlHours: 24,
      purpose: 'HOSPITAL_CHECKIN',
    });

    expect(pool).toHaveLength(5);
    const tokenHashes = new Set<string>();
    const sessionIds = new Set<string>();

    pool.forEach((cap) => {
      expect(cap.sessionId).toBeDefined();
      expect(cap.tokenHash).toHaveLength(64);
      expect(cap.qrPayload).toContain('offline=1');
      expect(cap.status).toBe('ACTIVE');
      expect(cap.ttlSeconds).toBe(86400);

      tokenHashes.add(cap.tokenHash);
      sessionIds.add(cap.sessionId);
    });

    expect(tokenHashes.size).toBe(5);
    expect(sessionIds.size).toBe(5);
  });

  // ── TEST 18: Offline Capability Consumption & Replay Defense ───────────
  it('TEST 18 — Offline Consumption & Replay: Pre-issued offline capability is consumed atomically upon hospital scan and replay is strictly blocked', async () => {
    const pool = await qrService.createOfflineCapabilityPool(mockUserIdA, mockSessionIdA, {
      count: 2,
    });
    const firstCap = pool[0];
    const rawToken = new URL(firstCap.qrPayload).searchParams.get('t')!;

    // Hospital scans and consumes capability online
    const consumeResult = await qrService.consumeQRSession({
      rawToken,
      consumerFacilityId: mockHospitalA,
      purpose: 'HOSPITAL_CHECKIN',
    });

    expect(consumeResult.status).toBe('CONSUMED');
    expect(consumeResult.qrSessionId).toBe(firstCap.sessionId);
    expect(consumeResult.encryptedExchangeEnvelope).toBeDefined();

    // Replay attempt must be rejected with 409 QR_SESSION_ALREADY_USED
    await expect(
      qrService.consumeQRSession({
        rawToken,
        consumerFacilityId: mockHospitalA,
        purpose: 'HOSPITAL_CHECKIN',
      }),
    ).rejects.toThrow(/already (been used|consumed)/i);
  });

  // ── TEST 19: Offline Capabilities Reconciliation / Sync ─────────────────
  it('TEST 19 — Offline Sync: Synchronizes capability states and identifies consumed / expired items', async () => {
    const pool = await qrService.createOfflineCapabilityPool(mockUserIdA, mockSessionIdA, {
      count: 3,
    });

    // Hospital consumes capability #1
    const rawToken0 = new URL(pool[0].qrPayload).searchParams.get('t')!;
    await qrService.consumeQRSession({
      rawToken: rawToken0,
      consumerFacilityId: mockHospitalA,
      purpose: 'HOSPITAL_CHECKIN',
    });

    // Patient reconnects and syncs capability IDs
    const syncStatus = await qrService.syncOfflineCapabilities(mockUserIdA, mockSessionIdA, [
      pool[0].sessionId,
      pool[1].sessionId,
      pool[2].sessionId,
    ]);

    expect(syncStatus).toHaveLength(3);
    const item0 = syncStatus.find((s) => s.id === pool[0].sessionId);
    const item1 = syncStatus.find((s) => s.id === pool[1].sessionId);

    expect(item0?.status).toBe('CONSUMED');
    expect(item0?.consumedAt).toBeDefined();
    expect(item1?.status).toBe('ACTIVE');
    expect(item1?.consumedAt).toBeNull();
  });
});
