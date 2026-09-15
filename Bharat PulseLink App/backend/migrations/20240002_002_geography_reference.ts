/**
 * Migration 002 — Geography Master Reference
 *
 * Establishes:
 * - geo_countries
 * - geo_states
 * - geo_districts
 * - geo_cities
 *
 * Owned by: Geography Domain (Prompt 101 §35–37)
 */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Countries
  await knex.schema.createTable('geo_countries', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('iso_code', 2).notNullable().unique(); // e.g. 'IN'
    t.string('name', 100).notNullable();
    t.string('dial_code', 10).notNullable().defaultTo('+91');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // States
  await knex.schema.createTable('geo_states', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('country_id').notNullable().references('id').inTable('geo_countries').onDelete('RESTRICT');
    t.string('code', 10).notNullable(); // e.g. 'DL', 'MH', 'KA', 'TN'
    t.string('name', 100).notNullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.unique(['country_id', 'code']);
  });

  // Districts
  await knex.schema.createTable('geo_districts', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('state_id').notNullable().references('id').inTable('geo_states').onDelete('RESTRICT');
    t.string('name', 150).notNullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.unique(['state_id', 'name']);
  });

  // Cities / Localities
  await knex.schema.createTable('geo_cities', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('district_id').notNullable().references('id').inTable('geo_districts').onDelete('RESTRICT');
    t.string('name', 150).notNullable();
    t.string('pincode_prefix', 6).nullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index(['district_id', 'name']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('geo_cities');
  await knex.schema.dropTableIfExists('geo_districts');
  await knex.schema.dropTableIfExists('geo_states');
  await knex.schema.dropTableIfExists('geo_countries');
}
