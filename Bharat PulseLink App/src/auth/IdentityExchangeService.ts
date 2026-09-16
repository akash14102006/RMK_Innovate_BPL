/**
 * Identity Exchange Service
 *
 * Coordinates exchanging verified authentication provider tokens
 * (Descope session JWT / WhatsApp OTP) with Bharat PulseLink backend.
 *
 * Owned by: Authentication & Identity (Prompt 88, 89)
 */

import { CanonicalIdentity, AuthResult } from './types';
import SessionManager from '../services/sessionManager';
import { resolveApiBaseUrl } from '../utils/apiUrl';

export class IdentityExchangeService {
  /**
   * Exchanges verified Descope session token with Bharat PulseLink backend
   * endpoint POST /api/v1/auth/exchange.
   */
  static async exchangeDescopeSession(
    sessionToken: string,
    refreshToken?: string
  ): Promise<AuthResult> {
    if (!sessionToken) {
      return {
        success: false,
        errorCode: 'MISSING_TOKEN',
        error: 'Missing session token from authentication provider',
      };
    }

    const apiBase = resolveApiBaseUrl();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const exchangeUrl = apiBase.endsWith('/api/v1')
        ? `${apiBase}/auth/exchange`
        : `${apiBase}/api/v1/auth/exchange`;

      const res = await fetch(exchangeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sessionToken,
          deviceFingerprint: `device_mobile_${Date.now()}`,
          platform: 'android',
          appVersion: '1.0.0',
        }),
        signal: controller.signal,
      })
        .finally(() => clearTimeout(timeoutId))
        .catch((err) => {
          console.warn('[AUTH_EXCHANGE] Network fetch failed:', err?.message);
          return null;
        });

      if (res && res.ok) {
        const body = (await res.json()) as {
          user: {
            id: string;
            status: string;
          };
          profile: {
            id: string;
            fullName: string;
            status: string;
            isComplete: boolean;
          };
          session: {
            sessionId: string | null;
            sessionToken: string;
            expiresAt: number | string;
          };
          isNewUser: boolean;
        };

        const identity: CanonicalIdentity = {
          id: body.user.id,
          authProvider: 'google',
          displayName: body.profile?.fullName || 'Patient',
          isNewUser: body.isNewUser,
          termsAccepted: true,
          profileCompleted: body.profile?.isComplete ?? true,
          createdAt: new Date().toISOString(),
        };

        const activeToken = body.session?.sessionToken || sessionToken;
        const expiresAt = typeof body.session?.expiresAt === 'number'
          ? body.session.expiresAt
          : Date.now() + 3600 * 1000;

        await SessionManager.setTokens({
          accessToken: activeToken,
          refreshToken: refreshToken ?? null,
          expiresAt,
        });

        return {
          success: true,
          identity,
        };
      }

      if (res && !res.ok) {
        const errJson = await res.json().catch(() => ({})) as { error?: { code?: string; message?: string } };
        return {
          success: false,
          errorCode: errJson?.error?.code || 'AUTH_EXCHANGE_FAILED',
          error: errJson?.error?.message || 'Authentication exchange failed with the server.',
        };
      }

      return {
        success: false,
        errorCode: 'NETWORK_ERROR',
        error: 'Unable to connect to the authentication service. Please check your connection.',
      };
    } catch (err: any) {
      console.error('[AUTH_EXCHANGE] Descope exchange error', err?.message || 'Unknown error');
      return {
        success: false,
        errorCode: 'INTERNAL_ERROR',
        error: err?.message || 'Unable to save your secure session. Please try again.',
      };
    }
  }

  /**
   * Backwards compatible Google credential exchange
   */
  static async exchangeGoogleCredential(idToken: string): Promise<AuthResult> {
    return this.exchangeDescopeSession(idToken);
  }

  /**
   * Exchanges OTP verification with Bharat PulseLink backend
   * endpoint POST /api/v1/auth/whatsapp/verify.
   */
  static async exchangeOtpVerification(
    challengeId: string,
    otp: string,
    phoneE164: string
  ): Promise<AuthResult> {
    if (!challengeId) {
      return {
        success: false,
        errorCode: 'INVALID_CHALLENGE',
        error: 'Invalid authentication session. Please request a new code.',
      };
    }
    if (!otp || !/^\d{6}$/.test(otp)) {
      return {
        success: false,
        errorCode: 'INVALID_OTP_FORMAT',
        error: 'Please enter a valid 6-digit verification code.',
      };
    }

    const apiBase = resolveApiBaseUrl();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const verifyUrl = apiBase.endsWith('/api/v1')
        ? `${apiBase}/auth/whatsapp/verify`
        : `${apiBase}/api/v1/auth/whatsapp/verify`;

      const res = await fetch(verifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          challengeId,
          otp,
          phone: phoneE164,
          deviceFingerprint: `device_mobile_${Date.now()}`,
          platform: 'android',
          appVersion: '1.0.0',
        }),
        signal: controller.signal,
      })
        .finally(() => clearTimeout(timeoutId))
        .catch((err) => {
          console.warn('[AUTH_EXCHANGE] OTP verify fetch failed:', err?.message);
          return null;
        });

      if (res && res.ok) {
        const body = (await res.json()) as {
          user: {
            id: string;
            status: string;
          };
          profile: {
            id: string;
            fullName: string;
            status: string;
            isComplete: boolean;
          };
          session: {
            sessionId: string | null;
            sessionToken: string;
            refreshToken?: string;
            expiresAt: number | string;
          };
          isNewUser: boolean;
        };

        const identity: CanonicalIdentity = {
          id: body.user.id,
          authProvider: 'whatsapp',
          phone: phoneE164,
          displayName: body.profile?.fullName || (`Patient ` + phoneE164.slice(-4)),
          isNewUser: body.isNewUser,
          termsAccepted: true,
          profileCompleted: body.profile?.isComplete ?? true,
          createdAt: new Date().toISOString(),
        };

        const expiresAt = typeof body.session?.expiresAt === 'number'
          ? body.session.expiresAt
          : Date.now() + 3600 * 1000;

        await SessionManager.setTokens({
          accessToken: body.session.sessionToken,
          refreshToken: body.session.refreshToken ?? null,
          expiresAt,
        });

        return {
          success: true,
          identity,
        };
      }

      if (res && !res.ok) {
        const errJson = await res.json().catch(() => ({})) as { error?: { code?: string; message?: string } };
        return {
          success: false,
          errorCode: errJson?.error?.code || 'VERIFICATION_FAILED',
          error: errJson?.error?.message || 'The verification code is invalid or expired.',
        };
      }

      return {
        success: false,
        errorCode: 'NETWORK_ERROR',
        error: 'Unable to connect to the authentication server. Please check your network connection.',
      };
    } catch (err: any) {
      console.error('[AUTH_EXCHANGE] OTP exchange error', err?.message || 'Unknown error');
      return {
        success: false,
        errorCode: 'INTERNAL_ERROR',
        error: err?.message || 'Unable to save your secure session. Please try again.',
      };
    }
  }
}

export default IdentityExchangeService;
