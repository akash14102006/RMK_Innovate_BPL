import { describe, it, expect } from 'vitest';
import { PhoneNormalizer } from '../../../src/modules/notifications/PhoneNormalizer.js';

describe('PhoneNormalizer — Phone Validation & Redaction', () => {
  it('normalizes 10-digit Indian numbers to E.164 +91XXXXXXXXXX', () => {
    expect(PhoneNormalizer.normalize('9876543210')).toEqual({
      isValid: true,
      normalized: '+919876543210',
    });
    expect(PhoneNormalizer.normalize('7890123456')).toEqual({
      isValid: true,
      normalized: '+917890123456',
    });
  });

  it('normalizes 12-digit numbers and existing +91 E.164 strings', () => {
    expect(PhoneNormalizer.normalize('919876543210')).toEqual({
      isValid: true,
      normalized: '+919876543210',
    });
    expect(PhoneNormalizer.normalize('+919876543210')).toEqual({
      isValid: true,
      normalized: '+919876543210',
    });
  });

  it('maps softphone extensions to test mobile format', () => {
    expect(PhoneNormalizer.normalize('1001')).toEqual({
      isValid: true,
      normalized: '+919876501001',
    });
  });

  it('rejects invalid or malformed numbers safely', () => {
    expect(PhoneNormalizer.normalize('')).toEqual({
      isValid: false,
      error: 'Phone number is required',
    });
    expect(PhoneNormalizer.normalize('123456')).toEqual({
      isValid: false,
      error: 'Invalid Indian mobile number format. Expected 10 digits starting with 6-9.',
    });
    expect(PhoneNormalizer.normalize('invalid_phone')).toEqual({
      isValid: false,
      error: 'Invalid Indian mobile number format. Expected 10 digits starting with 6-9.',
    });
  });

  it('redacts phone numbers for safe logging', () => {
    expect(PhoneNormalizer.redactForLogs('+919876543210')).toBe('+91******3210');
    expect(PhoneNormalizer.redactForLogs(null)).toBe('[REDACTED_PHONE]');
  });
});
