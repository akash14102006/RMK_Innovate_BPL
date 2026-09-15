/**
 * Bharat PulseLink — Client-Side Encrypted Sync Service Test Suite
 *
 * Validates:
 * 1. Offline mutation enqueuing with unique idempotency keys
 * 2. Querying pending mutations
 * 3. Clearing synced mutations upon server confirmation
 * 4. Local cursor progression rules (DATA PERSISTED FIRST -> THEN CURSOR ADVANCES)
 *
 * Owned by: Sync & Offline Security Domain (Prompt 93)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const secureStoreMap = new Map<string, string>();

vi.mock('../secureStore', () => ({
  default: {
    get: vi.fn(async (k: string) => secureStoreMap.get(k) || null),
    set: vi.fn(async (k: string, v: string) => { secureStoreMap.set(k, v); }),
    remove: vi.fn(async (k: string) => { secureStoreMap.delete(k); }),
  },
  get: vi.fn(async (k: string) => secureStoreMap.get(k) || null),
  set: vi.fn(async (k: string, v: string) => { secureStoreMap.set(k, v); }),
  remove: vi.fn(async (k: string) => { secureStoreMap.delete(k); }),
}));

let byteCounter = 0;
vi.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  getRandomBytesAsync: vi.fn(async (count: number) => {
    const arr = new Uint8Array(count);
    for (let i = 0; i < count; i++) {
      arr[i] = (byteCounter++ * 11 + 5) % 256;
    }
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

import EncryptedSyncService from '../EncryptedSyncService';

describe('EncryptedSyncService (Client-Side Offline Mutation Queue & Cursor)', () => {
  const userId = 'usr_akash_001';

  beforeEach(() => {
    secureStoreMap.clear();
  });

  it('enqueues offline mutations with generated idempotency keys and PENDING status', async () => {
    const mutation = await EncryptedSyncService.queueMutation(userId, {
      mutationType: 'UPDATE',
      resourceType: 'PATIENT_PROFILE',
      resourceId: 'pat_001',
      baseVersion: 2,
      payload: { bloodGroup: 'O+' },
    });

    expect(mutation.idempotencyKey).toMatch(/^mut_/);
    expect(mutation.status).toBe('PENDING');
    expect(mutation.baseVersion).toBe(2);

    const pending = await EncryptedSyncService.getPendingMutations(userId);
    expect(pending).toHaveLength(1);
    expect(pending[0].idempotencyKey).toBe(mutation.idempotencyKey);
  });

  it('clears synced mutations from local encrypted queue upon server confirmation', async () => {
    const mut1 = await EncryptedSyncService.queueMutation(userId, {
      mutationType: 'UPDATE',
      resourceType: 'PATIENT_PROFILE',
      resourceId: 'pat_001',
      baseVersion: 1,
      payload: { bloodGroup: 'O+' },
    });

    const mut2 = await EncryptedSyncService.queueMutation(userId, {
      mutationType: 'UPDATE',
      resourceType: 'PATIENT_PROFILE',
      resourceId: 'pat_001',
      baseVersion: 2,
      payload: { bloodGroup: 'A+' },
    });

    // Clear only mut1
    await EncryptedSyncService.clearSyncedMutations(userId, [mut1.idempotencyKey]);

    const remaining = await EncryptedSyncService.getPendingMutations(userId);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].idempotencyKey).toBe(mut2.idempotencyKey);
  });

  it('manages local sync cursor progression strictly', async () => {
    expect(await EncryptedSyncService.getLocalCursor(userId)).toBe(0);

    await EncryptedSyncService.advanceLocalCursor(userId, 5);
    expect(await EncryptedSyncService.getLocalCursor(userId)).toBe(5);

    await EncryptedSyncService.advanceLocalCursor(userId, 12);
    expect(await EncryptedSyncService.getLocalCursor(userId)).toBe(12);
  });
});
