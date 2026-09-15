/**
 * Bharat PulseLink — Authoritative Encryption Service (AES-256-GCM Envelope Encryption)
 *
 * Implements:
 * 1. AEAD encryption with cryptographically random 12-byte nonces (never reused)
 * 2. Envelope encryption with DEK wrapping via KeyManagementService (KMS)
 * 3. Context binding & Authenticated Additional Data (AAD) for tamper-evident isolation
 * 4. Strict fail-closed integrity validation (tampered ciphertext/tag/AAD/context fails)
 * 5. Re-encryption / key rotation helpers for background migrations
 * 6. Zero plaintext fallbacks or unredacted secrets
 *
 * Owned by: Patient Data Encryption & Cryptography Domain (Prompt 93)
 */

import crypto from 'crypto';
import { EncryptedEnvelope, EncryptionContext, IKeyManagementService } from './types.js';
import { AppError, ErrorCode } from '../../../core/errors/AppError.js';

export class EncryptionService {
  constructor(private readonly _kms: IKeyManagementService) {}

  /**
   * Encrypts plaintext (string or Buffer) under a fresh, ephemeral DEK wrapped by KMS.
   * Binds the encryption context to the AAD to prevent record swapping or cross-patient replay.
   */
  async encrypt(
    plaintext: string | Buffer,
    context: EncryptionContext,
    targetKeyVersion?: string,
  ): Promise<EncryptedEnvelope> {
    this._validateContext(context);

    // 1. Generate a fresh 256-bit (32 bytes) Data Encryption Key (DEK)
    const dek = crypto.randomBytes(32);

    // 2. Generate a fresh 96-bit (12 bytes) Initialization Vector (Nonce)
    const nonce = crypto.randomBytes(12);

    // 3. Construct deterministic Authenticated Additional Data (AAD)
    const aadString = this._buildDeterministicAAD(context);
    const aadBuffer = Buffer.from(aadString, 'utf8');

    // 4. Encrypt plaintext with AES-256-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', dek, nonce);
    cipher.setAAD(aadBuffer);

    const plaintextBuffer = typeof plaintext === 'string' ? Buffer.from(plaintext, 'utf8') : plaintext;
    const ciphertext = Buffer.concat([cipher.update(plaintextBuffer), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // 5. Wrap DEK under KMS KEK
    const { wrappedDek, keyVersion } = await this._kms.wrapDataKey(dek, targetKeyVersion);

    // 6. Compute supplemental SHA-256 integrity fingerprint
    const integrityHash = crypto.createHash('sha256').update(plaintextBuffer).digest('hex');

    return {
      version: 'BPL-ENC-v1',
      algorithm: 'AES-256-GCM',
      keyVersion,
      nonce: nonce.toString('hex'),
      ciphertext: ciphertext.toString('hex'),
      authTag: authTag.toString('hex'),
      aadVersion: 'v1',
      wrappedDek,
      integrityHash,
    };
  }

  /**
   * Decrypts an encrypted envelope using its bound context and wrapped DEK.
   * Strict fail-closed policy: any integrity or context mismatch immediately throws.
   */
  async decrypt(envelope: EncryptedEnvelope, context: EncryptionContext): Promise<string> {
    this._validateEnvelope(envelope);
    this._validateContext(context);

    // 1. Unwrap DEK using KMS KEK
    if (!envelope.wrappedDek) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Encrypted envelope missing wrapped DEK',
      });
    }
    const dek = await this._kms.unwrapDataKey(envelope.wrappedDek, envelope.keyVersion);

    // 2. Reconstruct deterministic AAD
    const aadString = this._buildDeterministicAAD(context);
    const aadBuffer = Buffer.from(aadString, 'utf8');

    // 3. Decrypt ciphertext with AES-256-GCM
    try {
      const nonceBuffer = Buffer.from(envelope.nonce, 'hex');
      const authTagBuffer = Buffer.from(envelope.authTag, 'hex');
      const ciphertextBuffer = Buffer.from(envelope.ciphertext, 'hex');

      const decipher = crypto.createDecipheriv('aes-256-gcm', dek, nonceBuffer);
      decipher.setAAD(aadBuffer);
      decipher.setAuthTag(authTagBuffer);

      const decryptedBuffer = Buffer.concat([decipher.update(ciphertextBuffer), decipher.final()]);

      // 4. Verify supplemental SHA-256 integrity fingerprint if present
      if (envelope.integrityHash) {
        const computedHash = crypto.createHash('sha256').update(decryptedBuffer).digest('hex');
        if (computedHash !== envelope.integrityHash) {
          throw new Error('Supplemental integrity hash mismatch');
        }
      }

      return decryptedBuffer.toString('utf8');
    } catch (err: any) {
      throw new AppError({
        code: ErrorCode.FORBIDDEN,
        message: `[CRYPTO] Decryption failed: Cryptographic integrity violation, tampered AAD, or wrong context (${err.message})`,
      });
    }
  }

  /**
   * Helper: Encrypts any JSON-serializable object
   */
  async encryptJson<T extends Record<string, any>>(
    data: T,
    context: EncryptionContext,
    targetKeyVersion?: string,
  ): Promise<EncryptedEnvelope> {
    const jsonString = JSON.stringify(data);
    return this.encrypt(jsonString, context, targetKeyVersion);
  }

  /**
   * Helper: Decrypts and parses JSON object
   */
  async decryptJson<T>(envelope: EncryptedEnvelope, context: EncryptionContext): Promise<T> {
    const jsonString = await this.decrypt(envelope, context);
    try {
      return JSON.parse(jsonString) as T;
    } catch (err: any) {
      throw new AppError({
        code: ErrorCode.INTERNAL_ERROR,
        message: '[CRYPTO] Decrypted payload could not be parsed as valid JSON',
      });
    }
  }

  /**
   * Re-encrypts an envelope under the latest active KEK version (Key Rotation migration).
   */
  async rotateEnvelope(envelope: EncryptedEnvelope, context: EncryptionContext): Promise<EncryptedEnvelope> {
    const activeVersion = await this._kms.getActiveKeyVersion();
    if (envelope.keyVersion === activeVersion) {
      return envelope; // Already on current version
    }

    const plaintext = await this.decrypt(envelope, context);
    return this.encrypt(plaintext, context, activeVersion);
  }

  /**
   * Builds deterministic canonical string representation of the encryption context for AAD.
   */
  private _buildDeterministicAAD(context: EncryptionContext): string {
    const sortedKeys = Object.keys(context).sort();
    const parts = sortedKeys.map((key) => `${key}=${context[key] ?? ''}`);
    return `BPL-AAD-v1:${parts.join('|')}`;
  }

  private _validateContext(context: EncryptionContext): void {
    if (!context || !context.patientId || !context.recordId || !context.recordType) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: '[CRYPTO] Invalid encryption context: patientId, recordId, and recordType are mandatory for AAD binding',
      });
    }
  }

  private _validateEnvelope(envelope: EncryptedEnvelope): void {
    if (!envelope || envelope.version !== 'BPL-ENC-v1' || envelope.algorithm !== 'AES-256-GCM') {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: '[CRYPTO] Unsupported or invalid encrypted envelope specification',
      });
    }
    if (!envelope.nonce || !envelope.ciphertext || !envelope.authTag || !envelope.keyVersion) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: '[CRYPTO] Incomplete encrypted envelope payload',
      });
    }
  }
}

export default EncryptionService;
