/**
 * MiniMoth WhatsApp OTP Client
 *
 * Server-side OTP provider integration for WhatsApp-first delivery
 * with SMS fallback. Implements the IOtpProviderClient interface
 * for clean provider swappability.
 *
 * Security:
 * - API key is server-side only (MINIMOTH_API_KEY env var)
 * - OTP values are NEVER logged in production
 * - Phone numbers are logged only in masked form
 * - Rate limiting enforced at both client and route level
 *
 * Owned by: Authentication & Identity Domain
 */

import type { Logger } from '../logger/logger.js';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface OtpSendResult {
  success: boolean;
  challengeId: string;
  maskedPhone: string;
  deliveryChannel: 'whatsapp' | 'sms' | 'unknown';
  expiresAt: number;
  error?: string;
  errorCode?: string;
}

export interface OtpVerifyResult {
  success: boolean;
  phone?: string;
  providerSubject?: string;
  error?: string;
  errorCode?: string;
  attemptsRemaining?: number;
}

export interface IOtpProviderClient {
  sendOtp(phoneE164: string): Promise<OtpSendResult>;
  verifyOtp(challengeId: string, otp: string, phoneE164: string): Promise<OtpVerifyResult>;
}

// ---------------------------------------------------------------------------
// Phone number utilities
// ---------------------------------------------------------------------------

function maskPhone(phoneE164: string): string {
  if (!phoneE164 || phoneE164.length < 10) return '***';
  const country = phoneE164.slice(0, 3);
  const digits = phoneE164.slice(3);
  if (digits.length === 10) {
    return country + ' ' + digits.slice(0, 2) + '*** **' + digits.slice(7);
  }
  return country + ' *** *** ' + digits.slice(-3);
}

function normalizeIndianPhone(phone: string): string {
  const cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.length === 10) return '+91' + cleaned;
  if (cleaned.length === 12 && cleaned.startsWith('91')) return '+' + cleaned;
  return '+91' + cleaned;
}

function isValidIndianMobile(phoneE164: string): boolean {
  return /^\+91[6-9][0-9]{9}$/.test(phoneE164);
}

// ---------------------------------------------------------------------------
// MiniMoth Client Implementation
// ---------------------------------------------------------------------------

export class MiniMothClient implements IOtpProviderClient {
  private readonly _logger: Logger;
  private readonly _apiKey: string;
  private readonly _baseUrl: string;
  private readonly _timeoutMs: number;
  private readonly _isDev: boolean;

  // In-memory rate limit tracking (per-phone)
  private readonly _sendAttempts: Map<string, { count: number; windowStart: number }> = new Map();
  private readonly _verifyAttempts: Map<string, { count: number; windowStart: number }> = new Map();

  // Active challenges (server-side state for development/test)
  private readonly _activeChallenges: Map<string, {
    phoneE164: string;
    otp: string;
    expiresAt: number;
    attempts: number;
    maxAttempts: number;
  }> = new Map();

  constructor(
    apiKey: string | undefined,
    baseUrl: string | undefined,
    logger: Logger,
    options?: { timeoutMs?: number },
  ) {
    this._apiKey = apiKey || '';
    this._baseUrl = baseUrl || 'https://api.minimoth.io/v1';
    this._timeoutMs = options?.timeoutMs ?? 10000;
    this._isDev = !this._apiKey || this._apiKey.startsWith('mm_test_');
    this._logger = logger.child({
      module: 'minimoth-client',
      configured: Boolean(this._apiKey),
      mode: this._isDev ? 'development' : 'production',
    });

    if (this._isDev) {
      this._logger.warn('MiniMoth running in development mode — OTP uses server-side generated codes');
    }
  }

  async sendOtp(phoneE164: string): Promise<OtpSendResult> {
    const normalized = normalizeIndianPhone(phoneE164);
    const masked = maskPhone(normalized);

    if (!isValidIndianMobile(normalized)) {
      return {
        success: false,
        challengeId: '',
        maskedPhone: masked,
        deliveryChannel: 'unknown',
        expiresAt: 0,
        error: 'Please enter a valid 10-digit Indian mobile number',
        errorCode: 'INVALID_PHONE',
      };
    }

    // Rate limit: max 3 sends per phone per 5 minutes
    const now = Date.now();
    const rateWindow = 5 * 60 * 1000;
    const maxSends = 3;
    const sendRate = this._sendAttempts.get(normalized);

    if (sendRate) {
      if (now - sendRate.windowStart < rateWindow) {
        if (sendRate.count >= maxSends) {
          this._logger.warn('otp_send_rate_limited', { masked });
          return {
            success: false, challengeId: '', maskedPhone: masked,
            deliveryChannel: 'unknown', expiresAt: 0,
            error: 'Too many verification attempts. Please wait before trying again.',
            errorCode: 'RATE_LIMITED',
          };
        }
        sendRate.count++;
      } else {
        sendRate.count = 1;
        sendRate.windowStart = now;
      }
    } else {
      this._sendAttempts.set(normalized, { count: 1, windowStart: now });
    }

    if (!this._isDev) {
      return this._sendOtpViaApi(normalized, masked);
    }

    return this._sendOtpDevelopment(normalized, masked);
  }

  async verifyOtp(challengeId: string, otp: string, phoneE164: string): Promise<OtpVerifyResult> {
    if (!challengeId || !otp) {
      return { success: false, error: 'Invalid verification request', errorCode: 'INVALID_REQUEST' };
    }
    if (!/^\d{6}$/.test(otp)) {
      return { success: false, error: 'Please enter a valid 6-digit verification code', errorCode: 'INVALID_OTP_FORMAT' };
    }

    const normalized = normalizeIndianPhone(phoneE164);

    // Brute-force protection: max 5 verify attempts per challenge
    const verifyRate = this._verifyAttempts.get(challengeId);
    if (verifyRate && verifyRate.count >= 5) {
      this._logger.warn('otp_verify_brute_force_blocked', { challengeId: challengeId.slice(0, 12) });
      return {
        success: false,
        error: 'Too many failed attempts. Please request a new verification code.',
        errorCode: 'MAX_ATTEMPTS_EXCEEDED',
        attemptsRemaining: 0,
      };
    }
    if (verifyRate) {
      verifyRate.count++;
    } else {
      this._verifyAttempts.set(challengeId, { count: 1, windowStart: Date.now() });
    }

    if (!this._isDev) {
      return this._verifyOtpViaApi(challengeId, otp, normalized);
    }

    return this._verifyOtpDevelopment(challengeId, otp, normalized);
  }

  // ---------------------------------------------------------------------------
  // Real API
  // ---------------------------------------------------------------------------

  private async _sendOtpViaApi(phoneE164: string, masked: string): Promise<OtpSendResult> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this._timeoutMs);
      const response = await fetch(this._baseUrl + '/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this._apiKey,
          'X-Provider': 'bharat-pulselink',
        },
        body: JSON.stringify({
          phone: phoneE164, channel: 'whatsapp', fallback: 'sms',
          otpLength: 6, expirySeconds: 300,
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (!response.ok) {
        this._logger.warn('minimoth_send_api_error', { status: response.status, masked });
        return {
          success: false, challengeId: '', maskedPhone: masked,
          deliveryChannel: 'unknown', expiresAt: 0,
          error: "We couldn't send the verification code. Please try again.",
          errorCode: 'PROVIDER_ERROR',
        };
      }

      const body = await response.json() as { challengeId: string; channel: 'whatsapp' | 'sms'; expiresAt: number };
      this._logger.info('otp_sent_success', { masked, channel: body.channel, challengeId: body.challengeId?.slice(0, 12) });
      return {
        success: true, challengeId: body.challengeId, maskedPhone: masked,
        deliveryChannel: body.channel || 'whatsapp',
        expiresAt: body.expiresAt || (Date.now() + 300000),
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown';
      this._logger.error('minimoth_send_network_error', { error: msg, masked });
      return {
        success: false, challengeId: '', maskedPhone: masked,
        deliveryChannel: 'unknown', expiresAt: 0,
        error: msg.includes('abort')
          ? 'The verification service is not responding. Please try again.'
          : "We couldn't send the verification code. Please try again.",
        errorCode: msg.includes('abort') ? 'TIMEOUT' : 'NETWORK_ERROR',
      };
    }
  }

  private async _verifyOtpViaApi(challengeId: string, otp: string, phoneE164: string): Promise<OtpVerifyResult> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this._timeoutMs);
      const response = await fetch(this._baseUrl + '/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this._apiKey,
          'X-Provider': 'bharat-pulselink',
        },
        body: JSON.stringify({ challengeId, otp, phone: phoneE164 }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({})) as Record<string, unknown>;
        const errorCode = (errorBody?.code as string) || 'VERIFICATION_FAILED';
        if (response.status === 410 || errorCode === 'OTP_EXPIRED') {
          return { success: false, error: 'The verification code has expired. Please request a new one.', errorCode: 'OTP_EXPIRED' };
        }
        if (response.status === 429 || errorCode === 'RATE_LIMITED') {
          return { success: false, error: 'Too many attempts. Please wait before trying again.', errorCode: 'RATE_LIMITED' };
        }
        return {
          success: false, error: 'The verification code is invalid or expired.', errorCode: 'INVALID_OTP',
          attemptsRemaining: (errorBody?.attemptsRemaining as number) ?? undefined,
        };
      }

      const body = await response.json() as { verified: boolean; identityId?: string };
      if (!body.verified) {
        return { success: false, error: 'Unable to verify this number.', errorCode: 'VERIFICATION_FAILED' };
      }

      this._logger.info('otp_verified_success', { challengeId: challengeId.slice(0, 12) });
      return {
        success: true, phone: phoneE164,
        providerSubject: body.identityId || 'minimoth_' + phoneE164.replace(/\D/g, ''),
      };
    } catch (err) {
      this._logger.error('minimoth_verify_network_error', { error: err instanceof Error ? err.message : 'unknown' });
      return { success: false, error: "We couldn't verify the code right now. Please try again.", errorCode: 'NETWORK_ERROR' };
    }
  }

  // ---------------------------------------------------------------------------
  // Development Fallback
  // ---------------------------------------------------------------------------

  private async _sendOtpDevelopment(phoneE164: string, masked: string): Promise<OtpSendResult> {
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const challengeId = 'chg_dev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const expiresAt = Date.now() + 5 * 60 * 1000;

    this._activeChallenges.set(challengeId, {
      phoneE164, otp, expiresAt, attempts: 0, maxAttempts: 5,
    });

    this._logger.info('dev_otp_generated', {
      masked, challengeId: challengeId.slice(0, 16),
      devOtp: otp,
      note: 'DEVELOPMENT ONLY — this log MUST NOT appear in production',
    });

    return {
      success: true, challengeId, maskedPhone: masked,
      deliveryChannel: 'whatsapp', expiresAt,
    };
  }

  private async _verifyOtpDevelopment(challengeId: string, otp: string, phoneE164: string): Promise<OtpVerifyResult> {
    const challenge = this._activeChallenges.get(challengeId);
    if (!challenge) {
      return { success: false, error: 'The verification session has expired. Please request a new code.', errorCode: 'CHALLENGE_NOT_FOUND' };
    }
    if (Date.now() > challenge.expiresAt) {
      this._activeChallenges.delete(challengeId);
      return { success: false, error: 'The verification code has expired. Please request a new one.', errorCode: 'OTP_EXPIRED' };
    }
    challenge.attempts++;
    if (challenge.attempts > challenge.maxAttempts) {
      this._activeChallenges.delete(challengeId);
      return { success: false, error: 'Too many failed attempts. Please request a new verification code.', errorCode: 'MAX_ATTEMPTS_EXCEEDED', attemptsRemaining: 0 };
    }
    if (otp !== challenge.otp) {
      return { success: false, error: 'The verification code is invalid or expired.', errorCode: 'INVALID_OTP', attemptsRemaining: challenge.maxAttempts - challenge.attempts };
    }
    if (challenge.phoneE164 !== phoneE164) {
      return { success: false, error: 'Unable to verify this number.', errorCode: 'PHONE_MISMATCH' };
    }

    this._activeChallenges.delete(challengeId);
    this._logger.info('dev_otp_verified', { challengeId: challengeId.slice(0, 16) });
    return { success: true, phone: phoneE164, providerSubject: 'minimoth_' + phoneE164.replace(/\D/g, '') };
  }

  cleanupExpired(): void {
    const now = Date.now();
    for (const [key, ch] of this._activeChallenges) {
      if (now > ch.expiresAt) this._activeChallenges.delete(key);
    }
    const maxAge = 10 * 60 * 1000;
    for (const [key, e] of this._sendAttempts) {
      if (now - e.windowStart > maxAge) this._sendAttempts.delete(key);
    }
    for (const [key, e] of this._verifyAttempts) {
      if (now - e.windowStart > maxAge) this._verifyAttempts.delete(key);
    }
  }
}
