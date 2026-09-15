/**
 * Consent Service
 *
 * Business logic, transaction orchestration, patient-ownership verification (IDOR protection),
 * optimistic concurrency control, and domain event emission for the Consent Domain.
 *
 * Owned by: Consent Domain (Prompt 91, 101 §28, §82)
 */

import { randomUUID } from 'node:crypto';
import type { Knex } from 'knex';
import { AppError, ErrorCode } from '../../core/errors/AppError.js';
import type { Logger } from '../../infrastructure/logger/logger.js';
import type { ConsentRepository } from '../../infrastructure/database/repositories/ConsentRepository.js';
import type { PatientRepository } from '../../infrastructure/database/repositories/PatientRepository.js';
import type { DomainEventEmitter } from '../../infrastructure/events/DomainEventEmitter.js';
import type { ConsentAuthorizer, CheckConsentParams } from './ConsentAuthorizer.js';
import {
  toConsentDTO,
  toConsentEventDTO,
  toConsentPreviewDTO,
  type ConsentDTO,
  type ConsentEventDTO,
  type ConsentPreviewDTO,
  type ConsentPreviewInput,
  type GrantConsentInput,
  type RevokeConsentInput,
  type ConsentEvaluationResult,
} from './consent.schemas.js';

export interface ConsentServiceDeps {
  db: Knex;
  consentRepo: ConsentRepository;
  patientRepo: PatientRepository;
  authorizer: ConsentAuthorizer;
  logger: Logger;
  eventEmitter?: DomainEventEmitter | null;
}

export class ConsentService {
  private readonly _db: Knex;
  private readonly _consentRepo: ConsentRepository;
  private readonly _patientRepo: PatientRepository;
  private readonly _authorizer: ConsentAuthorizer;
  private readonly _logger: Logger;
  private readonly _eventEmitter?: DomainEventEmitter | null;

  constructor(deps: ConsentServiceDeps) {
    this._db = deps.db;
    this._consentRepo = deps.consentRepo;
    this._patientRepo = deps.patientRepo;
    this._authorizer = deps.authorizer;
    this._logger = deps.logger.child({ module: 'consent-service' });
    this._eventEmitter = deps.eventEmitter;
  }

  /**
   * Retrieves all consents for the authenticated patient.
   */
  async getPatientConsents(
    userId: string,
    filter?: { status?: string; purpose?: string },
  ): Promise<ConsentDTO[]> {
    const patient = await this._getPatientByUserId(userId);
    const rows = await this._consentRepo.getPatientConsents(patient.id, filter);
    return rows.map((r) => toConsentDTO(r));
  }

  /**
   * Retrieves a single consent by ID with strict object-level authorization (IDOR safe).
   */
  async getConsentById(userId: string, consentId: string): Promise<ConsentDTO> {
    const patient = await this._getPatientByUserId(userId);
    const consent = await this._consentRepo.findById(consentId);

    if (!consent || consent.patient_id !== patient.id) {
      throw new AppError({
        code: ErrorCode.CONSENT_NOT_FOUND,
        message: 'Consent record not found',
      });
    }

    return toConsentDTO(consent);
  }

  /**
   * Previews what data categories would be shared without committing to the database.
   */
  async previewConsent(userId: string, input: ConsentPreviewInput): Promise<ConsentPreviewDTO> {
    await this._getPatientByUserId(userId);
    return toConsentPreviewDTO(input);
  }

  /**
   * Atomically grants patient consent with idempotency, event auditing, and cache invalidation.
   */
  async grantConsent(
    userId: string,
    input: GrantConsentInput,
    context: { ipAddress?: string | null; userAgent?: string | null } = {},
  ): Promise<ConsentDTO> {
    const patient = await this._getPatientByUserId(userId);

    const now = new Date();
    const validFrom = input.validFrom ? new Date(input.validFrom) : now;
    const duration = input.durationSeconds ?? 86400 * 30;
    const validTo = input.validTo
      ? new Date(input.validTo)
      : new Date(validFrom.getTime() + duration * 1000);

    // 1. Check idempotency: If an active consent with identical parameters exists, return it
    const existing = await this._consentRepo.findActiveConsent(
      patient.id,
      input.purpose,
      input.recipientType ?? 'HOSPITAL',
      input.recipientId,
    );

    if (existing) {
      const existingScopes = new Set(existing.scopes);
      const isScopesEqual =
        input.scopes.length === existingScopes.size &&
        input.scopes.every((s) => existingScopes.has(s));

      if (isScopesEqual && existing.policy_version === (input.policyVersion ?? '1.0')) {
        this._logger.info('idempotent_consent_grant_returned', {
          consentId: existing.id,
          patientId: patient.id,
        });
        return toConsentDTO(existing);
      }
    }

    // 2. Transactional creation and previous active consent supersede
    const created = await this._db.transaction(async (trx) => {
      // If a previous active grant existed with different scopes, mark it superseded
      if (existing) {
        await trx('consents')
          .where({ id: existing.id, status: 'GRANTED' })
          .update({
            status: 'SUPERSEDED',
            updated_at: new Date(),
          });

        await trx('consent_events').insert({
          id: randomUUID(),
          consent_id: existing.id,
          event_type: 'CONSENT_SUPERSEDED',
          actor_id: userId,
          actor_type: 'PATIENT',
          reason: 'Superseded by new consent grant',
          ip_address: context.ipAddress ?? null,
          user_agent: context.userAgent ?? null,
          timestamp: new Date(),
        });
      }

      return this._consentRepo.createConsent(
        {
          patient_id: patient.id,
          purpose: input.purpose,
          recipient_type: input.recipientType,
          recipient_id: input.recipientId,
          scopes: input.scopes,
          policy_version: input.policyVersion ?? '1.0',
          policy_hash: input.policyHash ?? null,
          status: 'GRANTED',
          valid_from: validFrom,
          valid_to: validTo,
        },
        userId,
        'PATIENT',
        context.ipAddress,
        context.userAgent,
        { requestedScopes: input.scopes, durationSeconds: duration },
        trx,
      );
    });

    this._logger.info('consent_granted', {
      consentId: created.id,
      patientId: patient.id,
      userId,
      purpose: input.purpose,
      recipientId: input.recipientId,
    });

    // 3. Emit real-time domain event (minimum metadata, zero PHI)
    this._eventEmitter?.emitDomainEvent({
      event: 'patient.consent.granted',
      consentId: created.id,
      patientId: patient.id,
      userId,
      purpose: created.purpose,
      recipientId: created.recipient_id,
      version: created.version,
      timestamp: new Date().toISOString(),
    });

    return toConsentDTO(created);
  }

  /**
   * Revokes an existing active consent with optimistic concurrency control.
   */
  async revokeConsent(
    userId: string,
    consentId: string,
    input: RevokeConsentInput,
    context: { ipAddress?: string | null; userAgent?: string | null } = {},
  ): Promise<ConsentDTO> {
    const patient = await this._getPatientByUserId(userId);
    const existing = await this._consentRepo.findById(consentId);

    if (!existing || existing.patient_id !== patient.id) {
      throw new AppError({
        code: ErrorCode.CONSENT_NOT_FOUND,
        message: 'Consent record not found',
      });
    }

    if (input.expectedVersion !== undefined && existing.version !== input.expectedVersion) {
      throw new AppError({
        code: ErrorCode.CONFLICT,
        message: `Consent record has been modified concurrently (expected: ${input.expectedVersion}, actual: ${existing.version})`,
      });
    }

    if (existing.status === 'REVOKED') {
      // Idempotent return if already revoked and no version conflict
      return toConsentDTO(existing);
    }

    const revoked = await this._db.transaction(async (trx) => {
      return this._consentRepo.revokeConsent(
        consentId,
        input.expectedVersion,
        input.reason,
        userId,
        'PATIENT',
        context.ipAddress,
        context.userAgent,
        trx,
      );
    });

    if (!revoked) {
      throw new AppError({
        code: ErrorCode.CONFLICT,
        message: 'Could not revoke consent due to a concurrent update; please reload and try again.',
      });
    }

    this._logger.info('consent_revoked', {
      consentId: revoked.id,
      patientId: patient.id,
      userId,
      reason: input.reason,
    });

    // Emit real-time domain event (invalidates cache across all connected nodes)
    this._eventEmitter?.emitDomainEvent({
      event: 'patient.consent.revoked',
      consentId: revoked.id,
      patientId: patient.id,
      userId,
      purpose: revoked.purpose,
      recipientId: revoked.recipient_id,
      version: revoked.version,
      timestamp: new Date().toISOString(),
    });

    return toConsentDTO(revoked);
  }

  /**
   * Retrieves the immutable audit event trail for a consent record.
   */
  async getConsentHistory(userId: string, consentId: string): Promise<ConsentEventDTO[]> {
    const patient = await this._getPatientByUserId(userId);
    const consent = await this._consentRepo.findById(consentId);

    if (!consent || consent.patient_id !== patient.id) {
      throw new AppError({
        code: ErrorCode.CONSENT_NOT_FOUND,
        message: 'Consent record not found',
      });
    }

    const events = await this._consentRepo.getConsentEvents(consentId);
    return events.map((e) => toConsentEventDTO(e));
  }

  /**
   * Authorizes downstream data requests against current effective consent.
   */
  async checkEffectiveConsent(params: CheckConsentParams): Promise<ConsentEvaluationResult> {
    return this._authorizer.check(params);
  }

  private async _getPatientByUserId(userId: string) {
    const patient = await this._patientRepo.findByUserId(userId);
    if (!patient) {
      throw new AppError({
        code: ErrorCode.PATIENT_NOT_FOUND,
        message: 'Patient profile not initialized for this account',
      });
    }
    return patient;
  }
}
