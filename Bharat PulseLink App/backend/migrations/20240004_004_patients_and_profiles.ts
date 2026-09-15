/**
 * Migration 004 — Patients, Profiles, Conditions, Allergies, Surgeries, Emergency Contacts, and Insurance
 *
 * Establishes:
 * - patient_profiles (canonical patient core aggregate with optimistic versioning)
 * - patient_conditions (patient-reported health conditions)
 * - patient_allergies (patient-reported allergies with severity)
 * - patient_surgeries (patient-reported surgical history)
 * - emergency_contacts
 * - patient_insurance
 *
 * Owned by: Patient Domain (Prompt 90, 101 §24–27, §31, §76)
 */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. Patient Profiles (Core Aggregate)
  await knex.schema.createTable('patient_profiles', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').notNullable().unique().references('id').inTable('users').onDelete('RESTRICT');
    t.integer('version').notNullable().defaultTo(1);
    t.string('status', 30).notNullable().defaultTo('INCOMPLETE'); // NOT_STARTED, DRAFT, INCOMPLETE, ACTIVE, COMPLETE, SUSPENDED, LOCKED, ARCHIVED
    t.string('full_name', 200).notNullable();
    t.string('preferred_name', 100).nullable();
    t.string('gender', 20).notNullable(); // MALE, FEMALE, OTHER, UNDISCLOSED
    t.date('date_of_birth').notNullable();
    t.string('blood_group', 10).nullable(); // A+, A-, B+, B-, AB+, AB-, O+, O-, UNKNOWN
    t.string('marital_status', 30).nullable();
    t.string('occupation', 100).nullable();
    t.string('primary_phone', 50).nullable();
    t.string('primary_email', 255).nullable();
    t.text('address_line_1').nullable();
    t.text('address_line_2').nullable();
    t.string('locality', 150).nullable();
    t.uuid('city_id').nullable().references('id').inTable('geo_cities').onDelete('SET NULL');
    t.uuid('district_id').nullable().references('id').inTable('geo_districts').onDelete('SET NULL');
    t.uuid('state_id').nullable().references('id').inTable('geo_states').onDelete('SET NULL');
    t.string('pincode', 10).nullable();
    t.string('abha_id', 50).nullable().unique();
    t.float('height_cm').nullable();
    t.float('weight_kg').nullable();
    t.string('smoking_status', 30).nullable(); // NEVER, FORMER, CURRENT, OCCASIONAL
    t.string('alcohol_status', 30).nullable(); // NEVER, FORMER, OCCASIONAL, REGULAR
    t.string('activity_level', 30).nullable(); // SEDENTARY, MODERATE, ACTIVE, VERY_ACTIVE
    t.string('sleep_pattern', 50).nullable();
    t.timestamp('completed_at', { useTz: true }).nullable();
    t.timestamp('last_synced_at', { useTz: true }).nullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index('user_id');
    t.index('status');
    t.index('abha_id');
    t.index(['state_id', 'district_id']);
  });

  // Patient profiles check constraints
  await knex.raw(`
    ALTER TABLE patient_profiles
    ADD CONSTRAINT patient_profiles_status_check
    CHECK (status IN ('NOT_STARTED', 'DRAFT', 'INCOMPLETE', 'ACTIVE', 'COMPLETE', 'SUSPENDED', 'LOCKED', 'ARCHIVED'))
  `);

  await knex.raw(`
    ALTER TABLE patient_profiles
    ADD CONSTRAINT patient_profiles_gender_check
    CHECK (gender IN ('MALE', 'FEMALE', 'OTHER', 'UNDISCLOSED'))
  `);

  // 2. Patient Conditions
  await knex.schema.createTable('patient_conditions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('patient_id').notNullable().references('id').inTable('patient_profiles').onDelete('CASCADE');
    t.string('condition_name', 200).notNullable();
    t.integer('diagnosed_year').nullable();
    t.string('status', 30).notNullable().defaultTo('ACTIVE'); // ACTIVE, MANAGED, RESOLVED
    t.string('source_type', 30).notNullable().defaultTo('PATIENT'); // PATIENT, PROVIDER, IMPORTED, SYSTEM
    t.text('notes').nullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index(['patient_id', 'status']);
  });

  // 3. Patient Allergies
  await knex.schema.createTable('patient_allergies', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('patient_id').notNullable().references('id').inTable('patient_profiles').onDelete('CASCADE');
    t.string('substance', 200).notNullable();
    t.string('reaction', 200).nullable();
    t.string('severity', 30).notNullable().defaultTo('UNKNOWN'); // MILD, MODERATE, SEVERE, UNKNOWN
    t.string('status', 30).notNullable().defaultTo('ACTIVE'); // ACTIVE, RESOLVED, INACTIVE
    t.string('source_type', 30).notNullable().defaultTo('PATIENT');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index(['patient_id', 'status']);
  });

  // 4. Patient Surgeries
  await knex.schema.createTable('patient_surgeries', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('patient_id').notNullable().references('id').inTable('patient_profiles').onDelete('CASCADE');
    t.string('procedure_name', 200).notNullable();
    t.integer('approximate_year').nullable();
    t.string('hospital_name', 200).nullable();
    t.text('notes').nullable();
    t.string('source_type', 30).notNullable().defaultTo('PATIENT');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index('patient_id');
  });

  // 5. Emergency Contacts
  await knex.schema.createTable('emergency_contacts', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('patient_id').notNullable().references('id').inTable('patient_profiles').onDelete('CASCADE');
    t.string('name', 150).notNullable();
    t.string('relationship', 50).notNullable(); // SPOUSE, PARENT, CHILD, SIBLING, GUARDIAN, FRIEND, OTHER
    t.string('phone_hash', 64).notNullable();
    t.boolean('is_primary').notNullable().defaultTo(false);
    t.integer('priority_order').notNullable().defaultTo(1);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index(['patient_id', 'priority_order']);
  });

  // 6. Patient Insurance
  await knex.schema.createTable('patient_insurance', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('patient_id').notNullable().references('id').inTable('patient_profiles').onDelete('CASCADE');
    t.string('provider_name', 200).notNullable();
    t.string('policy_number_hash', 64).notNullable();
    t.string('policy_type', 50).notNullable().defaultTo('COMPREHENSIVE'); // PMJAY, CORPORATE, INDIVIDUAL, FAMILY_FLOATER
    t.date('valid_from').nullable();
    t.date('valid_to').nullable();
    t.string('status', 30).notNullable().defaultTo('ACTIVE'); // ACTIVE, EXPIRED, PENDING_VERIFICATION
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index(['patient_id', 'status']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('patient_insurance');
  await knex.schema.dropTableIfExists('emergency_contacts');
  await knex.schema.dropTableIfExists('patient_surgeries');
  await knex.schema.dropTableIfExists('patient_allergies');
  await knex.schema.dropTableIfExists('patient_conditions');
  await knex.schema.dropTableIfExists('patient_profiles');
}
