/**
 * Bharat PulseLink — Enterprise I18N Engine
 *
 * Production-grade internationalization and deterministic localization engine:
 * 1. 4-step locale resolution priority:
 *    Explicit User Selection -> Persisted Preference -> Device Locale -> en-IN fallback
 * 2. Deterministic Fallback Chain:
 *    selected locale (e.g. 'ta-IN') -> regional fallback -> base language ('ta') -> 'en-IN' -> 'en' -> Humanized key label
 *    Never renders 'undefined', 'missing.key', 'null', or raw dot paths.
 * 3. Parameterized variable interpolation with safe regex escaping.
 * 4. Pluralization support (_one / _other) following ICU standards.
 * 5. Secure preference storage with version and explicit selection metadata.
 * 6. Audit & missing translation detection.
 */

import {
  ALL_SCHEDULED_LANGUAGES,
  SUPPORTED_LANGUAGES,
  LanguageDescriptor,
  getLanguageDescriptor,
  normalizeLocaleCode,
  isRTL as isLanguageRTL,
} from './languages';
import { languageResources } from './locales/allLanguages';
import secureStore from '../services/secureStore';

export type SupportedLanguage = string;

const LANGUAGE_STORAGE_KEY = 'user_language_preference';

let getLocalesFn: () => Array<{ languageCode: string | null; regionCode?: string | null }> = () => [];
try {
  const Localization = require('expo-localization');
  if (Localization && typeof Localization.getLocales === 'function') {
    getLocalesFn = () => Localization.getLocales();
  }
} catch (_e) {
  console.log('[I18N] ExpoLocalization native module unavailable, using fallback');
}

export const REQUIRED_I18N_KEYS: string[] = [
  'common.appName',
  'common.continue',
  'common.back',
  'common.skip',
  'common.getStarted',
  'navigation.home',
  'navigation.hospitals',
  'navigation.scan',
  'navigation.records',
  'navigation.profile',
  'onboarding.common.continue',
  'onboarding.common.back',
  'onboarding.common.skip',
  'onboarding.common.getStarted',
  'onboarding.screen1.eyebrow',
  'onboarding.screen1.title',
  'onboarding.screen1.description',
  'onboarding.screen1.accessibilityHero',
  'onboarding.screen2.eyebrow',
  'onboarding.screen2.title',
  'onboarding.screen2.description',
  'onboarding.screen2.accessibilityHero',
  'onboarding.screen3.eyebrow',
  'onboarding.screen3.title',
  'onboarding.screen3.description',
  'onboarding.screen3.accessibilityHero',
  'onboarding.screen4.eyebrow',
  'onboarding.screen4.title',
  'onboarding.screen4.description',
  'onboarding.screen4.accessibilityHero',
  'languageSelection.eyebrow',
  'languageSelection.title',
  'languageSelection.subtitle',
  'languageSelection.continue',
  'languageSelection.accessibilityHero',
  'languageSelection.accessibilityOption',
  'languageSelection.accessibilityOptionSelected',
  'auth.login',
  'errors.generic',
  'errors.authRequired',
  'errors.sessionExpired',
  'errors.qrSessionExpired',
  'errors.hospitalNotFound',
  'errors.networkUnavailable',
  'emergency.sosTitle',
  'emergency.ambulanceHelpline',
  'hospitals.headerTitle',
  'hospitals.searchPlaceholder',
  'hospitals.viewDetails',
  'hospitals.bookAppointment',
];

export class I18nEngine {
  private currentLanguage: string = 'en-IN';
  private initialized: boolean = false;
  private listeners: Set<(lang: string) => void> = new Set();
  private locales: Record<string, any> = languageResources || {};

  constructor() {
    if (!this.locales || Object.keys(this.locales).length === 0) {
      this.locales = languageResources || {};
    }
    this.init();
  }

  /**
   * Deterministic 4-step locale resolution:
   * 1. Explicit user selection / persisted preference in secureStore
   * 2. Device / OS locale via expo-localization
   * 3. en-IN fallback
   */
  public async init(): Promise<string> {
    if (this.initialized) return this.currentLanguage;

    try {
      const stored = await secureStore.get(LANGUAGE_STORAGE_KEY);
      if (stored) {
        let candidate = stored;
        try {
          const parsed = JSON.parse(stored);
          if (parsed && (parsed.localeCode || parsed.code)) {
            candidate = parsed.localeCode || parsed.code;
          }
        } catch {
          candidate = stored;
        }

        if (this.isSupported(candidate)) {
          this.currentLanguage = normalizeLocaleCode(candidate);
          this.initialized = true;
          return this.currentLanguage;
        }
      }

      // 2. Device / System locale
      const deviceLocales = getLocalesFn();
      if (deviceLocales && deviceLocales.length > 0 && deviceLocales[0] && deviceLocales[0].languageCode) {
        const devLang = deviceLocales[0].languageCode.toLowerCase();
        const devRegion = deviceLocales[0].regionCode ? deviceLocales[0].regionCode.toUpperCase() : 'IN';
        const candidateTag = `${devLang}-${devRegion}`;

        if (this.isSupported(candidateTag)) {
          this.currentLanguage = normalizeLocaleCode(candidateTag);
          this.initialized = true;
          return this.currentLanguage;
        } else if (this.isSupported(devLang)) {
          this.currentLanguage = normalizeLocaleCode(devLang);
          this.initialized = true;
          return this.currentLanguage;
        }
      }
    } catch (_err) {
      this.currentLanguage = 'en-IN';
    } finally {
      this.initialized = true;
    }

    return this.currentLanguage;
  }

  public getLanguage(): string {
    return this.currentLanguage;
  }

  public getDescriptor(code?: string): LanguageDescriptor {
    return getLanguageDescriptor(code || this.currentLanguage);
  }

  public async setLanguage(code: string): Promise<void> {
    if (!this.isSupported(code)) return;
    this.currentLanguage = code;
    const desc = getLanguageDescriptor(code);

    try {
      const payload = JSON.stringify({
        localeCode: desc.code,
        languageCode: desc.languageCode,
        localeVersion: desc.translationVersion || '1.0.0',
        userExplicitlySelected: true,
        updatedAt: new Date().toISOString(),
      });
      await secureStore.set(LANGUAGE_STORAGE_KEY, payload);
    } catch (_err) {
      // Storage failure ignored safely
    }

    this.notifyListeners();
  }

  public isSupported(code: string): boolean {
    if (!code || typeof code !== 'string') return false;
    const clean = code.trim().toLowerCase();
    return ALL_SCHEDULED_LANGUAGES.some(
      (l) =>
        l.code.toLowerCase() === clean ||
        l.languageCode.toLowerCase() === clean ||
        l.id.toLowerCase() === clean ||
        l.code.toLowerCase().startsWith(clean)
    );
  }

  public isRTL(code?: string): boolean {
    const targetCode = code || this.currentLanguage;
    return isLanguageRTL(targetCode);
  }

  public subscribe(listener: (lang: string) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.currentLanguage));
  }

  /**
   * Helper to traverse object by dot path
   */
  private getNestedValue(obj: any, keys: string[]): any {
    if (!obj || typeof obj !== 'object') return undefined;
    let current = obj;
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    return current;
  }

  /**
   * Translates a semantic key path with deterministic fallback:
   * selected locale -> base language -> en-IN -> en -> humanized key.
   * Supports ICU-style pluralization (_one / _other) and parameters.
   */
  public t(path: string, params?: Record<string, string | number>): string {
    if (!path || typeof path !== 'string') return '';

    const dictionary = this.locales || languageResources || {};
    const desc = getLanguageDescriptor(this.currentLanguage);
    const keys = path.split('.');

    // Pluralization check if count is provided
    let pluralKeys = [...keys];
    if (params && typeof params.count === 'number') {
      const lastKey = keys[keys.length - 1];
      const pluralSuffix = params.count === 1 ? '_one' : '_other';
      pluralKeys[pluralKeys.length - 1] = `${lastKey}${pluralSuffix}`;
    }

    // 1. Try selected locale (e.g. 'ta-IN')
    let value = this.getNestedValue(dictionary[this.currentLanguage], pluralKeys);
    if (typeof value !== 'string') {
      value = this.getNestedValue(dictionary[this.currentLanguage], keys);
    }

    // 2. Try base language code (e.g. 'ta')
    if (typeof value !== 'string' && desc.languageCode !== this.currentLanguage) {
      value = this.getNestedValue(dictionary[desc.languageCode], pluralKeys);
      if (typeof value !== 'string') {
        value = this.getNestedValue(dictionary[desc.languageCode], keys);
      }
    }

    // 3. Fallback to en-IN
    if (typeof value !== 'string') {
      value = this.getNestedValue(dictionary['en-IN'], pluralKeys);
      if (typeof value !== 'string') {
        value = this.getNestedValue(dictionary['en-IN'], keys);
      }
    }

    // 4. Fallback to en
    if (typeof value !== 'string') {
      value = this.getNestedValue(dictionary['en'], pluralKeys);
      if (typeof value !== 'string') {
        value = this.getNestedValue(dictionary['en'], keys);
      }
    }

    // 5. Final safety: Clean readable humanized label, never raw dot path or undefined
    if (typeof value !== 'string') {
      const lastKey = keys[keys.length - 1] || path;
      value = lastKey
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
    }

    // Parameter interpolation with regex escaping
    if (params && typeof params === 'object' && !Array.isArray(params)) {
      Object.keys(params).forEach((paramKey) => {
        if (paramKey && params[paramKey] !== undefined && params[paramKey] !== null) {
          const escaped = paramKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          value = value.replace(new RegExp(`{{${escaped}}}`, 'g'), String(params[paramKey]));
        }
      });
    }

    return value;
  }

  /**
   * Validates missing translation keys across all 23 supported locales.
   * Compares each against the canonical REQUIRED_I18N_KEYS.
   */
  public validateTranslations(): Record<string, string[]> {
    const missingKeysReport: Record<string, string[]> = {};

    ALL_SCHEDULED_LANGUAGES.forEach((lang) => {
      const code = lang.code;
      const missingForCode: string[] = [];
      const dict = this.locales[code] || this.locales[lang.languageCode];

      if (!dict) {
        missingForCode.push('ENTIRE_DICTIONARY_MISSING');
      } else {
        REQUIRED_I18N_KEYS.forEach((keyPath) => {
          const keys = keyPath.split('.');
          const val = this.getNestedValue(dict, keys);
          if (typeof val !== 'string' || val.trim() === '') {
            missingForCode.push(keyPath);
          }
        });
      }

      if (missingForCode.length > 0) {
        missingKeysReport[code] = missingForCode;
      }
    });

    return missingKeysReport;
  }
}

export const i18n = new I18nEngine();
export default i18n;
