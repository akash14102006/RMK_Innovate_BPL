import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import WhatsAppOtpProvider from '../WhatsAppOtpProvider';
import GoogleAuthProvider from '../GoogleAuthProvider';
import AuthenticationService from '../AuthenticationService';
import SessionManager from '../../services/sessionManager';
import { isDevAuthBypassEnabled, DEV_OTP_CODE } from '../devAuthBypass';

describe('Development Auth Bypass (DEV_AUTH_BYPASS)', () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'development';
    process.env.EXPO_PUBLIC_DEV_AUTH_BYPASS = 'true';
    AuthenticationService.reset();
    await SessionManager.clear();
  });

  afterEach(async () => {
    process.env = originalEnv;
    AuthenticationService.reset();
    await SessionManager.clear();
  });

  describe('Configuration Guardrails', () => {
    it('enables bypass only when flag is true in non-production', () => {
      process.env.NODE_ENV = 'development';
      process.env.EXPO_PUBLIC_DEV_AUTH_BYPASS = 'true';
      expect(isDevAuthBypassEnabled()).toBe(true);
    });

    it('strictly forces bypass to FALSE in production regardless of flag', () => {
      process.env.NODE_ENV = 'production';
      process.env.EXPO_PUBLIC_DEV_AUTH_BYPASS = 'true';
      expect(isDevAuthBypassEnabled()).toBe(false);
    });

    it('returns false when flag is not set or false', () => {
      process.env.NODE_ENV = 'development';
      process.env.EXPO_PUBLIC_DEV_AUTH_BYPASS = 'false';
      expect(isDevAuthBypassEnabled()).toBe(false);
    });
  });

  describe('WhatsApp OTP Bypass Flow', () => {
    it('creates dev challenge without making any network/fetch calls', async () => {
      const fetchSpy = vi.fn();
      global.fetch = fetchSpy as any;

      const provider = new WhatsAppOtpProvider();
      const res = await provider.requestOtp('9876543210');

      expect(res.success).toBe(true);
      expect(res.challenge).toBeDefined();
      expect(res.challenge?.challengeId).toMatch(/^chg_dev_/);
      expect(res.challenge?.maskedPhone).toBe('+91 98*** **210');
      expect(res.challenge?.deliveryChannel).toBe('whatsapp');

      // Zero network requests
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('accepts ONLY 123456 and successfully creates local development session', async () => {
      const fetchSpy = vi.fn();
      global.fetch = fetchSpy as any;

      const provider = new WhatsAppOtpProvider();
      const res = await provider.verifyOtp('chg_dev_test', DEV_OTP_CODE, '+919876543210');

      expect(res.success).toBe(true);
      expect(res.identity).toBeDefined();
      expect(res.identity?.id).toBe('usr_dev_3210');
      expect(res.identity?.authProvider).toBe('whatsapp');
      expect(res.identity?.phone).toBe('+919876543210');

      // Verifies SessionManager has saved dev tokens
      const accessToken = await SessionManager.getAccessToken();
      expect(accessToken).not.toBeNull();
      expect(accessToken).toMatch(/^bpl_dev_session_/);

      // Zero network requests
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('rejects any code other than 123456 with failure', async () => {
      const provider = new WhatsAppOtpProvider();

      const invalidCodes = ['654321', '000000', '111111', '999999', '123455', '123457'];

      for (const code of invalidCodes) {
        const res = await provider.verifyOtp('chg_dev_test', code, '+919876543210');
        expect(res.success).toBe(false);
        expect(res.errorCode).toBe('INVALID_OTP');
        expect(res.error).toContain('123456');
      }
    });

    it('executes full end-to-end AuthenticationService dev flow', async () => {
      // 1. Request OTP
      const requestRes = await AuthenticationService.requestWhatsAppOtp('9876543210');
      expect(requestRes.success).toBe(true);
      expect(AuthenticationService.getStep()).toBe('AWAITING_VERIFICATION');

      // 2. Try wrong OTP -> fails
      const failRes = await AuthenticationService.verifyWhatsAppOtp('999999');
      expect(failRes.success).toBe(false);

      // Re-request OTP for valid attempt
      await AuthenticationService.requestWhatsAppOtp('9876543210');

      // 3. Verify with 123456 -> succeeds
      const successRes = await AuthenticationService.verifyWhatsAppOtp('123456');
      expect(successRes.success).toBe(true);
      expect(successRes.identity?.id).toBe('usr_dev_3210');
      expect(AuthenticationService.getStep()).toBe('SUCCESS');
      expect(AuthenticationService.getIdentity()?.id).toBe('usr_dev_3210');

      // 4. Session exists
      const accessToken = await SessionManager.getAccessToken();
      expect(accessToken).toBeDefined();

      // 5. Logout clears dev session cleanly
      await SessionManager.clear();
      AuthenticationService.reset();
      expect(AuthenticationService.getStep()).toBe('IDLE');
      expect(SessionManager.getTokens()).toBeNull();
    });
  });

  describe('Google Sign-In Dev Bypass', () => {
    it('creates dev Google session without calling external Descope OAuth APIs', async () => {
      const fetchSpy = vi.fn();
      global.fetch = fetchSpy as any;

      const provider = new GoogleAuthProvider();
      const res = await provider.authenticate();

      expect(res.success).toBe(true);
      expect(res.identity?.authProvider).toBe('google');
      expect(res.identity?.displayName).toBe('Dev Google Patient');

      const accessToken = await SessionManager.getAccessToken();
      expect(accessToken).toMatch(/^bpl_dev_google_token_/);

      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });
});
