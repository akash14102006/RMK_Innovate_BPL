import { describe, it, expect } from 'vitest';
import WhatsAppOtpProvider from '../WhatsAppOtpProvider';

describe('WhatsAppOtpProvider Adapter & Phone Normalization', () => {
  it('normalizes 10-digit Indian numbers to E.164 (+91)', () => {
    expect(WhatsAppOtpProvider.normalizePhoneNumber('9876543210')).toBe('+919876543210');
  });

  it('normalizes 12-digit Indian numbers starting with 91 to E.164 (+91)', () => {
    expect(WhatsAppOtpProvider.normalizePhoneNumber('919876543210')).toBe('+919876543210');
  });

  it('preserves existing E.164 international phone formats', () => {
    expect(WhatsAppOtpProvider.normalizePhoneNumber('+919876543210')).toBe('+919876543210');
    expect(WhatsAppOtpProvider.normalizePhoneNumber('+14155552671')).toBe('+14155552671');
  });

  it('masks Indian phone numbers cleanly for privacy', () => {
    expect(WhatsAppOtpProvider.maskPhoneNumber('+919876543210')).toBe('+91 98*** **210');
  });

  it('generates server-authoritative challenge with 30s resend cooldown', async () => {
    const provider = new WhatsAppOtpProvider();
    const res = await provider.requestOtp('9876543210');
    expect(res.success).toBe(true);
    expect(res.challenge).toBeDefined();
    expect(res.challenge?.attemptsRemaining).toBe(3);
    expect(res.challenge?.resendAvailableAt).toBeGreaterThan(Date.now());
  });
});
