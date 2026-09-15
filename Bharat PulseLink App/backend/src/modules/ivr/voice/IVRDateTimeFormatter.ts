/**
 * Bharat PulseLink — IVR Date & Time Voice Formatter
 *
 * Formats ISO date strings and time strings into localized, accessible spoken voice phrases.
 *
 * Owned by: Voice UX & IVR Subsystem (Step 9)
 */

import { type LanguageCode } from '../ivr.types.js';

export class IVRDateTimeFormatter {
  private static readonly DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  private static readonly DAYS_TA = ['ஞாயிற்றுக்கிழமை', 'திங்கட்கிழமை', 'செவ்வாய்க்கிழமை', 'புதன்கிழமை', 'வியாழக்கிழமை', 'வெள்ளிக்கிழமை', 'சனிக்கிழமை'];
  private static readonly DAYS_HI = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];

  /**
   * Formats ISO date string (YYYY-MM-DD) into natural spoken date.
   */
  public static formatDateForVoice(isoDate: string, language: LanguageCode | null): string {
    const lang = language ?? 'en';
    const parts = isoDate.split('-').map(Number);
    if (parts.length !== 3) return isoDate;

    const [year, month, day] = parts;
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();

    switch (lang) {
      case 'ta':
        return `${IVRDateTimeFormatter.DAYS_TA[dayOfWeek]}`;
      case 'hi':
        return `${IVRDateTimeFormatter.DAYS_HI[dayOfWeek]}`;
      case 'en':
      default:
        return `${IVRDateTimeFormatter.DAYS_EN[dayOfWeek]}`;
    }
  }

  /**
   * Formats time string (e.g. "10:00" or "14:30") into natural spoken voice time.
   */
  public static formatTimeForVoice(timeStr: string, language: LanguageCode | null): string {
    const lang = language ?? 'en';
    const [hourStr, minStr] = timeStr.split(':');
    let hour = parseInt(hourStr, 10);
    const min = parseInt(minStr || '0', 10);

    if (isNaN(hour)) return timeStr;

    const isPM = hour >= 12;
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const minPart = min > 0 ? `:${min < 10 ? '0' + min : min}` : '';

    switch (lang) {
      case 'ta': {
        const period = hour < 12 ? 'காலை' : hour < 16 ? 'மதியம்' : 'மாலை';
        return `${period} ${displayHour}${min > 0 ? `:${min}` : ''} மணி`;
      }
      case 'hi': {
        const period = hour < 12 ? 'सुबह' : hour < 16 ? 'दोपहर' : 'शाम';
        return `${period} ${displayHour}${min > 0 ? `:${min}` : ''} बजे`;
      }
      case 'en':
      default:
        return `${displayHour}${minPart} ${isPM ? 'PM' : 'AM'}`;
    }
  }
}
