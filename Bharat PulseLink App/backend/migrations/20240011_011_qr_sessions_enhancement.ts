/**
 * Migration 011 — Real-Time Secure QR Sessions Enhancement (Prompt 107)
 *
 * Enhances qr_sessions with:
 * - purpose: enum/string for server-controlled intent (HOSPITAL_CHECKIN, APPOINTMENT, HEALTH_RECORD_SHARE, IDENTITY_VERIFICATION)
 * - recipient_type: FACILITY, PROVIDER, OPEN
 * - recipient_id: bound hospital/facility ID (nullable for open-scan triage)
 * - consumed_at: timestamp of one-time consumption
 * - revoked_at: timestamp of patient revocation
 * - created_by_session_id: reference to Prompt 92 user session
 * - version: optimistic concurrency and audit tracking
 *
 * Owned by: QR & Secure Session Domain (Prompt 107)
 */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('qr_sessions');
  if (hasTable) {
    await knex.schema.alterTable('qr_sessions', (t) => {
      t.string('purpose', 50).notNullable().defaultTo('HOSPITAL_CHECKIN');
      t.string('recipient_type', 30).notNullable().defaultTo('FACILITY');
      t.uuid('recipient_id').nullable().references('id').inTable('facilities').onDelete('SET NULL');
      t.timestamp('consumed_at', { useTz: true }).nullable();
      t.timestamp('revoked_at', { useTz: true }).nullable();
      t.uuid('created_by_session_id').nullable().references('id').inTable('sessions').onDelete('SET NULL');
      t.integer('version').notNullable().defaultTo(1);
    });

    // Make facility_id nullable if it wasn't already, so open-scans can be generated
    await knex.schema.alterTable('qr_sessions', (t) => {
      t.uuid('facility_id').nullable().alter();
    });

    await knex.schema.alterTable('qr_sessions', (t) => {
      t.index(['patient_id', 'status', 'expires_at']);
      t.index(['purpose', 'status']);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('qr_sessions');
  if (hasTable) {
    await knex.schema.alterTable('qr_sessions', (t) => {
      t.dropColumn('purpose');
      t.dropColumn('recipient_type');
      t.dropColumn('recipient_id');
      t.dropColumn('consumed_at');
      t.dropColumn('revoked_at');
      t.dropColumn('created_by_session_id');
      t.dropColumn('version');
    });
  }
}
