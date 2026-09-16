import { describe, it, expect, beforeEach, vi } from 'vitest';
import AuthenticationService from '../AuthenticationService';
import AuthenticationProviderRegistry from '../AuthenticationProviderRegistry';
import WhatsAppOtpProvider from '../WhatsAppOtpProvider';

describe('AuthenticationService Domain Architecture', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    AuthenticationService.reset();
  });

  it('initializes in IDLE step', () => {
    expect(AuthenticationService.getStep()).toBe('IDLE');
    expect(AuthenticationService.getIdentity()).toBeNull();
    expect(AuthenticationService.getActiveChallenge()).toBeNull();
  });

  it('handles Google authentication when client ID is unconfigured', async () => {
    const unconfigured = {
      providerType: 'google' as const,
      isAvailable: async () => false,
      authenticate: async () => ({
        success: false,
        isBlocked: true,
        errorCode: 'PROVIDER_UNAVAILABLE',
        error: 'Google Sign-In is not configured.',
      }),
    };
    AuthenticationProviderRegistry.register(unconfigured);
    const result = await AuthenticationService.authenticateWithProvider('google');
    expect(result.success).toBe(false);
    expect(result.isBlocked).toBe(true);
    expect(result.errorCode).toBe('PROVIDER_UNAVAILABLE');
  });

  it('creates a valid WhatsApp OTP challenge for valid Indian phone numbers', async () => {
    const mockSendResponse = {
      challengeId: 'chg_wa_auth_svc',
      maskedPhone: '+91 98*** **210',
      deliveryChannel: 'whatsapp',
      expiresAt: Date.now() + 300000,
      resendAvailableAt: Date.now() + 30000,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockSendResponse,
    }) as any;

    const res = await AuthenticationService.requestWhatsAppOtp('9876543210');
    expect(res.success).toBe(true);
    expect(res.challenge).toBeDefined();
    expect(res.challenge?.phoneE164).toBe('+919876543210');
    expect(res.challenge?.maskedPhone).toBe('+91 98*** **210');
    expect(AuthenticationService.getStep()).toBe('AWAITING_VERIFICATION');
  });

  it('rejects invalid phone numbers cleanly without network call', async () => {
    const res = await AuthenticationService.requestWhatsAppOtp('12345');
    expect(res.success).toBe(false);
    expect(res.error).toBe('Please enter a valid 10-digit Indian mobile number.');
    expect(AuthenticationService.getStep()).toBe('FAILED');
  });

  it('verifies WhatsApp OTP and returns canonical identity on valid 6-digit code', async () => {
    const mockSendResponse = {
      challengeId: 'chg_wa_auth_svc_2',
      maskedPhone: '+91 98*** **210',
      deliveryChannel: 'whatsapp',
      expiresAt: Date.now() + 300000,
      resendAvailableAt: Date.now() + 30000,
    };

    const mockVerifyResponse = {
      user: { id: 'usr_wa_test_valid', status: 'ACTIVE' },
      profile: { id: 'pat_wa_test_valid', fullName: 'Patient 3210', status: 'INCOMPLETE', isComplete: false },
      session: { sessionId: 'sess_wa_test', sessionToken: 'bpl_wa_token_valid', expiresAt: Date.now() + 3600000 },
      isNewUser: false,
    };

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSendResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockVerifyResponse,
      }) as any;

    await AuthenticationService.requestWhatsAppOtp('9876543210');
    const verifyRes = await AuthenticationService.verifyWhatsAppOtp('654321');
    expect(verifyRes.success).toBe(true);
    expect(verifyRes.identity).toBeDefined();
    expect(verifyRes.identity?.authProvider).toBe('whatsapp');
    expect(AuthenticationService.getStep()).toBe('SUCCESS');
  });

  it('rejects wrong OTP code cleanly with error mapping', async () => {
    const mockSendResponse = {
      challengeId: 'chg_wa_auth_svc_3',
      maskedPhone: '+91 98*** **210',
      deliveryChannel: 'whatsapp',
      expiresAt: Date.now() + 300000,
      resendAvailableAt: Date.now() + 30000,
    };

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSendResponse,
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: { code: 'INVALID_OTP', message: 'The verification code is invalid.' } }),
      }) as any;

    await AuthenticationService.requestWhatsAppOtp('9876543210');
    const verifyRes = await AuthenticationService.verifyWhatsAppOtp('000000');
    expect(verifyRes.success).toBe(false);
    expect(verifyRes.errorCode).toBe('INVALID_OTP');
    expect(verifyRes.error).toBe('Incorrect verification code. Please check and try again.');
    expect(AuthenticationService.getStep()).toBe('FAILED');
  });
});
