/**
 * Bharat PulseLink — Offline QR Audit Trail Queue
 *
 * Implements:
 * 1. Local append-only audit event queue for offline operations
 * 2. Standard Event Lifecycle: QR_CREATED, QR_SCANNED, QR_VERIFIED, QR_REJECTED, QR_EXPIRED, QR_CONSUMED
 * 3. Privacy-First Audit Standard: Zero PHI, zero private keys, zero raw clinical data in logs
 * 4. Background synchronization to backend when connectivity is restored
 *
 * Owned by: Audit & Security Compliance Domain (Prompt 107 Master Rework)
 */

import SecureStoreService from './secureStore';
import api from './api';

export type OfflineAuditEventType =
  | 'QR_CREATED'
  | 'QR_SCANNED'
  | 'QR_VERIFIED'
  | 'QR_REJECTED'
  | 'QR_EXPIRED'
  | 'QR_CONSUMED';

export interface OfflineAuditEvent {
  eventId: string;
  eventType: OfflineAuditEventType;
  sessionId: string;
  timestampISO: string;
  facilityId?: string;
  patientPublicRef?: string;
  scopes?: string[];
  reason?: string;
  mode: 'OFFLINE_SECURE';
}

const AUDIT_QUEUE_STORAGE_KEY = 'bpl_offline_audit_queue_v1';

export class OfflineQRAuditQueue {
  private static _queue: OfflineAuditEvent[] = [];
  private static _isLoaded = false;

  private static async _ensureLoaded(): Promise<void> {
    if (this._isLoaded) return;
    try {
      const raw = await SecureStoreService.get(AUDIT_QUEUE_STORAGE_KEY);
      if (raw) {
        this._queue = JSON.parse(raw);
      }
    } catch {
      this._queue = [];
    }
    this._isLoaded = true;
  }

  private static async _persist(): Promise<void> {
    try {
      await SecureStoreService.set(AUDIT_QUEUE_STORAGE_KEY, JSON.stringify(this._queue));
    } catch (e) {
      console.warn('[AUDIT_QUEUE] Failed to persist offline audit event', e);
    }
  }

  /**
   * Enqueues an offline audit event.
   */
  public static async recordEvent(event: Omit<OfflineAuditEvent, 'eventId' | 'timestampISO' | 'mode'> | any): Promise<void> {
    await this._ensureLoaded();

    const auditItem: OfflineAuditEvent = {
      ...event,
      eventId: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestampISO: new Date().toISOString(),
      mode: 'OFFLINE_SECURE',
    };

    this._queue.push(auditItem);
    await this._persist();
    console.log(`[QR_AUDIT_LOG] event=${auditItem.eventType} sid=${auditItem.sessionId} fac=${auditItem.facilityId || 'N/A'}`);
  }

  /**
   * Alias for recordEvent.
   */
  public static async enqueue(event: any): Promise<void> {
    return this.recordEvent(event);
  }

  /**
   * Returns all queued events.
   */
  public static async getQueuedEvents(): Promise<OfflineAuditEvent[]> {
    await this._ensureLoaded();
    return [...this._queue];
  }

  /**
   * Alias for getQueuedEvents.
   */
  public static async getPendingEvents(): Promise<OfflineAuditEvent[]> {
    return this.getQueuedEvents();
  }

  /**
   * Synchronizes queued offline events to the server when network is restored.
   */
  public static async syncQueueToServer(): Promise<number> {
    await this._ensureLoaded();
    if (this._queue.length === 0) return 0;

    const eventsToSync = [...this._queue];
    try {
      await api.post('/me/audit/offline-events', { events: eventsToSync });
      // Clear synced events
      this._queue = [];
      await this._persist();
      console.log(`[QR_AUDIT_SYNC] Successfully synced ${eventsToSync.length} offline audit events`);
      return eventsToSync.length;
    } catch (e) {
      console.log('[QR_AUDIT_SYNC] Sync deferred until stable backend connection', e);
      return 0;
    }
  }

  /**
   * Clears the queue (for testing).
   */
  public static async clear(): Promise<void> {
    this._queue = [];
    this._isLoaded = true;
    await SecureStoreService.remove(AUDIT_QUEUE_STORAGE_KEY);
  }
}

export default OfflineQRAuditQueue;
