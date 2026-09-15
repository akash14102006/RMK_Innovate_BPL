/**
 * Knex Configuration
 * Used by: knex CLI (migrate, seed) and application DatabaseClient
 *
 * Never commit secrets — DATABASE_URL must be in environment.
 */

import type { Knex } from 'knex';
import { config } from 'dotenv';

// Load .env for CLI usage (application loads via env.ts)
config();

const connection = process.env['DATABASE_URL'];

if (!connection) {
  console.error('[KNEX] DATABASE_URL environment variable is required');
  process.exit(1);
}

const baseConfig: Knex.Config = {
  client: 'pg',
  connection,
  migrations: {
    directory: './migrations',
    extension: 'ts',
    tableName: 'knex_migrations',
    loadExtensions: ['.ts'],
  },
  seeds: {
    directory: './seeds',
    extension: 'ts',
    loadExtensions: ['.ts'],
  },
};

const knexConfig: { [key: string]: Knex.Config } = {
  development: {
    ...baseConfig,
    pool: { min: 1, max: 5 },
  },
  test: {
    ...baseConfig,
    connection: process.env['TEST_DATABASE_URL'] ?? connection,
    pool: { min: 1, max: 5 },
  },
  staging: {
    ...baseConfig,
    pool: { min: 2, max: 10 },
  },
  production: {
    ...baseConfig,
    pool: { min: 2, max: 20 },
  },
};

export default knexConfig;
