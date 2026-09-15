/**
 * Bharat PulseLink — IVR Distance Formatter
 *
 * Formats distance in meters into human-friendly spoken voice strings for English, Tamil, and Hindi.
 * Prevents excessive floating-point precision in voice UX.
 *
 * Owned by: Voice UX & IVR Subsystem (Step 8)
 */

import { type LanguageCode } from '../ivr.types.js';

export class IVRDistanceFormatter {
  /**
   * Formats distance in meters into a localized spoken voice phrase.
   * - < 1000m: rounded to nearest 50 meters (e.g. "850 meters")
   * - >= 1000m: rounded to 1 decimal place (e.g. "2.1 kilometers")
   */
  public static formatForVoice(distanceMeters: number, language: LanguageCode | null): string {
    const lang = language ?? 'en';
    const safeMeters = Math.max(0, Math.round(distanceMeters));

    if (safeMeters < 1000) {
      const roundedMeters = Math.max(50, Math.round(safeMeters / 50) * 50);
      switch (lang) {
        case 'ta':
          return `சுமார் ${roundedMeters} மீட்டர்கள்`;
        case 'hi':
          return `लगभग ${roundedMeters} मीटर`;
        case 'en':
        default:
          return `approximately ${roundedMeters} meters`;
      }
    }

    const km = (safeMeters / 1000).toFixed(1);
    const cleanKm = km.endsWith('.0') ? km.slice(0, -2) : km;

    switch (lang) {
      case 'ta':
        return `சுமார் ${cleanKm} கிலோமீட்டர்`;
      case 'hi':
        return `लगभग ${cleanKm} किलोमीटर`;
      case 'en':
      default:
        return `approximately ${cleanKm} ${cleanKm === '1' ? 'kilometer' : 'kilometers'}`;
    }
  }
}
