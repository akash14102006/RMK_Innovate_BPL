/**
 * Bharat PulseLink — QR Sessions Fastify API Routes
 *
 * Exposes:
 * - POST /api/v1/me/qr-sessions (Generate real-time one-time QR session)
 * - GET  /api/v1/me/qr-sessions/:id (Get patient QR session details)
 * - POST /api/v1/me/qr-sessions/:id/revoke (Revoke active QR session)
 * - POST /api/v1/me/qr-capabilities/prefetch (Prefetch capability pool)
 * - POST /api/v1/me/qr-capabilities/sync (Sync offline capability statuses)
 * - POST /api/v1/qr-sessions/consume (Hospital scanner consume & encrypted exchange)
 * - GET  /api/v1/qr-sessions/:id/status (Public/hospital status check)
 *
 * Owned by: QR & Secure Session Domain (Prompt 107)
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import type { AppDependencies } from '../../app/container.js';
import { Errors } from '../../core/errors/AppError.js';
import { createAuthMiddleware } from '../../app/middleware/auth.middleware.js';

const createQRSessionSchema = z.object({
  purpose: z.enum(['HOSPITAL_CHECKIN', 'APPOINTMENT', 'HEALTH_RECORD_SHARE', 'IDENTITY_VERIFICATION']).default('HOSPITAL_CHECKIN'),
  recipientType: z.enum(['FACILITY', 'PROVIDER', 'OPEN']).default('FACILITY'),
  recipientId: z.string().uuid().nullable().optional(),
  ttlSeconds: z.number().int().min(30).max(300).default(90),
});

const consumeQRSessionSchema = z.object({
  rawToken: z.string().min(32),
  consumerFacilityId: z.string().min(1),
  purpose: z.enum(['HOSPITAL_CHECKIN', 'APPOINTMENT', 'HEALTH_RECORD_SHARE', 'IDENTITY_VERIFICATION']).default('HOSPITAL_CHECKIN'),
  requestedScopes: z.array(z.string()).optional(),
});

export async function registerQrRoutes(fastify: FastifyInstance, deps: AppDependencies): Promise<void> {
  const qrService = (deps as any).qrSessionService;
  const requireAuth = createAuthMiddleware(deps);

  // ── Patient Endpoints (Mounted under /me/qr-sessions) ──────────────────────

  // POST /api/v1/me/qr-sessions
  fastify.post(
    '/me/qr-sessions',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const ctx = request.ctx;
      if (!ctx || !ctx.userId || !ctx.sessionId) {
        throw Errors.unauthorized('Authentication required to generate QR session');
      }

      const body = createQRSessionSchema.parse(request.body ?? {});
      const result = await qrService.createPatientQRSession(ctx.userId, ctx.sessionId, body);

      return reply.status(201).send({
        success: true,
        data: result,
      });
    },
  );

  // GET /api/v1/me/qr-sessions/:id
  fastify.get(
    '/me/qr-sessions/:id',
    { preHandler: [requireAuth] },
    async (request: any, reply: FastifyReply) => {
      const ctx = request.ctx;
      if (!ctx || !ctx.userId) {
        throw Errors.unauthorized('Authentication required to access QR session');
      }

      const status = await qrService.getQRSessionStatus(request.params.id, ctx.userId);
      return reply.status(200).send({
        success: true,
        data: status,
      });
    },
  );

  // POST /api/v1/me/qr-sessions/:id/revoke
  fastify.post(
    '/me/qr-sessions/:id/revoke',
    { preHandler: [requireAuth] },
    async (request: any, reply: FastifyReply) => {
      const ctx = request.ctx;
      if (!ctx || !ctx.userId || !ctx.sessionId) {
        throw Errors.unauthorized('Authentication required to revoke QR session');
      }

      const revoked = await qrService.revokeQRSession(ctx.userId, ctx.sessionId, request.params.id);
      return reply.status(200).send({
        success: true,
        data: { revoked },
      });
    },
  );

  // POST /api/v1/me/qr-capabilities/prefetch (and /me/qr-sessions/offline-pool)
  const handlePrefetchCapabilities = async (request: FastifyRequest, reply: FastifyReply) => {
    const ctx = request.ctx;
    if (!ctx || !ctx.userId || !ctx.sessionId) {
      throw Errors.unauthorized('Authentication required to generate offline capability pool');
    }

    const offlineSchema = z.object({
      count: z.number().int().min(1).max(5).default(5),
      ttlHours: z.number().int().min(1).max(72).default(24),
      purpose: z.enum(['HOSPITAL_CHECKIN', 'APPOINTMENT', 'HEALTH_RECORD_SHARE', 'IDENTITY_VERIFICATION']).default('HOSPITAL_CHECKIN'),
    });

    const body = offlineSchema.parse(request.body ?? {});
    const capabilities = await qrService.createOfflineCapabilityPool(ctx.userId, ctx.sessionId, body);

    return reply.status(201).send({
      success: true,
      data: capabilities,
    });
  };

  fastify.post('/me/qr-capabilities/prefetch', { preHandler: [requireAuth] }, handlePrefetchCapabilities);
  fastify.post('/me/qr-sessions/offline-pool', { preHandler: [requireAuth] }, handlePrefetchCapabilities);

  // POST /api/v1/me/qr-capabilities/sync (and /me/qr-sessions/sync)
  const handleSyncCapabilities = async (request: FastifyRequest, reply: FastifyReply) => {
    const ctx = request.ctx;
    if (!ctx || !ctx.userId || !ctx.sessionId) {
      throw Errors.unauthorized('Authentication required to sync offline capabilities');
    }

    const syncSchema = z.object({
      capabilityIds: z.array(z.string().uuid()),
    });

    const body = syncSchema.parse(request.body ?? {});
    const synced = await qrService.syncOfflineCapabilities(ctx.userId, ctx.sessionId, body.capabilityIds);

    return reply.status(200).send({
      success: true,
      data: synced,
    });
  };

  fastify.post('/me/qr-capabilities/sync', { preHandler: [requireAuth] }, handleSyncCapabilities);
  fastify.post('/me/qr-sessions/sync', { preHandler: [requireAuth] }, handleSyncCapabilities);

  // ── Scanner / Consumption Endpoints (Mounted under /qr-sessions) ──────────

  // POST /api/v1/qr-sessions/consume
  fastify.post('/qr-sessions/consume', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = consumeQRSessionSchema.parse(request.body);
    const result = await qrService.consumeQRSession(body);

    return reply.status(200).send({
      success: true,
      data: result,
    });
  });

  // POST /api/v1/integrations/hospital/qr/resolve (Dedicated Hospital Bridge)
  fastify.post('/integrations/hospital/qr/resolve', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = consumeQRSessionSchema.parse(request.body);
    const result = await qrService.consumeQRSession(body);

    return reply.status(200).send({
      success: true,
      exchangeId: `exc_${result.qrSessionId}`,
      status: result.status,
      purpose: result.purpose,
      facilityId: result.facilityId,
      consumedAt: result.consumedAt,
      authorizedScopes: result.authorizedScopes,
      encryptedExchangeEnvelope: result.encryptedExchangeEnvelope,
      data: result.approvedData || {
        profile: {
          gender: result.publicPatientInfo?.gender,
          bloodGroup: result.publicPatientInfo?.bloodGroup,
        },
      },
    });
  });

  // GET /api/v1/qr-sessions/:id/status
  fastify.get('/qr-sessions/:id/status', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const status = await qrService.getQRSessionStatus(request.params.id);
    return reply.status(200).send({
      success: true,
      data: status,
    });
  });
}

export default registerQrRoutes;
