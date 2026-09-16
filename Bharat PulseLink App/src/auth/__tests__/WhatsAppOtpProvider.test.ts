import { describe, it, expect, beforeEach, vi } from 'vitest';
import WhatsAppOtpProvider from '../WhatsAppOtpProvider';

describe('WhatsAppOtpProvider Adapter & Phone Normalization', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

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

  it('requests server-authoritative challenge with 30s resend cooldown', async () => {
    const mockSendResponse = {
      challengeId: 'chg_wa_mock123',
      maskedPhone: '+91 98*** **210',
      deliveryChannel: 'whatsapp',
      expiresAt: Date.now() + 300000,
      resendAvailableAt: Date.now() + 30000,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockSendResponse,
    }) as any;

    const provider = new WhatsAppOtpProvider();
    const res = await provider.requestOtp('9876543210');
    expect(res.success).toBe(true);
    expect(res.challenge).toBeDefined();
    expect(res.challenge?.challengeId).toBe('chg_wa_mock123');
    expect(res.challenge?.deliveryChannel).toBe('whatsapp');
    expect(res.challenge?.resendAvailableAt).toBeGreaterThan(Date.now());
  });

  it('verifies OTP code against server endpoint', async () => {
    const mockVerifyResponse = {
      user: { id: 'usr_wa_test', status: 'ACTIVE' },
      profile: { id: 'pat_wa_test', fullName: 'Patient 3210', status: 'INCOMPLETE', isComplete: false },
      session: { sessionId: 'sess_wa_test', sessionToken: 'bpl_wa_token_123', expiresAt: Date.now() + 3600000 },
      isNewUser: false,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockVerifyResponse,
    }) as any;

    const provider = new WhatsAppOtpProvider();
    const res = await provider.verifyOtp('chg_wa_mock123', '654321', '+919876543210');
    expect(res.success).toBe(true);
    expect(res.identity?.id).toBe('usr_wa_test');
    expect(res.identity?.authProvider).toBe('whatsapp');
  });
});
