/**
 * Migration 008 — Appointments, QR Token Sessions, Secure Exchange, and Live Check-ins
 *
 * Establishes:
 * - appointment_slots
 * - appointments
 * - qr_sessions
 * - exchange_sessions
 * - live_check_ins
 *
 * Owned by: Appointments, QR, Exchange & Check-in Domains (Prompts 106–109, 101 §64–69)
 */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Appointment Slots
  await knex.schema.createTable('appointment_slots', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('facility_id').notNullable().references('id').inTable('facilities').onDelete('CASCADE');
    t.uuid('department_id').notNullable().references('id').inTable('departments').onDelete('RESTRICT');
    t.string('doctor_id', 128).nullable(); // External or staff identifier
    t.date('slot_date').notNullable();
    t.time('start_time').notNullable();
    t.time('end_time').notNullable();
    t.integer('max_capacity').notNullable().defaultTo(1);
    t.integer('booked_count').notNullable().defaultTo(0);
    t.string('status', 30).notNullable().defaultTo('AVAILABLE'); // 'AVAILABLE', 'BOOKED', 'BLOCKED', 'CANCELLED'
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index(['facility_id', 'slot_date', 'status']);
  });

  // Appointments
  await knex.schema.createTable('appointments', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('patient_id').notNullable().references('id').inTable('patient_profiles').onDelete('RESTRICT');
    t.uuid('facility_id').notNullable().references('id').inTable('facilities').onDelete('RESTRICT');
    t.uuid('department_id').notNullable().references('id').inTable('departments').onDelete('RESTRICT');
    t.uuid('slot_id').notNullable().references('id').inTable('appointment_slots').onDelete('RESTRICT');
    t.date('appointment_date').notNullable();
    t.time('start_time').notNullable();
    t.string('status', 30).notNullable().defaultTo('CONFIRMED'); // 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'
    t.string('token_number', 20).notNullable(); // e.g. 'A-12', 'OPD-045'
    t.string('idempotency_key', 128).nullable().unique(); // Booking deduplication safeguard
    t.string('facility_name_snapshot', 200).notNullable(); // Immutable display snapshot
    t.string('service_name_snapshot', 150).nullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index(['patient_id', 'appointment_date']);
    t.index(['facility_id', 'appointment_date', 'status']);
  });

  // QR Token Sessions (Time-bounded cryptographic handoff tokens)
  await knex.schema.createTable('qr_sessions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('patient_id').notNullable().references('id').inTable('patient_profiles').onDelete('RESTRICT');
    t.uuid('facility_id').notNullable().references('id').inTable('facilities').onDelete('RESTRICT');
    t.string('token_hash', 64).notNullable().unique(); // SHA-256 hash of single-use dynamic QR payload
    t.string('status', 30).notNullable().defaultTo('ACTIVE'); // 'ACTIVE', 'SCANNED', 'EXPIRED', 'REVOKED'
    t.timestamp('expires_at', { useTz: true }).notNullable();
    t.timestamp('used_at', { useTz: true }).nullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index(['token_hash', 'status']);
    t.index(['patient_id', 'expires_at']);
  });

  // Exchange Sessions (ABDM/FHIR health data exchange sessions)
  await knex.schema.createTable('exchange_sessions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('patient_id').notNullable().references('id').inTable('patient_profiles').onDelete('RESTRICT');
    t.uuid('requester_facility_id').notNullable().references('id').inTable('facilities').onDelete('RESTRICT');
    t.uuid('consent_id').notNullable().references('id').inTable('consents').onDelete('RESTRICT');
    t.jsonb('scope').notNullable();
    t.string('status', 30).notNullable().defaultTo('PENDING'); // 'PENDING', 'AUTHENTICATED', 'TRANSFERRING', 'COMPLETED', 'FAILED', 'TIMED_OUT'
    t.timestamp('expires_at', { useTz: true }).notNullable();
    t.timestamp('completed_at', { useTz: true }).nullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index(['patient_id', 'status']);
  });

  // Live Check-ins (Hospital queue & arrival management)
  await knex.schema.createTable('live_check_ins', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('patient_id').notNullable().references('id').inTable('patient_profiles').onDelete('RESTRICT');
    t.uuid('facility_id').notNullable().references('id').inTable('facilities').onDelete('RESTRICT');
    t.uuid('appointment_id').nullable().references('id').inTable('appointments').onDelete('SET NULL');
    t.uuid('exchange_session_id').nullable().references('id').inTable('exchange_sessions').onDelete('SET NULL');
    t.string('token_number', 20).notNullable();
    t.string('counter_number', 20).notNullable().defaultTo('1');
    t.integer('queue_position').notNullable().defaultTo(1);
    t.integer('estimated_wait_minutes').notNullable().defaultTo(15);
    t.string('status', 30).notNullable().defaultTo('QUEUED'); // 'QUEUED', 'CALLED', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED'
    t.timestamp('checked_in_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('completed_at', { useTz: true }).nullable();
    t.timestamp('cancelled_at', { useTz: true }).nullable();

    t.index(['facility_id', 'status']);
    t.index(['patient_id', 'status']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('live_check_ins');
  await knex.schema.dropTableIfExists('exchange_sessions');
  await knex.schema.dropTableIfExists('qr_sessions');
  await knex.schema.dropTableIfExists('appointments');
  await knex.schema.dropTableIfExists('appointment_slots');
}
