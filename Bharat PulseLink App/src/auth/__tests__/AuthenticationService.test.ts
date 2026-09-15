import { describe, it, expect, beforeEach } from 'vitest';
import AuthenticationService from '../AuthenticationService';
import AuthenticationProviderRegistry from '../AuthenticationProviderRegistry';
import WhatsAppOtpProvider from '../WhatsAppOtpProvider';

describe('AuthenticationService Domain Architecture', () => {
  beforeEach(() => {
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
    const res = await AuthenticationService.requestWhatsAppOtp('9876543210');
    expect(res.success).toBe(true);
    expect(res.challenge).toBeDefined();
    expect(res.challenge?.phoneE164).toBe('+919876543210');
    expect(res.challenge?.maskedPhone).toBe('+91 98*** **210');
    expect(AuthenticationService.getStep()).toBe('AWAITING_VERIFICATION');
  });

  it('rejects invalid phone numbers cleanly', async () => {
    const res = await AuthenticationService.requestWhatsAppOtp('12345');
    expect(res.success).toBe(false);
    expect(res.error).toBe('Please enter a valid 10-digit Indian mobile number');
    expect(AuthenticationService.getStep()).toBe('FAILED');
  });

  it('verifies WhatsApp OTP and returns canonical identity on valid 6-digit code', async () => {
    await AuthenticationService.requestWhatsAppOtp('9876543210');
    const verifyRes = await AuthenticationService.verifyWhatsAppOtp('123456');
    expect(verifyRes.success).toBe(true);
    expect(verifyRes.identity).toBeDefined();
    expect(verifyRes.identity?.authProvider).toBe('whatsapp');
    expect(AuthenticationService.getStep()).toBe('SUCCESS');
  }, 10000);

  it('rejects wrong OTP code cleanly', async () => {
    await AuthenticationService.requestWhatsAppOtp('9876543210');
    const verifyRes = await AuthenticationService.verifyWhatsAppOtp('000000');
    expect(verifyRes.success).toBe(false);
    expect(verifyRes.errorCode).toBe('INVALID_OTP');
    expect(AuthenticationService.getStep()).toBe('FAILED');
  }, 10000);
});
