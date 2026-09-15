/**
 * Bharat PulseLink — Sync Repository
 *
 * Implements persistent storage queries for:
 * - sync_cursors (tracking device-level sequence progress)
 * - sync_mutations (storing offline encrypted mutations idempotently)
 *
 * Owned by: Sync & Offline Security Domain (Prompt 93)
 */

import { Knex } from 'knex';
import { randomUUID } from 'crypto';

export interface SyncCursorRow {
  id: string;
  user_id: string;
  device_id: string;
  cursor_version: string | number;
  last_synced_at: Date;
  created_at: Date;
}

export interface SyncMutationRow {
  id: string;
  user_id: string;
  device_id: string;
  mutation_type: string;
  resource_type: string;
  resource_id: string;
  base_version: string | number;
  status: 'PENDING' | 'APPLIED' | 'CONFLICTED' | 'REJECTED';
  idempotency_key: string;
  payload: Record<string, any>;
  created_at: Date;
  processed_at?: Date | null;
}

export class SyncRepository {
  constructor(private readonly _db: Knex) {}

  /**
   * Retrieves current sync cursor for a specific user and device.
   */
  async getCursor(userId: string, deviceId: string, trx?: Knex.Transaction): Promise<SyncCursorRow | null> {
    const qb = (trx || this._db)('sync_cursors').where({ user_id: userId, device_id: deviceId }).first();
    const row = await qb;
    return row || null;
  }

  /**
   * Advances the sync cursor for user & device.
   * Only called AFTER local persistence is confirmed.
   */
  async advanceCursor(
    userId: string,
    deviceId: string,
    newCursorVersion: number,
    trx?: Knex.Transaction,
  ): Promise<SyncCursorRow> {
    const query = trx || this._db;
    const existing = await query('sync_cursors').where({ user_id: userId, device_id: deviceId }).first();

    if (existing) {
      const [updated] = await query('sync_cursors')
        .where({ id: existing.id })
        .update({
          cursor_version: newCursorVersion,
          last_synced_at: new Date(),
        })
        .returning('*');
      return updated;
    }

    const [created] = await query('sync_cursors')
      .insert({
        id: randomUUID(),
        user_id: userId,
        device_id: deviceId,
        cursor_version: newCursorVersion,
        last_synced_at: new Date(),
        created_at: new Date(),
      })
      .returning('*');
    return created;
  }

  /**
   * Enqueues an encrypted offline mutation idempotently.
   * If idempotency_key exists, returns the existing record without duplicating.
   */
  async queueMutation(
    data: {
      userId: string;
      deviceId: string;
      mutationType: string;
      resourceType: string;
      resourceId: string;
      baseVersion: number;
      idempotencyKey: string;
      payload: Record<string, any>;
    },
    trx?: Knex.Transaction,
  ): Promise<{ mutation: SyncMutationRow; isDuplicate: boolean }> {
    const query = trx || this._db;

    const existing = await query('sync_mutations')
      .where({ idempotency_key: data.idempotencyKey })
      .first();

    if (existing) {
      return { mutation: existing, isDuplicate: true };
    }

    const [inserted] = await query('sync_mutations')
      .insert({
        id: randomUUID(),
        user_id: data.userId,
        device_id: data.deviceId,
        mutation_type: data.mutationType,
        resource_type: data.resourceType,
        resource_id: data.resourceId,
        base_version: data.baseVersion,
        status: 'PENDING',
        idempotency_key: data.idempotencyKey,
        payload: JSON.stringify(data.payload),
        created_at: new Date(),
      })
      .returning('*');

    return { mutation: inserted, isDuplicate: false };
  }

  /**
   * Finds mutation by idempotency key.
   */
  async findMutationByIdempotencyKey(
    idempotencyKey: string,
    trx?: Knex.Transaction,
  ): Promise<SyncMutationRow | null> {
    const row = await (trx || this._db)('sync_mutations')
      .where({ idempotency_key: idempotencyKey })
      .first();
    return row || null;
  }

  /**
   * Lists all pending mutations for a user and device.
   */
  async listPendingMutations(
    userId: string,
    deviceId?: string,
    trx?: Knex.Transaction,
  ): Promise<SyncMutationRow[]> {
    const qb = (trx || this._db)('sync_mutations')
      .where({ user_id: userId, status: 'PENDING' });

    if (deviceId) {
      qb.andWhere({ device_id: deviceId });
    }

    qb.orderBy('created_at', 'asc');
    return qb;
  }

  /**
   * Updates mutation status upon server execution.
   */
  async updateMutationStatus(
    mutationId: string,
    status: 'APPLIED' | 'CONFLICTED' | 'REJECTED',
    trx?: Knex.Transaction,
  ): Promise<SyncMutationRow> {
    const [updated] = await (trx || this._db)('sync_mutations')
      .where({ id: mutationId })
      .update({
        status,
        processed_at: new Date(),
      })
      .returning('*');
    return updated;
  }
}

export default SyncRepository;
