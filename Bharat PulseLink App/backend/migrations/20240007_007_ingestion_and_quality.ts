/**
 * Migration 007 — Data Ingestion Pipeline & Quality Control
 *
 * Establishes:
 * - ingestion_batches
 * - ingestion_raw_records
 * - facility_identity_mappings
 * - data_validation_issues
 * - facility_merge_history
 *
 * Owned by: Ingestion & Quality Domains (Prompts 95–100, 101 §42–51)
 */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Ingestion Batches
  await knex.schema.createTable('ingestion_batches', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('source_system', 50).notNullable(); // 'NIN_GOVT_REGISTRY', 'ABDM_HFR', 'MOHFW_CSV', 'STATE_DIRECTORATE'
    t.string('source_type', 30).notNullable(); // 'CSV_UPLOAD', 'API_DELTA', 'FULL_SYNC'
    t.string('file_hash', 64).nullable(); // SHA-256 of source file
    t.string('status', 30).notNullable().defaultTo('PENDING'); // 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'PARTIALLY_ACCEPTED'
    t.timestamp('started_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('completed_at', { useTz: true }).nullable();
    t.integer('total_records').notNullable().defaultTo(0);
    t.integer('accepted_records').notNullable().defaultTo(0);
    t.integer('rejected_records').notNullable().defaultTo(0);
    t.integer('warning_records').notNullable().defaultTo(0);

    t.index(['source_system', 'status']);
  });

  // Ingestion Raw Records (Immutable raw observation storage before normalization)
  await knex.schema.createTable('ingestion_raw_records', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('batch_id').notNullable().references('id').inTable('ingestion_batches').onDelete('CASCADE');
    t.integer('source_row_number').notNullable();
    t.string('source_record_id', 100).nullable();
    t.jsonb('raw_payload').notNullable();
    t.string('row_hash', 64).notNullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index(['batch_id', 'source_row_number']);
  });

  // Facility Identity Mappings (Lineage linking external source IDs to canonical facilities)
  await knex.schema.createTable('facility_identity_mappings', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('source_system', 50).notNullable();
    t.string('source_record_id', 100).notNullable();
    t.uuid('facility_id').notNullable().references('id').inTable('facilities').onDelete('CASCADE');
    t.string('mapping_status', 30).notNullable().defaultTo('CANONICAL'); // 'CANONICAL', 'MERGED', 'DISPUTED'
    t.decimal('confidence_score', 4, 3).notNullable().defaultTo(1.000);
    t.timestamp('mapped_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.unique(['source_system', 'source_record_id']);
    t.index('facility_id');
  });

  // Data Validation Issues (Detailed log of all rejected or warning-level rows during ingestion)
  await knex.schema.createTable('data_validation_issues', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('batch_id').notNullable().references('id').inTable('ingestion_batches').onDelete('CASCADE');
    t.uuid('raw_record_id').nullable().references('id').inTable('ingestion_raw_records').onDelete('SET NULL');
    t.string('field_name', 100).nullable();
    t.string('issue_code', 50).notNullable(); // 'INVALID_PINCODE', 'OUT_OF_BOUNDS_COORDINATES', 'MISSING_MANDATORY_FIELD'
    t.string('severity', 20).notNullable(); // 'WARNING', 'FATAL_ROW', 'FATAL_BATCH'
    t.text('message').notNullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index(['batch_id', 'severity']);
  });

  // Facility Merge History (Audit trail of deduplication and surviving entity decisions)
  await knex.schema.createTable('facility_merge_history', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('source_facility_id').notNullable().references('id').inTable('facilities').onDelete('RESTRICT');
    t.uuid('surviving_facility_id').notNullable().references('id').inTable('facilities').onDelete('RESTRICT');
    t.text('reason').notNullable();
    t.string('decision_source', 50).notNullable(); // 'AUTO_DEDUP_EXACT', 'AUTO_DEDUP_FUZZY_HIGH_CONFIDENCE', 'MANUAL_REVIEW'
    t.string('actor_id', 128).notNullable();
    t.timestamp('merged_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index('source_facility_id');
    t.index('surviving_facility_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('facility_merge_history');
  await knex.schema.dropTableIfExists('data_validation_issues');
  await knex.schema.dropTableIfExists('facility_identity_mappings');
  await knex.schema.dropTableIfExists('ingestion_raw_records');
  await knex.schema.dropTableIfExists('ingestion_batches');
}
