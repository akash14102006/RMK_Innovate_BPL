/**
 * Bharat PulseLink — Client-Side Encrypted Storage Service Test Suite
 *
 * Validates:
 * 1. OS Secure Key Storage (SecureStore integration)
 * 2. Client-side envelope encryption with random IV and auth tags
 * 3. Cross-Account Isolation: User A cannot read User B's encrypted cache
 * 4. Tamper detection: Tampered local storage fails closed
 * 5. In-memory key eviction upon logout
 *
 * Owned by: Patient Data Encryption & Mobile Security Domain (Prompt 93)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const secureStorageMap = new Map<string, string>();

vi.mock('../secureStore', () => ({
  default: {
    get: vi.fn(async (k: string) => secureStorageMap.get(k) || null),
    set: vi.fn(async (k: string, v: string) => { secureStorageMap.set(k, v); }),
    remove: vi.fn(async (k: string) => { secureStorageMap.delete(k); }),
  },
  get: vi.fn(async (k: string) => secureStorageMap.get(k) || null),
  set: vi.fn(async (k: string, v: string) => { secureStorageMap.set(k, v); }),
  remove: vi.fn(async (k: string) => { secureStorageMap.delete(k); }),
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

import EncryptedStorageService from '../EncryptedStorageService';

describe('EncryptedStorageService (Client-Side OS Key & AEAD Storage)', () => {
  const userA = 'usr_akash_001';
  const userB = 'usr_priya_002';

  beforeEach(() => {
    secureStorageMap.clear();
    EncryptedStorageService.clearUserSession(userA);
    EncryptedStorageService.clearUserSession(userB);
  });

  it('generates and securely persists a 256-bit key per user in OS Keystore', async () => {
    const key1 = await EncryptedStorageService.getOrCreateUserKey(userA);
    expect(key1).toHaveLength(64); // 32 bytes in hex

    // Subsequent retrieval returns cached / stored key
    const key2 = await EncryptedStorageService.getOrCreateUserKey(userA);
    expect(key2).toBe(key1);
  });

  it('stores and decrypts sensitive clinical records locally', async () => {
    const clinicalProfile = {
      bloodGroup: 'O+',
      allergies: ['Penicillin'],
      conditions: ['Hypertension'],
    };

    await EncryptedStorageService.setEncryptedItem(userA, 'clinical_summary', clinicalProfile);

    const decrypted = await EncryptedStorageService.getDecryptedItem<typeof clinicalProfile>(
      userA,
      'clinical_summary',
    );

    expect(decrypted).toEqual(clinicalProfile);
  });

  it('enforces Account Isolation: User B cannot decrypt User A local data', async () => {
    const secretData = { confidentialNote: 'User A specific diagnosis' };
    await EncryptedStorageService.setEncryptedItem(userA, 'notes', secretData);

    // User B attempts to access User A storage key
    const attempt = await EncryptedStorageService.getDecryptedItem(userB, 'notes');
    expect(attempt).toBeNull();
  });

  it('fails closed when local envelope is corrupted or tampered', async () => {
    await EncryptedStorageService.setEncryptedItem(userA, 'sensitive_data', { score: 100 });

    const storageKey = 'bpl_mob_enc_usr_akash_001_sensitive_data';
    const rawEnvelope = secureStorageMap.get(storageKey)!;
    const parsed = JSON.parse(rawEnvelope);

    // Tamper with ciphertext
    parsed.ciphertext = 'deadbeef9999';
    secureStorageMap.set(storageKey, JSON.stringify(parsed));

    const result = await EncryptedStorageService.getDecryptedItem(userA, 'sensitive_data');
    expect(result).toBeNull();
  });

  it('clears active in-memory user key on session logout', async () => {
    await EncryptedStorageService.getOrCreateUserKey(userA);
    await EncryptedStorageService.clearUserSession(userA);

    // Key is evicted from memory
    expect((EncryptedStorageService as any)._activeUserKeys.has(userA)).toBe(false);
  });
});
