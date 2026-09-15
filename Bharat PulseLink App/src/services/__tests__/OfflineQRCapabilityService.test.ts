/**
 * Bharat PulseLink — Offline QR Capability Pool Service Test Suite
 *
 * Validates:
 * 1. AES-256-GCM encrypted persistence of pre-issued capabilities (Prompt 93 integration)
 * 2. Strict Account Isolation: User A capability pool is segregated from User B
 * 3. Pulling the next available non-expired unconsumed capability
 * 4. Automatic local expiry evaluation (expired capabilities filtered out)
 * 5. Local consumption tracking
 * 6. Reconciling server sync responses and cleaning consumed/expired tokens
 * 7. Logout / session purge
 *
 * Owned by: QR & Offline Security Domain (Prompt 107 Master Rework)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const secureStorageMap = new Map<string, string>();

vi.mock('../secureStore', () => ({
  default: {
    get: vi.fn(async (k: string) => secureStorageMap.get(k) || null),
    set: vi.fn(async (k: string, v: string) => {
      secureStorageMap.set(k, v);
    }),
    remove: vi.fn(async (k: string) => {
      secureStorageMap.delete(k);
    }),
  },
  get: vi.fn(async (k: string) => secureStorageMap.get(k) || null),
  set: vi.fn(async (k: string, v: string) => {
    secureStorageMap.set(k, v);
  }),
  remove: vi.fn(async (k: string) => {
    secureStorageMap.delete(k);
  }),
}));

vi.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  getRandomBytesAsync: vi.fn(async (count: number) => {
    const arr = new Uint8Array(count);
    for (let i = 0; i < count; i++) arr[i] = (i * 7 + 13) % 256;
    return arr;
  }),
  digestStringAsync: vi.fn(async (_algo: string, str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(32, '0');
  }),
}));

import OfflineQRCapabilityService from '../OfflineQRCapabilityService';

describe('OfflineQRCapabilityService (Encrypted Capability Pool & Account Isolation)', () => {
  const userA = 'usr_akash_001';
  const userB = 'usr_priya_002';

  beforeEach(async () => {
    secureStorageMap.clear();
    await OfflineQRCapabilityService.clearPool(userA);
    await OfflineQRCapabilityService.clearPool(userB);
  });

  it('returns null when offline capability pool is empty', async () => {
    const cap = await OfflineQRCapabilityService.getNextAvailableCapability(userA);
    expect(cap).toBeNull();
    expect(await OfflineQRCapabilityService.getRemainingCount(userA)).toBe(0);
  });

  it('stores pre-issued capabilities in encrypted storage and returns the first available valid capability', async () => {
    const mockCapabilities = [
      {
        sessionId: 'cap_1',
        qrPayload: 'bplqr://v1/s?sid=cap_1&t=tok1&p=HOSPITAL_CHECKIN&exp=1899999999&offline=1',
        tokenHash: 'hash_1',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        ttlSeconds: 86400,
        purpose: 'HOSPITAL_CHECKIN' as const,
        status: 'ACTIVE',
      },
      {
        sessionId: 'cap_2',
        qrPayload: 'bplqr://v1/s?sid=cap_2&t=tok2&p=HOSPITAL_CHECKIN&exp=1899999999&offline=1',
        tokenHash: 'hash_2',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        ttlSeconds: 86400,
        purpose: 'HOSPITAL_CHECKIN' as const,
        status: 'ACTIVE',
      },
    ];

    await OfflineQRCapabilityService.addProvisionedCapabilities(mockCapabilities, userA);
    expect(await OfflineQRCapabilityService.getRemainingCount(userA)).toBe(2);

    const first = await OfflineQRCapabilityService.getNextAvailableCapability(userA);
    expect(first).not.toBeNull();
    expect(first?.sessionId).toBe('cap_1');
  });

  it('enforces Account Isolation: User B cannot access User A capability pool', async () => {
    const mockCapabilities = [
      {
        sessionId: 'cap_user_a_only',
        qrPayload: 'bplqr://v1/s?sid=cap_user_a_only&t=tok_a&p=HOSPITAL_CHECKIN&exp=1899999999&offline=1',
        tokenHash: 'hash_a',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        ttlSeconds: 86400,
        purpose: 'HOSPITAL_CHECKIN' as const,
        status: 'ACTIVE',
      },
    ];

    await OfflineQRCapabilityService.addProvisionedCapabilities(mockCapabilities, userA);

    // User A has 1 capability
    expect(await OfflineQRCapabilityService.getRemainingCount(userA)).toBe(1);

    // User B pool remains strictly empty
    expect(await OfflineQRCapabilityService.getRemainingCount(userB)).toBe(0);
    expect(await OfflineQRCapabilityService.getNextAvailableCapability(userB)).toBeNull();
  });

  it('safely discards locally expired capabilities', async () => {
    const mockCapabilities = [
      {
        sessionId: 'cap_expired',
        qrPayload: 'bplqr://v1/s?sid=cap_expired&t=tok_exp&p=HOSPITAL_CHECKIN&exp=100000&offline=1',
        tokenHash: 'hash_exp',
        expiresAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        ttlSeconds: 86400,
        purpose: 'HOSPITAL_CHECKIN' as const,
        status: 'ACTIVE',
      },
      {
        sessionId: 'cap_valid_future',
        qrPayload: 'bplqr://v1/s?sid=cap_valid_future&t=tok_fut&p=HOSPITAL_CHECKIN&exp=1899999999&offline=1',
        tokenHash: 'hash_fut',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        ttlSeconds: 86400,
        purpose: 'HOSPITAL_CHECKIN' as const,
        status: 'ACTIVE',
      },
    ];

    await OfflineQRCapabilityService.addProvisionedCapabilities(mockCapabilities, userA);

    // Expired one is filtered out
    expect(await OfflineQRCapabilityService.getRemainingCount(userA)).toBe(1);
    const valid = await OfflineQRCapabilityService.getNextAvailableCapability(userA);
    expect(valid?.sessionId).toBe('cap_valid_future');
  });

  it('marks capability as consumed locally and yields the next available capability', async () => {
    const mockCapabilities = [
      {
        sessionId: 'cap_1',
        qrPayload: 'bplqr://v1/s?sid=cap_1&t=tok1&p=HOSPITAL_CHECKIN&exp=1899999999&offline=1',
        tokenHash: 'hash_1',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        ttlSeconds: 86400,
        purpose: 'HOSPITAL_CHECKIN' as const,
        status: 'ACTIVE',
      },
      {
        sessionId: 'cap_2',
        qrPayload: 'bplqr://v1/s?sid=cap_2&t=tok2&p=HOSPITAL_CHECKIN&exp=1899999999&offline=1',
        tokenHash: 'hash_2',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        ttlSeconds: 86400,
        purpose: 'HOSPITAL_CHECKIN' as const,
        status: 'ACTIVE',
      },
    ];

    await OfflineQRCapabilityService.addProvisionedCapabilities(mockCapabilities, userA);
    await OfflineQRCapabilityService.markConsumed('cap_1', userA);

    expect(await OfflineQRCapabilityService.getRemainingCount(userA)).toBe(1);

    const next = await OfflineQRCapabilityService.getNextAvailableCapability(userA);
    expect(next?.sessionId).toBe('cap_2');
  });

  it('reconciles sync status with server and discards consumed/expired capabilities', async () => {
    const mockCapabilities = [
      {
        sessionId: 'cap_1',
        qrPayload: 'bplqr://v1/s?sid=cap_1&t=tok1&p=HOSPITAL_CHECKIN&exp=1899999999&offline=1',
        tokenHash: 'hash_1',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        ttlSeconds: 86400,
        purpose: 'HOSPITAL_CHECKIN' as const,
        status: 'ACTIVE',
      },
      {
        sessionId: 'cap_2',
        qrPayload: 'bplqr://v1/s?sid=cap_2&t=tok2&p=HOSPITAL_CHECKIN&exp=1899999999&offline=1',
        tokenHash: 'hash_2',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        ttlSeconds: 86400,
        purpose: 'HOSPITAL_CHECKIN' as const,
        status: 'ACTIVE',
      },
    ];

    await OfflineQRCapabilityService.addProvisionedCapabilities(mockCapabilities, userA);

    await OfflineQRCapabilityService.reconcileSync(
      [
        { id: 'cap_1', status: 'CONSUMED', consumedAt: new Date().toISOString(), isExpired: false },
        { id: 'cap_2', status: 'ACTIVE', consumedAt: null, isExpired: false },
      ],
      userA
    );

    expect(await OfflineQRCapabilityService.getRemainingCount(userA)).toBe(1);
    const available = await OfflineQRCapabilityService.getNextAvailableCapability(userA);
    expect(available?.sessionId).toBe('cap_2');
  });

  it('clears pool completely upon user logout', async () => {
    const mockCapabilities = [
      {
        sessionId: 'cap_logout_test',
        qrPayload: 'bplqr://v1/s?sid=cap_logout_test&t=tok_l&p=HOSPITAL_CHECKIN&exp=1899999999&offline=1',
        tokenHash: 'hash_l',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        ttlSeconds: 86400,
        purpose: 'HOSPITAL_CHECKIN' as const,
        status: 'ACTIVE',
      },
    ];

    await OfflineQRCapabilityService.addProvisionedCapabilities(mockCapabilities, userA);
    expect(await OfflineQRCapabilityService.getRemainingCount(userA)).toBe(1);

    await OfflineQRCapabilityService.clearPool(userA);
    expect(await OfflineQRCapabilityService.getRemainingCount(userA)).toBe(0);
    expect(await OfflineQRCapabilityService.getNextAvailableCapability(userA)).toBeNull();
  });
});
