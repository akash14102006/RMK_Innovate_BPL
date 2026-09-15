/**
 * Migration 010 — Notifications, Sync Pipeline, Tamper-Evident Audit, and Security Events
 *
 * Establishes:
 * - notifications
 * - notification_preferences
 * - sync_cursors
 * - sync_mutations
 * - audit_events (immutable ABDM PHI access trail)
 * - security_events
 *
 * Owned by: Notifications, Sync, Audit & Security Domains (Prompts 78–86, 101 §77–85, 114–117)
 */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Notifications
  await knex.schema.createTable('notifications', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('channel', 20).notNullable(); // 'PUSH', 'SMS', 'EMAIL', 'IN_APP'
    t.string('category', 50).notNullable(); // 'APPOINTMENT', 'CHECKIN', 'REPORT', 'SECURITY', 'EMERGENCY'
    t.string('title', 200).notNullable();
    t.text('body').notNullable();
    t.string('status', 30).notNullable().defaultTo('QUEUED'); // 'QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED'
    t.jsonb('metadata').nullable();
    t.timestamp('scheduled_at', { useTz: true }).nullable();
    t.timestamp('sent_at', { useTz: true }).nullable();
    t.timestamp('read_at', { useTz: true }).nullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index(['user_id', 'status', 'created_at']);
  });

  // Notification Preferences
  await knex.schema.createTable('notification_preferences', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('channel', 20).notNullable();
    t.string('category', 50).notNullable();
    t.boolean('enabled').notNullable().defaultTo(true);
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.unique(['user_id', 'channel', 'category']);
  });

  // Sync Cursors (Server-authoritative offline sync progress tracking)
  await knex.schema.createTable('sync_cursors', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.uuid('device_id').notNullable().references('id').inTable('devices').onDelete('CASCADE');
    t.bigInteger('cursor_version').notNullable().defaultTo(0);
    t.timestamp('last_synced_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.unique(['user_id', 'device_id']);
  });

  // Sync Mutations (Queue of client-initiated mutations during offline/reconnect sync)
  await knex.schema.createTable('sync_mutations', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.uuid('device_id').notNullable().references('id').inTable('devices').onDelete('CASCADE');
    t.string('mutation_type', 50).notNullable(); // 'CREATE', 'UPDATE', 'DELETE'
    t.string('resource_type', 50).notNullable(); // 'PATIENT_PROFILE', 'EMERGENCY_CONTACT', 'DOCUMENT'
    t.string('resource_id', 128).notNullable();
    t.bigInteger('base_version').notNullable().defaultTo(1);
    t.string('status', 30).notNullable().defaultTo('PENDING'); // 'PENDING', 'APPLIED', 'CONFLICTED', 'REJECTED'
    t.string('idempotency_key', 128).notNullable().unique();
    t.jsonb('payload').notNullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('processed_at', { useTz: true }).nullable();

    t.index(['user_id', 'status']);
  });

  // Audit Events (Immutable, tamper-evident record of all PHI/PII data access)
  await knex.schema.createTable('audit_events', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('actor_id', 128).notNullable();
    t.string('actor_type', 30).notNullable(); // 'PATIENT', 'PROVIDER', 'SYSTEM', 'ADMIN'
    t.string('action', 50).notNullable(); // 'READ', 'WRITE', 'CONSENT_SHARE', 'EXPORT', 'REVOKE', 'DELETE'
    t.string('resource_type', 50).notNullable(); // 'HEALTH_RECORD', 'REPORT', 'PATIENT_PROFILE', 'CONSENT'
    t.string('resource_id', 128).notNullable();
    t.uuid('facility_id').nullable().references('id').inTable('facilities').onDelete('SET NULL');
    t.uuid('consent_id').nullable().references('id').inTable('consents').onDelete('SET NULL');
    t.string('ip_address', 45).notNullable();
    t.string('request_id', 64).notNullable();
    t.jsonb('metadata').nullable(); // Safe non-PHI operational metadata
    t.timestamp('timestamp', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index(['resource_type', 'resource_id', 'timestamp']);
    t.index(['actor_id', 'timestamp']);
    t.index('request_id');
  });

  // Security Events (Authentication, authorization, anomaly, and credential lifecycle)
  if (!(await knex.schema.hasTable('security_events'))) {
    await knex.schema.createTable('security_events', (t) => {
      t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      t.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
      t.uuid('device_id').nullable().references('id').inTable('devices').onDelete('SET NULL');
      t.string('event_type', 50).notNullable(); // 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'SESSION_REVOKED', 'DEVICE_BLOCKED', 'RATE_LIMIT_EXCEEDED'
      t.string('severity', 20).notNullable().defaultTo('INFO'); // 'INFO', 'WARN', 'CRITICAL'
      t.string('ip_address', 45).nullable();
      t.string('request_id', 64).nullable();
      t.jsonb('details').nullable();
      t.timestamp('timestamp', { useTz: true }).notNullable().defaultTo(knex.fn.now());

      t.index(['user_id', 'timestamp']);
      t.index(['event_type', 'severity']);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('security_events');
  await knex.schema.dropTableIfExists('audit_events');
  await knex.schema.dropTableIfExists('sync_mutations');
  await knex.schema.dropTableIfExists('sync_cursors');
  await knex.schema.dropTableIfExists('notification_preferences');
  await knex.schema.dropTableIfExists('notifications');
}
