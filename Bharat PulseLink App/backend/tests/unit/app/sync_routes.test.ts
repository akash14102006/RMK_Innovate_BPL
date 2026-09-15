/**
 * Bharat PulseLink — Sync & Offline Encryption Fastify API Route Tests
 *
 * Tests:
 * - GET /api/v1/me/sync/delta (requires auth, returns encrypted delta)
 * - POST /api/v1/me/sync/mutations (requires auth, processes offline mutations)
 * - POST /api/v1/me/sync/cursor (requires auth, advances sync cursor)
 *
 * Owned by: Sync & Offline Security Domain (Prompt 93)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from '../../helpers/createTestApp.js';
import { EncryptionService } from '../../../src/core/security/crypto/EncryptionService.js';
import { KeyManagementService } from '../../../src/core/security/crypto/KeyManagementService.js';

describe('Sync Fastify API Routes (/api/v1/me/sync)', () => {
  let app: FastifyInstance;
  let kms: KeyManagementService;
  let encryptionService: EncryptionService;

  beforeEach(async () => {
    kms = new KeyManagementService();
    encryptionService = new EncryptionService(kms);

    app = await createTestApp({
      depsOverrides: {
        encryptedSyncService: {
          getDeltaSync: vi.fn(async () => ({
            cursorVersion: 0,
            newCursorVersion: 1,
            hasMore: false,
            records: [
              {
                resourceType: 'PATIENT_PROFILE',
                resourceId: 'pat_test_01',
                version: 1,
                action: 'UPSERT',
                updatedAt: new Date().toISOString(),
              },
            ],
          })),
          processMutations: vi.fn(async () => ({
            processedCount: 1,
            results: [
              {
                idempotencyKey: 'idemp_101',
                status: 'APPLIED',
                resourceId: 'pat_test_01',
                newVersion: 2,
              },
            ],
          })),
          advanceClientCursor: vi.fn(async () => ({
            success: true,
            cursorVersion: 5,
          })),
        } as any,
      },
    });

    // Add auth context mock to test app
    app.addHook('preHandler', async (req) => {
      req.ctx = {
        requestId: 'req_sync_test',
        userId: 'usr_test_akash',
        sessionId: 'sess_test_123',
        deviceId: 'dev_test_pixel',
      };
    });
  });

  it('GET /api/v1/me/sync/delta returns delta sync changes', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/me/sync/delta?since=0',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.cursorVersion).toBe(0);
    expect(body.data.newCursorVersion).toBe(1);
    expect(body.data.records).toHaveLength(1);
  });

  it('POST /api/v1/me/sync/mutations uploads offline encrypted mutations', async () => {
    const envelope = await encryptionService.encrypt('Test Clinical Update', {
      patientId: 'pat_test_01',
      recordId: 'pat_test_01',
      recordType: 'PATIENT_PROFILE',
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/me/sync/mutations',
      payload: {
        mutations: [
          {
            idempotencyKey: 'idemp_101',
            mutationType: 'UPDATE',
            resourceType: 'PATIENT_PROFILE',
            resourceId: 'pat_test_01',
            baseVersion: 1,
            encryptedEnvelope: envelope,
          },
        ],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.processedCount).toBe(1);
    expect(body.data.results[0].status).toBe('APPLIED');
  });

  it('POST /api/v1/me/sync/cursor acknowledges local persistence and advances cursor', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/me/sync/cursor',
      payload: {
        cursorVersion: 5,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.cursorVersion).toBe(5);
  });
});
