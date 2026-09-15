import { describe, it, expect, beforeEach, vi } from 'vitest';
import i18n from '../i18n';
import { ALL_SCHEDULED_LANGUAGES } from '../languages';

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
  getLocales: vi.fn().mockReturnValue([{ languageCode: 'en', regionCode: 'US' }]),
  locale: 'en-US',
  locales: ['en-US'],
}));

describe('i18n Localization Engine', () => {
  beforeEach(async () => {
    await i18n.setLanguage('en');
  });

  it('resolves top-level and nested English keys', () => {
    expect(i18n.t('common.appName')).toBe('Bharat PulseLink');
    expect(i18n.t('auth.login')).toBe('Log In');
  });

  it('validates that ALL 23 locales have 100% complete translation dictionaries', () => {
    const missingKeysReport = i18n.validateTranslations();
    expect(missingKeysReport).toEqual({});
    expect(Object.keys(missingKeysReport).length).toBe(0);
  });

  it('verifies that all 23 scheduled languages are supported and configured', () => {
    expect(ALL_SCHEDULED_LANGUAGES.length).toBe(23);
    ALL_SCHEDULED_LANGUAGES.forEach((lang) => {
      expect(i18n.isSupported(lang.code)).toBe(true);
    });
  });

  it('correctly reports RTL direction for Urdu, Sindhi, and Kashmiri', () => {
    expect(i18n.isRTL('ur')).toBe(true);
    expect(i18n.isRTL('sd')).toBe(true);
    expect(i18n.isRTL('ks')).toBe(true);

    expect(i18n.isRTL('en')).toBe(false);
    expect(i18n.isRTL('hi')).toBe(false);
    expect(i18n.isRTL('ta')).toBe(false);
    expect(i18n.isRTL('te')).toBe(false);
  });

  it('handles real-time language switching to Hindi', async () => {
    await i18n.setLanguage('hi');
    expect(i18n.getLanguage()).toBe('hi');
    expect(i18n.t('languageSelection.title')).toBe('अपनी भाषा चुनें');
    expect(i18n.t('common.continue')).toBe('आगे बढ़ें');
  });

  it('handles real-time language switching to Tamil', async () => {
    await i18n.setLanguage('ta');
    expect(i18n.getLanguage()).toBe('ta');
    expect(i18n.t('languageSelection.title')).toBe('உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்');
    expect(i18n.t('common.continue')).toBe('தொடரவும்');
  });

  it('handles real-time language switching to Telugu', async () => {
    await i18n.setLanguage('te');
    expect(i18n.getLanguage()).toBe('te');
    expect(i18n.t('languageSelection.title')).toBe('మీ భాషను ఎంచుకోండి');
    expect(i18n.t('common.continue')).toBe('కొనసాగించండి');
  });

  it('handles real-time language switching to Bengali', async () => {
    await i18n.setLanguage('bn');
    expect(i18n.getLanguage()).toBe('bn');
    expect(i18n.t('languageSelection.title')).toBe('আপনার ভাষা নির্বাচন করুন');
    expect(i18n.t('common.continue')).toBe('এগিয়ে যান');
  });

  it('handles real-time language switching to Malayalam', async () => {
    await i18n.setLanguage('ml');
    expect(i18n.getLanguage()).toBe('ml');
    expect(i18n.t('languageSelection.title')).toBe('നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക');
    expect(i18n.t('common.continue')).toBe('തുടരുക');
  });

  it('handles real-time language switching to Punjabi', async () => {
    await i18n.setLanguage('pa');
    expect(i18n.getLanguage()).toBe('pa');
    expect(i18n.t('languageSelection.title')).toBe('ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ');
    expect(i18n.t('common.continue')).toBe('ਅੱਗੇ ਵਧੋ');
  });

  it('handles real-time language switching to Sindhi (RTL)', async () => {
    await i18n.setLanguage('sd');
    expect(i18n.getLanguage()).toBe('sd');
    expect(i18n.t('languageSelection.title')).toBe('پنهنجي ٻولي چونڊيو');
    expect(i18n.t('languageSelection.subtitle')).toBe('پنهنجي صحت جي سفر لاءِ پنهنجي پسنديده ٻولي چونڊيو');
    expect(i18n.t('common.continue')).toBe('اڳتي وڌو');
    expect(i18n.isRTL()).toBe(true);
  });

  it('handles real-time language switching to Urdu (RTL)', async () => {
    await i18n.setLanguage('ur');
    expect(i18n.getLanguage()).toBe('ur');
    expect(i18n.t('languageSelection.title')).toBe('اپنی زبان منتخب کریں');
    expect(i18n.t('common.continue')).toBe('آگے بڑھیں');
    expect(i18n.isRTL()).toBe(true);
  });

  it('returns clean readable fallback for missing keys without raw dot paths', () => {
    expect(i18n.t('nonexistent.path.key')).toBe('Key');
    expect(i18n.t('nonexistent.path.key')).not.toBe('nonexistent.path.key');
  });
});
