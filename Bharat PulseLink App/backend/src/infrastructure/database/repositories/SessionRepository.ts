/**
 * Session Repository
 *
 * Implements server-authoritative session lifecycle, token hash mapping,
 * device association, multi-device revocation, and concurrency-safe status updates.
 *
 * Owned by: Session & Security Infrastructure (Prompt 92, 101 §20, §30)
 */

import { randomUUID } from 'node:crypto';
import type { Knex } from 'knex';
import type {
  SessionRow,
  SessionStatus,
  SessionRiskLevel,
  DeviceRow,
  DevicePlatform,
} from '../../../core/types/database.types.js';

export class SessionRepository {
  constructor(private readonly _knex: Knex) {}

  /**
   * Creates a new application session record.
   */
  async createSession(
    data: {
      id?: string;
      user_id: string;
      device_id?: string | null;
      session_token_hash: string;
      descope_session_reference?: string | null;
      status?: SessionStatus;
      security_version?: number;
      risk_level?: SessionRiskLevel;
      platform?: DevicePlatform;
      app_version?: string;
      ip_hash?: string | null;
      user_agent_summary?: string | null;
      expires_at: Date;
      absolute_expires_at: Date;
    },
    trx?: Knex.Transaction,
  ): Promise<SessionRow> {
    const db = trx ?? this._knex;
    const sessionId = data.id ?? randomUUID();
    const now = new Date();

    const [session] = await db<SessionRow>('sessions')
      .insert({
        id: sessionId,
        user_id: data.user_id,
        device_id: data.device_id ?? null,
        session_token_hash: data.session_token_hash,
        descope_session_reference: data.descope_session_reference ?? null,
        status: data.status ?? 'ACTIVE',
        security_version: data.security_version ?? 1,
        risk_level: data.risk_level ?? 'LOW',
        platform: data.platform ?? 'android',
        app_version: data.app_version ?? '1.0.0',
        ip_hash: data.ip_hash ?? null,
        user_agent_summary: data.user_agent_summary ?? null,
        created_at: now,
        last_seen_at: now,
        expires_at: data.expires_at,
        absolute_expires_at: data.absolute_expires_at,
        revoked_at: null,
        revoke_reason: null,
        updated_at: now,
      })
      .returning('*');

    return session!;
  }

  /**
   * Finds a session by its unique ID.
   */
  async findSessionById(id: string, trx?: Knex.Transaction): Promise<SessionRow | null> {
    const q = (trx ?? this._knex)<SessionRow>('sessions').where({ id }).first();
    const row = (await q) ?? null;
    return row;
  }

  /**
   * Finds a session by its SHA-256 token hash.
   */
  async findSessionByTokenHash(tokenHash: string, trx?: Knex.Transaction): Promise<SessionRow | null> {
    const q = (trx ?? this._knex)<SessionRow>('sessions')
      .where({ session_token_hash: tokenHash })
      .first();
    const row = (await q) ?? null;
    return row;
  }

  /**
   * Finds an active session by Descope user reference / subject.
   */
  async findSessionByDescopeRef(descopeRef: string, trx?: Knex.Transaction): Promise<SessionRow | null> {
    const q = (trx ?? this._knex)<SessionRow>('sessions')
      .where({ descope_session_reference: descopeRef, status: 'ACTIVE' })
      .orderBy('created_at', 'desc')
      .first();
    const row = (await q) ?? null;
    return row;
  }

  /**
   * Lists all sessions for a user (both active and recent historical), ordered by created_at DESC.
   */
  async listUserSessions(userId: string, trx?: Knex.Transaction): Promise<SessionRow[]> {
    const rows = await (trx ?? this._knex)<SessionRow>('sessions')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc');
    return rows;
  }

  /**
   * Updates last_seen_at timestamp and ip_hash for an active session.
   */
  async updateLastSeen(id: string, ipHash?: string | null, trx?: Knex.Transaction): Promise<void> {
    const payload: Record<string, unknown> = {
      last_seen_at: new Date(),
      updated_at: new Date(),
    };
    if (ipHash !== undefined) {
      payload.ip_hash = ipHash;
    }

    await (trx ?? this._knex)('sessions')
      .where({ id })
      .update(payload);
  }

  /**
   * Revokes a specific session belonging to a user (IDOR protected).
   */
  async revokeSession(
    id: string,
    userId: string,
    reason: string,
    trx?: Knex.Transaction,
  ): Promise<SessionRow | null> {
    const db = trx ?? this._knex;
    const now = new Date();

    const [updated] = await db<SessionRow>('sessions')
      .where({ id, user_id: userId })
      .whereIn('status', ['ACTIVE'])
      .update({
        status: 'REVOKED',
        revoked_at: now,
        revoke_reason: reason,
        security_version: db.raw('security_version + 1'),
        updated_at: now,
      })
      .returning('*');

    return updated ?? null;
  }

  /**
   * Revokes all active sessions for a user EXCEPT the current session.
   */
  async revokeOtherSessions(
    userId: string,
    currentSessionId?: string | null,
    reason = 'Revoke other sessions',
    trx?: Knex.Transaction,
  ): Promise<number> {
    const db = trx ?? this._knex;
    const now = new Date();

    const query = db('sessions')
      .where({ user_id: userId, status: 'ACTIVE' });

    if (currentSessionId && currentSessionId.trim().length > 0) {
      query.whereNot('id', currentSessionId);
    }

    const count = await query.update({
      status: 'REVOKED',
      revoked_at: now,
      revoke_reason: reason,
      security_version: db.raw('security_version + 1'),
      updated_at: now,
    });

    return count;
  }

  /**
   * Revokes all active sessions for a user.
   */
  async revokeAllUserSessions(
    userId: string,
    reason: string,
    trx?: Knex.Transaction,
  ): Promise<number> {
    const db = trx ?? this._knex;
    const now = new Date();

    const count = await db('sessions')
      .where({ user_id: userId, status: 'ACTIVE' })
      .update({
        status: 'REVOKED',
        revoked_at: now,
        revoke_reason: reason,
        security_version: db.raw('security_version + 1'),
        updated_at: now,
      });

    return count;
  }

  /**
   * Sweeps and transitions expired sessions from ACTIVE to EXPIRED.
   */
  async expireStaleSessions(trx?: Knex.Transaction): Promise<number> {
    const db = trx ?? this._knex;
    const now = new Date();

    const count = await db('sessions')
      .where('status', 'ACTIVE')
      .andWhere('expires_at', '<', now)
      .update({
        status: 'EXPIRED',
        updated_at: now,
      });

    return count;
  }

  // ── Device Management ────────────────────────────────────────────────────

  /**
   * Upserts a client device record (registers new or updates last_seen on existing).
   */
  async upsertDevice(
    data: {
      id?: string;
      user_id: string;
      device_fingerprint_hash: string;
      platform: DevicePlatform;
      app_version: string;
      push_token_hash?: string | null;
    },
    trx?: Knex.Transaction,
  ): Promise<DeviceRow> {
    const db = trx ?? this._knex;
    const now = new Date();

    const existing = await db<DeviceRow>('devices')
      .where({
        user_id: data.user_id,
        device_fingerprint_hash: data.device_fingerprint_hash,
      })
      .first();

    if (existing) {
      const [updated] = await db<DeviceRow>('devices')
        .where({ id: existing.id })
        .update({
          platform: data.platform,
          app_version: data.app_version,
          push_token_hash: data.push_token_hash ?? existing.push_token_hash,
          last_seen_at: now,
        })
        .returning('*');
      return updated!;
    }

    const deviceId = data.id ?? randomUUID();
    const [inserted] = await db<DeviceRow>('devices')
      .insert({
        id: deviceId,
        user_id: data.user_id,
        device_fingerprint_hash: data.device_fingerprint_hash,
        platform: data.platform,
        app_version: data.app_version,
        push_token_hash: data.push_token_hash ?? null,
        status: 'ACTIVE',
        registered_at: now,
        last_seen_at: now,
      })
      .returning('*');

    return inserted!;
  }

  /**
   * Finds a device by ID.
   */
  async findDeviceById(id: string, trx?: Knex.Transaction): Promise<DeviceRow | null> {
    const q = (trx ?? this._knex)<DeviceRow>('devices').where({ id }).first();
    const row = (await q) ?? null;
    return row;
  }

  /**
   * Lists all registered devices for a user.
   */
  async listUserDevices(userId: string, trx?: Knex.Transaction): Promise<DeviceRow[]> {
    const rows = await (trx ?? this._knex)<DeviceRow>('devices')
      .where({ user_id: userId })
      .orderBy('last_seen_at', 'desc');
    return rows;
  }

  /**
   * Revokes a specific device and its associated active sessions.
   */
  async revokeDevice(
    deviceId: string,
    userId: string,
    reason: string,
    trx?: Knex.Transaction,
  ): Promise<boolean> {
    const db = trx ?? this._knex;
    const now = new Date();

    const updated = await db('devices')
      .where({ id: deviceId, user_id: userId })
      .update({ status: 'REVOKED' });

    if (!updated) return false;

    // Revoke all active sessions on this device
    await db('sessions')
      .where({ device_id: deviceId, user_id: userId, status: 'ACTIVE' })
      .update({
        status: 'REVOKED',
        revoked_at: now,
        revoke_reason: `Device revoked: ${reason}`,
        security_version: db.raw('security_version + 1'),
        updated_at: now,
      });

    return true;
  }
}
