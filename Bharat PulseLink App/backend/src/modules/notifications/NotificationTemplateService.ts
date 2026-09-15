/**
 * Bharat PulseLink — Notification Template Service
 *
 * Renders multilingual, injection-safe transactional SMS confirmation messages.
 *
 * Owned by: Notifications Domain (Step 11)
 */

import { type LanguageCode } from '../ivr/ivr.types.js';
import { AppError, ErrorCode } from '../../core/errors/AppError.js';

export interface AppointmentConfirmationTemplateParams {
  language: LanguageCode | null;
  hospitalName: string;
  date: string;
  time: string;
  bookingReference: string;
}

export interface RenderedNotificationTemplate {
  text: string;
  templateKey: string;
  templateVersion: string;
  language: LanguageCode;
}

export class NotificationTemplateService {
  public static readonly TEMPLATE_KEY = 'sms.appointment-confirmed';
  public static readonly TEMPLATE_VERSION = '1.0.0';

  private static readonly DISALLOWED_KEYWORDS = [
    'prescription',
    'diagnosis',
    'medical report',
    'blood test',
    'lab result',
    'discount',
    'special offer',
    'cashback',
    'lottery',
    'win money',
    'promotional',
    'buy now',
  ];

  /**
   * Sanitizes string parameters to prevent SMS template header/body injection.
   */
  public static sanitizeParameter(value?: string | null, maxLength = 100): string {
    if (!value || typeof value !== 'string') return '';
    const cleaned = value.replace(/[\r\n\t\x00-\x1F\x7F]/g, ' ').replace(/\s+/g, ' ').trim();
    return cleaned.slice(0, maxLength);
  }

  /**
   * Validates that dynamic inputs contain no marketing or clinical data.
   */
  public static validateContentSafety(text: string): void {
    const lower = text.toLowerCase();
    for (const keyword of NotificationTemplateService.DISALLOWED_KEYWORDS) {
      if (lower.includes(keyword)) {
        throw new AppError({
          code: ErrorCode.VALIDATION_ERROR,
          message: `Disallowed content or clinical/promotional data detected: "${keyword}"`,
        });
      }
    }
  }

  /**
   * Renders localized SMS text for confirmed appointment booking.
   */
  public renderAppointmentConfirmation(params: AppointmentConfirmationTemplateParams): string {
    const rendered = this.renderWithMetadata(params);
    return rendered.text;
  }

  /**
   * Renders localized template with full traceability metadata.
   */
  public renderWithMetadata(params: AppointmentConfirmationTemplateParams): RenderedNotificationTemplate {
    const lang: LanguageCode = params.language === 'ta' || params.language === 'hi' ? params.language : 'en';
    const hospital = NotificationTemplateService.sanitizeParameter(params.hospitalName, 100);
    const date = NotificationTemplateService.sanitizeParameter(params.date, 50);
    const time = NotificationTemplateService.sanitizeParameter(params.time, 30);
    const ref = NotificationTemplateService.sanitizeParameter(params.bookingReference, 30);

    if (!hospital) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Missing hospital name in notification template parameters',
      });
    }

    if (!ref) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Missing booking reference in notification template parameters',
      });
    }

    // Enforce privacy & anti-marketing policy on dynamic inputs
    NotificationTemplateService.validateContentSafety(`${hospital} ${ref} ${date} ${time}`);

    let text: string;
    switch (lang) {
      case 'ta':
        text = `பாரத் பல்ஸ்லிங்க்: ${hospital} மருத்துவமனையில் உங்கள் முன்பதிவு உறுதி செய்யப்பட்டது. தேதி: ${date}, நேரம்: ${time}. முன்பதிவு எண்: ${ref}.`;
        break;
      case 'hi':
        text = `भारत पल्सलिंक: ${hospital} में आपका अपॉइंटमेंट पुष्ट हो गया है। तारीख: ${date}, समय: ${time}। संदर्भ: ${ref}।`;
        break;
      case 'en':
      default:
        text = `Bharat PulseLink: Your appointment is confirmed at ${hospital}. Date: ${date}, Time: ${time}. Booking Ref: ${ref}.`;
        break;
    }

    return {
      text,
      templateKey: `${NotificationTemplateService.TEMPLATE_KEY}.${lang}`,
      templateVersion: NotificationTemplateService.TEMPLATE_VERSION,
      language: lang,
    };
  }
}

