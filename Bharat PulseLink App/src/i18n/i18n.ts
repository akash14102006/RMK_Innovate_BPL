import { ALL_SCHEDULED_LANGUAGES, getLanguageDescriptor } from './languages';
import { languageResources } from './locales/allLanguages';
import secureStore from '../services/secureStore';

export type SupportedLanguage = string;

const LANGUAGE_STORAGE_KEY = 'user_language_preference';

let getLocalesFn: () => Array<{ languageCode: string | null }> = () => [];
try {
  // Safe dynamic require to prevent crash if native module binding is delayed
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
];

export class I18nEngine {
  private currentLanguage: string = 'en';
  private initialized: boolean = false;
  private listeners: Set<(lang: string) => void> = new Set();
  private locales: Record<string, any> = languageResources || {};

  constructor() {
    if (!this.locales || Object.keys(this.locales).length === 0) {
      this.locales = languageResources || {};
    }
    this.init();
  }

  public async init(): Promise<string> {
    if (this.initialized) return this.currentLanguage;

    try {
      const stored = await secureStore.get(LANGUAGE_STORAGE_KEY);
      if (stored && this.isSupported(stored)) {
        this.currentLanguage = stored;
      } else {
        const deviceLocales = getLocalesFn();
        if (deviceLocales && deviceLocales.length > 0 && deviceLocales[0] && deviceLocales[0].languageCode) {
          const devCode = deviceLocales[0].languageCode.toLowerCase();
          if (this.isSupported(devCode)) {
            this.currentLanguage = devCode;
          }
        }
      }
    } catch (_err) {
      this.currentLanguage = 'en';
    } finally {
      this.initialized = true;
    }
    return this.currentLanguage;
  }

  public getLanguage(): string {
    return this.currentLanguage;
  }

  public async setLanguage(code: string): Promise<void> {
    if (!this.isSupported(code)) return;
    this.currentLanguage = code;
    try {
      await secureStore.set(LANGUAGE_STORAGE_KEY, code);
    } catch (_err) {
      // Storage failure ignored safely
    }
    this.notifyListeners();
  }

  public isSupported(code: string): boolean {
    return ALL_SCHEDULED_LANGUAGES.some((l) => l.code === code);
  }

  public isRTL(code?: string): boolean {
    const targetCode = code || this.currentLanguage;
    const desc = getLanguageDescriptor(targetCode);
    return desc.direction === 'rtl';
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
   * Validates missing translation keys across all 23 supported locales.
   * Returns a map of locale code -> missing key array.
   */
  public validateTranslations(): Record<string, string[]> {
    const missingKeysReport: Record<string, string[]> = {};

    ALL_SCHEDULED_LANGUAGES.forEach((lang) => {
      const code = lang.code;
      const missingForCode: string[] = [];
      const dict = this.locales[code];

      if (!dict) {
        missingForCode.push('ENTIRE_DICTIONARY_MISSING');
      } else {
        REQUIRED_I18N_KEYS.forEach((keyPath) => {
          const keys = keyPath.split('.');
          let val: any = dict;
          for (const k of keys) {
            if (val && typeof val === 'object' && k in val) {
              val = val[k];
            } else {
              val = undefined;
              break;
            }
          }
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

  public t(path: string, params?: Record<string, string | number>): string {
    if (!path || typeof path !== 'string') return '';

    const dictionary = this.locales || languageResources || {};
    const keys = path.split('.');
    let value: any = dictionary[this.currentLanguage];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        value = undefined;
        break;
      }
    }

    if (typeof value !== 'string') {
      let fallbackValue: any = dictionary['en'];
      for (const k of keys) {
        if (fallbackValue && typeof fallbackValue === 'object' && k in fallbackValue) {
          fallbackValue = fallbackValue[k];
        } else {
          fallbackValue = undefined;
          break;
        }
      }
      if (typeof fallbackValue === 'string') {
        value = fallbackValue;
      }
    }

    if (typeof value !== 'string') {
      const lastKey = keys[keys.length - 1] || path;
      value = lastKey
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
    }

    if (params && typeof params === 'object' && !Array.isArray(params)) {
      Object.keys(params).forEach((key) => {
        if (key && params[key] !== undefined && params[key] !== null) {
          value = value.replace(new RegExp(`{{${key}}}`, 'g'), String(params[key]));
        }
      });
    }

    return value;
  }
}

export const i18n = new I18nEngine();
export default i18n;
