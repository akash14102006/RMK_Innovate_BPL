import { describe, it, expect } from 'vitest';
import en from '../../i18n/locales/en';

describe('AuthEntryScreen & Authentication Gateway Contracts', () => {
  it('defines all required Prompt 12 translation keys in English dictionary', () => {
    expect(en.auth.welcomeTitle).toBe('Welcome to Bharat PulseLink');
    expect(en.auth.continueWithGoogle).toBe('Continue with Google');
    expect(en.auth.continueWithWhatsApp).toBe('Continue with WhatsApp');
    expect(en.auth.orDivider).toBe('OR');
    expect(en.common.terms).toBe('Terms of Service');
    expect(en.common.privacy).toBe('Privacy Policy');
  });
});
