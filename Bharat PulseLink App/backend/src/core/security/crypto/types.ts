/**
 * Bharat PulseLink — Cryptographic Types & Data Classification
 *
 * Owned by: Patient Data Encryption & Cryptography Domain (Prompt 93)
 */

// ---------------------------------------------------------------------------
// Data Classification Matrix
// ---------------------------------------------------------------------------

export type DataClassification = 'PUBLIC' | 'INTERNAL' | 'SENSITIVE' | 'HIGHLY_SENSITIVE';

export const DATA_CLASSIFICATION = {
  PUBLIC: 'PUBLIC' as const,
  INTERNAL: 'INTERNAL' as const,
  SENSITIVE: 'SENSITIVE' as const,
  HIGHLY_SENSITIVE: 'HIGHLY_SENSITIVE' as const,
};

export interface FieldClassificationPolicy {
  classification: DataClassification;
  requiresFieldEncryption: boolean;
  requiresObjectStorageEncryption: boolean;
  requiresConsentForSharing: boolean;
  allowOfflineCache: boolean;
}

export const DATA_PROTECTION_MATRIX: Record<string, FieldClassificationPolicy> = {
  // Public
  'facility.name': { classification: 'PUBLIC', requiresFieldEncryption: false, requiresObjectStorageEncryption: false, requiresConsentForSharing: false, allowOfflineCache: true },
  'facility.address': { classification: 'PUBLIC', requiresFieldEncryption: false, requiresObjectStorageEncryption: false, requiresConsentForSharing: false, allowOfflineCache: true },

  // Internal
  'audit.request_id': { classification: 'INTERNAL', requiresFieldEncryption: false, requiresObjectStorageEncryption: false, requiresConsentForSharing: false, allowOfflineCache: false },
  'session.device_id': { classification: 'INTERNAL', requiresFieldEncryption: false, requiresObjectStorageEncryption: false, requiresConsentForSharing: false, allowOfflineCache: false },

  // Sensitive (PII / Demographic)
  'patient.full_name': { classification: 'SENSITIVE', requiresFieldEncryption: false, requiresObjectStorageEncryption: false, requiresConsentForSharing: true, allowOfflineCache: true },
  'patient.date_of_birth': { classification: 'SENSITIVE', requiresFieldEncryption: false, requiresObjectStorageEncryption: false, requiresConsentForSharing: true, allowOfflineCache: true },
  'patient.primary_phone': { classification: 'SENSITIVE', requiresFieldEncryption: false, requiresObjectStorageEncryption: false, requiresConsentForSharing: true, allowOfflineCache: true },
  'patient.aadhaar_masked': { classification: 'SENSITIVE', requiresFieldEncryption: false, requiresObjectStorageEncryption: false, requiresConsentForSharing: true, allowOfflineCache: true },
  'patient.emergency_contact': { classification: 'SENSITIVE', requiresFieldEncryption: true, requiresObjectStorageEncryption: false, requiresConsentForSharing: true, allowOfflineCache: true },

  // Highly Sensitive (PHI / Clinical / Financial / Biometrics)
  'clinical.allergies': { classification: 'HIGHLY_SENSITIVE', requiresFieldEncryption: true, requiresObjectStorageEncryption: false, requiresConsentForSharing: true, allowOfflineCache: true },
  'clinical.conditions': { classification: 'HIGHLY_SENSITIVE', requiresFieldEncryption: true, requiresObjectStorageEncryption: false, requiresConsentForSharing: true, allowOfflineCache: true },
  'clinical.medications': { classification: 'HIGHLY_SENSITIVE', requiresFieldEncryption: true, requiresObjectStorageEncryption: false, requiresConsentForSharing: true, allowOfflineCache: true },
  'clinical.surgeries': { classification: 'HIGHLY_SENSITIVE', requiresFieldEncryption: true, requiresObjectStorageEncryption: false, requiresConsentForSharing: true, allowOfflineCache: true },
  'records.report_file': { classification: 'HIGHLY_SENSITIVE', requiresFieldEncryption: true, requiresObjectStorageEncryption: true, requiresConsentForSharing: true, allowOfflineCache: false },
  'records.prescription_file': { classification: 'HIGHLY_SENSITIVE', requiresFieldEncryption: true, requiresObjectStorageEncryption: true, requiresConsentForSharing: true, allowOfflineCache: false },
  'insurance.policy_number': { classification: 'HIGHLY_SENSITIVE', requiresFieldEncryption: true, requiresObjectStorageEncryption: false, requiresConsentForSharing: true, allowOfflineCache: true },
};

// ---------------------------------------------------------------------------
// Canonical Versioned Encryption Envelope Format (BPL-ENC-v1)
// ---------------------------------------------------------------------------

export interface EncryptedEnvelope {
  /** Envelope format specification */
  version: 'BPL-ENC-v1';
  /** AEAD Primitive */
  algorithm: 'AES-256-GCM';
  /** Active KEK version used to wrap the DEK */
  keyVersion: string;
  /** 12-byte initialization vector / nonce (hex encoded) */
  nonce: string;
  /** Ciphertext (hex encoded) */
  ciphertext: string;
  /** 16-byte GCM authentication tag (hex encoded) */
  authTag: string;
  /** AAD schema version */
  aadVersion: 'v1';
  /** Encrypted DEK under KEK (hex encoded) */
  wrappedDek?: string;
  /** Supplemental SHA-256 plaintext integrity hash */
  integrityHash?: string;
}

// ---------------------------------------------------------------------------
// Authenticated Additional Data (AAD) / Context Binding
// ---------------------------------------------------------------------------

export interface EncryptionContext {
  patientId: string;
  recordId: string;
  recordType: string;
  schemaVersion?: string;
  encryptionVersion?: string;
  [key: string]: string | undefined;
}

// ---------------------------------------------------------------------------
// Key Management Interfaces
// ---------------------------------------------------------------------------

export interface KeyMetadata {
  keyId: string;
  version: string;
  status: 'ACTIVE' | 'ROTATED' | 'REVOKED';
  algorithm: 'AES-256-GCM';
  createdAt: Date;
  rotatedAt?: Date;
  revokedAt?: Date;
}

export interface IKeyManagementService {
  getActiveKeyVersion(): Promise<string>;
  getKeyMetadata(version: string): Promise<KeyMetadata>;
  wrapDataKey(dek: Buffer, keyVersion?: string): Promise<{ wrappedDek: string; keyVersion: string }>;
  unwrapDataKey(wrappedDek: string, keyVersion: string): Promise<Buffer>;
  rotateKey(): Promise<{ previousVersion: string; newVersion: string }>;
  revokeKey(version: string): Promise<void>;
  checkAvailability(): Promise<boolean>;
}
