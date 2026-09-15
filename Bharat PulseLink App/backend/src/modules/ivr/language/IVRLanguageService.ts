/**
 * Bharat PulseLink — IVR Language Service
 *
 * Language validation, normalization, and DTMF digit mapping.
 */

import { type LanguageCode } from '../ivr.types.js';

export class IVRLanguageService {
  private static readonly SUPPORTED_LANGUAGES: Set<LanguageCode> = new Set(['ta', 'en', 'hi']);

  private static readonly DTMF_LANGUAGE_MAP: Record<string, LanguageCode> = {
    '1': 'ta',
    '2': 'en',
    '3': 'hi',
  };

  /**
   * Resolves language from DTMF digit.
   */
  public resolveLanguageFromDtmf(digit: string): LanguageCode | null {
    const trimmed = digit.trim();
    return IVRLanguageService.DTMF_LANGUAGE_MAP[trimmed] ?? null;
  }

  /**
   * Validates if a language code is supported.
   */
  public isSupported(code: string): code is LanguageCode {
    return IVRLanguageService.SUPPORTED_LANGUAGES.has(code as LanguageCode);
  }

  /**
   * Returns list of supported language codes.
   */
  public getSupportedLanguages(): LanguageCode[] {
    return Array.from(IVRLanguageService.SUPPORTED_LANGUAGES);
  }
}
