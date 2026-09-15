/**
 * Domain Event Emitter & Real-Time Invalidation Bus
 *
 * Emits lightweight domain events for real-time invalidation without leaking PHI.
 *
 * Owned by: Platform Infrastructure (Prompt 87/90/91/92)
 */

import { EventEmitter } from 'node:events';
import type { Logger } from '../logger/logger.js';
import type { CacheClient } from '../redis/redis.js';

// ── Patient Events ───────────────────────────────────────────────────────────

export interface PatientProfileUpdatedEvent {
  event: 'patient.profile.updated';
  patientId: string;
  userId: string;
  version: number;
  timestamp: string;
}

export interface PatientProfileCompletedEvent {
  event: 'patient.profile.completed';
  patientId: string;
  userId: string;
  version: number;
  timestamp: string;
}

// ── Consent Events ───────────────────────────────────────────────────────────

export interface ConsentGrantedEvent {
  event: 'patient.consent.granted';
  consentId: string;
  patientId: string;
  userId: string;
  purpose: string;
  recipientId: string;
  version: number;
  timestamp: string;
}

export interface ConsentRevokedEvent {
  event: 'patient.consent.revoked';
  consentId: string;
  patientId: string;
  userId: string;
  purpose: string;
  recipientId: string;
  version: number;
  timestamp: string;
}

export interface ConsentDeniedEvent {
  event: 'patient.consent.denied';
  consentId: string;
  patientId: string;
  userId: string;
  purpose: string;
  recipientId: string;
  version: number;
  timestamp: string;
}

// ── Session & Security Events ────────────────────────────────────────────────

export interface SessionCreatedEvent {
  event: 'session.created';
  sessionId: string;
  userId: string;
  deviceId?: string | null;
  version: number;
  timestamp: string;
}

export interface SessionRefreshedEvent {
  event: 'session.refreshed';
  sessionId: string;
  userId: string;
  deviceId?: string | null;
  version: number;
  timestamp: string;
}

export interface SessionRevokedEvent {
  event: 'session.revoked';
  sessionId: string;
  userId: string;
  reason?: string | null;
  version: number;
  timestamp: string;
}

export interface SessionAllRevokedEvent {
  event: 'session.all_revoked';
  userId: string;
  reason?: string | null;
  timestamp: string;
}

export interface SessionExpiredEvent {
  event: 'session.expired';
  sessionId: string;
  userId: string;
  timestamp: string;
}

// ── QR Session Events (Prompt 107) ──────────────────────────────────────────

export interface QRSessionCreatedEvent {
  event: 'qr.session.created';
  qrSessionId: string;
  patientId: string;
  userId: string;
  purpose: string;
  recipientId: string | null;
  expiresAt: string;
  timestamp: string;
}

export interface QRSessionScannedEvent {
  event: 'qr.session.scanned';
  qrSessionId: string;
  patientId: string;
  userId: string;
  scannedByFacilityId?: string | null;
  timestamp: string;
}

export interface QRSessionApprovedEvent {
  event: 'qr.session.approved';
  qrSessionId: string;
  patientId: string;
  userId: string;
  recipientId?: string | null;
  timestamp: string;
}

export interface QRSessionRejectedEvent {
  event: 'qr.session.rejected';
  qrSessionId: string;
  patientId: string;
  userId: string;
  reason?: string | null;
  timestamp: string;
}

export interface QRSessionExpiredEvent {
  event: 'qr.session.expired';
  qrSessionId: string;
  patientId: string;
  userId: string;
  timestamp: string;
}

export interface QRSessionRevokedEvent {
  event: 'qr.session.revoked';
  qrSessionId: string;
  patientId: string;
  userId: string;
  timestamp: string;
}

export interface QRSessionConsumedEvent {
  event: 'qr.session.consumed';
  qrSessionId: string;
  patientId: string;
  userId: string;
  consumedByFacilityId?: string | null;
  timestamp: string;
}

export interface QROfflinePoolProvisionedEvent {
  event: 'qr.offline_pool.provisioned';
  patientId: string;
  userId: string;
  count: number;
  expiresAt: string;
  timestamp: string;
}

export type DomainEvent =
  | PatientProfileUpdatedEvent
  | PatientProfileCompletedEvent
  | ConsentGrantedEvent
  | ConsentRevokedEvent
  | ConsentDeniedEvent
  | SessionCreatedEvent
  | SessionRefreshedEvent
  | SessionRevokedEvent
  | SessionAllRevokedEvent
  | SessionExpiredEvent
  | QRSessionCreatedEvent
  | QRSessionScannedEvent
  | QRSessionApprovedEvent
  | QRSessionRejectedEvent
  | QRSessionExpiredEvent
  | QRSessionRevokedEvent
  | QRSessionConsumedEvent
  | QROfflinePoolProvisionedEvent;

export class DomainEventEmitter extends EventEmitter {
  constructor(
    private readonly _logger: Logger,
    private readonly _cache?: CacheClient | null,
  ) {
    super();
    this._setupDefaultListeners();
  }

  emitDomainEvent(event: DomainEvent): void {
    this._logger.info('domain_event_emitted', {
      eventType: event.event,
      userId: event.userId,
      timestamp: event.timestamp,
    });

    this.emit(event.event, event);
    this.emit('*', event);
  }

  private _setupDefaultListeners(): void {
    // 1. Patient cache invalidation
    const invalidateProfileCache = async (event: PatientProfileUpdatedEvent | PatientProfileCompletedEvent) => {
      if (!this._cache) return;
      try {
        await Promise.all([
          this._cache.del(`patient:profile:${event.userId}`),
          this._cache.del(`patient:summary:${event.userId}`),
          this._cache.del(`patient:profile:${event.patientId}`),
        ]);
        this._logger.debug('patient_cache_invalidated', { userId: event.userId });
      } catch (err) {
        this._logger.warn('patient_cache_invalidation_failed', { err, userId: event.userId });
      }
    };

    // 2. Consent cache invalidation
    const invalidateConsentCache = async (
      event: ConsentGrantedEvent | ConsentRevokedEvent | ConsentDeniedEvent,
    ) => {
      if (!this._cache) return;
      try {
        await Promise.all([
          this._cache.del(`consent:${event.patientId}:${event.purpose}:${event.recipientId}`),
          this._cache.del(`consent:patient:${event.patientId}`),
          this._cache.del(`consent:patient:${event.userId}`),
        ]);
        this._logger.debug('consent_cache_invalidated', {
          patientId: event.patientId,
          purpose: event.purpose,
          recipientId: event.recipientId,
        });
      } catch (err) {
        this._logger.warn('consent_cache_invalidation_failed', { err, patientId: event.patientId });
      }
    };

    // 3. Session cache invalidation
    const invalidateSessionCache = async (
      event: SessionRevokedEvent | SessionAllRevokedEvent | SessionExpiredEvent,
    ) => {
      if (!this._cache) return;
      try {
        const promises: Promise<void>[] = [
          this._cache.del(`session:user:${event.userId}`),
          this._cache.del(`user:sessions:${event.userId}`),
        ];
        if ('sessionId' in event) {
          promises.push(this._cache.del(`session:${event.sessionId}`));
        }
        await Promise.all(promises);
        this._logger.debug('session_cache_invalidated', { userId: event.userId });
      } catch (err) {
        this._logger.warn('session_cache_invalidation_failed', { err, userId: event.userId });
      }
    };

    this.on('patient.profile.updated', invalidateProfileCache);
    this.on('patient.profile.completed', invalidateProfileCache);
    this.on('patient.consent.granted', invalidateConsentCache);
    this.on('patient.consent.revoked', invalidateConsentCache);
    this.on('patient.consent.denied', invalidateConsentCache);
    this.on('session.revoked', invalidateSessionCache);
    this.on('session.all_revoked', invalidateSessionCache);
    this.on('session.expired', invalidateSessionCache);
  }
}
