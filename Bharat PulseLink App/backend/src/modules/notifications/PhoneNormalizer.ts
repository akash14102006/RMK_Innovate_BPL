/**
 * Bharat PulseLink — Telephony Phone Number Normalizer & Validator
 *
 * Enforces canonical E.164 formatting (+91XXXXXXXXXX) and secure redaction for logs.
 *
 * Owned by: Notifications & Telephony Domain (Step 11)
 */

export interface PhoneValidationResult {
  isValid: boolean;
  normalized?: string;
  error?: string;
}

export class PhoneNormalizer {
  /**
   * Validates and normalizes phone number to canonical E.164 +91XXXXXXXXXX.
   */
  public static normalize(rawPhone?: string | null): PhoneValidationResult {
    if (!rawPhone || typeof rawPhone !== 'string') {
      return { isValid: false, error: 'Phone number is required' };
    }

    // Strip non-digits except leading +
    const cleaned = rawPhone.trim().replace(/[^\d+]/g, '');

    // Case A: 10-digit Indian standard (starts with 6, 7, 8, 9)
    if (/^[6-9]\d{9}$/.test(cleaned)) {
      return { isValid: true, normalized: `+91${cleaned}` };
    }

    // Case B: 12-digit format with 91 prefix
    if (/^91[6-9]\d{9}$/.test(cleaned)) {
      return { isValid: true, normalized: `+${cleaned}` };
    }

    // Case C: E.164 format with +91
    if (/^\+91[6-9]\d{9}$/.test(cleaned)) {
      return { isValid: true, normalized: cleaned };
    }

    // Case D: Softphone / internal test extension (e.g. 1001) mapped to test mobile number
    if (/^\d{3,5}$/.test(cleaned)) {
      return { isValid: true, normalized: `+9198765${cleaned.padStart(5, '0')}` };
    }

    return {
      isValid: false,
      error: 'Invalid Indian mobile number format. Expected 10 digits starting with 6-9.',
    };
  }

  /**
   * Redacts phone number for safe observability logs (e.g., +91******3210).
   */
  public static redactForLogs(normalizedPhone?: string | null): string {
    if (!normalizedPhone || typeof normalizedPhone !== 'string') return '[REDACTED_PHONE]';
    if (normalizedPhone.length <= 6) return '***';
    const prefix = normalizedPhone.slice(0, 3);
    const suffix = normalizedPhone.slice(-4);
    return `${prefix}******${suffix}`;
  }
}
