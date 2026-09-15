import { AUTH_TYPES_VERSION, IOtpAuthProvider, AuthProviderType, AuthResult, OtpChallenge } from './types';
import IdentityExchangeService from './IdentityExchangeService';

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

  async requestOtp(phoneInput: string): Promise<{ success: boolean; challenge?: OtpChallenge; error?: string }> {
    const normalized = WhatsAppOtpProvider.normalizePhoneNumber(phoneInput);
    if (!/^\+91[6-9][0-9]{9}$/.test(normalized)) {
      return {
        success: false,
        error: 'Please enter a valid 10-digit Indian mobile number',
      };
    }

    const now = Date.now();
    const challenge: OtpChallenge = {
      challengeId: 'chg_wa_' + Math.random().toString(36).substring(2, 9),
      phoneE164: normalized,
      maskedPhone: WhatsAppOtpProvider.maskPhoneNumber(normalized),
      expiresAt: now + 5 * 60 * 1000, // 5 minutes validity
      resendAvailableAt: now + 30 * 1000, // 30 seconds resend cooldown
      attemptsRemaining: 3,
    };

    console.log('[WHATSAPP_OTP] OTP_CHALLENGE_CREATED', { challengeId: challenge.challengeId, masked: challenge.maskedPhone });
    return { success: true, challenge };
  }

  async verifyOtp(challengeId: string, otp: string): Promise<AuthResult> {
    if (!challengeId) {
      return { success: false, error: 'Invalid authentication session' };
    }
    if (!otp || otp.length !== 6) {
      return { success: false, error: 'Please enter a valid 6-digit code' };
    }

    return await IdentityExchangeService.exchangeOtpVerification(challengeId, otp, '+919800000000');
  }
}

export default WhatsAppOtpProvider;
