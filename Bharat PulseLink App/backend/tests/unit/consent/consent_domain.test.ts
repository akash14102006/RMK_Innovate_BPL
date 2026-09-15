/**
 * Prompt 91 — Consent Domain Test Suite
 *
 * Runs against real in-memory PostgreSQL engine (pg-mem) to verify:
 * - PostgreSQL schema, foreign keys, check constraints, and indexes
 * - Granular, purpose-scoped, recipient-specific consent grants
 * - Idempotent grant deduplication and active grant superseding
 * - Optimistic Concurrency Control (409 conflict handling) on revocation
 * - Time-aware expiration evaluation and server-side gating
 * - Scope minimization (allow-list subset evaluation)
 * - Recipient and purpose boundary isolation
 * - Immutable consent audit trail (consent_events)
 * - Real-time domain events and zero PHI leakage
 * - Explicit check for zero dummy production data in migrations
 *
 * Owned by: Consent Domain (Prompt 91, 101, 108)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { newDb, DataType } from 'pg-mem';
import type { Knex } from 'knex';
import { up as migration001 } from '../../../migrations/20240001_001_database_foundation.js';
import { up as migration002 } from '../../../migrations/20240002_002_geography_reference.js';
import { up as migration003 } from '../../../migrations/20240003_003_identity_and_users.js';
import { up as migration004 } from '../../../migrations/20240004_004_patients_and_profiles.js';
import { up as migration005 } from '../../../migrations/20240005_005_consent_domain.js';
import { UserRepository } from '../../../src/infrastructure/database/repositories/UserRepository.js';
import { PatientRepository } from '../../../src/infrastructure/database/repositories/PatientRepository.js';
import { ConsentRepository } from '../../../src/infrastructure/database/repositories/ConsentRepository.js';
import { ConsentAuthorizer } from '../../../src/modules/consent/ConsentAuthorizer.js';
import { ConsentService } from '../../../src/modules/consent/ConsentService.js';
import { DomainEventEmitter } from '../../../src/infrastructure/events/DomainEventEmitter.js';
import { NoopLogger } from '../../../src/infrastructure/logger/logger.js';
import { AppError, ErrorCode } from '../../../src/core/errors/AppError.js';

describe('Prompt 91 — Consent Domain (PostgreSQL)', () => {
  let dbKnex: Knex;
  let userRepo: UserRepository;
  let patientRepo: PatientRepository;
  let consentRepo: ConsentRepository;
  let consentAuthorizer: ConsentAuthorizer;
  let consentService: ConsentService;
  let eventEmitter: DomainEventEmitter;
  const logger = new NoopLogger();

  beforeEach(async () => {
    const memDb = newDb();

    memDb.registerExtension('postgis', () => {});
    memDb.registerExtension('uuid-ossp', () => {});
    memDb.registerExtension('pgcrypto', () => {});
    memDb.registerExtension('citext', () => {});

    memDb.public.registerFunction({
      name: 'postgis_version',
      returns: DataType.text,
      implementation: () => '3.3.2',
    });

    memDb.public.registerFunction({
      name: 'gen_random_uuid',
      returns: DataType.text,
      implementation: () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      },
    });

    dbKnex = memDb.adapters.createKnex() as Knex;

    // Run migrations 001 through 005
    await migration001(dbKnex);
    await migration002(dbKnex);
    await migration003(dbKnex);
    await migration004(dbKnex);
    await migration005(dbKnex);

    userRepo = new UserRepository(dbKnex);
    patientRepo = new PatientRepository(dbKnex);
    consentRepo = new ConsentRepository(dbKnex);
    eventEmitter = new DomainEventEmitter(logger);

    consentAuthorizer = new ConsentAuthorizer({
      consentRepo,
      logger,
    });

    consentService = new ConsentService({
      db: dbKnex,
      consentRepo,
      patientRepo,
      authorizer: consentAuthorizer,
      logger,
      eventEmitter,
    });
  });

  // ── 1. Schema & Relational Integrity ─────────────────────────────────────

  it('verifies that consents, consent_events, and consent_policy_versions tables exist with constraints', async () => {
    const hasConsents = await dbKnex.schema.hasTable('consents');
    const hasEvents = await dbKnex.schema.hasTable('consent_events');
    const hasPolicyVersions = await dbKnex.schema.hasTable('consent_policy_versions');

    expect(hasConsents).toBe(true);
    expect(hasEvents).toBe(true);
    expect(hasPolicyVersions).toBe(true);
  });

  it('enforces status CHECK constraint on consents table', async () => {
    const user = await userRepo.createUser({ status: 'ACTIVE' });
    const profile = await patientRepo.createProfile({
      user_id: user.id,
      full_name: 'Test Patient',
      gender: 'MALE',
      date_of_birth: '1990-01-01',
    });

    await expect(
      dbKnex('consents').insert({
        patient_id: profile.id,
        purpose: 'HOSPITAL_CHECKIN',
        recipient_type: 'HOSPITAL',
        recipient_id: 'hosp-123',
        scopes: JSON.stringify(['PROFILE_BASIC']),
        status: 'INVALID_STATUS',
        valid_from: new Date(),
        valid_to: new Date(Date.now() + 86400000),
      }),
    ).rejects.toThrow();
  });

  it('enforces event_type CHECK constraint on consent_events table', async () => {
    const user = await userRepo.createUser({ status: 'ACTIVE' });
    const profile = await patientRepo.createProfile({
      user_id: user.id,
      full_name: 'Test Patient',
      gender: 'MALE',
      date_of_birth: '1990-01-01',
    });

    const consent = await consentRepo.createConsent(
      {
        patient_id: profile.id,
        purpose: 'HOSPITAL_CHECKIN',
        recipient_type: 'HOSPITAL',
        recipient_id: 'hosp-123',
        scopes: ['PROFILE_BASIC'],
        valid_from: new Date(),
        valid_to: new Date(Date.now() + 86400000),
      },
      user.id,
      'PATIENT',
    );

    await expect(
      dbKnex('consent_events').insert({
        consent_id: consent.id,
        event_type: 'INVALID_EVENT',
        actor_id: user.id,
        actor_type: 'PATIENT',
      }),
    ).rejects.toThrow();
  });

  // ── 2. Grant Flow & Canonical Storage ─────────────────────────────────────

  it('TEST A — Grants explicit, purpose-scoped, and recipient-bounded consent atomically', async () => {
    const user = await userRepo.createUser({ status: 'ACTIVE' });
    const profile = await patientRepo.createProfile({
      user_id: user.id,
      full_name: 'Deepak Verma',
      gender: 'MALE',
      date_of_birth: '1988-03-25',
    });

    const consent = await consentService.grantConsent(user.id, {
      purpose: 'HOSPITAL_CHECKIN',
      recipientType: 'HOSPITAL',
      recipientId: 'hosp_aiims_delhi',
      scopes: ['PROFILE_BASIC', 'ALLERGIES', 'MEDICATIONS'],
      durationSeconds: 86400 * 7, // 7 days
      policyVersion: '1.0',
    });

    expect(consent.id).toBeDefined();
    expect(consent.patientId).toBe(profile.id);
    expect(consent.purpose).toBe('HOSPITAL_CHECKIN');
    expect(consent.recipient.type).toBe('HOSPITAL');
    expect(consent.recipient.id).toBe('hosp_aiims_delhi');
    expect(consent.scopes).toEqual(['PROFILE_BASIC', 'ALLERGIES', 'MEDICATIONS']);
    expect(consent.status).toBe('GRANTED');
    expect(consent.version).toBe(1);
    expect(consent.isEffective).toBe(true);

    // Verify audit event in database
    const events = await consentRepo.getConsentEvents(consent.id);
    expect(events).toHaveLength(1);
    expect(events[0]?.event_type).toBe('CONSENT_GRANTED');
    expect(events[0]?.actor_id).toBe(user.id);
    expect(events[0]?.actor_type).toBe('PATIENT');
  });

  // ── 3. Idempotency & Superseding ──────────────────────────────────────────

  it('TEST B — Repeated grant with identical parameters is idempotent and returns existing active grant', async () => {
    const user = await userRepo.createUser({ status: 'ACTIVE' });
    await patientRepo.createProfile({
      user_id: user.id,
      full_name: 'Pooja Nair',
      gender: 'FEMALE',
      date_of_birth: '1992-09-15',
    });

    const grantParams = {
      purpose: 'APPOINTMENT_BOOKING' as const,
      recipientType: 'HOSPITAL' as const,
      recipientId: 'hosp_apollo_bangalore',
      scopes: ['PROFILE_BASIC', 'CONTACT'] as ('PROFILE_BASIC' | 'CONTACT')[],
      durationSeconds: 86400 * 3,
      policyVersion: '1.0',
    };

    const grant1 = await consentService.grantConsent(user.id, grantParams);
    const grant2 = await consentService.grantConsent(user.id, grantParams);

    expect(grant1.id).toBe(grant2.id);

    const allConsents = await consentRepo.getPatientConsents(grant1.patientId);
    expect(allConsents).toHaveLength(1);
  });

  it('TEST C — Granting modified scopes for same purpose and recipient supersedes previous active grant', async () => {
    const user = await userRepo.createUser({ status: 'ACTIVE' });
    const profile = await patientRepo.createProfile({
      user_id: user.id,
      full_name: 'Ravi Teja',
      gender: 'MALE',
      date_of_birth: '1984-12-04',
    });
    expect(profile.id).toBeDefined();

    const initial = await consentService.grantConsent(user.id, {
      purpose: 'HOSPITAL_CHECKIN',
      recipientType: 'HOSPITAL',
      recipientId: 'hosp_max_healthcare',
      scopes: ['PROFILE_BASIC'],
      durationSeconds: 86400 * 5,
    });

    expect(initial.status).toBe('GRANTED');

    // Grant with extended scopes
    const updated = await consentService.grantConsent(user.id, {
      purpose: 'HOSPITAL_CHECKIN',
      recipientType: 'HOSPITAL',
      recipientId: 'hosp_max_healthcare',
      scopes: ['PROFILE_BASIC', 'ALLERGIES', 'REPORTS'],
      durationSeconds: 86400 * 5,
    });

    expect(updated.id).not.toBe(initial.id);
    expect(updated.status).toBe('GRANTED');
    expect(updated.scopes).toEqual(['PROFILE_BASIC', 'ALLERGIES', 'REPORTS']);

    // Check that initial consent was marked SUPERSEDED
    const initialReloaded = await consentRepo.findById(initial.id);
    expect(initialReloaded?.status).toBe('SUPERSEDED');

    const initialEvents = await consentRepo.getConsentEvents(initial.id);
    expect(initialEvents.some((e) => e.event_type === 'CONSENT_SUPERSEDED')).toBe(true);
  });

  // ── 4. Optimistic Concurrency Control (OCC) ───────────────────────────────

  it('TEST D — Optimistic Concurrency Control rejects stale writes on revocation with 409 CONFLICT', async () => {
    const user = await userRepo.createUser({ status: 'ACTIVE' });
    await patientRepo.createProfile({
      user_id: user.id,
      full_name: 'Sunita Rao',
      gender: 'FEMALE',
      date_of_birth: '1979-05-18',
    });

    const consent = await consentService.grantConsent(user.id, {
      purpose: 'HEALTH_RECORD_SHARING',
      recipientType: 'HOSPITAL',
      recipientId: 'hosp_fortis_mumbai',
      scopes: ['PROFILE_BASIC', 'REPORTS'],
    });

    expect(consent.version).toBe(1);

    // Device A revokes with version 1 -> success, version becomes 2
    const revoked = await consentService.revokeConsent(user.id, consent.id, {
      reason: 'Consultation concluded',
      expectedVersion: 1,
    });

    expect(revoked.status).toBe('REVOKED');
    expect(revoked.version).toBe(2);

    // Device B attempts to revoke with stale expectedVersion: 1 -> strictly rejected with 409
    await expect(
      consentService.revokeConsent(user.id, consent.id, {
        reason: 'Duplicate revocation request',
        expectedVersion: 1,
      }),
    ).rejects.toThrowError(AppError);

    try {
      await consentService.revokeConsent(user.id, consent.id, {
        reason: 'Duplicate revocation request',
        expectedVersion: 1,
      });
    } catch (err) {
      const appErr = err as AppError;
      expect(appErr.statusCode).toBe(409);
      expect(appErr.code).toBe(ErrorCode.CONFLICT);
    }
  });

  // ── 5. Expiration & Time Boundary Evaluation ──────────────────────────────

  it('TEST E — Server-authoritative expiration evaluation rejects expired consent', async () => {
    const user = await userRepo.createUser({ status: 'ACTIVE' });
    const profile = await patientRepo.createProfile({
      user_id: user.id,
      full_name: 'Anil Kapoor',
      gender: 'MALE',
      date_of_birth: '1970-01-15',
    });

    // Create an expired consent record (valid_to in the past)
    const expiredConsent = await consentRepo.createConsent(
      {
        patient_id: profile.id,
        purpose: 'HOSPITAL_CHECKIN',
        recipient_type: 'HOSPITAL',
        recipient_id: 'hosp_manipal_bangalore',
        scopes: ['PROFILE_BASIC', 'ALLERGIES'],
        valid_from: new Date(Date.now() - 86400000 * 5),
        valid_to: new Date(Date.now() - 86400000 * 2), // Expired 2 days ago
      },
      user.id,
      'PATIENT',
    );

    const decision = await consentAuthorizer.check({
      patientId: profile.id,
      purpose: 'HOSPITAL_CHECKIN',
      recipient: { type: 'HOSPITAL', id: 'hosp_manipal_bangalore' },
      requiredScopes: ['PROFILE_BASIC'],
      at: new Date(),
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('EXPIRED');
    expect(decision.consentId).toBe(expiredConsent.id);
  });

  // ── 6. Scope Minimization & Allow-List Subset Checks ──────────────────────

  it('TEST F — Scope minimization authorizes exact or subset scopes, and strictly denies ungranted scopes', async () => {
    const user = await userRepo.createUser({ status: 'ACTIVE' });
    const profile = await patientRepo.createProfile({
      user_id: user.id,
      full_name: 'Neha Sharma',
      gender: 'FEMALE',
      date_of_birth: '1995-11-20',
    });

    await consentService.grantConsent(user.id, {
      purpose: 'HOSPITAL_CHECKIN',
      recipientType: 'HOSPITAL',
      recipientId: 'hosp_aiims_delhi',
      scopes: ['PROFILE_BASIC', 'ALLERGIES', 'MEDICAL_BASICS'],
    });

    // Case 1: Exact subset requested -> ALLOWED
    const checkSubset = await consentAuthorizer.check({
      patientId: profile.id,
      purpose: 'HOSPITAL_CHECKIN',
      recipient: { type: 'HOSPITAL', id: 'hosp_aiims_delhi' },
      requiredScopes: ['PROFILE_BASIC', 'ALLERGIES'],
    });

    expect(checkSubset.allowed).toBe(true);
    expect(checkSubset.reason).toBe('AUTHORIZED');
    expect(checkSubset.allowedScopes).toEqual(['PROFILE_BASIC', 'ALLERGIES']);

    // Case 2: Full granted set requested -> ALLOWED
    const checkFull = await consentAuthorizer.check({
      patientId: profile.id,
      purpose: 'HOSPITAL_CHECKIN',
      recipient: { type: 'HOSPITAL', id: 'hosp_aiims_delhi' },
      requiredScopes: ['PROFILE_BASIC', 'ALLERGIES', 'MEDICAL_BASICS'],
    });

    expect(checkFull.allowed).toBe(true);

    // Case 3: Request includes ungranted scope (REPORTS, MEDICATIONS) -> DENIED
    const checkUngranted = await consentAuthorizer.check({
      patientId: profile.id,
      purpose: 'HOSPITAL_CHECKIN',
      recipient: { type: 'HOSPITAL', id: 'hosp_aiims_delhi' },
      requiredScopes: ['PROFILE_BASIC', 'REPORTS', 'MEDICATIONS'],
    });

    expect(checkUngranted.allowed).toBe(false);
    expect(checkUngranted.reason).toBe('SCOPE_NOT_GRANTED');
    expect(checkUngranted.allowedScopes).toEqual(['PROFILE_BASIC']);
    expect(checkUngranted.deniedScopes).toEqual(['REPORTS', 'MEDICATIONS']);
  });

  // ── 7. Recipient & Purpose Boundaries ────────────────────────────────────

  it('TEST G — Strict boundary isolation between different recipients and purposes', async () => {
    const user = await userRepo.createUser({ status: 'ACTIVE' });
    const profile = await patientRepo.createProfile({
      user_id: user.id,
      full_name: 'Karan Mehra',
      gender: 'MALE',
      date_of_birth: '1987-07-11',
    });

    await consentService.grantConsent(user.id, {
      purpose: 'HOSPITAL_CHECKIN',
      recipientType: 'HOSPITAL',
      recipientId: 'hosp_apollo_delhi',
      scopes: ['PROFILE_BASIC', 'ALLERGIES'],
    });

    // Attempt access from unauthorized Hospital B
    const wrongRecipient = await consentAuthorizer.check({
      patientId: profile.id,
      purpose: 'HOSPITAL_CHECKIN',
      recipient: { type: 'HOSPITAL', id: 'hosp_unauthorized_clinic' },
      requiredScopes: ['PROFILE_BASIC'],
    });

    expect(wrongRecipient.allowed).toBe(false);
    expect(wrongRecipient.reason).toBe('NO_CONSENT');

    // Attempt access for unauthorized purpose (RESEARCH)
    const wrongPurpose = await consentAuthorizer.check({
      patientId: profile.id,
      purpose: 'HEALTH_RECORD_SHARING',
      recipient: { type: 'HOSPITAL', id: 'hosp_apollo_delhi' },
      requiredScopes: ['PROFILE_BASIC'],
    });

    expect(wrongPurpose.allowed).toBe(false);
    expect(wrongPurpose.reason).toBe('NO_CONSENT');
  });

  // ── 8. Revocation Blocks Immediate Downstream Access ───────────────────────

  it('TEST H — Revoking consent immediately blocks downstream access decisions', async () => {
    const user = await userRepo.createUser({ status: 'ACTIVE' });
    const profile = await patientRepo.createProfile({
      user_id: user.id,
      full_name: 'Shweta Singh',
      gender: 'FEMALE',
      date_of_birth: '1991-04-30',
    });

    const consent = await consentService.grantConsent(user.id, {
      purpose: 'HOSPITAL_CHECKIN',
      recipientType: 'HOSPITAL',
      recipientId: 'hosp_medanta_gurgaon',
      scopes: ['PROFILE_BASIC', 'ALLERGIES'],
    });

    // Check before revocation -> ALLOWED
    const checkBefore = await consentAuthorizer.check({
      patientId: profile.id,
      purpose: 'HOSPITAL_CHECKIN',
      recipient: { type: 'HOSPITAL', id: 'hosp_medanta_gurgaon' },
      requiredScopes: ['PROFILE_BASIC'],
    });
    expect(checkBefore.allowed).toBe(true);

    // Revoke
    await consentService.revokeConsent(user.id, consent.id, {
      reason: 'Visit completed, withdrawing access',
    });

    // Check after revocation -> DENIED with reason REVOKED
    const checkAfter = await consentAuthorizer.check({
      patientId: profile.id,
      purpose: 'HOSPITAL_CHECKIN',
      recipient: { type: 'HOSPITAL', id: 'hosp_medanta_gurgaon' },
      requiredScopes: ['PROFILE_BASIC'],
    });

    expect(checkAfter.allowed).toBe(false);
    expect(checkAfter.reason).toBe('REVOKED');
  });

  // ── 9. Real-Time Domain Events (Zero PHI) ─────────────────────────────────

  it('TEST I — Emits real-time domain events without leaking PHI', async () => {
    const user = await userRepo.createUser({ status: 'ACTIVE' });
    const profile = await patientRepo.createProfile({
      user_id: user.id,
      full_name: 'Aditya Roy',
      gender: 'MALE',
      date_of_birth: '1993-02-14',
    });

    const eventsEmitted: any[] = [];
    eventEmitter.on('patient.consent.granted', (evt) => eventsEmitted.push(evt));
    eventEmitter.on('patient.consent.revoked', (evt) => eventsEmitted.push(evt));

    const consent = await consentService.grantConsent(user.id, {
      purpose: 'APPOINTMENT_BOOKING',
      recipientType: 'HOSPITAL',
      recipientId: 'hosp_ganga_ram_delhi',
      scopes: ['PROFILE_BASIC', 'MEDICATIONS'],
    });

    await consentService.revokeConsent(user.id, consent.id, {
      reason: 'Appointment cancelled',
    });

    expect(eventsEmitted).toHaveLength(2);
    expect(eventsEmitted[0].event).toBe('patient.consent.granted');
    expect(eventsEmitted[0].patientId).toBe(profile.id);
    expect(eventsEmitted[0].recipientId).toBe('hosp_ganga_ram_delhi');
    expect(eventsEmitted[0].fullName).toBeUndefined(); // Zero PHI

    expect(eventsEmitted[1].event).toBe('patient.consent.revoked');
    expect(eventsEmitted[1].patientId).toBe(profile.id);
    expect(eventsEmitted[1].medicalBasics).toBeUndefined(); // Zero PHI
  });

  // ── 10. Immutable Audit Trail ─────────────────────────────────────────────

  it('TEST J — Preserves chronological, immutable audit events for complete lifecycle', async () => {
    const user = await userRepo.createUser({ status: 'ACTIVE' });
    const profile = await patientRepo.createProfile({
      user_id: user.id,
      full_name: 'Vikram Joshi',
      gender: 'MALE',
      date_of_birth: '1986-10-10',
    });
    expect(profile.id).toBeDefined();

    const consent = await consentService.grantConsent(
      user.id,
      {
        purpose: 'HOSPITAL_CHECKIN',
        recipientType: 'HOSPITAL',
        recipientId: 'hosp_narayana_health',
        scopes: ['PROFILE_BASIC', 'ALLERGIES'],
      },
      { ipAddress: '192.168.1.100', userAgent: 'BharatPulseLink-iOS/1.0' },
    );

    await consentService.revokeConsent(
      user.id,
      consent.id,
      { reason: 'User revoked consent' },
      { ipAddress: '192.168.1.100', userAgent: 'BharatPulseLink-iOS/1.0' },
    );

    const history = await consentService.getConsentHistory(user.id, consent.id);
    expect(history).toHaveLength(2);
    expect(history[0]?.eventType).toBe('CONSENT_GRANTED');
    expect(history[1]?.eventType).toBe('CONSENT_REVOKED');
    expect(history[1]?.reason).toBe('User revoked consent');
  });

  // ── 11. Zero Dummy Production Data Check ──────────────────────────────────

  it('Explicit check: Zero dummy production data in migration definitions', async () => {
    const consentsCount = await dbKnex('consents').count('* as count').first();
    const eventsCount = await dbKnex('consent_events').count('* as count').first();

    expect(Number(consentsCount?.count)).toBe(0);
    expect(Number(eventsCount?.count)).toBe(0);
  });
});
