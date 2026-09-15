/**
 * Health & Readiness Routes
 *
 * GET /health   — liveness: process is alive
 * GET /ready    — readiness: service can safely accept traffic
 * GET /version  — safe build metadata
 *
 * Rules:
 * - /health must NEVER expose secrets, credentials, or topology
 * - /ready checks real database + Redis connectivity
 * - Failed dependency → readiness fails (503), does not crash the process
 * - Both routes are unauthenticated (infrastructure probes)
 *
 * Owned by: Platform Foundation (Prompt 87)
 */

import { type FastifyInstance, type FastifyRequest, type FastifyReply } from 'fastify';
import { type AppDependencies } from '../container.js';

const SERVICE_VERSION = process.env['npm_package_version'] ?? '0.1.0';
const BUILD_SHA = process.env['BUILD_SHA'] ?? 'local';
const SERVICE_NAME = 'bharat-pulselink-api';

export async function registerHealthRoutes(app: FastifyInstance, deps: AppDependencies): Promise<void> {
  // ── Liveness — is the process alive? ─────────────────────────────────────
  const healthHandler = async (_req: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send({
      status: 'alive',
      timestamp: new Date().toISOString(),
    });
  };

  app.get('/health', healthHandler);
  app.get('/api/v1/health', healthHandler);

  // ── Readiness — can the service accept traffic? ───────────────────────────
  app.get('/ready', async (_req: FastifyRequest, reply: FastifyReply) => {
    const checks: Record<string, 'ok' | 'error'> = {};
    let ready = true;

    // Database check (always required)
    const dbOk = await deps.db.ping();
    checks['database'] = dbOk ? 'ok' : 'error';
    if (!dbOk) ready = false;

    // Redis check (required only if REDIS_REQUIRED=true)
    const cacheOk = await deps.cache.ping();
    checks['cache'] = cacheOk ? 'ok' : 'error';
    // Redis failure only fails readiness in production/staging
    // (NullCacheClient always returns true in dev)
    if (!cacheOk && process.env['REDIS_REQUIRED'] === 'true') {
      ready = false;
    }

    const statusCode = ready ? 200 : 503;
    return reply.status(statusCode).send({
      status: ready ? 'ready' : 'not_ready',
      checks,
      timestamp: new Date().toISOString(),
    });
  });

  // ── Version — safe build metadata ────────────────────────────────────────
  app.get('/version', async (_req: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send({
      service: SERVICE_NAME,
      version: SERVICE_VERSION,
      buildSha: BUILD_SHA,
      nodeVersion: process.version,
    });
  });

  deps.logger.info('Health routes registered', {
    routes: ['/health', '/ready', '/version'],
  });
}
