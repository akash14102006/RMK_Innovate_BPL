/**
 * Consent Authorizer Service
 *
 * Single Canonical Policy Enforcement Point for all downstream data exchange,
 * hospital check-in, report sharing, and QR transactions.
 *
 * Owned by: Consent Domain (Prompt 91, 101, 108)
 */

import type { ConsentRepository } from '../../infrastructure/database/repositories/ConsentRepository.js';
import type { Logger } from '../../infrastructure/logger/logger.js';
import type { CacheClient } from '../../infrastructure/redis/redis.js';
import type {
  ConsentPurpose,
  ConsentRecipientType,
  ConsentScope,
} from '../../core/types/database.types.js';
import type { ConsentEvaluationResult } from './consent.schemas.js';

export interface CheckConsentParams {
  patientId: string;
  purpose: ConsentPurpose | string;
  recipient: {
    type: ConsentRecipientType | string;
    id: string;
  };
  requiredScopes: Array<ConsentScope | string>;
  at?: Date;
}

export class ConsentAuthorizer {
  private readonly _consentRepo: ConsentRepository;
  private readonly _logger: Logger;
  private readonly _cache?: CacheClient | null;

  constructor(deps: {
    consentRepo: ConsentRepository;
    logger: Logger;
    cache?: CacheClient | null;
  }) {
    this._consentRepo = deps.consentRepo;
    this._logger = deps.logger.child({ module: 'consent-authorizer' });
    this._cache = deps.cache;
    if (this._cache) {
      this._logger.debug('ConsentAuthorizer initialized with cache layer');
    }
  }

  /**
   * Evaluates effective consent decision for a patient data access request.
   *
   * Hard authorization boundary: All downstream services MUST invoke this method
   * before releasing or decrypting protected health data.
   */
  async check(params: CheckConsentParams): Promise<ConsentEvaluationResult> {
    const evaluatedAt = params.at ?? new Date();
    const evaluatedAtIso = evaluatedAt.toISOString();

    const { patientId, purpose, recipient, requiredScopes } = params;

    this._logger.debug('evaluating_consent_decision', {
      patientId,
      purpose,
      recipientType: recipient.type,
      recipientId: recipient.id,
      requiredScopes,
      evaluatedAt: evaluatedAtIso,
    });

    try {
      // 1. Fetch active consent record from database
      const activeConsent = await this._consentRepo.findActiveConsent(
        patientId,
        purpose,
        recipient.type,
        recipient.id,
      );

      if (!activeConsent) {
        // Look up if any consent exists (to return informative denial reasons such as REVOKED or EXPIRED)
        const allConsents = await this._consentRepo.getPatientConsents(patientId, { purpose });
        const matchingRecipient = allConsents.find(
          (c) => c.recipient_type === recipient.type && c.recipient_id === recipient.id,
        );

        if (matchingRecipient) {
          if (matchingRecipient.status === 'REVOKED' || matchingRecipient.revoked_at) {
            this._logger.info('consent_denied_revoked', { consentId: matchingRecipient.id, patientId });
            return {
              allowed: false,
              reason: 'REVOKED',
              message: 'Consent was revoked by the patient',
              consentId: matchingRecipient.id,
              allowedScopes: [],
              deniedScopes: requiredScopes,
              evaluatedAt: evaluatedAtIso,
            };
          }

          if (matchingRecipient.status === 'DENIED') {
            this._logger.info('consent_denied_explicit', { consentId: matchingRecipient.id, patientId });
            return {
              allowed: false,
              reason: 'DENIED',
              message: 'Consent was explicitly denied',
              consentId: matchingRecipient.id,
              allowedScopes: [],
              deniedScopes: requiredScopes,
              evaluatedAt: evaluatedAtIso,
            };
          }

          if (new Date(matchingRecipient.valid_to).getTime() < evaluatedAt.getTime()) {
            this._logger.info('consent_denied_expired', { consentId: matchingRecipient.id, patientId });
            return {
              allowed: false,
              reason: 'EXPIRED',
              message: 'Consent validity duration has expired',
              consentId: matchingRecipient.id,
              allowedScopes: [],
              deniedScopes: requiredScopes,
              evaluatedAt: evaluatedAtIso,
              expiresAt: new Date(matchingRecipient.valid_to).toISOString(),
            };
          }
        }

        this._logger.info('consent_denied_not_found', { patientId, purpose, recipientId: recipient.id });
        return {
          allowed: false,
          reason: 'NO_CONSENT',
          message: 'No active consent record exists for this patient, recipient, and purpose',
          allowedScopes: [],
          deniedScopes: requiredScopes,
          evaluatedAt: evaluatedAtIso,
        };
      }

      // 2. Validate time boundaries
      const validFromTime = new Date(activeConsent.valid_from).getTime();
      const validToTime = new Date(activeConsent.valid_to).getTime();
      const evalTime = evaluatedAt.getTime();

      if (evalTime < validFromTime || evalTime > validToTime) {
        this._logger.info('consent_denied_outside_valid_time', {
          consentId: activeConsent.id,
          evalTime,
          validFromTime,
          validToTime,
        });
        return {
          allowed: false,
          reason: 'EXPIRED',
          message: 'Evaluation timestamp is outside the approved consent validity window',
          consentId: activeConsent.id,
          allowedScopes: [],
          deniedScopes: requiredScopes,
          evaluatedAt: evaluatedAtIso,
          expiresAt: new Date(activeConsent.valid_to).toISOString(),
        };
      }

      // 3. Evaluate granular data category scopes (Allow-list subset evaluation)
      const grantedScopesSet = new Set(activeConsent.scopes);
      const deniedScopes: string[] = [];
      const allowedScopes: string[] = [];

      for (const scope of requiredScopes) {
        if (grantedScopesSet.has(scope)) {
          allowedScopes.push(scope);
        } else {
          deniedScopes.push(scope);
        }
      }

      if (deniedScopes.length > 0) {
        this._logger.info('consent_denied_insufficient_scopes', {
          consentId: activeConsent.id,
          requiredScopes,
          grantedScopes: activeConsent.scopes,
          deniedScopes,
        });
        return {
          allowed: false,
          reason: 'SCOPE_NOT_GRANTED',
          message: `Consent does not cover requested scopes: ${deniedScopes.join(', ')}`,
          consentId: activeConsent.id,
          allowedScopes,
          deniedScopes,
          evaluatedAt: evaluatedAtIso,
          expiresAt: new Date(activeConsent.valid_to).toISOString(),
        };
      }

      // 4. Authorization success
      this._logger.info('consent_authorization_granted', {
        consentId: activeConsent.id,
        patientId,
        purpose,
        recipientId: recipient.id,
        allowedScopes,
      });

      return {
        allowed: true,
        reason: 'AUTHORIZED',
        message: 'All requested data category scopes are explicitly authorized by active patient consent',
        consentId: activeConsent.id,
        allowedScopes,
        deniedScopes: [],
        evaluatedAt: evaluatedAtIso,
        expiresAt: new Date(activeConsent.valid_to).toISOString(),
      };
    } catch (err) {
      // Fail closed
      this._logger.error('consent_evaluation_error_fail_closed', { err, patientId, purpose });
      return {
        allowed: false,
        reason: 'SERVICE_UNAVAILABLE',
        message: 'Consent evaluation service unavailable; access denied by fail-closed policy',
        allowedScopes: [],
        deniedScopes: requiredScopes,
        evaluatedAt: evaluatedAtIso,
      };
    }
  }
}
