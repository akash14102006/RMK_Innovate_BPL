/**
 * Session & Security Center Fastify Routes
 *
 * Exposes patient self-service session management endpoints (/api/v1/me/sessions, /api/v1/me/security)
 * with strict IDOR protection, session enumeration defense, and audit logging.
 *
 * Owned by: Security & Session Domain (Prompt 92, 101 §20, §30)
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { type ZodSchema } from 'zod';
import { AppError, ErrorCode } from '../../core/errors/AppError.js';
import { createAuthMiddleware } from '../../app/middleware/auth.middleware.js';
import type { AppDependencies } from '../../app/container.js';
import {
  RevokeSessionSchema,
  RevokeOtherSessionsSchema,
  RevokeAllSessionsSchema,
} from './session.schemas.js';

function validatePayload<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errorMessages = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    throw new AppError({
      code: ErrorCode.VALIDATION_ERROR,
      message: `Invalid session request payload: ${errorMessages}`,
      issues: result.error.errors.map((e) => ({
        code: 'VALIDATION_ERROR',
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }
  return result.data;
}

export async function registerSessionRoutes(app: FastifyInstance, deps: AppDependencies): Promise<void> {
  const requireAuth = createAuthMiddleware(deps);
  const sessionService = deps.sessionService;

  const tags = ['Security & Sessions'];
  const security = [{ bearerAuth: [] }];

  // ── GET /me/sessions ─────────────────────────────────────────────────────
  app.get(
    '/me/sessions',
    {
      preHandler: [requireAuth],
      schema: {
        tags,
        summary: 'List active and recent user sessions',
        description: 'Returns sanitized session list for the authenticated patient with current session flag.',
        security,
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.ctx.userId!;
      const currentSessionId = request.ctx.sessionId;
      const sessions = await sessionService.listUserSessions(userId, currentSessionId);
      return reply.status(200).send({ success: true, data: sessions });
    },
  );

  // ── GET /me/sessions/:id ─────────────────────────────────────────────────
  app.get(
    '/me/sessions/:id',
    {
      preHandler: [requireAuth],
      schema: {
        tags,
        summary: 'Get session details by ID',
        description: 'Retrieves metadata for a specific session. Protected against IDOR and enumeration.',
        security,
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.ctx.userId!;
      const { id } = request.params as { id: string };
      const currentSessionId = request.ctx.sessionId;
      const session = await sessionService.getSessionById(userId, id, currentSessionId);
      return reply.status(200).send({ success: true, data: session });
    },
  );

  // ── POST /me/sessions/:id/revoke ─────────────────────────────────────────
  app.post(
    '/me/sessions/:id/revoke',
    {
      preHandler: [requireAuth],
      schema: {
        tags,
        summary: 'Revoke a specific device session',
        description: 'Revokes a single target session owned by the authenticated patient.',
        security,
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.ctx.userId!;
      const { id } = request.params as { id: string };
      const payload = validatePayload(RevokeSessionSchema, request.body ?? {});

      const revoked = await sessionService.revokeSession(userId, id, payload.reason, {
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      return reply.status(200).send({ success: true, data: revoked });
    },
  );

  // ── POST /me/sessions/revoke-others ──────────────────────────────────────
  app.post(
    '/me/sessions/revoke-others',
    {
      preHandler: [requireAuth],
      schema: {
        tags,
        summary: 'Revoke all other active sessions',
        description: 'Revokes all active sessions on other devices, keeping current device session active.',
        security,
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.ctx.userId!;
      const currentSessionId = request.ctx.sessionId ?? '';
      const payload = validatePayload(RevokeOtherSessionsSchema, request.body ?? {});

      const result = await sessionService.revokeOtherSessions(userId, currentSessionId, payload.reason, {
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      return reply.status(200).send({ success: true, data: result });
    },
  );

  // ── POST /me/sessions/revoke-all ─────────────────────────────────────────
  app.post(
    '/me/sessions/revoke-all',
    {
      preHandler: [requireAuth],
      schema: {
        tags,
        summary: 'Revoke all active sessions (forced logout everywhere)',
        description: 'Revokes every active session for the authenticated patient across all devices.',
        security,
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.ctx.userId!;
      const payload = validatePayload(RevokeAllSessionsSchema, request.body ?? {});

      const result = await sessionService.revokeAllSessions(userId, payload.reason, {
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      // Also trigger remote provider logout
      if (request.ctx.descopeUserId) {
        await deps.descopeClient.revokeSession(request.ctx.descopeUserId).catch(() => {});
      }

      return reply.status(200).send({ success: true, data: result });
    },
  );

  // ── GET /me/security/status ──────────────────────────────────────────────
  app.get(
    '/me/security/status',
    {
      preHandler: [requireAuth],
      schema: {
        tags,
        summary: 'Get Security Center overview status',
        description: 'Returns high-level summary of active sessions, devices, and security metrics.',
        security,
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.ctx.userId!;
      const currentSessionId = request.ctx.sessionId;
      const status = await sessionService.getSecurityStatus(userId, currentSessionId);
      return reply.status(200).send({ success: true, data: status });
    },
  );

  // ── GET /me/security/events ──────────────────────────────────────────────
  app.get(
    '/me/security/events',
    {
      preHandler: [requireAuth],
      schema: {
        tags,
        summary: 'List user security audit events',
        description: 'Retrieves chronological security audit events for the authenticated patient.',
        security,
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.ctx.userId!;
      const query = request.query as { limit?: string };
      const limit = query.limit ? Math.min(parseInt(query.limit, 10), 100) : 50;
      const events = await sessionService.getUserSecurityEvents(userId, limit);
      return reply.status(200).send({ success: true, data: events });
    },
  );
}
