/**
 * Bharat PulseLink — Sync & Offline Encryption Fastify API Routes
 *
 * Exposes:
 * - GET /api/v1/me/sync/delta (pull delta changes)
 * - POST /api/v1/me/sync/mutations (push encrypted offline mutations)
 * - POST /api/v1/me/sync/cursor (acknowledge persistence and advance cursor)
 *
 * Owned by: Sync & Offline Security Domain (Prompt 93)
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { AppDependencies } from '../../app/container.js';
import { Errors } from '../../core/errors/AppError.js';

const deltaQuerySchema = z.object({
  since: z.coerce.number().int().min(0).default(0),
});

const mutationsBodySchema = z.object({
  mutations: z.array(
    z.object({
      idempotencyKey: z.string().min(1),
      mutationType: z.enum(['CREATE', 'UPDATE', 'DELETE']),
      resourceType: z.string().min(1),
      resourceId: z.string().min(1),
      baseVersion: z.number().int().min(1),
      encryptedEnvelope: z.object({
        version: z.literal('BPL-ENC-v1'),
        algorithm: z.literal('AES-256-GCM'),
        keyVersion: z.string(),
        nonce: z.string(),
        ciphertext: z.string(),
        authTag: z.string(),
        aadVersion: z.literal('v1'),
        wrappedDek: z.string().optional(),
        integrityHash: z.string().optional(),
      }),
    }),
  ),
});

const cursorBodySchema = z.object({
  cursorVersion: z.number().int().min(0),
});

export async function syncRoutes(fastify: FastifyInstance, deps: AppDependencies): Promise<void> {
  const syncService = (deps as any).encryptedSyncService;

  // GET /api/v1/me/sync/delta
  fastify.get('/delta', async (request: FastifyRequest, reply: FastifyReply) => {
    const ctx = request.ctx;
    if (!ctx || !ctx.userId || !ctx.sessionId) {
      throw Errors.unauthorized('Authentication required for sync');
    }

    const query = deltaQuerySchema.parse(request.query);
    const deviceId = ctx.deviceId || 'dev_default';

    const delta = await syncService.getDeltaSync(ctx.userId, ctx.sessionId, deviceId, query.since);
    return reply.status(200).send({
      success: true,
      data: delta,
    });
  });

  // POST /api/v1/me/sync/mutations
  fastify.post('/mutations', async (request: FastifyRequest, reply: FastifyReply) => {
    const ctx = request.ctx;
    if (!ctx || !ctx.userId || !ctx.sessionId) {
      throw Errors.unauthorized('Authentication required for sync');
    }

    const body = mutationsBodySchema.parse(request.body);
    const deviceId = ctx.deviceId || 'dev_default';

    const result = await syncService.processMutations(ctx.userId, ctx.sessionId, deviceId, body.mutations);
    return reply.status(200).send({
      success: true,
      data: result,
    });
  });

  // POST /api/v1/me/sync/cursor
  fastify.post('/cursor', async (request: FastifyRequest, reply: FastifyReply) => {
    const ctx = request.ctx;
    if (!ctx || !ctx.userId || !ctx.sessionId) {
      throw Errors.unauthorized('Authentication required for sync');
    }

    const body = cursorBodySchema.parse(request.body);
    const deviceId = ctx.deviceId || 'dev_default';

    const result = await syncService.advanceClientCursor(
      ctx.userId,
      ctx.sessionId,
      deviceId,
      body.cursorVersion,
    );
    return reply.status(200).send({
      success: true,
      data: result,
    });
  });
}

export default syncRoutes;
