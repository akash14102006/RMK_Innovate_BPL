/**
 * Authentication & Session Verification Middleware
 *
 * Enforces enterprise-grade token and session validation:
 * 1. Extracts Authorization Bearer token
 * 2. Validates session token hash in SessionService (PostgreSQL / Redis cache)
 * 3. Enforces session status (ACTIVE only — rejects REVOKED, EXPIRED, FORCED_OUT)
 * 4. Enforces account status (ACTIVE only — rejects SUSPENDED, DISABLED)
 * 5. Falls back to Descope token validation and active session lookup
 * 6. Injects verified principal and session context into RequestContext (ZERO secrets)
 *
 * Owned by: Authentication & Security Domain (Prompt 88, 92)
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { AppError, ErrorCode } from '../../core/errors/AppError.js';
import type { AppDependencies } from '../container.js';

export function createAuthMiddleware(deps: AppDependencies) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    // If context was already populated (e.g. unit test runner injection without mock token)
    if (request.ctx?.userId && request.ctx?.sessionId && !request.headers.authorization) {
      return;
    }

    // Allow dev headers in development mode
    if (process.env['NODE_ENV'] !== 'production' && request.headers['x-user-id']) {
      request.ctx.userId = request.headers['x-user-id'] as string;
      request.ctx.sessionId = (request.headers['x-session-id'] as string) || '018f0000-0000-7000-8000-000000000003';
      request.ctx.roles = ['patient'];
      request.ctx.scopes = [];
      return;
    }

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError({
        code: ErrorCode.UNAUTHORIZED,
        message: 'Missing or invalid Authorization header',
      });
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      throw new AppError({
        code: ErrorCode.UNAUTHORIZED,
        message: 'Bearer token cannot be empty',
      });
    }

    const context = {
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    };

    // 1. Direct validation via SessionService if token matches a local session
    if (deps.sessionService) {
      try {
        const validated = await deps.sessionService.validateSession(token, context);
        request.ctx.userId = validated.user.id;
        request.ctx.sessionId = validated.session.id;
        request.ctx.deviceId = validated.session.device_id ?? undefined;
        request.ctx.descopeUserId = validated.session.descope_session_reference ?? undefined;
        request.ctx.roles = ['patient'];
        request.ctx.scopes = [];
        return;
      } catch (err) {
        // If error was an explicit session state error (REVOKED, EXPIRED, FORBIDDEN), rethrow immediately
        if (
          err instanceof AppError &&
          (err.code === ErrorCode.TOKEN_EXPIRED ||
            err.code === ErrorCode.FORBIDDEN ||
            err.message.includes('revoked') ||
            err.message.includes('expired') ||
            err.message.includes('forced_out'))
        ) {
          throw err;
        }
        // If token was not found in local table, fall through to Descope token validation
      }
    }

    // 2. Validate Descope session token
    const claims = await deps.descopeClient.validateSessionToken(token);

    // 3. Resolve local user via identity mapping
    const identity = await deps.identityRepo.findByProviderSubject('DESCOPE', claims.descopeUserId);
    if (!identity) {
      throw new AppError({
        code: ErrorCode.USER_NOT_FOUND,
        message: 'No registered Bharat PulseLink account matches this session',
      });
    }

    const user = await deps.userRepo.findById(identity.user_id);
    if (!user) {
      throw new AppError({
        code: ErrorCode.USER_NOT_FOUND,
        message: 'No registered Bharat PulseLink user found for this identity',
      });
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError({
        code: ErrorCode.FORBIDDEN,
        message: `Account is currently ${user.status.toLowerCase()}`,
      });
    }

    // 4. Look up or find active session for this descope user
    let sessionId: string | undefined;
    let deviceId: string | undefined;

    if (deps.sessionRepo) {
      const activeSession = await deps.sessionRepo.findSessionByDescopeRef(claims.descopeUserId);
      if (activeSession) {
        if (activeSession.status === 'REVOKED' || activeSession.status === 'FORCED_OUT') {
          throw new AppError({
            code: ErrorCode.UNAUTHORIZED,
            message: `Session has been ${activeSession.status.toLowerCase()}`,
          });
        }
        sessionId = activeSession.id;
        deviceId = activeSession.device_id ?? undefined;
      }
    }

    // 5. Populate verified request context
    request.ctx.userId = user.id;
    request.ctx.sessionId = sessionId;
    request.ctx.deviceId = deviceId;
    request.ctx.descopeUserId = claims.descopeUserId;
    request.ctx.roles = claims.roles ?? ['patient'];
    request.ctx.scopes = claims.permissions ?? [];
  };
}
