/**
 * Bharat PulseLink — Authoritative Key Management Service (KMS)
 *
 * Implements:
 * - KEK (Key Encryption Key) lifecycle management (active, rotated, revoked)
 * - Cryptographically secure DEK (Data Encryption Key) wrapping & unwrapping
 * - Key versioning (v1 -> v2) with zero downtime rotation
 * - Strict key revocation & fail-closed error handling
 * - No plaintext master/KEK material leakage to business domain code
 *
 * Owned by: Patient Data Encryption & Cryptography Domain (Prompt 93)
 */

import crypto from 'crypto';
import { IKeyManagementService, KeyMetadata } from './types.js';
import { AppError, ErrorCode, Errors } from '../../../core/errors/AppError.js';

interface KEKEntry {
  keyMaterial: Buffer; // 256-bit (32 bytes) KEK
  metadata: KeyMetadata;
}

export class KeyManagementService implements IKeyManagementService {
  private readonly _keyRing = new Map<string, KEKEntry>();
  private _activeVersion: string = 'v1';
  private _isAvailable: boolean = true;

  constructor(initialMasterKeyHex?: string) {
    // Initialize root key version v1
    const masterKey = initialMasterKeyHex
      ? Buffer.from(initialMasterKeyHex, 'hex')
      : crypto.randomBytes(32);

    if (masterKey.length !== 32) {
      throw new Error('[KMS] FATAL — Master key material must be exactly 256 bits (32 bytes).');
    }

    this._keyRing.set('v1', {
      keyMaterial: masterKey,
      metadata: {
        keyId: 'bpl-kms-root-v1',
        version: 'v1',
        status: 'ACTIVE',
        algorithm: 'AES-256-GCM',
        createdAt: new Date(),
      },
    });
  }

  /**
   * Returns current active KEK version for new encryptions
   */
  async getActiveKeyVersion(): Promise<string> {
    this._ensureAvailable();
    return this._activeVersion;
  }

  /**
   * Returns metadata for specified key version
   */
  async getKeyMetadata(version: string): Promise<KeyMetadata> {
    this._ensureAvailable();
    const entry = this._keyRing.get(version);
    if (!entry) {
      throw Errors.notFound(`Key version '${version}' not found in KMS key ring`);
    }
    return { ...entry.metadata };
  }

  /**
   * Wraps a random 256-bit DEK under the requested (or active) KEK version.
   * Uses AES-256-GCM with a dedicated 12-byte IV for the key-wrapping envelope.
   */
  async wrapDataKey(dek: Buffer, keyVersion?: string): Promise<{ wrappedDek: string; keyVersion: string }> {
    this._ensureAvailable();
    const targetVersion = keyVersion || this._activeVersion;
    const entry = this._keyRing.get(targetVersion);

    if (!entry) {
      throw new AppError({
        code: ErrorCode.INTERNAL_ERROR,
        message: `[KMS] Cannot wrap DEK: Unknown key version '${targetVersion}'`,
      });
    }
    if (entry.metadata.status === 'REVOKED') {
      throw new AppError({
        code: ErrorCode.FORBIDDEN,
        message: `[KMS] Cannot wrap DEK: Key version '${targetVersion}' is REVOKED`,
      });
    }

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', entry.keyMaterial, iv);
    cipher.setAAD(Buffer.from(`BPL-KMS-WRAP-${targetVersion}`, 'utf8'));

    const ciphertext = Buffer.concat([cipher.update(dek), cipher.final()]);
    const tag = cipher.getAuthTag();

    // Format: iv(12) + tag(16) + ciphertext(32) = 60 bytes total
    const wrappedBuffer = Buffer.concat([iv, tag, ciphertext]);

    return {
      wrappedDek: wrappedBuffer.toString('hex'),
      keyVersion: targetVersion,
    };
  }

  /**
   * Unwraps an encrypted DEK under its original KEK version.
   * Fails closed on tampered ciphertext or revoked KEK.
   */
  async unwrapDataKey(wrappedDekHex: string, keyVersion: string): Promise<Buffer> {
    this._ensureAvailable();
    const entry = this._keyRing.get(keyVersion);

    if (!entry) {
      throw new AppError({
        code: ErrorCode.INTERNAL_ERROR,
        message: `[KMS] Cannot unwrap DEK: Unknown key version '${keyVersion}'`,
      });
    }
    if (entry.metadata.status === 'REVOKED') {
      throw new AppError({
        code: ErrorCode.FORBIDDEN,
        message: `[KMS] Cannot unwrap DEK: Key version '${keyVersion}' is REVOKED`,
      });
    }

    try {
      const wrappedBuffer = Buffer.from(wrappedDekHex, 'hex');
      if (wrappedBuffer.length < 28) {
        throw new Error('Invalid wrapped key length');
      }

      const iv = wrappedBuffer.subarray(0, 12);
      const tag = wrappedBuffer.subarray(12, 28);
      const ciphertext = wrappedBuffer.subarray(28);

      const decipher = crypto.createDecipheriv('aes-256-gcm', entry.keyMaterial, iv);
      decipher.setAAD(Buffer.from(`BPL-KMS-WRAP-${keyVersion}`, 'utf8'));
      decipher.setAuthTag(tag);

      const decryptedDek = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      return decryptedDek;
    } catch (err: any) {
      throw new AppError({
        code: ErrorCode.FORBIDDEN,
        message: `[KMS] DEK Unwrap failed — cryptographic integrity violation or invalid key (${err.message})`,
      });
    }
  }

  /**
   * Rotates master KEK: creates a new active version (e.g. v1 -> v2).
   * Previous version transitions to ROTATED status (can still decrypt existing data).
   */
  async rotateKey(): Promise<{ previousVersion: string; newVersion: string }> {
    this._ensureAvailable();
    const previousVersion = this._activeVersion;
    const prevEntry = this._keyRing.get(previousVersion);

    if (prevEntry && prevEntry.metadata.status !== 'REVOKED') {
      prevEntry.metadata.status = 'ROTATED';
      prevEntry.metadata.rotatedAt = new Date();
    }

    const nextIndex = this._keyRing.size + 1;
    const newVersion = `v${nextIndex}`;
    const newKeyMaterial = crypto.randomBytes(32);

    this._keyRing.set(newVersion, {
      keyMaterial: newKeyMaterial,
      metadata: {
        keyId: `bpl-kms-root-${newVersion}`,
        version: newVersion,
        status: 'ACTIVE',
        algorithm: 'AES-256-GCM',
        createdAt: new Date(),
      },
    });

    this._activeVersion = newVersion;
    return { previousVersion, newVersion };
  }

  /**
   * Revokes a compromised key version. Immediately blocks further unwraps/decryptions under this key.
   */
  async revokeKey(version: string): Promise<void> {
    this._ensureAvailable();
    const entry = this._keyRing.get(version);
    if (!entry) {
      throw Errors.notFound(`Cannot revoke: Key version '${version}' does not exist`);
    }

    entry.metadata.status = 'REVOKED';
    entry.metadata.revokedAt = new Date();

    // If active key is revoked, auto-rotate to new key immediately
    if (this._activeVersion === version) {
      await this.rotateKey();
    }
  }

  /**
   * Injects availability fault for testing fail-closed behavior
   */
  setAvailability(isAvailable: boolean): void {
    this._isAvailable = isAvailable;
  }

  async checkAvailability(): Promise<boolean> {
    return this._isAvailable;
  }

  private _ensureAvailable(): void {
    if (!this._isAvailable) {
      throw new AppError({
        code: ErrorCode.DEPENDENCY_UNAVAILABLE,
        message: '[KMS] Key Management Service unavailable — failing closed',
      });
    }
  }
}

export default KeyManagementService;
