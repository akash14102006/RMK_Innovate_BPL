/**
 * WhatsApp OTP Authentication Provider
 *
 * Client adapter for server-authoritative WhatsApp/SMS OTP authentication
 * backed by MiniMoth via the Bharat PulseLink backend endpoints:
 * - POST /api/v1/auth/whatsapp/send
 * - POST /api/v1/auth/whatsapp/verify
 *
 * Owned by: Authentication & Identity Domain (Prompt 88, 89)
 */

import { IOtpAuthProvider, AuthProviderType, AuthResult, OtpChallenge } from './types';
import IdentityExchangeService from './IdentityExchangeService';
import { resolveApiBaseUrl } from '../utils/apiUrl';

export class WhatsAppOtpProvider implements IOtpAuthProvider {
  readonly providerType: AuthProviderType = 'whatsapp';

  /**
   * Normalizes Indian and international phone numbers into standard E.164 format.
   * Default country code is +91 for India.
   */
  static normalizePhoneNumber(phoneInput: string, defaultCountryCode = '+91'): string {
    const cleaned = phoneInput.replace(/[^0-9+]/g, '');
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    if (cleaned.length === 10) {
      return `${defaultCountryCode}${cleaned}`;
    }
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return `+${cleaned}`;
    }
    return `${defaultCountryCode}${cleaned}`;
  }

  /**
   * Masks E.164 phone number for privacy display: e.g. +91 98*** **321
   */
  static maskPhoneNumber(phoneE164: string): string {
    if (!phoneE164 || phoneE164.length < 10) return phoneE164;
    const country = phoneE164.slice(0, 3); // e.g. +91
    const digits = phoneE164.slice(3); // 10 digits
    if (digits.length === 10) {
      return `${country} ${digits.slice(0, 2)}*** **${digits.slice(7)}`;
    }
    return `${country} *** *** ${digits.slice(-3)}`;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async authenticate(): Promise<AuthResult> {
    return {
      success: false,
      error: 'WhatsApp authentication requires phone number entry',
    };
  }

  /**
   * Requests an OTP code to be sent to the given phone number via WhatsApp.
   * Calls the backend API (POST /api/v1/auth/whatsapp/send) which interfaces with MiniMoth.
   */
  async requestOtp(
    phoneInput: string
  ): Promise<{ success: boolean; challenge?: OtpChallenge; error?: string; errorCode?: string }> {
    const normalized = WhatsAppOtpProvider.normalizePhoneNumber(phoneInput);
    if (!/^\+91[6-9][0-9]{9}$/.test(normalized)) {
      return {
        success: false,
        errorCode: 'INVALID_PHONE',
        error: 'Please enter a valid 10-digit Indian mobile number',
      };
    }

    const apiBase = resolveApiBaseUrl();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const sendUrl = apiBase.endsWith('/api/v1')
        ? `${apiBase}/auth/whatsapp/send`
        : `${apiBase}/api/v1/auth/whatsapp/send`;

      const res = await fetch(sendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ phone: normalized }),
        signal: controller.signal,
      })
        .finally(() => clearTimeout(timeoutId))
        .catch((err) => {
          console.warn('[WHATSAPP_OTP] Send network error:', err?.message);
          return null;
        });

      if (res && res.ok) {
        const data = (await res.json()) as {
          challengeId: string;
          maskedPhone: string;
          deliveryChannel: 'whatsapp' | 'sms' | 'unknown';
          expiresAt: number;
          resendAvailableAt: number;
        };

        const challenge: OtpChallenge = {
          challengeId: data.challengeId,
          phoneE164: normalized,
          maskedPhone: data.maskedPhone || WhatsAppOtpProvider.maskPhoneNumber(normalized),
          deliveryChannel: data.deliveryChannel,
          expiresAt: data.expiresAt || (Date.now() + 5 * 60 * 1000),
          resendAvailableAt: data.resendAvailableAt || (Date.now() + 30 * 1000),
          attemptsRemaining: 5,
        };

        console.log('[WHATSAPP_OTP] OTP_CHALLENGE_CREATED', {
          challengeId: challenge.challengeId,
          masked: challenge.maskedPhone,
          channel: challenge.deliveryChannel,
        });

        return { success: true, challenge };
      }

      if (res && !res.ok) {
        const errJson = await res.json().catch(() => ({})) as { error?: { code?: string; message?: string } };
        return {
          success: false,
          errorCode: errJson?.error?.code || 'OTP_SEND_FAILED',
          error: errJson?.error?.message || "We couldn't send the verification code. Please try again.",
        };
      }

      return {
        success: false,
        errorCode: 'NETWORK_ERROR',
        error: 'Unable to reach the verification server. Please check your connection.',
      };
    } catch (err: any) {
      console.error('[WHATSAPP_OTP] Request OTP exception:', err);
      return {
        success: false,
        errorCode: 'INTERNAL_ERROR',
        error: err?.message || 'Failed to request verification code. Please try again.',
      };
    }
  }

  /**
   * Verifies the 6-digit OTP code against the backend.
   */
  async verifyOtp(challengeId: string, otp: string, phoneE164?: string): Promise<AuthResult> {
    if (!challengeId) {
      return { success: false, errorCode: 'INVALID_CHALLENGE', error: 'Invalid authentication session' };
    }
    if (!otp || !/^\d{6}$/.test(otp)) {
      return { success: false, errorCode: 'INVALID_OTP_FORMAT', error: 'Please enter a valid 6-digit code' };
    }

    return await IdentityExchangeService.exchangeOtpVerification(
      challengeId,
      otp,
      phoneE164 || '+919876543210'
    );
  }
}

export default WhatsAppOtpProvider;
