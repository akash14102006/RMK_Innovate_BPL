/**
 * User Repository
 *
 * Implements user, device, and server-authoritative session persistence.
 *
 * Owned by: Identity & Security Infrastructure (Prompt 88, 89, 92)
 */

import type { Knex } from 'knex';
import { uuidv7 } from 'uuidv7';
import type { UserRow, UserStatus, DeviceRow, SessionRow } from '../../../core/types/database.types.js';

export class UserRepository {
  constructor(private readonly _knex: Knex) {}

  async findById(id: string, trx?: Knex.Transaction): Promise<UserRow | null> {
    const q = (trx ?? this._knex)<UserRow>('users').where({ id }).first();
    return (await q) ?? null;
  }

  async createUser(
    data?: { id?: string; status?: UserStatus },
    trx?: Knex.Transaction,
  ): Promise<UserRow> {
    const insertPayload: Partial<UserRow> = {
      id: data?.id ?? uuidv7(),
      status: data?.status ?? 'ACTIVE',
    };

    const [user] = await (trx ?? this._knex)<UserRow>('users')
      .insert(insertPayload)
      .returning('*');
    return user!;
  }

  async updateStatus(id: string, status: UserStatus, trx?: Knex.Transaction): Promise<UserRow | null> {
    const [updated] = await (trx ?? this._knex)<UserRow>('users')
      .where({ id })
      .update({
        status,
        updated_at: new Date(),
      })
      .returning('*');
    return updated ?? null;
  }

  async updateLastAuthenticated(id: string, trx?: Knex.Transaction): Promise<void> {
    await (trx ?? this._knex)('users')
      .where({ id })
      .update({
        last_authenticated_at: new Date(),
        updated_at: new Date(),
      });
  }

  async updateLastSeen(id: string, trx?: Knex.Transaction): Promise<void> {
    await (trx ?? this._knex)('users')
      .where({ id })
      .update({
        last_seen_at: new Date(),
        updated_at: new Date(),
      });
  }

  async deleteUser(id: string, trx?: Knex.Transaction): Promise<boolean> {
    const count = await (trx ?? this._knex)('users').where({ id }).del();
    return count > 0;
  }

  // ── Session methods ──────────────────────────────────────────────────────

  async createSession(
    data: {
      user_id: string;
      device_id?: string;
      session_token_hash: string;
      expires_at: Date;
      absolute_expires_at: Date;
    },
    trx?: Knex.Transaction,
  ): Promise<SessionRow> {
    const [session] = await (trx ?? this._knex)<SessionRow>('sessions')
      .insert({
        user_id: data.user_id,
        device_id: data.device_id ?? null,
        session_token_hash: data.session_token_hash,
        status: 'ACTIVE',
        expires_at: data.expires_at,
        absolute_expires_at: data.absolute_expires_at,
      })
      .returning('*');
    return session!;
  }

  async findSessionByTokenHash(tokenHash: string, trx?: Knex.Transaction): Promise<SessionRow | null> {
    const q = (trx ?? this._knex)<SessionRow>('sessions')
      .where({ session_token_hash: tokenHash, status: 'ACTIVE' })
      .first();
    return (await q) ?? null;
  }

  async revokeSession(id: string, reason: string, trx?: Knex.Transaction): Promise<void> {
    await (trx ?? this._knex)('sessions')
      .where({ id })
      .update({
        status: 'REVOKED',
        revoked_at: new Date(),
        revoke_reason: reason,
      });
  }

  async revokeAllUserSessions(userId: string, reason: string, trx?: Knex.Transaction): Promise<number> {
    return (trx ?? this._knex)('sessions')
      .where({ user_id: userId, status: 'ACTIVE' })
      .update({
        status: 'REVOKED',
        revoked_at: new Date(),
        revoke_reason: reason,
      });
  }

  // ── Device methods ───────────────────────────────────────────────────────

  async registerDevice(
    data: {
      user_id: string;
      device_fingerprint_hash: string;
      platform: 'ios' | 'android' | 'web';
      app_version: string;
      push_token_hash?: string;
    },
    trx?: Knex.Transaction,
  ): Promise<DeviceRow> {
    const [device] = await (trx ?? this._knex)<DeviceRow>('devices')
      .insert({
        user_id: data.user_id,
        device_fingerprint_hash: data.device_fingerprint_hash,
        platform: data.platform,
        app_version: data.app_version,
        push_token_hash: data.push_token_hash ?? null,
        status: 'ACTIVE',
      })
      .returning('*');
    return device!;
  }

  async updateDeviceLastSeen(id: string, trx?: Knex.Transaction): Promise<void> {
    await (trx ?? this._knex)('devices')
      .where({ id })
      .update({ last_seen_at: new Date() });
  }
}
