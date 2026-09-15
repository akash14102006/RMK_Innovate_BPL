/**
 * Consent Domain Fastify Routes
 *
 * Exposes patient self-service consent endpoints (/api/v1/me/consents)
 * and internal policy evaluation endpoint (/api/v1/internal/consent/check).
 *
 * Owned by: Consent Domain (Prompt 91, 101 §28, §82)
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { type ZodSchema } from 'zod';
import { AppError, ErrorCode } from '../../core/errors/AppError.js';
import { createAuthMiddleware } from '../../app/middleware/auth.middleware.js';
import type { AppDependencies } from '../../app/container.js';
import {
  GrantConsentSchema,
  RevokeConsentSchema,
  ConsentPreviewSchema,
  CheckConsentSchema,
} from './consent.schemas.js';

function validatePayload<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errorMessages = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    throw new AppError({
      code: ErrorCode.VALIDATION_ERROR,
      message: `Invalid consent request payload: ${errorMessages}`,
      issues: result.error.errors.map((e) => ({
        code: 'VALIDATION_ERROR',
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }
  return result.data;
}

export async function registerConsentRoutes(app: FastifyInstance, deps: AppDependencies): Promise<void> {
  const requireAuth = createAuthMiddleware(deps);
  const consentService = deps.consentService;

  const tags = ['Consent & Privacy'];
  const security = [{ bearerAuth: [] }];

  // ── GET /me/consents ─────────────────────────────────────────────────────
  app.get(
    '/me/consents',
    {
      preHandler: [requireAuth],
      schema: {
        tags,
        summary: 'List patient consent records',
        description: 'Retrieves all active and historical data-sharing consents for the authenticated patient.',
        security,
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.ctx.userId!;
      const query = request.query as { status?: string; purpose?: string };
      const consents = await consentService.getPatientConsents(userId, query);
      return reply.status(200).send({ success: true, data: consents });
    },
  );

  // ── GET /me/consents/:id ─────────────────────────────────────────────────
  app.get(
    '/me/consents/:id',
    {
      preHandler: [requireAuth],
      schema: {
        tags,
        summary: 'Get consent record by ID',
        description: 'Retrieves a single consent decision with scope breakdown and validity timestamps.',
        security,
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.ctx.userId!;
      const { id } = request.params as { id: string };
      const consent = await consentService.getConsentById(userId, id);
      return reply.status(200).send({ success: true, data: consent });
    },
  );

  // ── POST /me/consents/preview ────────────────────────────────────────────
  app.post(
    '/me/consents/preview',
    {
      preHandler: [requireAuth],
      schema: {
        tags,
        summary: 'Preview consent scopes and notices',
        description: 'Returns what data categories will be shared without committing consent to the database.',
        security,
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.ctx.userId!;
      const payload = validatePayload(ConsentPreviewSchema, request.body ?? {});
      const preview = await consentService.previewConsent(userId, payload);
      return reply.status(200).send({ success: true, data: preview });
    },
  );

  // ── POST /me/consents ────────────────────────────────────────────────────
  app.post(
    '/me/consents',
    {
      preHandler: [requireAuth],
      schema: {
        tags,
        summary: 'Grant explicit patient consent',
        description: 'Atomically creates an auditable, versioned data-sharing consent for a specific recipient and purpose.',
        security,
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.ctx.userId!;
      const payload = validatePayload(GrantConsentSchema, request.body ?? {});
      const consent = await consentService.grantConsent(userId, payload, {
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });
      return reply.status(201).send({ success: true, data: consent });
    },
  );

  // ── POST /me/consents/:id/revoke ─────────────────────────────────────────
  app.post(
    '/me/consents/:id/revoke',
    {
      preHandler: [requireAuth],
      schema: {
        tags,
        summary: 'Revoke active patient consent',
        description: 'Instantly revokes data-sharing consent with optimistic concurrency control, invalidating downstream access.',
        security,
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.ctx.userId!;
      const { id } = request.params as { id: string };
      const payload = validatePayload(RevokeConsentSchema, request.body ?? {});
      const revoked = await consentService.revokeConsent(userId, id, payload, {
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });
      return reply.status(200).send({ success: true, data: revoked });
    },
  );

  // ── GET /me/consents/:id/history ─────────────────────────────────────────
  app.get(
    '/me/consents/:id/history',
    {
      preHandler: [requireAuth],
      schema: {
        tags,
        summary: 'Get immutable consent audit trail',
        description: 'Retrieves all lifecycle state change events (requested, granted, revoked, superseded) for a consent.',
        security,
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.ctx.userId!;
      const { id } = request.params as { id: string };
      const history = await consentService.getConsentHistory(userId, id);
      return reply.status(200).send({ success: true, data: history });
    },
  );

  // ── POST /internal/consent/check ─────────────────────────────────────────
  app.post(
    '/internal/consent/check',
    {
      schema: {
        tags: ['Internal Services'],
        summary: 'Evaluate effective consent authorization decision',
        description: 'Invoked by downstream services (check-in, secure exchange, QR) to check if requested scopes are authorized.',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const payload = validatePayload(CheckConsentSchema, request.body ?? {});
      const decision = await consentService.checkEffectiveConsent({
        patientId: payload.patientId,
        purpose: payload.purpose,
        recipient: payload.recipient,
        requiredScopes: payload.requiredScopes,
        at: payload.at ? new Date(payload.at) : undefined,
      });

      return reply.status(200).send({ success: true, data: decision });
    },
  );
}
