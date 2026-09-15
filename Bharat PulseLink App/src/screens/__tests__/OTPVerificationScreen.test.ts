import { describe, it, expect } from 'vitest';
import en from '../../i18n/locales/en';

describe('OTPVerificationScreen Contracts', () => {
  it('defines all required Prompt 15 OTP translation keys in English dictionary', () => {
    expect(en.otp.title).toBe('OTP Verification');
    expect(en.otp.sentInstruction).toBe('Enter 6-digit code sent to');
    expect(en.otp.changeNumber).toBe('Change Number');
    expect(en.otp.resendIn).toBe('Resend code in');
    expect(en.otp.resendCode).toBe('Resend Code');
    expect(en.otp.verifyAction).toBe('Verify & Continue');
  });
});
