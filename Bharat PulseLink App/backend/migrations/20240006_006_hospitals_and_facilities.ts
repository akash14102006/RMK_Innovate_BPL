/**
 * Migration 006 — Hospitals, Facilities, Departments, Services, and Contacts (PostGIS)
 *
 * Establishes:
 * - hospital_organizations
 * - facilities (with PostGIS location & GiST index)
 * - facility_contacts
 * - services
 * - facility_services
 * - departments
 * - facility_departments
 * - facility_operating_hours
 * - Foreign key link from consents.granted_to_facility_id
 *
 * Owned by: Hospital Domain (Prompt 94, 101 §32–34, §38–41, §52–59, 102 PostGIS)
 */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Hospital Organizations (Parent corporate/system entities)
  await knex.schema.createTable('hospital_organizations', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name', 200).notNullable();
    t.string('code', 50).nullable().unique();
    t.string('status', 30).notNullable().defaultTo('ACTIVE');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // Facilities (Core physical hospital/clinic units)
  await knex.schema.createTable('facilities', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('organization_id').nullable().references('id').inTable('hospital_organizations').onDelete('SET NULL');
    t.string('name', 200).notNullable();
    t.string('display_name', 200).notNullable();
    t.string('facility_type', 50).notNullable().defaultTo('GENERAL_HOSPITAL'); // 'GOVERNMENT', 'PRIVATE', 'SPECIALTY', 'CLINIC', 'COMMUNITY_HEALTH_CENTER', 'PRIMARY_HEALTH_CENTER'
    t.string('ownership_type', 50).notNullable().defaultTo('GOVERNMENT'); // 'CENTRAL_GOVT', 'STATE_GOVT', 'MUNICIPAL', 'TRUST', 'PRIVATE'
    t.string('status', 30).notNullable().defaultTo('ACTIVE'); // 'ACTIVE', 'INACTIVE', 'MERGED', 'UNDER_MAINTENANCE'
    t.string('publication_status', 30).notNullable().defaultTo('PUBLISHED'); // 'DRAFT', 'PUBLISHED', 'UNPUBLISHED'
    t.string('verification_status', 30).notNullable().defaultTo('VERIFIED'); // 'PENDING', 'VERIFIED', 'FLAGGED'

    // Address fields
    t.text('address_line_1').notNullable();
    t.text('address_line_2').nullable();
    t.string('landmark', 150).nullable();
    t.string('locality', 150).nullable();
    t.uuid('city_id').nullable().references('id').inTable('geo_cities').onDelete('SET NULL');
    t.uuid('district_id').nullable().references('id').inTable('geo_districts').onDelete('SET NULL');
    t.uuid('state_id').nullable().references('id').inTable('geo_states').onDelete('SET NULL');
    t.string('pincode', 10).notNullable();

    // Coordinates metadata
    t.decimal('latitude', 10, 7).notNullable();
    t.decimal('longitude', 10, 7).notNullable();
    t.string('coordinate_source', 50).notNullable().defaultTo('GOVT_REGISTRY'); // 'GOVT_REGISTRY', 'GEOCODED', 'MANUAL_VERIFIED'

    t.boolean('emergency_available').notNullable().defaultTo(false);
    t.uuid('superseded_by_facility_id').nullable().references('id').inTable('facilities').onDelete('SET NULL');

    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index(['district_id', 'status']);
    t.index(['state_id', 'status']);
    t.index(['status', 'publication_status']);
  });

  // Add PostGIS spatial column and GiST index
  await knex.raw('ALTER TABLE facilities ADD COLUMN location geography(Point, 4326)');
  await knex.raw('UPDATE facilities SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography');
  await knex.raw('CREATE INDEX idx_facilities_location_gist ON facilities USING GIST (location)');

  // Link consents to facilities
  await knex.schema.alterTable('consents', (t) => {
    t.foreign('granted_to_facility_id').references('id').inTable('facilities').onDelete('SET NULL');
  });

  // Facility Contacts
  await knex.schema.createTable('facility_contacts', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('facility_id').notNullable().references('id').inTable('facilities').onDelete('CASCADE');
    t.string('contact_type', 30).notNullable().defaultTo('GENERAL'); // 'GENERAL', 'EMERGENCY', 'APPOINTMENT', 'AMBULANCE', 'BLOOD_BANK', 'SUPPORT'
    t.string('phone', 30).notNullable();
    t.string('email', 150).nullable();
    t.boolean('is_toll_free').notNullable().defaultTo(false);
    t.boolean('is_primary').notNullable().defaultTo(false);
    t.string('operating_hours_note', 100).nullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index(['facility_id', 'contact_type']);
  });

  // Services Catalog (Standardized reference catalog)
  await knex.schema.createTable('services', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('code', 50).notNullable().unique(); // e.g. 'OPD', 'EMERGENCY_24X7', 'ICU', 'NICU', 'DIALYSIS', 'MRI', 'CT_SCAN'
    t.string('name', 150).notNullable();
    t.string('category', 50).notNullable(); // 'DIAGNOSTIC', 'EMERGENCY', 'INPATIENT', 'SURGICAL', 'OUTPATIENT'
    t.text('description').nullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // Facility Services (Many-to-Many linking facility and available services)
  await knex.schema.createTable('facility_services', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('facility_id').notNullable().references('id').inTable('facilities').onDelete('CASCADE');
    t.uuid('service_id').notNullable().references('id').inTable('services').onDelete('RESTRICT');
    t.string('status', 30).notNullable().defaultTo('AVAILABLE'); // 'AVAILABLE', 'TEMPORARILY_UNAVAILABLE', 'DISCONTINUED'
    t.decimal('price_inr', 10, 2).nullable(); // Nullable for free/government facilities
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.unique(['facility_id', 'service_id']);
  });

  // Departments Catalog
  await knex.schema.createTable('departments', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('code', 50).notNullable().unique(); // e.g. 'CARDIOLOGY', 'NEUROLOGY', 'ORTHOPEDICS', 'GENERAL_MEDICINE', 'PEDIATRICS'
    t.string('name', 150).notNullable();
    t.text('description').nullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // Facility Departments
  await knex.schema.createTable('facility_departments', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('facility_id').notNullable().references('id').inTable('facilities').onDelete('CASCADE');
    t.uuid('department_id').notNullable().references('id').inTable('departments').onDelete('RESTRICT');
    t.string('floor_location', 100).nullable();
    t.string('status', 30).notNullable().defaultTo('ACTIVE');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.unique(['facility_id', 'department_id']);
  });

  // Facility Operating Hours
  await knex.schema.createTable('facility_operating_hours', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('facility_id').notNullable().references('id').inTable('facilities').onDelete('CASCADE');
    t.smallint('day_of_week').notNullable(); // 0 = Sunday, 1 = Monday ... 6 = Saturday
    t.time('open_time').nullable();
    t.time('close_time').nullable();
    t.boolean('is_24x7').notNullable().defaultTo(false);
    t.boolean('is_closed').notNullable().defaultTo(false);

    t.unique(['facility_id', 'day_of_week']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('consents', (t) => {
    t.dropForeign(['granted_to_facility_id']);
  });
  await knex.schema.dropTableIfExists('facility_operating_hours');
  await knex.schema.dropTableIfExists('facility_departments');
  await knex.schema.dropTableIfExists('departments');
  await knex.schema.dropTableIfExists('facility_services');
  await knex.schema.dropTableIfExists('services');
  await knex.schema.dropTableIfExists('facility_contacts');
  await knex.schema.dropTableIfExists('facilities');
  await knex.schema.dropTableIfExists('hospital_organizations');
}
