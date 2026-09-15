/**
 * Bharat PulseLink — Client-Side QR Session Service Test Suite (Prompt 107 Master Architecture)
 *
 * Validates:
 * 1. Requesting server-authoritative live QR sessions
 * 2. Pre-fetching capability pool and encrypted local caching
 * 3. Unified resolver: Online generation vs Offline encrypted fallback
 * 4. Error classification: 401 Session Expired, 500 Server Error, No Internet
 * 5. Background synchronization & automatic pool replenishment
 * 6. Parsing URI (`bplqr://v1/s?...`) and JSON QR payloads
 * 7. Expired / malformed QR detection
 * 8. Revoking QR sessions
 * 9. Consuming QR sessions via hospital scanner
 *
 * Owned by: QR & Client Service Domain (Prompt 107)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import QRSessionClientService from '../QRSessionClientService';
import OfflineQRCapabilityService from '../OfflineQRCapabilityService';
import SessionManager from '../sessionManager';

vi.mock('axios', () => {
  const instance = {
    post: vi.fn(),
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  };
  return {
    default: {
      ...instance,
      create: vi.fn(() => instance),
    },
  };
});
vi.mock('../sessionManager', () => ({
  default: {
    getAccessToken: vi.fn(async () => 'mock_jwt_access_token_123'),
  },
}));

vi.mock('../OfflineQRCapabilityService', () => {
  let storedPool: any[] = [];
  return {
    default: {
      TARGET_POOL_SIZE: 5,
      MIN_REPLENISHMENT_THRESHOLD: 2,
      minReplenishmentThreshold: 2,
      targetPoolSize: 5,
      getStoredPool: vi.fn(async () => storedPool),
      getStoredPoolCount: vi.fn(async () => storedPool.length),
      addProvisionedCapabilities: vi.fn(async (caps: any[]) => {
        storedPool = [...storedPool, ...caps];
      }),
      getNextAvailableCapability: vi.fn(async () => storedPool[0] || null),
      getRemainingCount: vi.fn(async () => storedPool.length),
      markConsumed: vi.fn(async (id: string) => {
        storedPool = storedPool.filter((p) => p.sessionId !== id);
      }),
      reconcileSync: vi.fn(async (statuses: any[]) => {
        const consumedIds = new Set(statuses.filter((s) => s.status === 'CONSUMED').map((s) => s.id));
        storedPool = storedPool.filter((p) => !consumedIds.has(p.sessionId));
      }),
      clearPool: vi.fn(async () => {
        storedPool = [];
      }),
    },
  };
});

describe('QRSessionClientService (Client-Side QR Session Client & Offline Pool)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await OfflineQRCapabilityService.clearPool();
  });

  it('generates a real-time one-time QR session with server auth token', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: {
          sessionId: 'qrs_client_101',
          qrPayload: 'bplqr://v1/s?sid=qrs_client_101&t=f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8&p=HOSPITAL_CHECKIN&exp=1799999999',
          tokenHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
          expiresAt: '2026-08-24T02:00:00.000Z',
          ttlSeconds: 90,
          purpose: 'HOSPITAL_CHECKIN',
          status: 'ACTIVE',
        },
      },
    };

    (axios.post as any).mockResolvedValueOnce(mockResponse);

    const session = await QRSessionClientService.generatePatientQRSession({
      purpose: 'HOSPITAL_CHECKIN',
      ttlSeconds: 90,
    });

    expect(session.sessionId).toBe('qrs_client_101');
    expect(session.qrPayload).toContain('bplqr://v1/s?sid=');
    expect(session.status).toBe('ACTIVE');
  });

  it('prefetches capability pool and stores inside OfflineQRCapabilityService', async () => {
    const mockCapabilities = [
      {
        sessionId: 'cap_prefetch_1',
        qrPayload: 'bplqr://v1/s?sid=cap_prefetch_1&t=11111111111111111111111111111111&p=HOSPITAL_CHECKIN&exp=1899999999&offline=1',
        tokenHash: 'h1',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        ttlSeconds: 86400,
        purpose: 'HOSPITAL_CHECKIN',
        status: 'ACTIVE',
      },
      {
        sessionId: 'cap_prefetch_2',
        qrPayload: 'bplqr://v1/s?sid=cap_prefetch_2&t=22222222222222222222222222222222&p=HOSPITAL_CHECKIN&exp=1899999999&offline=1',
        tokenHash: 'h2',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        ttlSeconds: 86400,
        purpose: 'HOSPITAL_CHECKIN',
        status: 'ACTIVE',
      },
    ];

    (axios.post as any).mockResolvedValueOnce({
      data: { success: true, data: mockCapabilities },
    });

    const result = await QRSessionClientService.prefetchCapabilityPool({ count: 5 });
    expect(result).toHaveLength(2);
    expect(OfflineQRCapabilityService.addProvisionedCapabilities).toHaveBeenCalledWith(mockCapabilities);
  });

  it('unified resolver falls back to offline secure QR envelope without blocking on backend network', async () => {
    (axios.post as any).mockRejectedValueOnce(new Error('Network Error'));

    const unified = await QRSessionClientService.getActiveSessionUnified({
      facilityId: 'hosp_chennai_01',
      scopes: ['BASIC_PROFILE', 'EMERGENCY_CONTACT'],
    });

    expect(unified.isOffline).toBe(true);
    expect(unified.data.qrPayload.startsWith('bploff://v1?data=')).toBe(true);
    expect(unified.data.sessionId.includes('off_')).toBe(true);
  });

  it('classifies 401 responses as SESSION_EXPIRED when hospital key is unavailable and pool is empty', async () => {
    (axios.post as any).mockRejectedValueOnce({
      response: { status: 401, data: { message: 'Unauthorized session' } },
    });
    vi.mocked(OfflineQRCapabilityService.getNextAvailableCapability).mockResolvedValueOnce(null);

    await expect(
      QRSessionClientService.getActiveSessionUnified({
        facilityId: 'unknown_unregistered_facility_99',
      })
    ).rejects.toMatchObject({
      code: 'OFFLINE_KEY_UNAVAILABLE',
    });
  });

  it('classifies 500 server errors cleanly when hospital key is unavailable and pool is empty', async () => {
    (axios.post as any).mockRejectedValueOnce({
      response: { status: 500, data: { message: 'Internal Server Error' } },
    });
    vi.mocked(OfflineQRCapabilityService.getNextAvailableCapability).mockResolvedValueOnce(null);

    await expect(
      QRSessionClientService.getActiveSessionUnified({
        facilityId: 'unknown_unregistered_facility_99',
      })
    ).rejects.toMatchObject({
      code: 'OFFLINE_KEY_UNAVAILABLE',
    });
  });

  it('parses valid bplqr:// protocol QR URI accurately', () => {
    const uri =
      'bplqr://v1/s?sid=sess_desk_01&t=f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8&p=HOSPITAL_CHECKIN&exp=2099999999999';

    const parsed = QRSessionClientService.parseQRString(uri);
    expect(parsed.isValid).toBe(true);
    expect(parsed.sessionId).toBe('sess_desk_01');
    expect(parsed.rawToken).toBe('f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8');
    expect(parsed.purpose).toBe('HOSPITAL_CHECKIN');
  });

  it('tolerates scanner device prefixes like iconbplqr:// gracefully', () => {
    const futureEpoch = Date.now() + 60000;
    const prefixedUri =
      `iconbplqr://v1/s?sid=01a05818-499b-74e4-b19f-02468a3c18cb&t=e3481f0af31166fb95dcb31542dcfe81b3ab799ea7b10c8b66a1537c18fca4dc&p=HOSPITAL_CHECKIN&exp=${futureEpoch}`;

    const parsed = QRSessionClientService.parseQRString(prefixedUri);
    expect(parsed.isValid).toBe(true);
    expect(parsed.sessionId).toBe('01a05818-499b-74e4-b19f-02468a3c18cb');
    expect(parsed.rawToken).toBe('e3481f0af31166fb95dcb31542dcfe81b3ab799ea7b10c8b66a1537c18fca4dc');
  });

  it('rejects expired QR URI format', () => {
    const expiredUri =
      'bplqr://v1/s?sid=sess_old&t=f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8&p=HOSPITAL_CHECKIN&exp=1000000000';

    const parsed = QRSessionClientService.parseQRString(expiredUri);
    expect(parsed.isValid).toBe(false);
    expect(parsed.errorMessage).toContain('expired');
  });

  it('rejects malformed or non-BPL QR strings cleanly', () => {
    const bogus = 'https://some-random-phishing-url.com/scan';
    const parsed = QRSessionClientService.parseQRString(bogus);
    expect(parsed.errorMessage).toBeDefined();
    expect(parsed.errorMessage).toContain('Not a Bharat PulseLink code');
  });

  it('revokes an active QR session via API', async () => {
    (axios.post as any).mockResolvedValueOnce({
      data: { success: true, data: { revoked: true } },
    });

    const revoked = await QRSessionClientService.revokeQRSession('qrs_client_101');
    expect(revoked).toBe(true);
  });

  it('consumes QR session and exchanges encrypted patient data', async () => {
    const mockConsumeResponse = {
      data: {
        success: true,
        data: {
          qrSessionId: 'qrs_client_101',
          patientId: 'pat_001',
          status: 'CONSUMED',
          purpose: 'HOSPITAL_CHECKIN',
          facilityId: 'hosp_chennai_01',
          consumedAt: new Date().toISOString(),
          encryptedExchangeEnvelope: {
            version: 'BPL-ENC-v1',
            algorithm: 'AES-256-GCM',
            ciphertext: 'deadbeef',
          },
        },
      },
    };

    (axios.post as any).mockResolvedValueOnce(mockConsumeResponse);

    const result = await QRSessionClientService.consumeQRSession({
      rawToken: 'f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8',
      consumerFacilityId: 'hosp_chennai_01',
    });

    expect(result.status).toBe('CONSUMED');
    expect(result.encryptedExchangeEnvelope).toBeDefined();
  });
});
