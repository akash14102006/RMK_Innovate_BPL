/**
 * Bharat PulseLink — QR Sessions Fastify API Route Tests
 *
 * Tests:
 * - POST /api/v1/me/qr-sessions (Generate real-time one-time QR session)
 * - GET  /api/v1/me/qr-sessions/:id (Get patient QR session details)
 * - POST /api/v1/me/qr-sessions/:id/revoke (Revoke active QR session)
 * - POST /api/v1/qr-sessions/consume (Hospital scanner consume & encrypted exchange)
 * - GET  /api/v1/qr-sessions/:id/status (Public/hospital status check)
 *
 * Owned by: QR & Secure Session Domain (Prompt 107)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from '../../helpers/createTestApp.js';

describe('QR Sessions Fastify API Routes (/api/v1/me/qr-sessions & /api/v1/qr-sessions)', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await createTestApp({
      depsOverrides: {
        qrSessionService: {
          createPatientQRSession: vi.fn(async () => ({
            sessionId: 'qrs_test_101',
            qrPayload: 'bplqr://v1/s?sid=qrs_test_101&t=f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8&p=HOSPITAL_CHECKIN&exp=1799999999',
            tokenHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
            expiresAt: new Date(Date.now() + 90000).toISOString(),
            ttlSeconds: 90,
            purpose: 'HOSPITAL_CHECKIN',
            status: 'ACTIVE',
          })),
          getQRSessionStatus: vi.fn(async (id: string) => ({
            id,
            status: 'ACTIVE',
            purpose: 'HOSPITAL_CHECKIN',
            expiresAt: new Date(Date.now() + 90000).toISOString(),
            isExpired: false,
            consumedAt: null,
          })),
          revokeQRSession: vi.fn(async () => true),
          consumeQRSession: vi.fn(async () => ({
            qrSessionId: 'qrs_test_101',
            patientId: 'pat_test_001',
            status: 'CONSUMED',
            purpose: 'HOSPITAL_CHECKIN',
            facilityId: 'hosp_test_01',
            consumedAt: new Date().toISOString(),
            encryptedExchangeEnvelope: {
              version: 'BPL-ENC-v1',
              algorithm: 'AES-256-GCM',
              ciphertext: 'abcd',
            },
          })),
          createOfflineCapabilityPool: vi.fn(async () => [
            {
              sessionId: 'qrs_offline_01',
              qrPayload: 'bplqr://v1/s?sid=qrs_offline_01&t=123&p=HOSPITAL_CHECKIN&exp=1899999999&offline=1',
              tokenHash: 'hash_offline_01',
              expiresAt: new Date(Date.now() + 86400000).toISOString(),
              ttlSeconds: 86400,
              purpose: 'HOSPITAL_CHECKIN',
              status: 'ACTIVE',
            },
          ]),
          syncOfflineCapabilities: vi.fn(async () => [
            { id: 'qrs_offline_01', status: 'ACTIVE', consumedAt: null, isExpired: false },
          ]),
        } as any,
      },
    });

    app.addHook('preHandler', async (req) => {
      req.ctx = {
        requestId: 'req_qr_test',
        userId: 'usr_patient_test_01',
        sessionId: 'sess_active_123',
        deviceId: 'dev_pixel_test',
      };
    });
  });

  it('POST /api/v1/me/qr-sessions creates a new one-time QR session for authenticated patient', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/me/qr-sessions',
      payload: {
        purpose: 'HOSPITAL_CHECKIN',
        ttlSeconds: 90,
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.sessionId).toBe('qrs_test_101');
    expect(body.data.qrPayload).toMatch(/^bplqr:\/\/v1\/s\?sid=/);
    expect(body.data.status).toBe('ACTIVE');
  });

  it('GET /api/v1/me/qr-sessions/:id returns status for patient', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/me/qr-sessions/qrs_test_101',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('qrs_test_101');
    expect(body.data.status).toBe('ACTIVE');
  });

  it('POST /api/v1/me/qr-sessions/:id/revoke cancels the QR session', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/me/qr-sessions/qrs_test_101/revoke',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.revoked).toBe(true);
  });

  it('POST /api/v1/qr-sessions/consume consumes QR session from hospital scanner', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/qr-sessions/consume',
      payload: {
        rawToken: 'f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8',
        consumerFacilityId: 'hosp_test_01',
        purpose: 'HOSPITAL_CHECKIN',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('CONSUMED');
    expect(body.data.encryptedExchangeEnvelope).toBeDefined();
  });

  it('POST /api/v1/me/qr-capabilities/prefetch pre-issues a batch of offline capabilities', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/me/qr-capabilities/prefetch',
      payload: {
        count: 5,
        ttlHours: 24,
        purpose: 'HOSPITAL_CHECKIN',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('POST /api/v1/me/qr-capabilities/sync reconciles client capability pool state', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/me/qr-capabilities/sync',
      payload: {
        capabilityIds: ['018e3a2b-1c0d-7e8f-9a8b-7c6d5e4f3a2b'],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });
});

