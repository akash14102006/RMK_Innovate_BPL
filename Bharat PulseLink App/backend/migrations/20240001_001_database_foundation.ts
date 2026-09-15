/**
 * Migration 001 — Database Foundation
 *
 * Establishes:
 * - PostGIS extension
 * - pgcrypto extension (for gen_random_uuid())
 * - citext extension (case-insensitive text for emails)
 * - Database-level conventions (timestamps, soft-delete patterns)
 *
 * Domain schema is in subsequent migrations (Prompt 101).
 *
 * Owned by: Platform Foundation (Prompt 87)
 */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Enable PostgreSQL extensions (idempotent)
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "postgis"');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "citext"');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // Verify PostGIS is active
  const result = await knex.raw<{ rows: Array<{ postgis_version: string }> }>(
    'SELECT PostGIS_Version() AS postgis_version',
  );
  const version = result.rows[0]?.postgis_version;
  console.log(`[MIGRATION 001] PostGIS version: ${version ?? 'unknown'}`);
}

export async function down(knex: Knex): Promise<void> {
  // Note: dropping extensions may affect other databases in the cluster
  // Only drop in test/dev environments — document this constraint
  const env = process.env['NODE_ENV'];
  if (env === 'production' || env === 'staging') {
    console.warn('[MIGRATION 001] Skipping extension drop in production/staging');
    return;
  }

  await knex.raw('DROP EXTENSION IF EXISTS "postgis" CASCADE');
  await knex.raw('DROP EXTENSION IF EXISTS "pgcrypto"');
  await knex.raw('DROP EXTENSION IF EXISTS "citext"');
  await knex.raw('DROP EXTENSION IF EXISTS "uuid-ossp"');
}
