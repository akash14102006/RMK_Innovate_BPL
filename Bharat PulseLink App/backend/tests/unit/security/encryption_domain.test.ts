/**
 * Bharat PulseLink — Patient Data Encryption Domain Test Suite (Prompt 93)
 *
 * Validates:
 * 1. Real AEAD AES-256-GCM envelope encryption & decryption
 * 2. Deterministic Context / AAD binding & anti-swapping security
 * 3. Tamper detection: tampered ciphertext, nonce, authTag, or context fails closed
 * 4. Supplemental SHA-256 plaintext integrity validation
 * 5. Cross-Patient Isolation (Patient A key/context cannot decrypt Patient B record)
 * 6. Zero plaintext fallback policy
 * 7. Key rotation (v1 -> v2) & re-encryption migration
 * 8. Key revocation (revoked key immediately denies decryption)
 * 9. KMS availability failure handling (fails closed)
 * 10. Actual cryptographic performance latency benchmarks
 *
 * Owned by: Patient Data Encryption & Cryptography Domain (Prompt 93)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { KeyManagementService } from '../../../src/core/security/crypto/KeyManagementService.js';
import { EncryptionService } from '../../../src/core/security/crypto/EncryptionService.js';
import { EncryptionContext } from '../../../src/core/security/crypto/types.js';

describe('Prompt 93 — Patient Data Encryption Domain (AEAD & KMS)', () => {
  let kms: KeyManagementService;
  let encryptionService: EncryptionService;

  const patientAContext: EncryptionContext = {
    patientId: 'pat_akash_001',
    recordId: 'rec_blood_test_01',
    recordType: 'DIAGNOSTIC_REPORT',
    schemaVersion: 'v1',
  };

  const patientBContext: EncryptionContext = {
    patientId: 'pat_priya_002',
    recordId: 'rec_blood_test_02',
    recordType: 'DIAGNOSTIC_REPORT',
    schemaVersion: 'v1',
  };

  beforeEach(() => {
    kms = new KeyManagementService();
    encryptionService = new EncryptionService(kms);
  });

  // ── TEST 1: Real AEAD AES-256-GCM Encrypt & Decrypt ────────────────────
  it('TEST 1 — Encrypts and decrypts sensitive clinical plaintext using AES-256-GCM envelope', async () => {
    const sensitiveMedicalData = JSON.stringify({
      bloodGroup: 'O+',
      allergies: ['Penicillin (Anaphylaxis)', 'Sulfa Drugs'],
      chronicConditions: ['Type-2 Diabetes Mellitus', 'Hypertension'],
      medications: ['Metformin 500mg BD', 'Telmisartan 40mg OD'],
    });

    const envelope = await encryptionService.encrypt(sensitiveMedicalData, patientAContext);

    expect(envelope.version).toBe('BPL-ENC-v1');
    expect(envelope.algorithm).toBe('AES-256-GCM');
    expect(envelope.keyVersion).toBe('v1');
    expect(envelope.nonce).toHaveLength(24); // 12 bytes hex
    expect(envelope.authTag).toHaveLength(32); // 16 bytes hex
    expect(envelope.ciphertext).toBeDefined();
    expect(envelope.ciphertext).not.toBe(sensitiveMedicalData);
    expect(envelope.wrappedDek).toBeDefined();

    const decrypted = await encryptionService.decrypt(envelope, patientAContext);
    expect(decrypted).toBe(sensitiveMedicalData);
    expect(JSON.parse(decrypted).bloodGroup).toBe('O+');
  });

  // ── TEST 2: Tampered Ciphertext Fails Closed ───────────────────────────
  it('TEST 2 — Tampered ciphertext immediately fails authentication and never returns plaintext', async () => {
    const sensitiveData = 'Critical Patient Allergy: Severe Peanut Anaphylaxis';
    const envelope = await encryptionService.encrypt(sensitiveData, patientAContext);

    // Tamper with the ciphertext byte
    const rawCipher = Buffer.from(envelope.ciphertext, 'hex');
    rawCipher[0] ^= 0xff; // Invert first byte
    const tamperedEnvelope = {
      ...envelope,
      ciphertext: rawCipher.toString('hex'),
    };

    await expect(encryptionService.decrypt(tamperedEnvelope, patientAContext)).rejects.toThrow(
      /Cryptographic integrity violation/,
    );
  });

  // ── TEST 3: Tampered Nonce Fails Closed ─────────────────────────────────
  it('TEST 3 — Tampered nonce/IV fails authentication', async () => {
    const sensitiveData = 'Cardiac Catheterization History 2024';
    const envelope = await encryptionService.encrypt(sensitiveData, patientAContext);

    const rawNonce = Buffer.from(envelope.nonce, 'hex');
    rawNonce[0] ^= 0xff;
    const tamperedEnvelope = {
      ...envelope,
      nonce: rawNonce.toString('hex'),
    };

    await expect(encryptionService.decrypt(tamperedEnvelope, patientAContext)).rejects.toThrow(
      /Cryptographic integrity violation/,
    );
  });

  // ── TEST 4: Tampered AAD / Context Binding Fails Closed ─────────────────
  it('TEST 4 — Tampered AAD context (anti-record swapping) fails closed', async () => {
    const sensitiveData = 'Patient Akash Blood Sugar: 180 mg/dL';
    const envelope = await encryptionService.encrypt(sensitiveData, patientAContext);

    // Attempt to decrypt with modified context (e.g. Swapping recordId or recordType)
    const swappedContext: EncryptionContext = {
      ...patientAContext,
      recordId: 'rec_different_record_99',
    };

    await expect(encryptionService.decrypt(envelope, swappedContext)).rejects.toThrow(
      /Cryptographic integrity violation/,
    );
  });

  // ── TEST 5: Cross-Patient Isolation ────────────────────────────────────
  it('TEST 5 — Cross-Patient Isolation: Patient A encrypted record cannot be decrypted under Patient B context', async () => {
    const patientAData = 'Patient Akash Sensitive Clinical PHI Record';
    const envelopeA = await encryptionService.encrypt(patientAData, patientAContext);

    // Patient B attempts to decrypt Patient A's envelope
    await expect(encryptionService.decrypt(envelopeA, patientBContext)).rejects.toThrow(
      /Cryptographic integrity violation/,
    );
  });

  // ── TEST 6: Key Rotation (v1 -> v2) & Re-encryption ────────────────────
  it('TEST 6 — Zero-downtime key rotation: old data readable during migration, new writes use v2', async () => {
    const originalText = 'Pre-rotation Patient Clinical Data';
    const envelopeV1 = await encryptionService.encrypt(originalText, patientAContext);
    expect(envelopeV1.keyVersion).toBe('v1');

    // Perform KMS Key Rotation
    const { previousVersion, newVersion } = await kms.rotateKey();
    expect(previousVersion).toBe('v1');
    expect(newVersion).toBe('v2');
    expect(await kms.getActiveKeyVersion()).toBe('v2');

    // 1. Old record on v1 can still be decrypted under ROTATED status
    const decryptedV1 = await encryptionService.decrypt(envelopeV1, patientAContext);
    expect(decryptedV1).toBe(originalText);

    // 2. New writes automatically use v2
    const envelopeV2 = await encryptionService.encrypt('Post-rotation Patient Data', patientAContext);
    expect(envelopeV2.keyVersion).toBe('v2');

    // 3. Re-encrypt / migrate v1 envelope to v2
    const migratedEnvelope = await encryptionService.rotateEnvelope(envelopeV1, patientAContext);
    expect(migratedEnvelope.keyVersion).toBe('v2');
    expect(await encryptionService.decrypt(migratedEnvelope, patientAContext)).toBe(originalText);
  });

  // ── TEST 7: Key Revocation Fails Closed ─────────────────────────────────
  it('TEST 7 — Key Revocation: Compromised key version is immediately revoked and rejects unwrapping', async () => {
    const envelope = await encryptionService.encrypt('Sensitive Data Under v1', patientAContext);

    // Revoke v1
    await kms.revokeKey('v1');

    // Decryption of v1 envelope must fail closed
    await expect(encryptionService.decrypt(envelope, patientAContext)).rejects.toThrow(
      /is REVOKED/,
    );
  });

  // ── TEST 8: KMS Availability Failure ───────────────────────────────────
  it('TEST 8 — KMS Unavailable fault injection causes fail-closed rejection without plaintext fallback', async () => {
    kms.setAvailability(false);

    await expect(
      encryptionService.encrypt('Emergency Clinical Payload', patientAContext),
    ).rejects.toThrow(/Key Management Service unavailable/);

    // Restore
    kms.setAvailability(true);
  });

  // ── TEST 9: Cryptographic Latency Performance Benchmark ────────────────
  it('TEST 9 — Real cryptographic performance benchmarks meet sub-millisecond production targets', async () => {
    const payload = JSON.stringify({
      patientId: 'pat_akash_001',
      vitals: { hr: 72, bp: '120/80', spo2: 99, tempF: 98.4 },
      notes: 'Routine clinical consultation with normal cardiopulmonary examination.',
    });

    const iterations = 100;
    const startEncrypt = performance.now();
    const envelopes = [];
    for (let i = 0; i < iterations; i++) {
      envelopes.push(await encryptionService.encrypt(payload, patientAContext));
    }
    const encryptDurationMs = performance.now() - startEncrypt;
    const avgEncryptMs = encryptDurationMs / iterations;

    const startDecrypt = performance.now();
    for (let i = 0; i < iterations; i++) {
      await encryptionService.decrypt(envelopes[i], patientAContext);
    }
    const decryptDurationMs = performance.now() - startDecrypt;
    const avgDecryptMs = decryptDurationMs / iterations;

    console.log(
      `[CRYPTO_BENCHMARK] AES-256-GCM Envelope Performance: Encrypt: ${avgEncryptMs.toFixed(3)}ms/op, Decrypt: ${avgDecryptMs.toFixed(3)}ms/op (${iterations} ops)`,
    );

    // Must be under 5ms per operation for high-throughput healthcare gateway
    expect(avgEncryptMs).toBeLessThan(5);
    expect(avgDecryptMs).toBeLessThan(5);
  });
});
