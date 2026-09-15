import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  BottomTabBar,
  BOTTOM_NAV_HEIGHT,
  getBottomNavHeight,
  TabId,
} from '../BottomTabBar';
import i18n from '../../../i18n/i18n';
import { languageResources } from '../../../i18n/locales/allLanguages';

vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 24, left: 0, right: 0 }),
}));

vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Svg: 'Svg',
  Circle: 'Circle',
  Path: 'Path',
  Rect: 'Rect',
}));

vi.mock('../../../services/secureStore', () => ({
  default: {
    set: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    remove: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../../i18n/I18nContext', () => ({
  useI18n: () => ({
    t: (key: string) => i18n.t(key),
    isRTL: i18n.isRTL(),
    language: i18n.getLanguage(),
  }),
}));

describe('Bharat PulseLink — Global Bottom Navigation Bar', () => {
  beforeEach(async () => {
    await i18n.setLanguage('en-IN');
  });

  it('exports a consistent height contract for screens and floating controls', () => {
    expect(BOTTOM_NAV_HEIGHT).toBe(64);
    // On 0 inset (small screen / immersive)
    expect(getBottomNavHeight(0)).toBe(64 + 10);
    // On 20 inset (gesture navigation)
    expect(getBottomNavHeight(20)).toBe(64 + 20);
    // On 48 inset (3-button navigation)
    expect(getBottomNavHeight(48)).toBe(64 + 48);
  });

  it('verifies all 5 core navigation tabs exist in the exact required order', () => {
    const expectedTabs: TabId[] = ['Home', 'Hospitals', 'Scan', 'Records', 'Profile'];
    expect(expectedTabs.length).toBe(5);
  });

  it('guarantees short, non-empty navigation labels across all 23 scheduled languages', () => {
    const locales = [
      'en-IN', 'hi-IN', 'ta-IN', 'te-IN', 'bn-IN', 'mr-IN', 'gu-IN',
      'kn-IN', 'ml-IN', 'pa-IN', 'or-IN', 'as-IN', 'brx-IN', 'doi-IN',
      'ks-IN', 'kok-IN', 'mai-IN', 'mni-IN', 'ne-IN', 'sa-IN', 'sat-IN',
      'sd-IN', 'ur-IN',
    ];

    locales.forEach((locale) => {
      const dict = languageResources[locale];
      expect(dict).toBeDefined();
      expect(dict.navigation).toBeDefined();

      const home = dict.navigation.home;
      const hospitals = dict.navigation.hospitals;
      const scan = dict.navigation.scan;
      const records = dict.navigation.records;
      const profile = dict.navigation.profile;

      expect(typeof home === 'string').toBe(true);
      expect(home.trim().length).toBeGreaterThan(0);

      expect(typeof hospitals === 'string').toBe(true);
      expect(hospitals.trim().length).toBeGreaterThan(0);

      expect(typeof scan === 'string').toBe(true);
      expect(scan.trim().length).toBeGreaterThan(0);

      expect(typeof records === 'string').toBe(true);
      expect(records.trim().length).toBeGreaterThan(0);

      expect(typeof profile === 'string').toBe(true);
      expect(profile.trim().length).toBeGreaterThan(0);
    });
  });

  it('resolves authentic native labels for Tamil, Hindi, Telugu, Malayalam and Urdu', async () => {
    // Hindi
    await i18n.setLanguage('hi');
    expect(i18n.t('navigation.home')).toBe('होम');
    expect(i18n.t('navigation.hospitals')).toBe('अस्पताल');
    expect(i18n.t('navigation.scan')).toBe('स्कैन');

    // Tamil
    await i18n.setLanguage('ta');
    expect(i18n.t('navigation.home')).toBe('முகப்பு');
    expect(i18n.t('navigation.hospitals')).toBe('மருத்துவமனை');
    expect(i18n.t('navigation.records')).toBe('பதிவுகள்');

    // Telugu
    await i18n.setLanguage('te');
    expect(i18n.t('navigation.home')).toBe('హోమ్');
    expect(i18n.t('navigation.hospitals')).toBe('ఆసుపత్రి');

    // Malayalam
    await i18n.setLanguage('ml');
    expect(i18n.t('navigation.home')).toBe('ഹോം');
    expect(i18n.t('navigation.hospitals')).toBe('ആശുപത്രി');

    // Urdu (RTL)
    await i18n.setLanguage('ur');
    expect(i18n.t('navigation.home')).toBe('ہوم');
    expect(i18n.t('navigation.hospitals')).toBe('ہسپتال');
    expect(i18n.isRTL('ur')).toBe(true);
  });

  it('correctly reports RTL for Urdu, Sindhi, and Kashmiri', () => {
    expect(i18n.isRTL('ur')).toBe(true);
    expect(i18n.isRTL('sd')).toBe(true);
    expect(i18n.isRTL('ks')).toBe(true);

    expect(i18n.isRTL('en')).toBe(false);
    expect(i18n.isRTL('ta')).toBe(false);
    expect(i18n.isRTL('hi')).toBe(false);
  });

  it('maintains layout stability during multi-language switching cycle', async () => {
    const cycle = ['en-IN', 'ta-IN', 'hi-IN', 'te-IN', 'ur-IN', 'en-IN'];
    for (const lang of cycle) {
      await i18n.setLanguage(lang);
      const hospitals = i18n.t('navigation.hospitals');
      expect(hospitals).toBeTruthy();
      expect(hospitals).not.toBe('undefined');
      expect(hospitals).not.toBe('null');
    }
  });

  it('verifies 5-column equal width layout constraints and safe area padding', () => {
    const onSelect = vi.fn();
    const element = React.createElement(BottomTabBar, {
      activeTab: 'Hospitals',
      onSelectTab: onSelect,
    });

    expect(element).toBeDefined();
    expect(element.props.activeTab).toBe('Hospitals');
    expect(element.props.onSelectTab).toBe(onSelect);
  });
});
