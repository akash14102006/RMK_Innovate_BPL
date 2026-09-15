/**
 * Bharat PulseLink — Offline QR Replay Defense Store
 *
 * Implements:
 * 1. Local single-use tracking of consumed offline QR session IDs (Prompt 107 Master Rework)
 * 2. In-memory Set backed by SecureStore persistence
 * 3. TTL-based automatic pruning of expired session records
 * 4. Disconnected replay rejection: Scanners reject duplicate presentations locally
 *
 * Documented Boundary:
 * Local replay protection prevents multiple submissions on the same scanner device.
 * Global multi-device replay prevention during disconnected network partitions is synchronized
 * when devices reconnect to the central registry.
 *
 * Owned by: QR & Offline Security Domain (Prompt 107 Master Rework)
 */

import SecureStoreService from './secureStore';

export interface ConsumedOfflineRecord {
  sessionId: string;
  consumedAtISO: string;
  expiresAtEpoch: number;
  hospitalFacilityId: string;
}

const REPLAY_STORE_STORAGE_KEY = 'bpl_consumed_offline_sessions_v1';

export class OfflineQRReplayStore {
  private static _consumedMap = new Map<string, ConsumedOfflineRecord>();
  private static _isLoaded = false;

  /**
   * Loads consumed sessions from storage into memory.
   */
  private static async _ensureLoaded(): Promise<void> {
    if (this._isLoaded) return;
    try {
      const raw = await SecureStoreService.get(REPLAY_STORE_STORAGE_KEY);
      if (raw) {
        const records: ConsumedOfflineRecord[] = JSON.parse(raw);
        const now = Math.floor(Date.now() / 1000);
        for (const r of records) {
          // Only keep records that haven't naturally expired yet
          if (r.expiresAtEpoch > now) {
            this._consumedMap.set(r.sessionId, r);
          }
        }
      }
    } catch {
      // Memory fallback
    }
    this._isLoaded = true;
  }

  /**
   * Persists the consumed map to SecureStore.
   */
  private static async _persist(): Promise<void> {
    try {
      const records = Array.from(this._consumedMap.values());
      await SecureStoreService.set(REPLAY_STORE_STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.warn('[REPLAY_STORE] Failed to persist consumed sessions', e);
    }
  }

  /**
   * Checks if a session ID has already been consumed locally on this device.
   */
  public static async isConsumed(sessionId: string): Promise<boolean> {
    await this._ensureLoaded();
    const record = this._consumedMap.get(sessionId);
    if (!record) return false;

    const now = Math.floor(Date.now() / 1000);
    if (record.expiresAtEpoch <= now) {
      // Natural expiry reached
      this._consumedMap.delete(sessionId);
      this._persist().catch(() => {});
      return false;
    }

    return true;
  }

  /**
   * Alias for isConsumed to clearly express replay checking.
   */
  public static async isReplayed(sessionId: string): Promise<boolean> {
    return this.isConsumed(sessionId);
  }

  /**
   * Marks a session ID as consumed. Supports record object or direct parameters.
   */
  public static async markConsumed(
    recordOrSessionId: ConsumedOfflineRecord | string,
    expiresAtEpoch?: number,
    hospitalFacilityId?: string
  ): Promise<void> {
    await this._ensureLoaded();

    let record: ConsumedOfflineRecord;
    if (typeof recordOrSessionId === 'string') {
      record = {
        sessionId: recordOrSessionId,
        consumedAtISO: new Date().toISOString(),
        expiresAtEpoch: expiresAtEpoch || Math.floor(Date.now() / 1000) + 300,
        hospitalFacilityId: hospitalFacilityId || 'hosp_smart_triage_01',
      };
    } else {
      record = recordOrSessionId;
    }

    if (this._consumedMap.has(record.sessionId)) {
      throw new Error(`Offline QR session '${record.sessionId}' has already been consumed and cannot be replayed`);
    }

    this._consumedMap.set(record.sessionId, record);
    await this._persist();
  }

  /**
   * Returns list of all consumed session records pending audit sync.
   */
  public static async getConsumedRecords(): Promise<ConsumedOfflineRecord[]> {
    await this._ensureLoaded();
    return Array.from(this._consumedMap.values());
  }

  /**
   * Clears the store (for testing or device reset).
   */
  public static async clear(): Promise<void> {
    this._consumedMap.clear();
    this._isLoaded = true;
    await SecureStoreService.remove(REPLAY_STORE_STORAGE_KEY);
  }
}

export default OfflineQRReplayStore;
