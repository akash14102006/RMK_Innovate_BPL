/**
 * Auth Routes (Prompt 88, 89, 92)
 *
 * Implements:
 * - POST /api/v1/auth/exchange — Descope token exchange & idempotent user/profile/session provisioning
 * - POST /api/v1/auth/logout — Revokes current application session and remote provider session
 * - POST /api/v1/auth/revoke-all — Revokes all active sessions for user across devices
 * - GET /api/v1/auth/me — Returns current authenticated user and profile state
 *
 * Owned by: Authentication & Identity Domain (Prompt 88, 89, 92)
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { AppError, ErrorCode } from '../../core/errors/AppError.js';
import type { AppDependencies } from '../../app/container.js';
import { createAuthMiddleware } from '../../app/middleware/auth.middleware.js';

const exchangeSchema = z.object({
  sessionToken: z.string().min(1, 'sessionToken is required'),
  deviceFingerprint: z.string().optional(),
  platform: z.enum(['ios', 'android', 'web']).default('android'),
  appVersion: z.string().default('1.0.0'),
  pushToken: z.string().optional(),
});

export async function registerAuthRoutes(app: FastifyInstance, deps: AppDependencies): Promise<void> {
  const requireAuth = createAuthMiddleware(deps);

  // ── POST /exchange ────────────────────────────────────────────────────────
  app.post(
    '/exchange',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parseResult = exchangeSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid exchange payload',
          issues: parseResult.error.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        });
      }

      const { sessionToken, deviceFingerprint, platform, appVersion, pushToken } = parseResult.data;

      // 1. Validate Descope session
      const claims = await deps.descopeClient.validateSessionToken(sessionToken);

      // 2. Resolve or atomically provision canonical user via IdentityResolver
      const resolution = await deps.identityResolver.resolveOrCreateUser({
        provider: 'DESCOPE',
        providerSubject: claims.descopeUserId,
        email: claims.email,
        phone: claims.phone,
        correlationId: request.ctx.requestId,
      });

      const user = resolution.user;
      const isNewUser = resolution.isNewUser;

      if (user.status !== 'ACTIVE') {
        throw new AppError({
          code: ErrorCode.FORBIDDEN,
          message: `Account is currently ${user.status.toLowerCase()}`,
        });
      }

      // 3. Ensure patient profile exists or create initial shell
      let profile = await deps.patientRepo.findByUserId(user.id);
      if (!profile) {
        profile = await deps.patientRepo.createProfile({
          user_id: user.id,
          full_name: claims.email ? claims.email.split('@')[0]! : 'Patient',
          gender: 'UNDISCLOSED',
          date_of_birth: new Date('2000-01-01'),
          status: 'INCOMPLETE',
          abha_id: null,
          blood_group: null,
          marital_status: null,
          occupation: null,
          address_line_1: null,
          address_line_2: null,
          locality: null,
          city_id: null,
          district_id: null,
          state_id: null,
          pincode: null,
        });
      }

      // 4. Provision application session & register device in PostgreSQL
      let createdSession = null;
      let sessionTokenToReturn = sessionToken;
      if (deps.sessionService) {
        const sessionResult = await deps.sessionService.createSession({
          userId: user.id,
          deviceFingerprint,
          platform,
          appVersion,
          pushToken,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
          sessionToken,
          descopeSessionRef: claims.descopeUserId,
        });
        createdSession = sessionResult.session;
        sessionTokenToReturn = sessionResult.sessionToken;
      }

      // 5. Record security login event
      await deps.auditRepo.logSecurityEvent({
        user_id: user.id,
        device_id: createdSession?.device?.id ?? null,
        event_type: isNewUser ? 'REGISTRATION_SUCCESS' : 'LOGIN_SUCCESS',
        severity: 'INFO',
        ip_address: request.ip,
        request_id: request.ctx.requestId,
        details: { descopeUserId: claims.descopeUserId, isNewUser, sessionId: createdSession?.sessionId },
      });

      return reply.status(200).send({
        user: {
          id: user.id,
          status: user.status,
        },
        profile: {
          id: profile.id,
          fullName: profile.full_name,
          gender: profile.gender,
          status: profile.status,
          isComplete: profile.status === 'ACTIVE',
        },
        session: {
          sessionId: createdSession?.sessionId ?? null,
          sessionToken: sessionTokenToReturn,
          expiresAt: claims.expiresAt,
        },
        isNewUser,
      });
    },
  );

  // ── POST /logout ──────────────────────────────────────────────────────────
  app.post(
    '/logout',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.ctx.userId!;
      const sessionId = request.ctx.sessionId;

      if (deps.sessionService && sessionId) {
        await deps.sessionService.revokeSession(userId, sessionId, 'USER_LOGOUT', {
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        }).catch(() => {});
      } else if (deps.sessionService) {
        await deps.sessionService.revokeAllSessions(userId, 'USER_LOGOUT', {
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        }).catch(() => {});
      }

      if (request.ctx.descopeUserId) {
        await deps.descopeClient.revokeSession(request.ctx.descopeUserId).catch(() => {});
      }

      return reply.status(200).send({ success: true, message: 'Logged out successfully' });
    },
  );

  // ── POST /revoke-all ──────────────────────────────────────────────────────
  app.post(
    '/revoke-all',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.ctx.userId!;

      let revokedCount = 0;
      if (deps.sessionService) {
        const result = await deps.sessionService.revokeAllSessions(userId, 'SECURITY_REVOKE_ALL', {
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });
        revokedCount = result.revokedCount;
      }

      if (request.ctx.descopeUserId) {
        await deps.descopeClient.revokeSession(request.ctx.descopeUserId).catch(() => {});
      }

      return reply.status(200).send({ success: true, revokedSessionsCount: revokedCount });
    },
  );

  // ── GET /me ───────────────────────────────────────────────────────────────
  app.get(
    '/me',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.ctx.userId!;
      const user = await deps.userRepo.findById(userId);
      const profile = await deps.patientRepo.findByUserId(userId);

      return reply.status(200).send({
        user: {
          id: user?.id,
          status: user?.status,
        },
        profile: profile
          ? {
              id: profile.id,
              fullName: profile.full_name,
              gender: profile.gender,
              dateOfBirth: profile.date_of_birth,
              bloodGroup: profile.blood_group,
              abhaId: profile.abha_id,
              status: profile.status,
              isComplete: profile.status === 'ACTIVE',
            }
          : null,
        roles: request.ctx.roles,
      });
    },
  );
}
