/**
 * Migration 009 — Patient Health Records, Reports, Prescriptions, Medications, and Documents
 *
 * Establishes:
 * - visits
 * - reports (with cryptographic integrity hash & blockchain anchoring)
 * - documents
 * - prescriptions
 * - medications_catalog
 * - patient_medications
 *
 * Owned by: Health Records Domain (Prompts 63–73, 101 §70–75, 110–113)
 */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Clinical Visits
  await knex.schema.createTable('visits', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('patient_id').notNullable().references('id').inTable('patient_profiles').onDelete('RESTRICT');
    t.uuid('facility_id').notNullable().references('id').inTable('facilities').onDelete('RESTRICT');
    t.date('visit_date').notNullable();
    t.string('visit_type', 50).notNullable().defaultTo('OPD'); // 'OPD', 'IPD', 'EMERGENCY', 'TELECONSULTATION'
    t.uuid('department_id').nullable().references('id').inTable('departments').onDelete('SET NULL');
    t.string('doctor_name', 150).nullable();
    t.text('chief_complaint').nullable();
    t.text('diagnosis').nullable();
    t.string('status', 30).notNullable().defaultTo('COMPLETED'); // 'IN_PROGRESS', 'COMPLETED', 'DISCHARGED'
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index(['patient_id', 'visit_date']);
  });

  // Diagnostic & Lab Reports
  await knex.schema.createTable('reports', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('patient_id').notNullable().references('id').inTable('patient_profiles').onDelete('RESTRICT');
    t.uuid('facility_id').notNullable().references('id').inTable('facilities').onDelete('RESTRICT');
    t.uuid('visit_id').nullable().references('id').inTable('visits').onDelete('SET NULL');
    t.string('report_type', 50).notNullable(); // 'BLOOD_TEST', 'IMAGING', 'PATHOLOGY', 'ECG', 'GENERAL_REPORT'
    t.string('title', 200).notNullable();
    t.date('report_date').notNullable();
    t.string('storage_key', 255).notNullable(); // Object storage pointer
    t.string('mime_type', 100).notNullable().defaultTo('application/pdf');
    t.integer('file_size_bytes').notNullable().defaultTo(0);
    t.string('integrity_hash', 64).notNullable(); // SHA-256 hash of report file content
    t.string('blockchain_tx_id', 128).nullable(); // Immutable ledger timestamp anchor (Prompt 113)
    t.string('status', 30).notNullable().defaultTo('VERIFIED'); // 'PENDING', 'VERIFIED', 'AMENDED'
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index(['patient_id', 'report_type', 'report_date']);
    t.index('integrity_hash');
  });

  // Patient Uploaded Documents
  await knex.schema.createTable('documents', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('patient_id').notNullable().references('id').inTable('patient_profiles').onDelete('RESTRICT');
    t.string('document_type', 50).notNullable(); // 'ID_PROOF', 'INSURANCE_CARD', 'DISCHARGE_SUMMARY', 'PREVIOUS_RECORD'
    t.string('title', 200).notNullable();
    t.string('storage_key', 255).notNullable();
    t.string('mime_type', 100).notNullable();
    t.integer('file_size_bytes').notNullable().defaultTo(0);
    t.string('sha256', 64).notNullable();
    t.uuid('uploaded_by_user_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index(['patient_id', 'document_type']);
  });

  // Prescriptions
  await knex.schema.createTable('prescriptions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('patient_id').notNullable().references('id').inTable('patient_profiles').onDelete('RESTRICT');
    t.uuid('facility_id').notNullable().references('id').inTable('facilities').onDelete('RESTRICT');
    t.uuid('visit_id').nullable().references('id').inTable('visits').onDelete('SET NULL');
    t.string('doctor_name', 150).notNullable();
    t.date('issued_date').notNullable();
    t.string('storage_key', 255).nullable(); // Digital PDF copy if available
    t.string('status', 30).notNullable().defaultTo('ACTIVE'); // 'ACTIVE', 'COMPLETED', 'DISCONTINUED'
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index(['patient_id', 'issued_date']);
  });

  // Medications Reference Catalog
  await knex.schema.createTable('medications_catalog', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name', 200).notNullable();
    t.string('generic_name', 200).notNullable();
    t.string('brand_name', 200).nullable();
    t.string('dosage_form', 50).notNullable(); // 'TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'OINTMENT'
    t.string('strength', 50).nullable(); // e.g. '500mg', '10mg/ml'
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index('generic_name');
    t.index('name');
  });

  // Patient Active & Historical Medications
  await knex.schema.createTable('patient_medications', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('patient_id').notNullable().references('id').inTable('patient_profiles').onDelete('RESTRICT');
    t.uuid('prescription_id').nullable().references('id').inTable('prescriptions').onDelete('SET NULL');
    t.string('medication_name', 200).notNullable();
    t.string('dosage', 100).notNullable(); // e.g. '1 tablet', '5ml'
    t.string('frequency', 100).notNullable(); // 'ONCE_DAILY', 'TWICE_DAILY', 'THRICE_DAILY', 'AS_NEEDED'
    t.integer('duration_days').nullable();
    t.date('start_date').notNullable();
    t.date('end_date').nullable();
    t.text('instructions').nullable(); // 'After food with warm water'
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index(['patient_id', 'is_active']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('patient_medications');
  await knex.schema.dropTableIfExists('medications_catalog');
  await knex.schema.dropTableIfExists('prescriptions');
  await knex.schema.dropTableIfExists('documents');
  await knex.schema.dropTableIfExists('reports');
  await knex.schema.dropTableIfExists('visits');
}
