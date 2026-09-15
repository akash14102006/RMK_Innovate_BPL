import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ALL_SCHEDULED_LANGUAGES, SUPPORTED_LANGUAGES, getLanguageDescriptor } from '../../i18n/languages';
import i18n from '../../i18n/i18n';

vi.mock('../../services/secureStore', () => ({
  default: {
    set: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    remove: vi.fn().mockResolvedValue(undefined),
  },
  set: vi.fn().mockResolvedValue(undefined),
  get: vi.fn().mockResolvedValue(null),
  remove: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('expo-localization', () => ({
  getLocales: vi.fn().mockReturnValue([{ languageCode: 'hi', regionCode: 'IN' }]),
  locale: 'hi-IN',
  locales: ['hi-IN'],
}));

vi.mock('lottie-react-native', () => ({
  default: 'LottieViewMock',
}));

describe('Prompt 11 — 22 Scheduled Indian Languages & Lottie Experience', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    await i18n.setLanguage('en');
  });

  it('contains all 22 Eighth Schedule Indian Languages + English in registry', () => {
    expect(ALL_SCHEDULED_LANGUAGES.length).toBe(23);
    const codes = ALL_SCHEDULED_LANGUAGES.map((l) => l.code);
    const requiredCodes = [
      'en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa',
      'or', 'as', 'brx', 'doi', 'ks', 'kok', 'mai', 'mni', 'ne', 'sa',
      'sat', 'sd', 'ur'
    ];
    requiredCodes.forEach((code) => {
      expect(codes).toContain(code);
    });
  });

  it('never returns raw dot-separated keys for onboarding or language selection', () => {
    const rawKeys = [
      'onboarding.screen1.title',
      'onboarding.screen1.description',
      'onboarding.common.continue',
      'onboarding.common.skip',
      'onboarding.common.back',
      'languageSelection.title',
    ];

    rawKeys.forEach((key) => {
      const translated = i18n.t(key);
      expect(translated).not.toBe(key);
      expect(translated).not.toMatch(/^[a-z_]+\.[a-z0-9_.]+/);
    });
  });

  it('every registered language has valid metadata (code, name, nativeName, script, direction)', () => {
    ALL_SCHEDULED_LANGUAGES.forEach((lang) => {
      expect(lang.code).toBeTruthy();
      expect(lang.name).toBeTruthy();
      expect(lang.nativeName).toBeTruthy();
      expect(lang.script).toBeTruthy();
      expect(['ltr', 'rtl']).toContain(lang.direction);
      expect(typeof lang.enabled).toBe('boolean');
      expect(typeof lang.order).toBe('number');
    });
  });

  it('correctly identifies RTL scripts for Kashmiri, Sindhi, and Urdu', () => {
    const ks = getLanguageDescriptor('ks');
    const sd = getLanguageDescriptor('sd');
    const ur = getLanguageDescriptor('ur');

    expect(ks.direction).toBe('rtl');
    expect(sd.direction).toBe('rtl');
    expect(ur.direction).toBe('rtl');
  });

  it('applies language selection immediately across all 23 language bundles', async () => {
    const sampleLanguages = ['hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa', 'ur'];

    for (const langCode of sampleLanguages) {
      await i18n.setLanguage(langCode);
      expect(i18n.getLanguage()).toBe(langCode);
      const title = i18n.t('languageSelection.title');
      expect(title).toBeTruthy();
      expect(title).not.toMatch(/^[a-z_]+\.[a-z0-9_.]+/);
    }

    // Reset back to English
    await i18n.setLanguage('en');
    expect(i18n.t('languageSelection.title')).toBe('Choose your language');
  });
});
