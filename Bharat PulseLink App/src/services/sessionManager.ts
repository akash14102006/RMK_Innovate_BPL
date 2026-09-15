const API_BASE = (globalThis as any)?.API_BASE || 'https://api.example.com';

import * as SecureStore from './secureStore';
import { clearQueryCacheStorage } from '../lib/cachePersister';
import AccountManagementService from './AccountManagementService';
import ProfileDraftService from './ProfileDraftService';
import OfflineQRCapabilityService from './OfflineQRCapabilityService';

type Tokens = {
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: number | null;
};

type AuthChangeListener = (isAuthenticated: boolean) => void;

// Helper for bounded promise execution
function withTimeout<T>(promise: Promise<T>, ms: number, fallbackValue: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallbackValue), ms)),
  ]);
}

class SessionManager {
  private tokens: Tokens | null = null;
  private refreshPromise: Promise<void> | null = null;
  private listeners: Set<AuthChangeListener> = new Set();

  subscribe(listener: AuthChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(isAuthenticated: boolean) {
    this.listeners.forEach((listener) => {
      try {
        listener(isAuthenticated);
      } catch (err) {
        console.warn('[SESSION_MANAGER] Listener error:', err);
      }
    });
  }

  async init(): Promise<void> {
    console.log('[BOOT] BOOT_START');
    console.log('[BOOT] SECURE_STORE_READ_START');

    try {
      // 3000ms bounded read from SecureStore to prevent native keystore deadlocks
      const raw = await withTimeout(SecureStore.get('auth_tokens'), 3000, null);
      console.log('[BOOT] SECURE_STORE_READ_DONE');

      if (raw) {
        try {
          this.tokens = JSON.parse(raw) as Tokens;
        } catch {
          this.tokens = null;
        }
      } else {
        this.tokens = null;
      }
    } catch {
      console.log('[BOOT] SECURE_STORE_READ_ERROR');
      this.tokens = null;
    }

    console.log('[BOOT] SESSION_INIT_DONE');
  }

  async getAccessToken(): Promise<string | null> {
    if (!this.tokens) {
      await this.init();
    }

    if (this.tokens && this.isExpired() && this.tokens.refreshToken) {
      try {
        console.log('[BOOT] REFRESH_START');
        await withTimeout(this.refreshIfNeeded(), 3000, undefined);
        console.log('[BOOT] REFRESH_DONE');
      } catch {
        console.log('[BOOT] REFRESH_FAILED_OR_OFFLINE');
        // Clear invalid/expired session safely when refresh fails or backend is unreachable
        await this.clear();
      }
    }

    return this.tokens ? this.tokens.accessToken : null;
  }

  async setTokens(tokens: Tokens) {
    this.tokens = tokens;
    try {
      await SecureStore.set('auth_tokens', JSON.stringify(tokens));
    } catch (err: any) {
      console.warn('[SESSION_MANAGER] Failed to write auth_tokens to secure store', err?.message);
    }
    this.notifyListeners(true);
  }

  async clear() {
    this.tokens = null;
    try {
      await SecureStore.remove('auth_tokens');
    } catch {
      // Ignore storage clear errors
    }
  }

  async logout(): Promise<void> {
    console.log('[SESSION_MANAGER] LOGOUT_INITIATED');
    const token = this.tokens?.accessToken;

    // 1. Attempt backend session revocation with 3s timeout
    if (token) {
      try {
        const apiBase =
          process.env.EXPO_PUBLIC_API_BASE_URL ||
          (globalThis as any)?.API_BASE ||
          'http://localhost:8080/api/v1';

        const logoutUrl = apiBase.endsWith('/api/v1')
          ? `${apiBase}/auth/logout`
          : `${apiBase}/api/v1/auth/logout`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        await fetch(logoutUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        })
          .finally(() => clearTimeout(timeoutId))
          .catch(() => null);
      } catch {
        // Offline / network failure must not block client logout
      }
    }

    // 2. Comprehensive Security Logout & total account state purge (Prompt 86)
    try {
      await AccountManagementService.performSecureLogout();
    } catch (err) {
      console.warn('[SESSION_MANAGER] Account purge error:', err);
    }

    // 3. User-specific profile draft cleanup
    try {
      await ProfileDraftService.clearDraft('usr_patient_primary');
      await ProfileDraftService.clearDraft('user_patient_primary');
      await ProfileDraftService.clearDraft('guest_user');
    } catch (err) {
      console.warn('[SESSION_MANAGER] Draft purge error:', err);
    }

    // 3b. User-specific offline QR capability pool cleanup
    try {
      await OfflineQRCapabilityService.clearPool('usr_patient_primary');
      await OfflineQRCapabilityService.clearPool('user_patient_primary');
      await OfflineQRCapabilityService.clearPool('guest_user');
      await OfflineQRCapabilityService.clearPool();
    } catch (err) {
      console.warn('[SESSION_MANAGER] Offline QR purge error:', err);
    }

    // 4. Clear memory tokens and SecureStore auth_tokens
    await this.clear();

    // 5. Purge React Query cache
    await clearQueryCacheStorage();

    // 6. Notify active auth listeners (switches RootNavigator from AUTHENTICATED to UNAUTHENTICATED)
    this.notifyListeners(false);
    console.log('[SESSION_MANAGER] LOGOUT_COMPLETED');
  }

  private isExpired(): boolean {
    if (!this.tokens || !this.tokens.expiresAt) return true;
    return Date.now() >= (this.tokens.expiresAt || 0) - 60_000;
  }

  // Single-flight refresh: concurrent callers wait on the same promise.
  async refreshIfNeeded(): Promise<void> {
    if (!this.tokens || !this.tokens.refreshToken) throw new Error('no refresh token available');
    if (!this.isExpired()) return;

    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: this.tokens?.refreshToken }),
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));

        if (!res.ok) {
          await this.clear();
          throw new Error('refresh failed');
        }

        const body = await res.json();
        const newTokens: Tokens = {
          accessToken: body.accessToken,
          refreshToken: body.refreshToken ?? this.tokens?.refreshToken,
          expiresAt: body.expiresAt ?? null,
        };
        await this.setTokens(newTokens);
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }
}

export default new SessionManager();
