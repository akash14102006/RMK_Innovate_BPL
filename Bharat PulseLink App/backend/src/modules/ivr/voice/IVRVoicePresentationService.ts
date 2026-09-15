/**
 * Bharat PulseLink — IVR Voice Presentation Service
 *
 * Prepares safe, sanitized hospital presentation DTOs and prompt sequences for voice channels.
 *
 * Owned by: Voice UX & IVR Subsystem (Step 8)
 */

import { type IVRNearbyHospitalSummary, type LanguageCode } from '../ivr.types.js';
import { IVRDistanceFormatter } from './IVRDistanceFormatter.js';

export interface VoiceHospitalOption {
  index: number;
  hospitalId: string;
  spokenName: string;
  spokenDistance: string;
  promptText: string;
}

export interface VoiceHospitalPresentation {
  totalFound: number;
  options: VoiceHospitalOption[];
  headerText: string;
  menuPromptKey: string;
}

export class IVRVoicePresentationService {
  public static readonly MAX_VOICE_RESULTS = 5;

  /**
   * Sanitizes external hospital name for voice safety (strips control chars, shell metachars, bounds length).
   */
  public static sanitizeHospitalName(rawName?: string | null): string {
    if (!rawName || typeof rawName !== 'string') {
      return 'Hospital Facility';
    }

    // Strip non-printable and shell injection characters
    const clean = rawName
      .replace(/[\x00-\x1F\x7F`$<>|;&]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (clean.length === 0) {
      return 'Hospital Facility';
    }

    // Bound max spoken length to 60 characters for voice UX conciseness
    return clean.length > 60 ? clean.substring(0, 57) + '...' : clean;
  }

  /**
   * Builds voice presentation options from ranked nearby hospitals.
   */
  public buildPresentation(
    hospitals: IVRNearbyHospitalSummary[],
    language: LanguageCode | null,
    maxResults: number = IVRVoicePresentationService.MAX_VOICE_RESULTS,
  ): VoiceHospitalPresentation {
    const lang = language ?? 'en';
    const topHospitals = hospitals.slice(0, maxResults);
    const options: VoiceHospitalOption[] = [];

    for (let i = 0; i < topHospitals.length; i++) {
      const h = topHospitals[i];
      const index = i + 1;
      const spokenName = IVRVoicePresentationService.sanitizeHospitalName(h.displayName ?? h.name);
      const spokenDistance = IVRDistanceFormatter.formatForVoice(h.distanceMeters, lang);

      let promptText = '';
      switch (lang) {
        case 'ta':
          promptText = `${spokenName}க்கு ${index}ஐ அழுத்தவும், ${spokenDistance} தொலைவு.`;
          break;
        case 'hi':
          promptText = `${spokenName} के लिए ${index} दबाएं, ${spokenDistance} दूर।`;
          break;
        case 'en':
        default:
          promptText = `Press ${index} for ${spokenName}, ${spokenDistance} away.`;
          break;
      }

      options.push({
        index,
        hospitalId: h.id,
        spokenName,
        spokenDistance,
        promptText,
      });
    }

    let headerText = '';
    switch (lang) {
      case 'ta':
        headerText = `${topHospitals.length} மருத்துவமனைகள் கண்டறியப்பட்டன.`;
        break;
      case 'hi':
        headerText = `${topHospitals.length} नजदीकी अस्पताल मिले हैं।`;
        break;
      case 'en':
      default:
        headerText = `We found ${topHospitals.length} nearby hospitals.`;
        break;
    }

    return {
      totalFound: topHospitals.length,
      options,
      headerText,
      menuPromptKey: 'hospital-options-menu',
    };
  }
}
