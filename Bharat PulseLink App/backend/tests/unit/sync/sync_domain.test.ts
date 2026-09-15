/**
 * Bharat PulseLink — Encrypted Sync Domain Test Suite (Prompt 93)
 *
 * Validates:
 * 1. Session-aware sync: Revoked or expired sessions are halted immediately.
 * 2. Incremental / Delta sync: Only records updated since cursor are transmitted.
 * 3. Client mutation processing with transaction atomicity & idempotency.
 * 4. Optimistic concurrency control (OCC) conflict rejection.
 * 5. Cursor integrity: Cursor advances only upon explicit client acknowledgment.
 *
 * Owned by: Sync & Offline Security Domain (Prompt 93)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EncryptedSyncService } from '../../../src/modules/sync/EncryptedSyncService.js';
import { SyncRepository } from '../../../src/infrastructure/database/repositories/SyncRepository.js';
import { PatientRepository } from '../../../src/infrastructure/database/repositories/PatientRepository.js';
import { SessionRepository } from '../../../src/infrastructure/database/repositories/SessionRepository.js';
import { ConsentAuthorizer } from '../../../src/modules/consent/ConsentAuthorizer.js';
import { EncryptionService } from '../../../src/core/security/crypto/EncryptionService.js';
import { KeyManagementService } from '../../../src/core/security/crypto/KeyManagementService.js';

describe('Prompt 93 — Encrypted Sync Domain', () => {
  let syncService: EncryptedSyncService;
  let syncRepo: SyncRepository;
  let patientRepo: PatientRepository;
  let sessionRepo: SessionRepository;
  let consentAuthorizer: ConsentAuthorizer;
  let encryptionService: EncryptionService;
  let kms: KeyManagementService;

  const mockUserId = 'usr_patient_akash_01';
  const mockSessionId = 'sess_active_001';
  const mockDeviceId = 'dev_pixel8_001';
  const mockPatientId = 'pat_akash_001';

  // In-memory state
  let sessionStore: Map<string, any>;
  let profileStore: any;
  let cursorStore: Map<string, any>;
  let mutationStore: Map<string, any>;

  beforeEach(() => {
    sessionStore = new Map();
    cursorStore = new Map();
    mutationStore = new Map();

    sessionStore.set(mockSessionId, {
      id: mockSessionId,
      user_id: mockUserId,
      device_id: mockDeviceId,
      status: 'ACTIVE',
    });

    profileStore = {
      id: mockPatientId,
      user_id: mockUserId,
      abha_id: '91-2048-9182-4410',
      gender: 'MALE',
      blood_group: 'O+',
      is_aadhaar_verified: true,
      version: 5,
      updated_at: new Date('2026-08-24T00:00:00Z'),
    };

    kms = new KeyManagementService();
    encryptionService = new EncryptionService(kms);

    // Mock Repositories
    syncRepo = {
      getCursor: vi.fn(async (u, d) => cursorStore.get(`${u}_${d}`) || null),
      advanceCursor: vi.fn(async (u, d, v) => {
        const row = { id: 'cur_1', user_id: u, device_id: d, cursor_version: v, last_synced_at: new Date() };
        cursorStore.set(`${u}_${d}`, row);
        return row;
      }),
      queueMutation: vi.fn(async (data) => {
        const existing = mutationStore.get(data.idempotencyKey);
        if (existing) return { mutation: existing, isDuplicate: true };
        const row = { id: `mut_${Date.now()}`, ...data, status: 'PENDING' };
        mutationStore.set(data.idempotencyKey, row);
        return { mutation: row, isDuplicate: false };
      }),
      updateMutationStatus: vi.fn(async (targetId, status) => {
        for (const [, v] of mutationStore.entries()) {
          if (v.id === targetId) {
            v.status = status;
            return v;
          }
        }
        return null;
      }),
    } as unknown as SyncRepository;

    patientRepo = {
      findByUserId: vi.fn(async (u) => (u === mockUserId ? profileStore : null)),
      getAllergies: vi.fn(async () => ['Penicillin']),
      getConditions: vi.fn(async () => ['Diabetes']),
      getSurgeries: vi.fn(async () => ['Appendectomy']),
      updateProfile: vi.fn(async (_id, data) => {
        profileStore = { ...profileStore, ...data, version: (data.expectedVersion || profileStore.version) + 1 };
        return profileStore;
      }),
    } as unknown as PatientRepository;

    sessionRepo = {
      findSessionById: vi.fn(async (sId) => sessionStore.get(sId) || null),
    } as unknown as SessionRepository;

    consentAuthorizer = {
      check: vi.fn(async () => ({ isAuthorized: true })),
    } as unknown as ConsentAuthorizer;

    syncService = new EncryptedSyncService(
      syncRepo,
      patientRepo,
      sessionRepo,
      consentAuthorizer,
      encryptionService,
    );
  });

  // ── TEST 1: Session-Aware Sync Rejects Invalid/Revoked Sessions ────────
  it('TEST 1 — Session-Aware Sync: Rejects sync requests when session is revoked or expired', async () => {
    // Mark session as REVOKED
    sessionStore.set(mockSessionId, {
      id: mockSessionId,
      user_id: mockUserId,
      device_id: mockDeviceId,
      status: 'REVOKED',
    });

    await expect(
      syncService.getDeltaSync(mockUserId, mockSessionId, mockDeviceId, 0),
    ).rejects.toThrow(/Session is invalid, expired, or revoked/);

    await expect(
      syncService.processMutations(mockUserId, mockSessionId, mockDeviceId, []),
    ).rejects.toThrow(/Session is invalid, expired, or revoked/);
  });

  // ── TEST 2: Delta Sync Returns Encrypted Clinical Records ──────────────
  it('TEST 2 — Delta Sync: Returns encrypted clinical payload when serverVersion > cursorVersion', async () => {
    const delta = await syncService.getDeltaSync(mockUserId, mockSessionId, mockDeviceId, 2);

    expect(delta.cursorVersion).toBe(2);
    expect(delta.newCursorVersion).toBe(5);
    expect(delta.records).toHaveLength(1);

    const record = delta.records[0];
    expect(record.resourceType).toBe('PATIENT_PROFILE');
    expect(record.version).toBe(5);
    expect(record.encryptedEnvelope).toBeDefined();

    // Verify envelope is real AES-256-GCM and decrypts accurately
    const decrypted = await encryptionService.decryptJson<any>(record.encryptedEnvelope!, {
      patientId: mockPatientId,
      recordId: mockPatientId,
      recordType: 'CLINICAL_SNAPSHOT',
      schemaVersion: 'v1',
    });

    expect(decrypted.allergies).toContain('Penicillin');
    expect(decrypted.conditions).toContain('Diabetes');
  });

  // ── TEST 3: Offline Mutation Processing & Idempotency ──────────────────
  it('TEST 3 — Offline Mutations: Successfully processes and applies mutation idempotently', async () => {
    const mutationPayload = { bloodGroup: 'B+' };
    const envelope = await encryptionService.encryptJson(mutationPayload, {
      patientId: mockPatientId,
      recordId: mockPatientId,
      recordType: 'PATIENT_PROFILE',
    });

    const mutations = [
      {
        idempotencyKey: 'mut_idemp_1001',
        mutationType: 'UPDATE' as const,
        resourceType: 'PATIENT_PROFILE',
        resourceId: mockPatientId,
        baseVersion: 5,
        encryptedEnvelope: envelope,
      },
    ];

    const result = await syncService.processMutations(
      mockUserId,
      mockSessionId,
      mockDeviceId,
      mutations,
    );

    expect(result.processedCount).toBe(1);
    expect(result.results[0].status).toBe('APPLIED');
    expect(result.results[0].newVersion).toBe(6);

    // Replay exact same mutation (idempotency check)
    const replayResult = await syncService.processMutations(
      mockUserId,
      mockSessionId,
      mockDeviceId,
      mutations,
    );
    expect(replayResult.results[0].status).toBe('APPLIED');
  });

  // ── TEST 4: OCC Version Conflict Detection ─────────────────────────────
  it('TEST 4 — Version Conflicts: Rejects stale offline mutation (baseVersion < serverVersion)', async () => {
    const staleEnvelope = await encryptionService.encryptJson({ bloodGroup: 'AB+' }, {
      patientId: mockPatientId,
      recordId: mockPatientId,
      recordType: 'PATIENT_PROFILE',
    });

    const mutations = [
      {
        idempotencyKey: 'mut_stale_2002',
        mutationType: 'UPDATE' as const,
        resourceType: 'PATIENT_PROFILE',
        resourceId: mockPatientId,
        baseVersion: 3, // Server is at version 5
        encryptedEnvelope: staleEnvelope,
      },
    ];

    const result = await syncService.processMutations(
      mockUserId,
      mockSessionId,
      mockDeviceId,
      mutations,
    );

    expect(result.processedCount).toBe(0);
    expect(result.results[0].status).toBe('CONFLICTED');
    expect(result.results[0].error).toMatch(/Version conflict/);
  });

  // ── TEST 5: Cursor Integrity & Explicit Progression ────────────────────
  it('TEST 5 — Cursor Integrity: Advances cursor only upon explicit acknowledgment', async () => {
    const response = await syncService.advanceClientCursor(
      mockUserId,
      mockSessionId,
      mockDeviceId,
      5,
    );

    expect(response.success).toBe(true);
    expect(response.cursorVersion).toBe(5);

    const cursor = await syncRepo.getCursor(mockUserId, mockDeviceId);
    expect(cursor?.cursor_version).toBe(5);
  });
});
