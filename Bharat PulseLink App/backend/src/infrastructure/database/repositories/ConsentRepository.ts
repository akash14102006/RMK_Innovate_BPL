/**
 * Consent Repository
 *
 * Implements ABDM Consent Manager persistence, policy versioning, and immutable consent event trails.
 *
 * Owned by: Consent Domain (Prompt 91, 101 §28, §82)
 */

import { randomUUID } from 'node:crypto';
import type { Knex } from 'knex';
import type {
  ConsentRow,
  ConsentEventRow,
  ConsentPolicyVersionRow,
  ConsentActorType,
} from '../../../core/types/database.types.js';

export class ConsentRepository {
  constructor(private readonly _knex: Knex) {}

  async findById(id: string, trx?: Knex.Transaction): Promise<ConsentRow | null> {
    const q = (trx ?? this._knex)<ConsentRow>('consents').where({ id }).first();
    const row = (await q) ?? null;
    if (!row) return null;
    return this._normalizeConsentRow(row);
  }

  /**
   * Finds an active GRANTED consent for a specific patient, purpose, and recipient.
   */
  async findActiveConsent(
    patientId: string,
    purpose: string,
    recipientType: string,
    recipientId: string,
    trx?: Knex.Transaction,
  ): Promise<ConsentRow | null> {
    const now = new Date();
    const row = await (trx ?? this._knex)<ConsentRow>('consents')
      .where({
        patient_id: patientId,
        purpose,
        recipient_type: recipientType,
        recipient_id: recipientId,
        status: 'GRANTED',
      })
      .andWhere('valid_from', '<=', now)
      .andWhere('valid_to', '>=', now)
      .whereNull('revoked_at')
      .orderBy('created_at', 'desc')
      .first();

    if (!row) return null;
    return this._normalizeConsentRow(row);
  }

  /**
   * Retrieves all consents for a patient, optionally filtered by status or purpose.
   */
  async getPatientConsents(
    patientId: string,
    filter?: { status?: string; purpose?: string },
    trx?: Knex.Transaction,
  ): Promise<ConsentRow[]> {
    let q = (trx ?? this._knex)<ConsentRow>('consents')
      .where({ patient_id: patientId })
      .orderBy('created_at', 'desc');

    if (filter?.status) {
      q = q.andWhere('status', filter.status);
    }
    if (filter?.purpose) {
      q = q.andWhere('purpose', filter.purpose);
    }

    const rows = await q;
    return rows.map((r) => this._normalizeConsentRow(r));
  }

  /**
   * Atomically creates a consent record and appends a GRANTED (or initial) audit event.
   */
  async createConsent(
    data: {
      id?: string;
      patient_id: string;
      purpose: string;
      recipient_type?: string;
      recipient_id: string;
      granted_to_facility_id?: string | null;
      scopes: string[];
      policy_version?: string;
      policy_hash?: string | null;
      status?: ConsentRow['status'];
      valid_from: Date;
      valid_to: Date;
    },
    actorId: string,
    actorType: ConsentActorType = 'PATIENT',
    ipAddress?: string | null,
    userAgent?: string | null,
    metadata?: Record<string, unknown> | null,
    trx?: Knex.Transaction,
  ): Promise<ConsentRow> {
    const db = trx ?? this._knex;
    const consentId = data.id ?? randomUUID();

    const [inserted] = await db<ConsentRow>('consents')
      .insert({
        id: consentId,
        patient_id: data.patient_id,
        purpose: data.purpose,
        recipient_type: data.recipient_type ?? 'HOSPITAL',
        recipient_id: data.recipient_id,
        granted_to_facility_id: data.granted_to_facility_id ?? null,
        scopes: JSON.stringify(data.scopes) as unknown as string[],
        policy_version: data.policy_version ?? '1.0',
        policy_hash: data.policy_hash ?? null,
        status: data.status ?? 'GRANTED',
        version: 1,
        valid_from: data.valid_from,
        valid_to: data.valid_to,
        granted_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    const consent = this._normalizeConsentRow(inserted!);

    // Record immutable audit event in the same transaction
    await db<ConsentEventRow>('consent_events').insert({
      id: randomUUID(),
      consent_id: consent.id,
      event_type: consent.status === 'DENIED' ? 'CONSENT_DENIED' : 'CONSENT_GRANTED',
      actor_id: actorId,
      actor_type: actorType,
      reason: consent.status === 'DENIED' ? 'Explicit consent denial by user' : 'Consent granted by user',
      ip_address: ipAddress ?? null,
      user_agent: userAgent ?? null,
      metadata: metadata ? (JSON.stringify(metadata) as unknown as Record<string, unknown>) : null,
      timestamp: new Date(),
    });

    return consent;
  }

  /**
   * Revokes an existing active consent with optimistic concurrency control.
   */
  async revokeConsent(
    consentId: string,
    expectedVersion: number | undefined,
    reason: string,
    actorId: string,
    actorType: ConsentActorType = 'PATIENT',
    ipAddress?: string | null,
    userAgent?: string | null,
    trx?: Knex.Transaction,
  ): Promise<ConsentRow | null> {
    const db = trx ?? this._knex;

    let query = db('consents')
      .where({ id: consentId })
      .whereIn('status', ['GRANTED', 'PENDING']);

    if (expectedVersion !== undefined) {
      query = query.andWhere({ version: expectedVersion });
    }

    const [updated] = await query
      .update({
        status: 'REVOKED',
        revoked_at: new Date(),
        revocation_reason: reason,
        version: db.raw('version + 1'),
        updated_at: new Date(),
      })
      .returning('*');

    if (!updated) {
      return null;
    }

    const consent = this._normalizeConsentRow(updated);

    // Record immutable revocation event in same transaction
    await db<ConsentEventRow>('consent_events').insert({
      id: randomUUID(),
      consent_id: consentId,
      event_type: 'CONSENT_REVOKED',
      actor_id: actorId,
      actor_type: actorType,
      reason,
      ip_address: ipAddress ?? null,
      user_agent: userAgent ?? null,
      timestamp: new Date(),
    });

    return consent;
  }

  /**
   * Retrieves all immutable lifecycle events for a specific consent record.
   */
  async getConsentEvents(consentId: string, trx?: Knex.Transaction): Promise<ConsentEventRow[]> {
    const rows = await (trx ?? this._knex)<ConsentEventRow>('consent_events')
      .where({ consent_id: consentId })
      .orderBy('timestamp', 'asc');

    return rows.map((r) => this._normalizeEventRow(r));
  }

  /**
   * Policy version queries
   */
  async getPolicyVersion(
    policyType: string,
    version: string,
    trx?: Knex.Transaction,
  ): Promise<ConsentPolicyVersionRow | null> {
    const row = await (trx ?? this._knex)<ConsentPolicyVersionRow>('consent_policy_versions')
      .where({ policy_type: policyType, version })
      .first();

    return row ?? null;
  }

  async getLatestPolicyVersion(
    policyType: string,
    trx?: Knex.Transaction,
  ): Promise<ConsentPolicyVersionRow | null> {
    const row = await (trx ?? this._knex)<ConsentPolicyVersionRow>('consent_policy_versions')
      .where({ policy_type: policyType })
      .whereNull('effective_until')
      .orderBy('effective_from', 'desc')
      .first();

    return row ?? null;
  }

  private _normalizeConsentRow(row: any): ConsentRow {
    let scopes: string[] = [];
    if (typeof row.scopes === 'string') {
      try {
        scopes = JSON.parse(row.scopes);
      } catch {
        scopes = [row.scopes];
      }
    } else if (Array.isArray(row.scopes)) {
      scopes = row.scopes;
    } else if (Array.isArray(row.scope)) {
      scopes = row.scope;
    } else if (typeof row.scope === 'string') {
      try {
        scopes = JSON.parse(row.scope);
      } catch {
        scopes = [row.scope];
      }
    }

    return {
      ...row,
      scopes,
    };
  }

  private _normalizeEventRow(row: any): ConsentEventRow {
    let metadata: Record<string, unknown> | null = null;
    if (typeof row.metadata === 'string') {
      try {
        metadata = JSON.parse(row.metadata);
      } catch {
        metadata = null;
      }
    } else if (row.metadata && typeof row.metadata === 'object') {
      metadata = row.metadata;
    }

    return {
      ...row,
      metadata,
    };
  }
}
