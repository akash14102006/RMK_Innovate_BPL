/**
 * Bharat PulseLink — Client-Side QR Session Service
 *
 * Coordinates:
 * 1. Requesting server-authoritative one-time QR sessions (`POST /api/v1/me/qr-sessions`)
 * 2. Pre-issuing capability pool (`POST /api/v1/me/qr-capabilities/prefetch`)
 * 3. Offline-First capability resolution with AES-256-GCM encrypted mobile storage
 * 4. Background synchronization & automatic pool replenishment (Pool: 5, Min: 2)
 * 5. Hospital scanner consumption (`POST /api/v1/qr-sessions/consume`)
 * 6. Patient QR revocation and polling status checks
 * 7. Separate and authoritative Network Online vs Backend Reachability state detection
 *
 * Diagnostic logging follows strict safe logging standards:
 * - [QR_NETWORK] online=true/false
 * - [QR_BACKEND] reachable=true/false
 * - [QR_PREFETCH] status=200 / prefetchStarted
 * - [QR_POOL] serverCount=5 / localUsableCount=5
 * - Zero PHI, zero raw tokens, zero JWTs in logs.
 *
 * Owned by: QR & Secure Session Domain (Prompt 107 Master Architecture)
 */

import axios, { AxiosError } from 'axios';
import SessionManager from './sessionManager';
import OfflineQRCapabilityService from './OfflineQRCapabilityService';

export interface PatientQRSessionData {
  sessionId: string;
  qrPayload: string;
  tokenHash: string;
  expiresAt: string;
  ttlSeconds: number;
  purpose: string;
  status: string;
}

export interface ParsedQRPayload {
  isValid: boolean;
  sessionId?: string;
  rawToken?: string;
  purpose?: string;
  expiresAtEpoch?: number;
  errorMessage?: string;
}

export interface ConsumeQRResult {
  qrSessionId: string;
  patientId: string;
  status: 'CONSUMED';
  purpose: string;
  facilityId: string;
  consumedAt: string;
  encryptedExchangeEnvelope?: any;
  authorizedScopes?: string[];
  publicPatientInfo?: {
    gender: string;
    bloodGroup?: string | null;
  };
}

/**
 * Checks whether the physical device / browser environment is currently connected to the network.
 */
export function isDeviceOnline(): boolean {
  if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
    return navigator.onLine;
  }
  return true;
}

/**
 * Classifies QR network responses with distinct separation between
 * network connectivity (isDeviceOnline) and backend server reachability.
 */
function classifyQRError(error: any): Error & { code: string; status?: number } {
  const status = error?.response?.status;
  const message = error?.response?.data?.message || error?.message || 'QR session operation failed';
  const err = new Error(message) as Error & { code: string; status?: number };
  err.status = status;

  const online = isDeviceOnline();
  console.log(`[QR_NETWORK] online=${online}`);

  if (status === 401) {
    err.code = 'SESSION_EXPIRED';
    console.log('[QR_BACKEND] reachable=true');
  } else if (status === 403) {
    err.code = 'AUTH_REQUIRED';
    console.log('[QR_BACKEND] reachable=true');
  } else if (status === 404) {
    err.code = 'BACKEND_UNREACHABLE';
    console.log('[QR_BACKEND] reachable=false');
  } else if (status && status >= 500) {
    err.code = 'SERVER_ERROR';
    console.log('[QR_BACKEND] reachable=false');
  } else if (!online) {
    err.code = 'NO_INTERNET';
    console.log('[QR_BACKEND] reachable=false');
  } else {
    err.code = 'BACKEND_UNREACHABLE';
    console.log('[QR_BACKEND] reachable=false');
  }
  return err;
}

import { resolveApiBaseUrl } from '../utils/apiUrl';

export class QRSessionClientService {
  /**
   * Resolves the canonical backend API base URL dynamically across Web, Android, and iOS.
   */
  private get _baseUrl(): string {
    return resolveApiBaseUrl();
  }

  /**
   * Checks whether the backend API is reachable via health probe.
   */
  async checkBackendReachable(): Promise<boolean> {
    try {
      const response = await axios.get(`${this._baseUrl}/health`, { timeout: 3000 });
      const reachable = response.status >= 200 && response.status < 400;
      console.log(`[QR_BACKEND] reachable=${reachable}`);
      return reachable;
    } catch {
      console.log('[QR_BACKEND] reachable=false');
      return false;
    }
  }

  /**
   * Requests a fresh, server-authoritative one-time QR session.
   */
  async generatePatientQRSession(options?: {
    purpose?: 'HOSPITAL_CHECKIN' | 'APPOINTMENT' | 'HEALTH_RECORD_SHARE' | 'IDENTITY_VERIFICATION';
    recipientId?: string;
    ttlSeconds?: number;
  }): Promise<PatientQRSessionData> {
    const token = await SessionManager.getAccessToken();
    if (!token) {
      console.log('[QR_AUTH] tokenMissing');
      const err = new Error('Authentication required to generate secure QR code') as any;
      err.code = 'AUTH_REQUIRED';
      throw err;
    }

    try {
      console.log('[QR_PREFETCH] started');
      const response = await axios.post(
        `${this._baseUrl}/me/qr-sessions`,
        {
          purpose: options?.purpose || 'HOSPITAL_CHECKIN',
          recipientId: options?.recipientId || null,
          ttlSeconds: options?.ttlSeconds || 90,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        },
      );

      console.log('[QR_PREFETCH] status=200');
      return response.data.data;
    } catch (err: any) {
      const classified = classifyQRError(err);
      console.log(`[QR_PREFETCH] status=FAILED code=${classified.code} http_status=${classified.status || 'NET_ERR'}`);
      throw classified;
    }
  }

  /**
   * Pre-fetches a pool of pre-issued offline capabilities and stores them in client encrypted storage.
   */
  async prefetchCapabilityPool(options?: {
    count?: number;
    ttlHours?: number;
    purpose?: string;
  }): Promise<PatientQRSessionData[]> {
    const token = await SessionManager.getAccessToken();
    if (!token) {
      console.log('[QR_AUTH] tokenMissingForPrefetch');
      const err = new Error('Authentication required to prefetch QR capability pool') as any;
      err.code = 'AUTH_REQUIRED';
      throw err;
    }

    try {
      console.log('[QR_PREFETCH] prefetchStarted');
      let response;
      try {
        response = await axios.post(
          `${this._baseUrl}/me/qr-capabilities/prefetch`,
          {
            count: options?.count || 5,
            ttlHours: options?.ttlHours || 24,
            purpose: options?.purpose || 'HOSPITAL_CHECKIN',
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            timeout: 10000,
          },
        );
      } catch (e: any) {
        if (e.response?.status === 404) {
          // Fallback alias route
          response = await axios.post(
            `${this._baseUrl}/me/qr-sessions/offline-pool`,
            {
              count: options?.count || 5,
              ttlHours: options?.ttlHours || 24,
              purpose: options?.purpose || 'HOSPITAL_CHECKIN',
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              timeout: 10000,
            },
          );
        } else {
          throw e;
        }
      }

      const capabilities: PatientQRSessionData[] = response.data.data;
      console.log(`[QR_POOL] serverCount=${capabilities.length}`);
      await OfflineQRCapabilityService.addProvisionedCapabilities(capabilities);
      const usable = await OfflineQRCapabilityService.getRemainingCount();
      console.log(`[QR_POOL] count=${capabilities.length} localUsableCount=${usable}`);
      return capabilities;
    } catch (err: any) {
      const classified = classifyQRError(err);
      console.log(`[QR_PREFETCH] prefetchFailed code=${classified.code}`);
      throw classified;
    }
  }

  /**
   * Provision offline pool alias for backward compatibility.
   */
  async provisionOfflinePool(options?: { count?: number; ttlHours?: number; purpose?: string }): Promise<PatientQRSessionData[]> {
    return this.prefetchCapabilityPool(options);
  }

  /**
   * Synchronizes local capability pool with backend when connectivity is restored.
   * Auto-replenishes pool if valid count falls below threshold (2).
   */
  async syncOfflinePool(): Promise<void> {
    try {
      const token = await SessionManager.getAccessToken();
      if (!token) return;

      const pool = await OfflineQRCapabilityService.getStoredPool();
      if (pool.length === 0) {
        console.log('[QR_POOL] poolEmpty -> triggeringInitialPrefetch');
        await this.prefetchCapabilityPool({ count: 5, ttlHours: 24 });
        return;
      }

      const capabilityIds = pool.map((p) => p.sessionId);

      let response;
      try {
        response = await axios.post(
          `${this._baseUrl}/me/qr-capabilities/sync`,
          { capabilityIds },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            timeout: 10000,
          },
        );
      } catch (e: any) {
        if (e.response?.status === 404) {
          response = await axios.post(
            `${this._baseUrl}/me/qr-sessions/sync`,
            { capabilityIds },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              timeout: 10000,
            },
          );
        } else {
          throw e;
        }
      }

      if (response && response.data?.data) {
        await OfflineQRCapabilityService.reconcileSync(response.data.data);
      }

      // Check remaining valid count; auto-replenish if below minimum threshold (2)
      const remaining = await OfflineQRCapabilityService.getRemainingCount();
      console.log(`[QR_POOL] localUsableCount=${remaining}`);
      if (remaining < OfflineQRCapabilityService.minReplenishmentThreshold) {
        console.log('[QR_POOL] belowThreshold -> triggeringReplenishment');
        await this.prefetchCapabilityPool({ count: 5, ttlHours: 24 });
      }
    } catch (err: any) {
      console.log('[QR_SYNC] syncDeferred', err?.message);
    }
  }

  /**
   * Unified QR session resolver:
   * 1. Attempts live online server session generation.
   * 2. Background-replenishes the offline pool if online and pool is low.
   * 3. On offline / backend failure, returns the next valid pre-issued offline capability.
   * 4. Clearly distinguishes between NO_INTERNET and BACKEND_UNREACHABLE.
   */
  async getActiveSessionUnified(options?: {
    purpose?: 'HOSPITAL_CHECKIN' | 'APPOINTMENT' | 'HEALTH_RECORD_SHARE' | 'IDENTITY_VERIFICATION';
    recipientId?: string;
    ttlSeconds?: number;
  }): Promise<{ data: PatientQRSessionData; isOffline: boolean; isBackendUnreachable?: boolean }> {
    console.log('[QR_PREFETCH] getActiveSessionUnified_started');
    const online = isDeviceOnline();
    console.log(`[QR_NETWORK] online=${online}`);

    const poolCount = await OfflineQRCapabilityService.getStoredPoolCount();
    const usableCount = await OfflineQRCapabilityService.getRemainingCount();
    console.log(`[QR_POOL] count=${poolCount} localUsableCount=${usableCount}`);

    try {
      // 1. Try online generation first
      const liveData = await this.generatePatientQRSession(options);

      // Opportunistically check and refill offline capability pool in background
      if (usableCount < OfflineQRCapabilityService.minReplenishmentThreshold) {
        this.prefetchCapabilityPool({ count: 5, ttlHours: 24 }).catch(() => {});
      }

      return { data: liveData, isOffline: false };
    } catch (netErr: any) {
      console.log(`[QR_POOL] liveGenerationFailed code=${netErr.code || netErr.name || 'UNKNOWN'}`);

      // If user session is invalid / expired (401), reject directly unless an offline capability exists
      if (netErr.code === 'SESSION_EXPIRED' || netErr.code === 'AUTH_REQUIRED') {
        const fallbackCap = await OfflineQRCapabilityService.getNextAvailableCapability();
        if (fallbackCap) {
          console.log('[QR_PREFETCH] offlineFallbackUsedForExpiredOnline');
          return { data: fallbackCap, isOffline: true };
        }
        throw netErr;
      }

      // Check for pre-issued cryptographic capability in encrypted storage
      const offlineCap = await OfflineQRCapabilityService.getNextAvailableCapability();
      if (offlineCap) {
        console.log('[QR_PREFETCH] offlineCapabilityFound');
        return {
          data: offlineCap,
          isOffline: true,
          isBackendUnreachable: netErr.code === 'BACKEND_UNREACHABLE' || netErr.code === 'SERVER_ERROR',
        };
      }

      // No offline capability in local pool
      console.log('[QR_POOL] errorCode=CAPABILITY_POOL_EMPTY');
      const err = new Error('No offline capability available in local secure pool') as any;
      if (netErr.code === 'BACKEND_UNREACHABLE') {
        err.code = 'BACKEND_UNREACHABLE';
      } else if (netErr.code === 'SERVER_ERROR') {
        err.code = 'SERVER_ERROR';
      } else if (!online || netErr.code === 'NO_INTERNET') {
        err.code = 'NO_INTERNET_NO_POOL';
      } else {
        err.code = 'BACKEND_UNREACHABLE';
      }
      throw err;
    }
  }

  /**
   * Revokes an active QR session on patient request.
   */
  async revokeQRSession(sessionId: string): Promise<boolean> {
    const token = await SessionManager.getAccessToken();
    const response = await axios.post(
      `${this._baseUrl}/me/qr-sessions/${sessionId}/revoke`,
      {},
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      },
    );

    return response.data.data.revoked;
  }

  /**
   * Fetches status of a QR session (polling / verification).
   */
  async getQRSessionStatus(sessionId: string): Promise<{
    id: string;
    status: string;
    purpose: string;
    expiresAt: string;
  }> {
    const response = await axios.get(`${this._baseUrl}/qr-sessions/${sessionId}/status`, {
      timeout: 5000,
    });
    return response.data.data;
  }

  /**
   * Consumes a scanned QR token at hospital point-of-care.
   */
  async consumeQRSession(params: {
    rawToken: string;
    consumerFacilityId: string;
    purpose?: string;
    requestedScopes?: string[];
  }): Promise<ConsumeQRResult> {
    const response = await axios.post(
      `${this._baseUrl}/qr-sessions/consume`,
      {
        rawToken: params.rawToken,
        consumerFacilityId: params.consumerFacilityId,
        purpose: params.purpose || 'HOSPITAL_CHECKIN',
        requestedScopes: params.requestedScopes,
      },
      {
        timeout: 10000,
      },
    );

    return response.data.data;
  }

  /**
   * Parses and validates raw QR string schema.
   * Tolerates scanner device prefixes (e.g. "icon", quotes, whitespace)
   * and supports both millisecond (13-digit) and second (10-digit) timestamps.
   */
  parseQRString(qrString: string): ParsedQRPayload {
    if (!qrString || typeof qrString !== 'string') {
      return { isValid: false, errorMessage: 'Invalid or empty QR payload' };
    }

    const trimmed = qrString.trim();

    // 1. Check for Bharat PulseLink QR protocol (tolerant of scanner prefixes)
    const bplIndex = trimmed.indexOf('bplqr://v1/s?');
    if (bplIndex !== -1) {
      try {
        const canonical = trimmed.substring(bplIndex);
        const queryPart = canonical.split('?')[1];
        if (!queryPart) {
          return { isValid: false, errorMessage: 'Malformed Bharat PulseLink QR parameters' };
        }

        const params = new URLSearchParams(queryPart);
        const sessionId = params.get('sid');
        const rawToken = params.get('t');
        const purpose = params.get('p') || 'HOSPITAL_CHECKIN';
        const expStr = params.get('exp');
        const expiresAtEpoch = expStr ? parseInt(expStr, 10) : undefined;

        if (!sessionId || !rawToken) {
          return { isValid: false, errorMessage: 'Missing session ID or token parameter' };
        }

        // Handle both 13-digit ms (1788184471851) and 10-digit s (1788184471) timestamps
        if (expiresAtEpoch) {
          const expMs = expiresAtEpoch > 1e11 ? expiresAtEpoch : expiresAtEpoch * 1000;
          if (expMs < Date.now()) {
            return { isValid: false, errorMessage: 'QR session has expired' };
          }
        }

        return {
          isValid: true,
          sessionId,
          rawToken,
          purpose,
          expiresAtEpoch,
        };
      } catch (err: any) {
        return { isValid: false, errorMessage: 'Malformed Bharat PulseLink QR schema' };
      }
    }

    return { isValid: false, errorMessage: 'Unrecognized QR code format. Not a Bharat PulseLink code.' };
  }
}

export default new QRSessionClientService();
