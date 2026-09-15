/**
 * Migration 003 — Identity, Auth Identities, Devices, and Sessions
 *
 * Establishes:
 * - users (canonical application account)
 * - user_auth_identities (external authentication identity mappings: Descope, Google, WhatsApp)
 * - devices (client device registry with platform & app version metadata)
 * - sessions (server-authoritative session records, token hashes, security version & revocation)
 *
 * Owned by: Identity & Security Domains (Prompt 88, 89, 92, 101 §20–23, §29–30)
 */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. Canonical Users
  await knex.schema.createTable('users', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('status', 30).notNullable().defaultTo('ACTIVE'); // ACTIVE, SUSPENDED, DISABLED, DEACTIVATED
    t.timestamp('last_authenticated_at', { useTz: true }).nullable();
    t.timestamp('last_seen_at', { useTz: true }).nullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index('status');
    t.index('created_at');
  });

  // Users status CHECK constraint
  await knex.raw(`
    ALTER TABLE users
    ADD CONSTRAINT users_status_check
    CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DISABLED', 'DEACTIVATED'))
  `);

  // 2. User Auth Identities (1-to-N external auth provider mappings to 1 canonical user)
  await knex.schema.createTable('user_auth_identities', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    t.string('provider', 50).notNullable(); // 'DESCOPE', 'GOOGLE', 'WHATSAPP'
    t.string('provider_subject', 255).notNullable();
    t.string('email', 255).nullable();
    t.timestamp('email_verified_at', { useTz: true }).nullable();
    t.string('phone', 50).nullable();
    t.timestamp('phone_verified_at', { useTz: true }).nullable();
    t.timestamp('provider_created_at', { useTz: true }).nullable();
    t.timestamp('last_authenticated_at', { useTz: true }).nullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.unique(['provider', 'provider_subject']);
    t.index('user_id');
    t.index(['provider', 'provider_subject']);
  });

  // User Auth Identities provider CHECK constraint
  await knex.raw(`
    ALTER TABLE user_auth_identities
    ADD CONSTRAINT user_auth_identities_provider_check
    CHECK (provider IN ('DESCOPE', 'GOOGLE', 'WHATSAPP'))
  `);

  // 3. Devices
  await knex.schema.createTable('devices', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('device_fingerprint_hash', 64).notNullable();
    t.string('platform', 20).notNullable().defaultTo('android'); // 'ios', 'android', 'web'
    t.string('app_version', 30).notNullable().defaultTo('1.0.0');
    t.string('push_token_hash', 128).nullable();
    t.string('status', 30).notNullable().defaultTo('ACTIVE'); // ACTIVE, REVOKED, BLOCKED
    t.timestamp('registered_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('last_seen_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index(['user_id', 'status']);
    t.index(['user_id', 'device_fingerprint_hash']);
  });

  // Devices status CHECK constraint
  await knex.raw(`
    ALTER TABLE devices
    ADD CONSTRAINT devices_status_check
    CHECK (status IN ('ACTIVE', 'REVOKED', 'BLOCKED'))
  `);

  // 4. Sessions
  await knex.schema.createTable('sessions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.uuid('device_id').nullable().references('id').inTable('devices').onDelete('SET NULL');
    t.string('session_token_hash', 64).notNullable().unique();
    t.string('descope_session_reference', 255).nullable();
    t.string('status', 30).notNullable().defaultTo('ACTIVE'); // ACTIVE, EXPIRED, REVOKED, FORCED_OUT, SUSPENDED
    t.integer('security_version').notNullable().defaultTo(1);
    t.string('risk_level', 20).notNullable().defaultTo('LOW'); // LOW, MEDIUM, HIGH
    t.string('platform', 20).notNullable().defaultTo('android');
    t.string('app_version', 30).notNullable().defaultTo('1.0.0');
    t.string('ip_hash', 64).nullable();
    t.string('user_agent_summary', 255).nullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('last_seen_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('expires_at', { useTz: true }).notNullable();
    t.timestamp('absolute_expires_at', { useTz: true }).notNullable();
    t.timestamp('revoked_at', { useTz: true }).nullable();
    t.string('revoke_reason', 255).nullable();
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index(['user_id', 'status']);
    t.index(['expires_at', 'status']);
    t.index('session_token_hash');
    t.index(['user_id', 'device_id']);
  });

  // Sessions status CHECK constraint
  await knex.raw(`
    ALTER TABLE sessions
    ADD CONSTRAINT sessions_status_check
    CHECK (status IN ('ACTIVE', 'EXPIRED', 'REVOKED', 'FORCED_OUT', 'SUSPENDED'))
  `);

  // Sessions risk_level CHECK constraint
  await knex.raw(`
    ALTER TABLE sessions
    ADD CONSTRAINT sessions_risk_level_check
    CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH'))
  `);

  // 5. Security Events
  await knex.schema.createTable('security_events', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    t.uuid('device_id').nullable().references('id').inTable('devices').onDelete('SET NULL');
    t.string('event_type', 50).notNullable();
    t.string('severity', 20).notNullable().defaultTo('INFO');
    t.string('ip_address', 45).nullable();
    t.string('request_id', 64).nullable();
    t.jsonb('details').nullable();
    t.timestamp('timestamp', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index(['user_id', 'timestamp']);
    t.index(['event_type', 'severity']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('security_events');
  await knex.schema.dropTableIfExists('sessions');
  await knex.schema.dropTableIfExists('devices');
  await knex.schema.dropTableIfExists('user_auth_identities');
  await knex.schema.dropTableIfExists('users');
}
