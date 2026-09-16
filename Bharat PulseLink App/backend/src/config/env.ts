/**
 * Environment Configuration
 *
 * Validates all environment variables at startup using Zod.
 * The process FAILS FAST if required variables are missing or invalid.
 * Never logs secret values — only safe metadata is exposed.
 *
 * Owned by: Platform Foundation (Prompt 87)
 */

import 'dotenv/config';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Environment schema
// ---------------------------------------------------------------------------

const envSchema = z.object({
  // ── Runtime ──────────────────────────────────────────────────────────────
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().min(0).max(65535).default(8080),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  API_PREFIX: z.string().default('/api/v1'),
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().min(0).max(60000).default(15000),
  REQUEST_BODY_LIMIT_BYTES: z.coerce.number().int().default(1024 * 1024), // 1MB default

  // ── Database ─────────────────────────────────────────────────────────────
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection URL'),
  DATABASE_POOL_MIN: z.coerce.number().int().min(1).max(50).default(2),
  DATABASE_POOL_MAX: z.coerce.number().int().min(2).max(100).default(10),
  DATABASE_POOL_IDLE_TIMEOUT_MS: z.coerce.number().int().default(30000),
  DATABASE_ACQUIRE_TIMEOUT_MS: z.coerce.number().int().default(10000),
  DATABASE_STATEMENT_TIMEOUT_MS: z.coerce.number().int().default(30000),

  // ── Redis ────────────────────────────────────────────────────────────────
  REDIS_URL: z.string().url('REDIS_URL must be a valid Redis connection URL').optional(),
  REDIS_REQUIRED: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),

  // ── CORS ─────────────────────────────────────────────────────────────────
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:8081,http://localhost:19006')
    .transform((v) => v.split(',').map((o) => o.trim())),

  // ── Security ─────────────────────────────────────────────────────────────
  // Descope (Prompt 88) — required in non-test environments
  DESCOPE_PROJECT_ID: z.string().optional(),
  DESCOPE_MANAGEMENT_KEY: z.string().optional(),

  // MiniMoth WhatsApp OTP (Prompt 88, 89)
  MINIMOTH_API_KEY: z.string().optional(),
  MINIMOTH_BASE_URL: z.string().url().optional().default('https://api.minimoth.io/v1'),
  MINIMOTH_WHATSAPP_SENDER_ID: z.string().optional(),

  // ── Storage ──────────────────────────────────────────────────────────────
  STORAGE_PROVIDER: z.enum(['local', 's3', 'gcs']).default('local'),
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_ENDPOINT: z.string().url().optional(),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),

  // ── Notifications (Prompt 114) — optional at foundation ──────────────────
  FCM_SERVER_KEY: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),

  // ── Observability ────────────────────────────────────────────────────────
  OTEL_SERVICE_NAME: z.string().default('bharat-pulselink-api'),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),

  // ── Government integration (Prompt 95–97) ────────────────────────────────
  GOVT_API_BASE_URL: z.string().url().optional(),
  GOVT_API_KEY: z.string().optional(),

  // ── Blockchain / Integrity (Prompt 113) ──────────────────────────────────
  BLOCKCHAIN_PROVIDER: z.enum(['polygon', 'hyperledger', 'mock', 'disabled']).default('disabled'),
  BLOCKCHAIN_NODE_URL: z.string().url().optional(),
  BLOCKCHAIN_WALLET_KEY: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Derived config types
// ---------------------------------------------------------------------------

export type Env = z.infer<typeof envSchema>;

// ---------------------------------------------------------------------------
// Validation — fails fast on invalid config
// ---------------------------------------------------------------------------

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    // Use raw console.error because logger may not yet be initialized
    console.error('[CONFIG] FATAL — Environment validation failed:');
    for (const issue of result.error.issues) {
      console.error(`  • ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }

  const env = result.data;

  // Cross-field validation
  if (env.NODE_ENV !== 'development' && env.NODE_ENV !== 'test') {
    if (!env.DESCOPE_PROJECT_ID) {
      console.error('[CONFIG] FATAL — DESCOPE_PROJECT_ID is required in non-development environments');
      process.exit(1);
    }
    if (env.REDIS_REQUIRED && !env.REDIS_URL) {
      console.error('[CONFIG] FATAL — REDIS_URL is required when REDIS_REQUIRED=true');
      process.exit(1);
    }
  }

  return env;
}

// ---------------------------------------------------------------------------
// Singleton — evaluated once at import time
// ---------------------------------------------------------------------------

export const env: Readonly<Env> = loadEnv();

// ---------------------------------------------------------------------------
// Safe startup metadata (never includes secrets)
// ---------------------------------------------------------------------------

export function getSafeStartupInfo(): Record<string, unknown> {
  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    host: env.HOST,
    logLevel: env.LOG_LEVEL,
    apiPrefix: env.API_PREFIX,
    database: 'configured',
    redis: env.REDIS_URL ? 'configured' : 'not configured',
    redisRequired: env.REDIS_REQUIRED,
    storageProvider: env.STORAGE_PROVIDER,
    descopeProjectId: env.DESCOPE_PROJECT_ID ? `${env.DESCOPE_PROJECT_ID.slice(0, 8)}...` : 'not configured',
    minimothConfigured: Boolean(env.MINIMOTH_API_KEY),
    blockchainProvider: env.BLOCKCHAIN_PROVIDER,
    otelServiceName: env.OTEL_SERVICE_NAME,
  };
}
