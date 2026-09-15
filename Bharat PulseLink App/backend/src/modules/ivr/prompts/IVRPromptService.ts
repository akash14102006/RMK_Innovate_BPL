/**
 * Bharat PulseLink — IVR Prompt Service
 *
 * Resolves logical prompt identifiers based on language and key.
 * Does not perform audio playback directly.
 */

import { type LanguageCode } from '../ivr.types.js';

export class IVRPromptService {
  /**
   * Resolves the relative audio prompt path for Asterisk.
   */
  public getPromptPath(language: LanguageCode | null, promptKey: string): string {
    const lang = language ?? 'en';
    switch (promptKey) {
      case 'welcome':
        return 'bharat-pulselink/welcome';
      case 'language-select':
        return 'bharat-pulselink/language-select';
      case 'main-menu':
        return `bharat-pulselink/${lang}/main-menu`;
      case 'find-hospital':
        return `bharat-pulselink/${lang}/find-hospital`;
      case 'enter-pincode':
        return `bharat-pulselink/${lang}/enter-pincode`;
      case 'pin-invalid':
        return `bharat-pulselink/${lang}/pin-invalid`;
      case 'pin-timeout':
        return `bharat-pulselink/${lang}/pin-timeout`;
      case 'pin-success':
        return `bharat-pulselink/${lang}/pin-success`;
      case 'pin-max-attempts':
        return `bharat-pulselink/${lang}/pin-max-attempts`;
      case 'searching-hospitals':
        return `bharat-pulselink/${lang}/searching-hospitals`;
      case 'hospitals-found':
        return `bharat-pulselink/${lang}/hospitals-found`;
      case 'no-hospitals-found':
        return `bharat-pulselink/${lang}/no-hospitals-found`;
      case 'hospital-search-error':
        return `bharat-pulselink/${lang}/hospital-search-error`;
      case 'hospital-options-menu':
        return `bharat-pulselink/${lang}/hospital-options-menu`;
      case 'hospital-confirm-1':
        return `bharat-pulselink/${lang}/hospital-confirm-1`;
      case 'hospital-confirm-2':
        return `bharat-pulselink/${lang}/hospital-confirm-2`;
      case 'hospital-confirm-3':
        return `bharat-pulselink/${lang}/hospital-confirm-3`;
      case 'hospital-confirmed':
        return `bharat-pulselink/${lang}/hospital-confirmed`;
      case 'hospital-invalid-choice':
        return `bharat-pulselink/${lang}/hospital-invalid-choice`;
      case 'hospital-selection-timeout':
        return `bharat-pulselink/${lang}/hospital-selection-timeout`;
      case 'hospital-max-attempts':
        return `bharat-pulselink/${lang}/hospital-max-attempts`;
      case 'appointment-dates-menu':
        return `bharat-pulselink/${lang}/appointment-dates-menu`;
      case 'appointment-slots-menu':
        return `bharat-pulselink/${lang}/appointment-slots-menu`;
      case 'appointment-confirm-slot':
        return `bharat-pulselink/${lang}/appointment-confirm-slot`;
      case 'appointment-slot-confirmed':
        return `bharat-pulselink/${lang}/appointment-slot-confirmed`;
      case 'booking-confirmed-sms-sent':
        return `bharat-pulselink/${lang}/booking-confirmed-sms-sent`;
      case 'booking-confirmed-sms-queued':
        return `bharat-pulselink/${lang}/booking-confirmed-sms-queued`;
      case 'appointment-no-dates':
        return `bharat-pulselink/${lang}/appointment-no-dates`;
      case 'appointment-no-slots':
        return `bharat-pulselink/${lang}/appointment-no-slots`;
      case 'appointment-invalid-date':
        return `bharat-pulselink/${lang}/appointment-invalid-date`;
      case 'appointment-invalid-slot':
        return `bharat-pulselink/${lang}/appointment-invalid-slot`;
      case 'appointment-timeout':
        return `bharat-pulselink/${lang}/appointment-timeout`;
      case 'appointment-max-attempts':
        return `bharat-pulselink/${lang}/appointment-max-attempts`;
      case 'appointment-provider-error':
        return `bharat-pulselink/${lang}/appointment-provider-error`;
      case 'book-appointment':
        return `bharat-pulselink/${lang}/book-appointment`;
      case 'existing-appointment':
        return `bharat-pulselink/${lang}/existing-appointment`;
      case 'emergency':
        return `bharat-pulselink/${lang}/emergency`;
      case 'invalid':
        return language ? `bharat-pulselink/${lang}/invalid` : 'bharat-pulselink/invalid';
      case 'timeout':
        return language ? `bharat-pulselink/${lang}/timeout` : 'bharat-pulselink/timeout';
      case 'goodbye':
        return language ? `bharat-pulselink/${lang}/goodbye` : 'bharat-pulselink/goodbye';
      default:
        return `bharat-pulselink/${lang}/${promptKey}`;
    }
  }
}
