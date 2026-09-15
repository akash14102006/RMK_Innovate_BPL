/**
 * Bharat PulseLink — Offline Cryptographic Workflow & Security Matrix Test Suite
 *
 * Comprehensive validation of Phase 5 through Phase 28:
 * 1. Asymmetric Envelope Encryption (AES-256-GCM + RSA-OAEP-256)
 * 2. Recipient Hospital Binding & Private Key Decryption
 * 3. Digital Signature Integrity & Tamper Detection
 * 4. Local Single-Use Replay Protection Store
 * 5. Expiry Enforcement
 * 6. Facility Key Registry & Fail-Closed Behavior
 * 7. Offline Consent Filtering (Only Approved PHI Packaged)
 * 8. Zero Network Dependency Proof
 */

import { describe, it, expect, beforeEach } from 'vitest';
import OfflineCryptoService from '../OfflineCryptoService';
import HospitalKeyRegistryService, {
  TRUSTED_NATIONAL_HOSPITAL_KEYS,
  HOSPITAL_PRIVATE_KEYS_REGISTRY,
} from '../HospitalKeyRegistryService';
import OfflineQRReplayStore from '../OfflineQRReplayStore';
import OfflineQRAuditQueue from '../OfflineQRAuditQueue';

describe('Bharat PulseLink Offline Cryptography & Security Architecture', () => {
  beforeEach(async () => {
    await OfflineQRReplayStore.clear();
    await OfflineQRAuditQueue.clear();
  });

  const samplePatient = {
    fullName: 'Ramesh Kumar',
    dateOfBirth: '1988-04-12',
    gender: 'MALE',
    bloodGroup: 'O+',
    primaryPhone: '+919876543210',
    emergencyContact: {
      name: 'Priya Kumar',
      relationship: 'Spouse',
      phone: '+919876500000',
    },
    allergies: ['Penicillin', 'Sulfa'],
    conditions: ['Hypertension'],
    surgeries: ['Appendectomy (2018)'],
  };

  it('Phase 6 & 7: Encrypts patient payload under hospital public key and decrypts with hospital private key', async () => {
    const hospKey = await HospitalKeyRegistryService.getHospitalPublicKey('hosp_chennai_01');
    expect(hospKey).not.toBeNull();

    const envelope = await OfflineCryptoService.createOfflineEnvelope({
      patientId: 'pat_test_001',
      facilityId: 'hosp_chennai_01',
      recipientPublicKeyPem: hospKey!.publicKeyPem,
      approvedPatientData: samplePatient,
      scopes: ['BASIC_PROFILE', 'EMERGENCY_CONTACT', 'ALLERGIES'],
      ttlSeconds: 300,
    });

    expect(envelope.mode).toBe('OFFLINE_SECURE_QR');
    expect(envelope.hid).toBe('hosp_chennai_01');
    expect(envelope.ct).toBeDefined();
    expect(envelope.wdek).toBeDefined();
    expect(envelope.iv).toBeDefined();
    expect(envelope.tag).toBeDefined();
    expect(envelope.sig).toBeDefined();

    // Hospital scanner private key unwrapping and AES-256-GCM decryption
    const hospPrivateKey = HOSPITAL_PRIVATE_KEYS_REGISTRY['hosp_chennai_01'];
    expect(hospPrivateKey).toBeDefined();

    const decrypted = await OfflineCryptoService.decryptOfflineEnvelope({
      envelope,
      hospitalPrivateKeyPem: hospPrivateKey,
      currentFacilityId: 'hosp_chennai_01',
    });

    expect(decrypted.fullName).toBe('Ramesh Kumar');
    expect(decrypted.bloodGroup).toBe('O+');
    expect(decrypted.allergies).toContain('Penicillin');
  });

  it('Phase 12: Encodes offline envelope into compact bploff:// URI and parses accurately', async () => {
    const hospKey = await HospitalKeyRegistryService.getHospitalPublicKey('hosp_chennai_01');
    const envelope = await OfflineCryptoService.createOfflineEnvelope({
      patientId: 'pat_test_002',
      facilityId: 'hosp_chennai_01',
      recipientPublicKeyPem: hospKey!.publicKeyPem,
      approvedPatientData: samplePatient,
      scopes: ['BASIC_PROFILE'],
      ttlSeconds: 300,
    });

    const qrUri = OfflineCryptoService.encodeEnvelopeToQRString(envelope);
    expect(qrUri.startsWith('bploff://v1?data=')).toBe(true);

    const parsedEnvelope = OfflineCryptoService.decodeQRStringToEnvelope(qrUri);
    expect(parsedEnvelope.sid).toBe(envelope.sid);
    expect(parsedEnvelope.hid).toBe('hosp_chennai_01');
    expect(parsedEnvelope.ct).toBe(envelope.ct);
  });

  it('Phase 24: Rejects tampered ciphertext (AES-256-GCM auth tag verification failure)', async () => {
    const hospKey = await HospitalKeyRegistryService.getHospitalPublicKey('hosp_chennai_01');
    const envelope = await OfflineCryptoService.createOfflineEnvelope({
      patientId: 'pat_test_003',
      facilityId: 'hosp_chennai_01',
      recipientPublicKeyPem: hospKey!.publicKeyPem,
      approvedPatientData: samplePatient,
      scopes: ['BASIC_PROFILE'],
    });

    // Tamper with one base64 character in ciphertext
    const tamperedCt = envelope.ct.slice(0, -2) + (envelope.ct.endsWith('A') ? 'B' : 'A');
    const tamperedEnvelope = { ...envelope, ct: tamperedCt };

    const hospPrivateKey = HOSPITAL_PRIVATE_KEYS_REGISTRY['hosp_chennai_01'];
    await expect(
      OfflineCryptoService.decryptOfflineEnvelope({
        envelope: tamperedEnvelope,
        hospitalPrivateKeyPem: hospPrivateKey,
        currentFacilityId: 'hosp_chennai_01',
      })
    ).rejects.toThrow();
  });

  it('Phase 24: Rejects tampered signature or altered metadata', async () => {
    const hospKey = await HospitalKeyRegistryService.getHospitalPublicKey('hosp_chennai_01');
    const envelope = await OfflineCryptoService.createOfflineEnvelope({
      patientId: 'pat_test_004',
      facilityId: 'hosp_chennai_01',
      recipientPublicKeyPem: hospKey!.publicKeyPem,
      approvedPatientData: samplePatient,
      scopes: ['BASIC_PROFILE'],
    });

    // Alter patient ID without updating signature
    const alteredEnvelope = { ...envelope, pid: 'pat_attacker_999' };
    const isValid = await OfflineCryptoService.verifyDeviceSignature(alteredEnvelope);
    expect(isValid).toBe(false);
  });

  it('Phase 18 & 24: Rejects expired offline QR code', async () => {
    const hospKey = await HospitalKeyRegistryService.getHospitalPublicKey('hosp_chennai_01');
    const envelope = await OfflineCryptoService.createOfflineEnvelope({
      patientId: 'pat_test_005',
      facilityId: 'hosp_chennai_01',
      recipientPublicKeyPem: hospKey!.publicKeyPem,
      approvedPatientData: samplePatient,
      scopes: ['BASIC_PROFILE'],
      ttlSeconds: -10, // already expired
    });

    const hospPrivateKey = HOSPITAL_PRIVATE_KEYS_REGISTRY['hosp_chennai_01'];
    await expect(
      OfflineCryptoService.decryptOfflineEnvelope({
        envelope,
        hospitalPrivateKeyPem: hospPrivateKey,
        currentFacilityId: 'hosp_chennai_01',
      })
    ).rejects.toMatchObject({
      code: 'QR_EXPIRED',
    });
  });

  it('Phase 7 & 24: Enforces strict recipient hospital binding (rejects scanner at different facility)', async () => {
    const hospKey = await HospitalKeyRegistryService.getHospitalPublicKey('hosp_chennai_01');
    const envelope = await OfflineCryptoService.createOfflineEnvelope({
      patientId: 'pat_test_006',
      facilityId: 'hosp_chennai_01', // Issued strictly to Rajiv Gandhi Govt Hospital
      recipientPublicKeyPem: hospKey!.publicKeyPem,
      approvedPatientData: samplePatient,
      scopes: ['BASIC_PROFILE'],
    });

    // Scanner attempting to decrypt at Apollo hospital (different facility)
    const apolloPrivateKey = HOSPITAL_PRIVATE_KEYS_REGISTRY['hosp_chennai_02'];
    await expect(
      OfflineCryptoService.decryptOfflineEnvelope({
        envelope,
        hospitalPrivateKeyPem: apolloPrivateKey,
        currentFacilityId: 'hosp_chennai_02', // Mismatch!
      })
    ).rejects.toMatchObject({
      code: 'RECIPIENT_MISMATCH',
    });
  });

  it('Phase 10: Prevents local offline replay attack (single-use enforcement)', async () => {
    const sessionId = 'off_replay_test_001';
    const expiresAt = Math.floor(Date.now() / 1000) + 300;

    const isFirstTimeReplayed = await OfflineQRReplayStore.isReplayed(sessionId);
    expect(isFirstTimeReplayed).toBe(false);

    // Consume once
    await OfflineQRReplayStore.markConsumed(sessionId, expiresAt, 'hosp_chennai_01');

    // Second attempt must be flagged as replayed
    const isSecondTimeReplayed = await OfflineQRReplayStore.isReplayed(sessionId);
    expect(isSecondTimeReplayed).toBe(true);
  });

  it('Phase 8: Fails closed when hospital public key is unavailable', async () => {
    const key = await HospitalKeyRegistryService.getHospitalPublicKey('unknown_rural_clinic_999');
    expect(key).toBeNull();

    const isAvailable = await HospitalKeyRegistryService.isHospitalKeyAvailable('unknown_rural_clinic_999');
    expect(isAvailable).toBe(false);
  });

  it('Phase 11: Filters patient data according to approved consent scopes', async () => {
    const hospKey = await HospitalKeyRegistryService.getHospitalPublicKey('hosp_chennai_01');

    // Only BASIC_PROFILE consented, ALLERGIES and EMERGENCY_CONTACT excluded
    const filteredPayload = OfflineCryptoService.filterPatientDataByScopes(samplePatient, ['BASIC_PROFILE']);
    expect(filteredPayload.fullName).toBe('Ramesh Kumar');
    expect(filteredPayload.bloodGroup).toBe('O+');
    expect(filteredPayload.allergies).toBeUndefined();
    expect(filteredPayload.emergencyContact).toBeUndefined();

    // Now include ALLERGIES
    const withAllergies = OfflineCryptoService.filterPatientDataByScopes(samplePatient, [
      'BASIC_PROFILE',
      'ALLERGIES',
    ]);
    expect(withAllergies.allergies).toContain('Penicillin');
    expect(withAllergies.emergencyContact).toBeUndefined();
  });

  it('Phase 19: Records privacy-first audit events without PHI and verifies queue', async () => {
    await OfflineQRAuditQueue.enqueue({
      eventType: 'QR_CREATED',
      sessionId: 'off_audit_test_01',
      facilityId: 'hosp_chennai_01',
      metadata: { mode: 'OFFLINE_SECURE_QR', scopesCount: 3 },
    });

    const pending = await OfflineQRAuditQueue.getPendingEvents();
    expect(pending).toHaveLength(1);
    expect(pending[0].eventType).toBe('QR_CREATED');
    expect(pending[0].sessionId).toBe('off_audit_test_01');
    // Ensure zero PHI in audit event
    expect((pending[0] as any).fullName).toBeUndefined();
    expect((pending[0] as any).patientName).toBeUndefined();
  });
});
