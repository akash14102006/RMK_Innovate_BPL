import { describe, it, expect } from 'vitest';
import i18n from '../i18n';
import { ALL_SCHEDULED_LANGUAGES, getLanguageDescriptor, isRTL } from '../languages';
import { languageResources } from '../locales/allLanguages';

describe('Prompt Enterprise Multilingual Audit & Parity', () => {
  it('verifies that central language registry has exactly 23 supported languages', () => {
    expect(ALL_SCHEDULED_LANGUAGES.length).toBe(23);

    const requiredBcp47 = [
      'en-IN', 'hi-IN', 'ta-IN', 'te-IN', 'bn-IN', 'mr-IN', 'gu-IN',
      'kn-IN', 'ml-IN', 'pa-IN', 'or-IN', 'as-IN', 'brx-IN', 'doi-IN',
      'ks-IN', 'kok-IN', 'mai-IN', 'mni-IN', 'ne-IN', 'sa-IN', 'sat-IN',
      'sd-IN', 'ur-IN'
    ];

    const codes = ALL_SCHEDULED_LANGUAGES.map((l) => l.code);
    requiredBcp47.forEach((code) => {
      expect(codes).toContain(code);
    });
  });

  it('validates 100% key parity on all critical namespaces for all 23 languages', () => {
    const missingKeysReport = i18n.validateTranslations();
    expect(missingKeysReport).toEqual({});
    expect(Object.keys(missingKeysReport).length).toBe(0);
  });

  it('ensures every language descriptor has full required enterprise metadata', () => {
    ALL_SCHEDULED_LANGUAGES.forEach((lang) => {
      expect(lang.code).toMatch(/^[a-z]{2,3}-IN$/);
      expect(lang.languageCode).toMatch(/^[a-z]{2,3}$/);
      expect(lang.name).toBeTruthy();
      expect(lang.englishName).toBeTruthy();
      expect(lang.nativeName).toBeTruthy();
      expect(lang.script).toBeTruthy();
      expect(['ltr', 'rtl']).toContain(lang.direction);
      expect(lang.enabled).toBe(true);
      expect(lang.fallback).toBe('en-IN');
      expect(lang.translationVersion).toBe('1.0.0');
    });
  });

  it('verifies RTL direction for Urdu, Sindhi, and Kashmiri', () => {
    expect(isRTL('ur-IN')).toBe(true);
    expect(isRTL('sd-IN')).toBe(true);
    expect(isRTL('ks-IN')).toBe(true);

    expect(isRTL('en-IN')).toBe(false);
    expect(isRTL('hi-IN')).toBe(false);
    expect(isRTL('ta-IN')).toBe(false);
    expect(isRTL('te-IN')).toBe(false);
  });

  it('guarantees deterministic fallback chain without raw dot paths or undefined', async () => {
    await i18n.setLanguage('ta-IN');

    // Known key in Tamil
    const continueTamil = i18n.t('common.continue');
    expect(continueTamil).toBe('தொடரவும்');

    // Missing key should fall back to en-IN / en or humanized label, NEVER raw dot path or undefined
    const fallbackText = i18n.t('hospitals.arbitraryNonexistentKey');
    expect(fallbackText).toBeTruthy();
    expect(fallbackText).not.toBe('undefined');
    expect(fallbackText).not.toBe('null');
    expect(fallbackText).not.toContain('hospitals.arbitraryNonexistentKey');
  });

  it('supports parameterized variable interpolation across languages', () => {
    const interpolated = i18n.t('languageSelection.accessibilityOption', {
      language: 'Tamil',
    });
    expect(interpolated).toBeTruthy();
    expect(interpolated).toContain('Tamil');
    expect(interpolated).not.toContain('{{language}}');
  });
});
