/**
 * Bharat PulseLink — IVR Internal Fastify Routes
 *
 * Exposes internal endpoints for Asterisk webhook / bridge adapters.
 * Protected against public exposure.
 */

import { type FastifyInstance, type FastifyRequest, type FastifyReply } from 'fastify';
import { type AppDependencies } from '../../app/container.js';
import { IVRApplicationService } from './IVRApplicationService.js';
import {
  IvrCallStartSchema,
  IvrDtmfInputSchema,
  IvrTimeoutSchema,
  IvrHangupSchema,
  IvrSessionParamSchema,
  type IvrCallStartInput,
  type IvrDtmfInput,
  type IvrTimeoutInput,
  type IvrHangupInput,
  type IvrSessionParam,
} from './ivr.schemas.js';

export async function registerIvrRoutes(
  app: FastifyInstance,
  deps: AppDependencies,
  ivrServiceOverride?: IVRApplicationService,
): Promise<void> {
  const ivrService = ivrServiceOverride ?? new IVRApplicationService({ logger: deps.logger });

  // ── Health Endpoint ──────────────────────────────────────────────────────
  app.get('/health', async (_req: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send({
      status: 'UP',
      service: 'bharat-pulselink-ivr-service',
      timestamp: new Date().toISOString(),
    });
  });

  // ── Inbound Call Start ───────────────────────────────────────────────────
  app.post(
    '/session/start',
    async (
      req: FastifyRequest<{ Body: IvrCallStartInput }>,
      reply: FastifyReply,
    ) => {
      const parsed = IvrCallStartSchema.parse(req.body);
      const res = await ivrService.handleCallStart({
        callId: parsed.callId,
        channelId: parsed.channelId,
        callerNumber: parsed.callerNumber,
        correlationId: parsed.correlationId ?? req.id,
      });

      return reply.status(200).send({
        success: true,
        sessionId: res.session.sessionId,
        state: res.session.state,
        nextPrompt: res.result.promptKey,
        action: res.result.action,
      });
    },
  );

  // ── DTMF Event ───────────────────────────────────────────────────────────
  app.post(
    '/event/dtmf',
    async (
      req: FastifyRequest<{ Body: IvrDtmfInput }>,
      reply: FastifyReply,
    ) => {
      const parsed = IvrDtmfInputSchema.parse(req.body);
      const res = await ivrService.handleDtmfInput({
        callId: parsed.callId,
        digits: parsed.digits,
        correlationId: parsed.correlationId ?? req.id,
      });

      return reply.status(200).send({
        success: true,
        sessionId: res.session.sessionId,
        state: res.session.state,
        language: res.session.language,
        intent: res.session.intent,
        nextPrompt: res.result.promptKey,
        action: res.result.action,
        error: res.result.error,
        bookingId: res.session.bookingId,
        bookingReference: res.session.bookingReference,
        notificationStatus: res.session.notificationStatus,
      });
    },
  );

  // ── Timeout Event ────────────────────────────────────────────────────────
  app.post(
    '/event/timeout',
    async (
      req: FastifyRequest<{ Body: IvrTimeoutInput }>,
      reply: FastifyReply,
    ) => {
      const parsed = IvrTimeoutSchema.parse(req.body);
      const res = await ivrService.handleTimeout({
        callId: parsed.callId,
        correlationId: parsed.correlationId ?? req.id,
      });

      return reply.status(200).send({
        success: true,
        sessionId: res.session.sessionId,
        state: res.session.state,
        language: res.session.language,
        nextPrompt: res.result.promptKey,
        action: res.result.action,
        error: res.result.error,
      });
    },
  );

  // ── Call Hangup ──────────────────────────────────────────────────────────
  app.post(
    '/event/hangup',
    async (
      req: FastifyRequest<{ Body: IvrHangupInput }>,
      reply: FastifyReply,
    ) => {
      const parsed = IvrHangupSchema.parse(req.body);
      const terminated = await ivrService.handleCallHangup({
        callId: parsed.callId,
        correlationId: parsed.correlationId ?? req.id,
      });

      return reply.status(200).send({
        success: true,
        callId: parsed.callId,
        terminatedState: terminated?.state ?? 'TERMINATED',
      });
    },
  );

  // ── Session Inspection ───────────────────────────────────────────────────
  app.get(
    '/session/:callId',
    async (
      req: FastifyRequest<{ Params: IvrSessionParam }>,
      reply: FastifyReply,
    ) => {
      const parsed = IvrSessionParamSchema.parse(req.params);
      const session = await ivrService.getSessionStatus(parsed.callId);

      return reply.status(200).send({
        success: true,
        session,
      });
    },
  );
}
