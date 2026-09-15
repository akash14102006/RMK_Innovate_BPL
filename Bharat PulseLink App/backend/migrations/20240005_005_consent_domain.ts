/**
 * Migration 005 — Consent Domain (ABDM Consent Manager)
 *
 * Establishes:
 * - consent_policy_versions: Versioned legal, privacy, and sharing policies
 * - consents: Canonical patient-controlled, versioned, purpose- and scope-specific consent records
 * - consent_events: Immutable audit trail of all consent lifecycle events
 *
 * Owned by: Consent Domain (Prompt 91, 101 §28, §82)
 */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // ── 1. Consent Policy Versions ──────────────────────────────────────────
  await knex.schema.createTable('consent_policy_versions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('policy_type', 100).notNullable(); // e.g. 'TERMS_OF_SERVICE', 'PRIVACY_POLICY', 'HOSPITAL_DATA_SHARING', 'EMERGENCY_ACCESS'
    t.string('version', 50).notNullable(); // e.g. '1.0', '2.0'
    t.string('content_hash', 128).notNullable(); // SHA-256 hash of policy text
    t.string('title', 255).notNullable();
    t.timestamp('effective_from', { useTz: true }).notNullable();
    t.timestamp('effective_until', { useTz: true }).nullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.unique(['policy_type', 'version']);
    t.index(['policy_type', 'effective_from']);
  });

  // ── 2. Consents ─────────────────────────────────────────────────────────
  await knex.schema.createTable('consents', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('patient_id').notNullable().references('id').inTable('patient_profiles').onDelete('RESTRICT');
    t.string('purpose', 100).notNullable(); // e.g. 'HOSPITAL_CHECKIN', 'APPOINTMENT_BOOKING', 'HEALTH_RECORD_SHARING'
    t.string('recipient_type', 50).notNullable().defaultTo('HOSPITAL'); // 'HOSPITAL', 'DOCTOR', 'CARE_PROVIDER', 'SYSTEM', 'EMERGENCY_SERVICE', 'SPECIFIC_PROVIDER'
    t.string('recipient_id', 128).notNullable(); // Canonical hospital ID or provider identifier
    t.uuid('granted_to_facility_id').nullable(); // Facility UUID reference where applicable
    t.jsonb('scopes').notNullable(); // Array of data categories: ['PROFILE_BASIC', 'ALLERGIES', 'MEDICATIONS', etc.]
    t.string('policy_version', 50).notNullable().defaultTo('1.0');
    t.string('policy_hash', 128).nullable();
    t.string('status', 30).notNullable().defaultTo('GRANTED'); // 'PENDING', 'GRANTED', 'REVOKED', 'EXPIRED', 'DENIED', 'SUPERSEDED'
    t.integer('version').notNullable().defaultTo(1); // Optimistic Concurrency Control
    t.timestamp('valid_from', { useTz: true }).notNullable();
    t.timestamp('valid_to', { useTz: true }).notNullable();
    t.timestamp('granted_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('revoked_at', { useTz: true }).nullable();
    t.text('revocation_reason').nullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index(['patient_id', 'status']);
    t.index(['patient_id', 'purpose', 'recipient_id']);
    t.index(['valid_to', 'status']);
  });

  // Check constraints on consents
  await knex.raw(`
    ALTER TABLE consents
      ADD CONSTRAINT chk_consents_status
      CHECK (status IN ('PENDING', 'GRANTED', 'REVOKED', 'EXPIRED', 'DENIED', 'SUPERSEDED'));
  `);

  await knex.raw(`
    ALTER TABLE consents
      ADD CONSTRAINT chk_consents_recipient_type
      CHECK (recipient_type IN ('HOSPITAL', 'DOCTOR', 'CARE_PROVIDER', 'SYSTEM', 'EMERGENCY_SERVICE', 'SPECIFIC_PROVIDER'));
  `);

  // ── 3. Consent Events (Immutable Audit Trail) ───────────────────────────
  await knex.schema.createTable('consent_events', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('consent_id').notNullable().references('id').inTable('consents').onDelete('RESTRICT');
    t.string('event_type', 50).notNullable(); // 'CONSENT_REQUESTED', 'CONSENT_VIEWED', 'CONSENT_GRANTED', 'CONSENT_DENIED', 'CONSENT_REVOKED', 'CONSENT_EXPIRED', 'CONSENT_SUPERSEDED', 'CONSENT_SCOPE_CHANGED'
    t.string('actor_id', 128).notNullable();
    t.string('actor_type', 30).notNullable(); // 'PATIENT', 'AUTHORIZED_CAREGIVER', 'SYSTEM', 'HOSPITAL', 'ADMIN', 'EMERGENCY_PROCESS'
    t.text('reason').nullable();
    t.string('ip_address', 45).nullable();
    t.text('user_agent').nullable();
    t.jsonb('metadata').nullable();
    t.timestamp('timestamp', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index(['consent_id', 'timestamp']);
    t.index(['actor_id', 'timestamp']);
  });

  await knex.raw(`
    ALTER TABLE consent_events
      ADD CONSTRAINT chk_consent_events_type
      CHECK (event_type IN ('CONSENT_REQUESTED', 'CONSENT_VIEWED', 'CONSENT_GRANTED', 'CONSENT_DENIED', 'CONSENT_REVOKED', 'CONSENT_EXPIRED', 'CONSENT_SUPERSEDED', 'CONSENT_SCOPE_CHANGED'));
  `);

  await knex.raw(`
    ALTER TABLE consent_events
      ADD CONSTRAINT chk_consent_events_actor_type
      CHECK (actor_type IN ('PATIENT', 'AUTHORIZED_CAREGIVER', 'SYSTEM', 'HOSPITAL', 'ADMIN', 'EMERGENCY_PROCESS'));
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('consent_events');
  await knex.schema.dropTableIfExists('consents');
  await knex.schema.dropTableIfExists('consent_policy_versions');
}
