/**
 * Session Management & Security Service
 *
 * Production-grade server-authoritative session service:
 * - Multi-device session lifecycle & token hash lookup
 * - Single-flight refresh mutex preventing refresh storms
 * - Concurrency-safe revocation (current, specific device, other devices, all devices)
 * - Safe against Logout vs Refresh race conditions (revocation wins immediately)
 * - Near-real-time Redis cache invalidation & domain events (ZERO PHI/secrets)
 * - IDOR-safe session inspection and enumeration protection
 *
 * Owned by: Security & Session Domain (Prompt 92, 101 §20, §30)
 */

import { createHash, randomBytes } from 'node:crypto';
import type { Knex } from 'knex';
import { AppError, ErrorCode } from '../../core/errors/AppError.js';
import type { Logger } from '../../infrastructure/logger/logger.js';
import type { CacheClient } from '../../infrastructure/redis/redis.js';
import type { SessionRepository } from '../../infrastructure/database/repositories/SessionRepository.js';
import type { UserRepository } from '../../infrastructure/database/repositories/UserRepository.js';
import type { AuditRepository } from '../../infrastructure/database/repositories/AuditRepository.js';
import type { IDescopeClient } from '../../infrastructure/auth/DescopeClient.js';
import type { DomainEventEmitter } from '../../infrastructure/events/DomainEventEmitter.js';
import type {
  DevicePlatform,
  SessionRow,
  UserRow,
} from '../../core/types/database.types.js';
import {
  toSessionDTO,
  toSecurityEventDTO,
  type SessionDTO,
  type SecurityStatusDTO,
  type SecurityEventDTO,
} from './session.schemas.js';

export interface SessionServiceDeps {
  db: Knex;
  sessionRepo: SessionRepository;
  userRepo: UserRepository;
  auditRepo: AuditRepository;
  descopeClient?: IDescopeClient | null;
  logger: Logger;
  cache?: CacheClient | null;
  eventEmitter?: DomainEventEmitter | null;
  sessionTtlSeconds?: number;
  absoluteLifetimeSeconds?: number;
}

export class SessionService {
  private readonly _db: Knex;
  private readonly _sessionRepo: SessionRepository;
  private readonly _userRepo: UserRepository;
  private readonly _auditRepo: AuditRepository;
  private readonly _descopeClient?: IDescopeClient | null;
  private readonly _logger: Logger;
  private readonly _cache?: CacheClient | null;
  private readonly _eventEmitter?: DomainEventEmitter | null;
  private readonly _sessionTtlSeconds: number;
  private readonly _absoluteLifetimeSeconds: number;

  // Single-flight in-memory promise registry for concurrent refresh deduplication
  private readonly _refreshFlightMap = new Map<string, Promise<{ session: SessionDTO; sessionToken: string }>>();

  constructor(deps: SessionServiceDeps) {
    this._db = deps.db;
    this._sessionRepo = deps.sessionRepo;
    this._userRepo = deps.userRepo;
    this._auditRepo = deps.auditRepo;
    this._descopeClient = deps.descopeClient;
    this._logger = deps.logger.child({
      module: 'session-service',
      descopeConfigured: Boolean(this._descopeClient),
    });
    this._cache = deps.cache;
    this._eventEmitter = deps.eventEmitter;
    this._sessionTtlSeconds = deps.sessionTtlSeconds ?? 86400 * 7; // Default 7 days
    this._absoluteLifetimeSeconds = deps.absoluteLifetimeSeconds ?? 86400 * 30; // Default 30 days
  }

  /**
   * Computes SHA-256 digest of an opaque token string.
   */
  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Hashes an IP address for privacy-safe audit logging.
   */
  private _hashIp(ip?: string | null): string | null {
    if (!ip) return null;
    return createHash('sha256').update(ip).digest('hex').slice(0, 32);
  }

  /**
   * Creates a new application session for an authenticated user.
   */
  async createSession(params: {
    userId: string;
    deviceFingerprint?: string | null;
    platform?: DevicePlatform;
    appVersion?: string;
    pushToken?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    sessionToken?: string | null;
    descopeSessionRef?: string | null;
    ttlSeconds?: number;
  }): Promise<{ session: SessionDTO; sessionToken: string; expiresAt: Date }> {
    const user = await this._userRepo.findById(params.userId);
    if (!user) {
      throw new AppError({
        code: ErrorCode.USER_NOT_FOUND,
        message: 'Cannot create session for non-existent user',
      });
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError({
        code: ErrorCode.FORBIDDEN,
        message: `Account is currently ${user.status.toLowerCase()}`,
      });
    }

    const platform = params.platform ?? 'android';
    const appVersion = params.appVersion ?? '1.0.0';
    let token = params.sessionToken ?? randomBytes(32).toString('hex');
    let tokenHash = this.hashToken(token);
    const ipHash = this._hashIp(params.ipAddress);

    const now = new Date();
    const ttl = params.ttlSeconds ?? this._sessionTtlSeconds;
    const expiresAt = new Date(now.getTime() + ttl * 1000);
    const absoluteExpiresAt = new Date(now.getTime() + this._absoluteLifetimeSeconds * 1000);

    // If an active session with this exact token already exists, reuse it idempotently
    const existingSession = await this._sessionRepo.findSessionByTokenHash(tokenHash);
    if (existingSession && existingSession.status === 'ACTIVE' && existingSession.expires_at.getTime() > now.getTime()) {
      return {
        session: toSessionDTO(existingSession, existingSession.id),
        sessionToken: token,
        expiresAt: existingSession.expires_at,
      };
    } else if (existingSession) {
      // Existing token was revoked/expired; generate fresh opaque token
      token = randomBytes(32).toString('hex');
      tokenHash = this.hashToken(token);
    }

    const created = await this._db.transaction(async (trx) => {
      let deviceId: string | null = null;
      let device = null;

      if (params.deviceFingerprint) {
        device = await this._sessionRepo.upsertDevice(
          {
            user_id: params.userId,
            device_fingerprint_hash: params.deviceFingerprint,
            platform,
            app_version: appVersion,
            push_token_hash: params.pushToken,
          },
          trx,
        );
        deviceId = device.id;
      }

      const session = await this._sessionRepo.createSession(
        {
          user_id: params.userId,
          device_id: deviceId,
          session_token_hash: tokenHash,
          descope_session_reference: params.descopeSessionRef ?? null,
          status: 'ACTIVE',
          security_version: 1,
          risk_level: 'LOW',
          platform,
          app_version: appVersion,
          ip_hash: ipHash,
          user_agent_summary: params.userAgent ? params.userAgent.slice(0, 255) : null,
          expires_at: expiresAt,
          absolute_expires_at: absoluteExpiresAt,
        },
        trx,
      );

      // Audit security event
      await this._auditRepo.logSecurityEvent(
        {
          user_id: params.userId,
          device_id: deviceId,
          event_type: 'SESSION_CREATED',
          severity: 'INFO',
          ip_address: params.ipAddress ?? null,
          request_id: null,
          details: { sessionId: session.id, platform, appVersion },
        },
        trx,
      );

      return { session, device };
    });

    // Populate Redis cache if available
    if (this._cache) {
      try {
        await this._cache.set(
          `session:${created.session.id}`,
          JSON.stringify({
            id: created.session.id,
            userId: created.session.user_id,
            status: 'ACTIVE',
            securityVersion: 1,
            expiresAt: expiresAt.toISOString(),
          }),
          ttl,
        );
      } catch (err) {
        this._logger.warn('Failed to cache session in Redis', { err, sessionId: created.session.id });
      }
    }

    // Emit domain event (ZERO secrets)
    this._eventEmitter?.emitDomainEvent({
      event: 'session.created',
      sessionId: created.session.id,
      userId: created.session.user_id,
      deviceId: created.session.device_id,
      version: created.session.security_version,
      timestamp: created.session.created_at.toISOString(),
    });

    return {
      session: toSessionDTO(created.session, created.session.id, created.device),
      sessionToken: token,
      expiresAt,
    };
  }

  /**
   * Authoritatively validates a session token on incoming requests.
   */
  async validateSession(
    token: string,
    context: { ipAddress?: string | null; userAgent?: string | null } = {},
  ): Promise<{ session: SessionRow; user: UserRow }> {
    if (!token || typeof token !== 'string') {
      throw new AppError({
        code: ErrorCode.UNAUTHORIZED,
        message: 'Missing or malformed session token',
      });
    }

    const tokenHash = this.hashToken(token);
    const session = await this._sessionRepo.findSessionByTokenHash(tokenHash);

    if (!session) {
      throw new AppError({
        code: ErrorCode.UNAUTHORIZED,
        message: 'Invalid or unknown session',
      });
    }

    // Check status
    if (session.status === 'REVOKED' || session.status === 'FORCED_OUT') {
      throw new AppError({
        code: ErrorCode.UNAUTHORIZED,
        message: `Session has been ${session.status.toLowerCase()}`,
      });
    }

    // Check expiration against server-authoritative time
    const now = new Date();
    if (now > session.expires_at || now > session.absolute_expires_at) {
      await this._sessionRepo.expireStaleSessions();
      throw new AppError({
        code: ErrorCode.TOKEN_EXPIRED,
        message: 'Session has expired',
      });
    }

    // Check user account eligibility
    const user = await this._userRepo.findById(session.user_id);
    if (!user) {
      throw new AppError({
        code: ErrorCode.USER_NOT_FOUND,
        message: 'Account associated with session no longer exists',
      });
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError({
        code: ErrorCode.FORBIDDEN,
        message: `Account is currently ${user.status.toLowerCase()}`,
      });
    }

    // Throttled last_seen update (async background)
    const ipHash = this._hashIp(context.ipAddress);
    this._sessionRepo.updateLastSeen(session.id, ipHash).catch((err) => {
      this._logger.debug('Failed to update session last_seen', { err, sessionId: session.id });
    });

    return { session, user };
  }

  /**
   * Single-flight session renewal preventing concurrent refresh storms.
   * Hardened against Logout vs Refresh races: if session is revoked, refresh fails immediately.
   */
  async refreshSession(params: {
    currentToken: string;
    context?: { ipAddress?: string | null; userAgent?: string | null };
  }): Promise<{ session: SessionDTO; sessionToken: string }> {
    const tokenHash = this.hashToken(params.currentToken);

    // If a refresh is already in-flight for this token, await the same promise
    if (this._refreshFlightMap.has(tokenHash)) {
      return this._refreshFlightMap.get(tokenHash)!;
    }

    const refreshPromise = (async () => {
      const existing = await this._sessionRepo.findSessionByTokenHash(tokenHash);
      if (!existing) {
        throw new AppError({
          code: ErrorCode.UNAUTHORIZED,
          message: 'Invalid session token for refresh',
        });
      }

      // CRITICAL RACE CHECK: If session was revoked (e.g. concurrent logout), refresh MUST FAIL
      if (existing.status === 'REVOKED' || existing.status === 'FORCED_OUT') {
        throw new AppError({
          code: ErrorCode.UNAUTHORIZED,
          message: 'Cannot refresh a revoked session',
        });
      }

      const user = await this._userRepo.findById(existing.user_id);
      if (!user || user.status !== 'ACTIVE') {
        throw new AppError({
          code: ErrorCode.FORBIDDEN,
          message: 'Account is no longer active',
        });
      }

      const now = new Date();
      if (now > existing.absolute_expires_at) {
        throw new AppError({
          code: ErrorCode.TOKEN_EXPIRED,
          message: 'Session has reached its absolute maximum lifetime',
        });
      }

      // Extend expiration bounded by absoluteExpiresAt
      const newExpiresAt = new Date(
        Math.min(now.getTime() + this._sessionTtlSeconds * 1000, existing.absolute_expires_at.getTime()),
      );

      const [updated] = await this._db('sessions')
        .where({ id: existing.id, status: 'ACTIVE' })
        .update({
          expires_at: newExpiresAt,
          security_version: this._db.raw('security_version + 1'),
          last_seen_at: now,
          updated_at: now,
        })
        .returning('*');

      if (!updated) {
        throw new AppError({
          code: ErrorCode.UNAUTHORIZED,
          message: 'Session was modified or revoked during refresh',
        });
      }

      // Invalidate/refresh cache
      if (this._cache) {
        try {
          await this._cache.set(
            `session:${updated.id}`,
            JSON.stringify({
              id: updated.id,
              userId: updated.user_id,
              status: 'ACTIVE',
              securityVersion: updated.security_version,
              expiresAt: newExpiresAt.toISOString(),
            }),
            this._sessionTtlSeconds,
          );
        } catch (err) {
          this._logger.warn('Failed to update session in Redis after refresh', { err, sessionId: updated.id });
        }
      }

      this._eventEmitter?.emitDomainEvent({
        event: 'session.refreshed',
        sessionId: updated.id,
        userId: updated.user_id,
        deviceId: updated.device_id,
        version: updated.security_version,
        timestamp: updated.updated_at.toISOString(),
      });

      return {
        session: toSessionDTO(updated, updated.id),
        sessionToken: params.currentToken,
      };
    })();

    this._refreshFlightMap.set(tokenHash, refreshPromise);

    try {
      return await refreshPromise;
    } finally {
      this._refreshFlightMap.delete(tokenHash);
    }
  }

  /**
   * Revokes a specific session owned by the authenticated user (IDOR protected).
   */
  async revokeSession(
    userId: string,
    sessionId: string,
    reason = 'Revoked by user',
    context: { ipAddress?: string | null; userAgent?: string | null } = {},
  ): Promise<SessionDTO> {
    const existing = await this._sessionRepo.findSessionById(sessionId);
    if (!existing || existing.user_id !== userId) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: 'Session not found or not owned by authenticated user',
      });
    }

    if (existing.status === 'REVOKED') {
      return toSessionDTO(existing);
    }

    const revoked = await this._sessionRepo.revokeSession(sessionId, userId, reason);
    if (!revoked) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: 'Session could not be revoked',
      });
    }

    // Invalidate Redis cache
    if (this._cache) {
      try {
        await Promise.all([
          this._cache.del(`session:${sessionId}`),
          this._cache.del(`user:sessions:${userId}`),
        ]);
      } catch (err) {
        this._logger.warn('Redis cache invalidation error during session revoke', { err, sessionId });
      }
    }

    // Audit log
    await this._auditRepo.logSecurityEvent({
      user_id: userId,
      device_id: revoked.device_id,
      event_type: 'SESSION_REVOKED',
      severity: 'INFO',
      ip_address: context.ipAddress ?? null,
      request_id: null,
      details: { sessionId, reason },
    });

    // Domain event
    this._eventEmitter?.emitDomainEvent({
      event: 'session.revoked',
      sessionId,
      userId,
      reason,
      version: revoked.security_version,
      timestamp: revoked.updated_at.toISOString(),
    });

    return toSessionDTO(revoked);
  }

  /**
   * Revokes all active sessions for a user EXCEPT the current session.
   */
  async revokeOtherSessions(
    userId: string,
    currentSessionId: string,
    reason = 'Revoke other sessions requested',
    context: { ipAddress?: string | null; userAgent?: string | null } = {},
  ): Promise<{ revokedCount: number }> {
    const count = await this._sessionRepo.revokeOtherSessions(userId, currentSessionId, reason);

    if (this._cache) {
      try {
        await this._cache.del(`user:sessions:${userId}`);
      } catch (err) {
        this._logger.warn('Redis cache invalidation error on revokeOtherSessions', { err, userId });
      }
    }

    await this._auditRepo.logSecurityEvent({
      user_id: userId,
      device_id: null,
      event_type: 'OTHER_SESSIONS_REVOKED',
      severity: 'WARN',
      ip_address: context.ipAddress ?? null,
      request_id: null,
      details: { currentSessionId, revokedCount: count },
    });

    this._eventEmitter?.emitDomainEvent({
      event: 'session.all_revoked',
      userId,
      reason,
      timestamp: new Date().toISOString(),
    });

    return { revokedCount: count };
  }

  /**
   * Revokes all active sessions for a user.
   */
  async revokeAllSessions(
    userId: string,
    reason = 'Revoke all sessions requested',
    context: { ipAddress?: string | null; userAgent?: string | null } = {},
  ): Promise<{ revokedCount: number }> {
    const count = await this._sessionRepo.revokeAllUserSessions(userId, reason);

    if (this._cache) {
      try {
        await Promise.all([
          this._cache.del(`session:user:${userId}`),
          this._cache.del(`user:sessions:${userId}`),
        ]);
      } catch (err) {
        this._logger.warn('Redis cache invalidation error on revokeAllSessions', { err, userId });
      }
    }

    await this._auditRepo.logSecurityEvent({
      user_id: userId,
      device_id: null,
      event_type: 'ALL_SESSIONS_REVOKED',
      severity: 'WARN',
      ip_address: context.ipAddress ?? null,
      request_id: null,
      details: { revokedCount: count },
    });

    this._eventEmitter?.emitDomainEvent({
      event: 'session.all_revoked',
      userId,
      reason,
      timestamp: new Date().toISOString(),
    });

    return { revokedCount: count };
  }

  /**
   * Lists all sessions for the authenticated user with sanitized metadata.
   */
  async listUserSessions(userId: string, currentSessionId?: string | null): Promise<SessionDTO[]> {
    const sessions = await this._sessionRepo.listUserSessions(userId);
    const devices = await this._sessionRepo.listUserDevices(userId);
    const deviceMap = new Map(devices.map((d) => [d.id, d]));

    return sessions.map((s) => toSessionDTO(s, currentSessionId, s.device_id ? deviceMap.get(s.device_id) : null));
  }

  /**
   * Retrieves single session details with IDOR protection.
   */
  async getSessionById(
    userId: string,
    sessionId: string,
    currentSessionId?: string | null,
  ): Promise<SessionDTO> {
    const session = await this._sessionRepo.findSessionById(sessionId);
    if (!session || session.user_id !== userId) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: 'Session not found',
      });
    }

    let device = null;
    if (session.device_id) {
      device = await this._sessionRepo.findDeviceById(session.device_id);
    }

    return toSessionDTO(session, currentSessionId, device);
  }

  /**
   * Retrieves high-level security center status overview.
   */
  async getSecurityStatus(userId: string, currentSessionId?: string | null): Promise<SecurityStatusDTO> {
    const user = await this._userRepo.findById(userId);
    if (!user) {
      throw new AppError({
        code: ErrorCode.USER_NOT_FOUND,
        message: 'User account not found',
      });
    }

    const sessions = await this._sessionRepo.listUserSessions(userId);
    const devices = await this._sessionRepo.listUserDevices(userId);
    const activeSessions = sessions.filter((s) => s.status === 'ACTIVE');
    const recentEvents = await this._auditRepo.getUserSecurityEvents(userId, 10);

    return {
      userId: user.id,
      accountStatus: user.status,
      activeSessionsCount: activeSessions.length,
      totalRegisteredDevices: devices.length,
      currentSessionId: currentSessionId ?? null,
      lastAuthenticatedAt: user.last_authenticated_at ? user.last_authenticated_at.toISOString() : null,
      securityScore: user.status === 'ACTIVE' ? 100 : 0,
      recentSecurityEventsCount: recentEvents.length,
    };
  }

  /**
   * Retrieves security audit events for the user.
   */
  async getUserSecurityEvents(userId: string, limit = 50): Promise<SecurityEventDTO[]> {
    const events = await this._auditRepo.getUserSecurityEvents(userId, limit);
    return events.map((e) => toSecurityEventDTO(e));
  }
}
