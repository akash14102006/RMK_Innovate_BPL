/**
 * Bharat PulseLink — QR Session Repository (PostgreSQL)
 *
 * Implements persistent database operations for QR sessions:
 * - Creation of one-time cryptographic QR sessions
 * - Lookup by cryptographic token hash (SHA-256)
 * - Atomic transactional consumption (race-condition protected)
 * - Revocation & Expiration lifecycle updates
 * - Full audit versioning
 *
 * Owned by: QR & Secure Session Domain (Prompt 107)
 */

import type { Knex } from 'knex';
import { uuidv7 } from 'uuidv7';
import type {
  QRSessionRow,
  QRSessionStatus,
  QRSessionPurpose,
  QRRecipientType,
} from '../../../core/types/database.types.js';

export interface CreateQRSessionInput {
  id?: string;
  patient_id: string;
  facility_id?: string | null;
  token_hash: string;
  purpose?: QRSessionPurpose;
  recipient_type?: QRRecipientType;
  recipient_id?: string | null;
  expires_at: Date;
  created_by_session_id?: string | null;
}

export class QRSessionRepository {
  constructor(private readonly _knex: Knex) {}

  /**
   * Creates a new QR session record with ACTIVE status.
   */
  async createSession(data: CreateQRSessionInput, trx?: Knex.Transaction): Promise<QRSessionRow> {
    let validRecipientId = data.recipient_id ?? null;
    if (validRecipientId) {
      const facilityExists = await (trx ?? this._knex)('facilities').where({ id: validRecipientId }).first();
      if (!facilityExists) {
        validRecipientId = null;
      }
    }

    const payload = {
      id: data.id ?? uuidv7(),
      patient_id: data.patient_id,
      facility_id: data.facility_id ?? null,
      token_hash: data.token_hash,
      status: 'ACTIVE' as QRSessionStatus,
      purpose: data.purpose ?? 'HOSPITAL_CHECKIN',
      recipient_type: data.recipient_type ?? 'FACILITY',
      recipient_id: validRecipientId,
      expires_at: data.expires_at,
      used_at: null,
      consumed_at: null,
      revoked_at: null,
      created_by_session_id: data.created_by_session_id ?? null,
      version: 1,
      created_at: new Date(),
    };

    const [row] = await (trx ?? this._knex)<QRSessionRow>('qr_sessions')
      .insert(payload)
      .returning('*');

    return row!;
  }

  /**
   * Finds a QR session by primary UUID.
   */
  async findById(id: string, trx?: Knex.Transaction): Promise<QRSessionRow | null> {
    const row = await (trx ?? this._knex)<QRSessionRow>('qr_sessions')
      .where({ id })
      .first();
    return row ?? null;
  }

  /**
   * Finds a QR session by its SHA-256 token hash.
   */
  async findByTokenHash(tokenHash: string, trx?: Knex.Transaction): Promise<QRSessionRow | null> {
    const row = await (trx ?? this._knex)<QRSessionRow>('qr_sessions')
      .where({ token_hash: tokenHash })
      .first();
    return row ?? null;
  }

  /**
   * Atomic consumption query:
   * Transitions status from ACTIVE -> CONSUMED in a single atomic SQL statement
   * guarded by `status = 'ACTIVE' AND expires_at > now()`.
   * This guarantees that concurrent double-scans CANNOT both succeed.
   */
  async consumeSessionAtomic(
    id: string,
    facilityId?: string | null,
    trx?: Knex.Transaction,
  ): Promise<{ success: boolean; session: QRSessionRow | null }> {
    const now = new Date();
    const executor = trx ?? this._knex;

    // Verify facilityId is a valid UUID present in facilities table
    let validFacilityUuid: string | null = null;
    if (facilityId) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(facilityId);
      if (isUuid) {
        const fac = await executor('facilities').where({ id: facilityId }).first();
        if (fac) {
          validFacilityUuid = fac.id;
        }
      }
    }

    const [updated] = await executor<QRSessionRow>('qr_sessions')
      .where({ id, status: 'ACTIVE' })
      .andWhere('expires_at', '>', now)
      .update({
        status: 'CONSUMED',
        facility_id: validFacilityUuid ?? executor.raw('facility_id'),
        consumed_at: now,
        used_at: now,
        version: executor.raw('version + 1'),
      })
      .returning('*');

    if (updated) {
      return { success: true, session: updated };
    }

    // Lookup existing state for precise diagnostic error classification
    const existing = await this.findById(id, trx);
    return { success: false, session: existing };
  }

  /**
   * Updates status to SCANNED (for multi-step approval workflows).
   */
  async markScanned(
    id: string,
    facilityId?: string | null,
    trx?: Knex.Transaction,
  ): Promise<QRSessionRow | null> {
    const now = new Date();
    const executor = trx ?? this._knex;

    let validFacilityUuid: string | null = null;
    if (facilityId) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(facilityId);
      if (isUuid) {
        const fac = await executor('facilities').where({ id: facilityId }).first();
        if (fac) {
          validFacilityUuid = fac.id;
        }
      }
    }

    const [updated] = await executor<QRSessionRow>('qr_sessions')
      .where({ id, status: 'ACTIVE' })
      .andWhere('expires_at', '>', now)
      .update({
        status: 'SCANNED',
        facility_id: validFacilityUuid ?? executor.raw('facility_id'),
        version: executor.raw('version + 1'),
      })
      .returning('*');

    return updated ?? null;
  }

  /**
   * Revokes an active QR session immediately.
   */
  async revokeSession(
    id: string,
    patientId: string,
    trx?: Knex.Transaction,
  ): Promise<QRSessionRow | null> {
    const now = new Date();
    const executor = trx ?? this._knex;

    const [updated] = await executor<QRSessionRow>('qr_sessions')
      .where({ id, patient_id: patientId, status: 'ACTIVE' })
      .update({
        status: 'REVOKED',
        revoked_at: now,
        version: executor.raw('version + 1'),
      })
      .returning('*');

    return updated ?? null;
  }

  /**
   * Marks a session as EXPIRED.
   */
  async markExpired(id: string, trx?: Knex.Transaction): Promise<boolean> {
    const executor = trx ?? this._knex;
    const count = await executor('qr_sessions')
      .where({ id, status: 'ACTIVE' })
      .update({
        status: 'EXPIRED',
        version: executor.raw('version + 1'),
      });
    return count > 0;
  }

  /**
   * Lists all active unexpired QR sessions for a patient.
   */
  async listActiveByPatient(
    patientId: string,
    trx?: Knex.Transaction,
  ): Promise<QRSessionRow[]> {
    const now = new Date();
    return (trx ?? this._knex)<QRSessionRow>('qr_sessions')
      .where({ patient_id: patientId, status: 'ACTIVE' })
      .andWhere('expires_at', '>', now)
      .orderBy('created_at', 'desc');
  }
}

export default QRSessionRepository;
