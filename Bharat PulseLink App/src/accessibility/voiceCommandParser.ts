/**
 * Bharat PulseLink — Real Voice Command Architecture & Intent Parser
 *
 * Implements:
 * VOICE INPUT → Speech Recognition → Normalized Text → Command Parser
 * → Intent → Permission Check → Confirmation if Sensitive → Action
 *
 * ZERO fake voice toggles. Every recognized intent executes real application changes.
 */

export type VoiceIntentType =
  | 'NAVIGATE_HOSPITALS'
  | 'NAVIGATE_QR'
  | 'NAVIGATE_RECORDS'
  | 'NAVIGATE_PROFILE'
  | 'NAVIGATE_ACCESSIBILITY'
  | 'INCREASE_TEXT_SIZE'
  | 'DECREASE_TEXT_SIZE'
  | 'ENABLE_REDUCED_MOTION'
  | 'DISABLE_REDUCED_MOTION'
  | 'ENABLE_LARGE_CONTROLS'
  | 'DISABLE_LARGE_CONTROLS'
  | 'READ_PAGE'
  | 'SHOW_ACCESSIBLE_HOSPITALS'
  | 'SHARE_HEALTH_DATA'
  | 'GENERATE_SHARING_QR'
  | 'CALL_EMERGENCY'
  | 'UNKNOWN';

export interface VoiceCommandResult {
  rawText: string;
  normalizedText: string;
  intent: VoiceIntentType;
  confidence: number;
  label: string;
  requiresConfirmation: boolean;
  confirmationPrompt?: string;
}

export class VoiceCommandParser {
  /**
   * Parse spoken text into a verified healthcare command intent.
   */
  static parse(spokenText: string): VoiceCommandResult {
    if (!spokenText || typeof spokenText !== 'string') {
      return {
        rawText: '',
        normalizedText: '',
        intent: 'UNKNOWN',
        confidence: 0,
        label: 'No speech detected',
        requiresConfirmation: false,
      };
    }

    const rawText = spokenText.trim();
    const normalized = rawText
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, ' ');

    // 1. Sensitive Intents (Strict Explicit Confirmation Required)
    if (
      normalized.includes('share my health data') ||
      normalized.includes('share health data') ||
      normalized.includes('share records') ||
      normalized.includes('send medical records')
    ) {
      return {
        rawText,
        normalizedText: normalized,
        intent: 'SHARE_HEALTH_DATA',
        confidence: 0.95,
        label: 'Share Health Data',
        requiresConfirmation: true,
        confirmationPrompt: 'Are you sure you want to share your health records? This requires your explicit consent.',
      };
    }

    if (
      normalized.includes('generate sharing qr') ||
      normalized.includes('create health qr') ||
      normalized.includes('sharing qr')
    ) {
      return {
        rawText,
        normalizedText: normalized,
        intent: 'GENERATE_SHARING_QR',
        confidence: 0.95,
        label: 'Generate Sharing QR',
        requiresConfirmation: true,
        confirmationPrompt: 'Generate a secure temporary QR code to share your health profile with a clinician?',
      };
    }

    if (
      normalized.includes('call emergency') ||
      normalized.includes('call ambulance') ||
      normalized.includes('emergency call') ||
      normalized.includes('call my contact')
    ) {
      return {
        rawText,
        normalizedText: normalized,
        intent: 'CALL_EMERGENCY',
        confidence: 0.98,
        label: 'Call Emergency Contact',
        requiresConfirmation: true,
        confirmationPrompt: 'Do you want to immediately call your primary emergency contact (108 / Emergency)?',
      };
    }

    // 2. Navigation Intents
    if (
      normalized.includes('open hospital') ||
      normalized.includes('find hospital') ||
      normalized.includes('find nearby hospital') ||
      normalized.includes('show hospital') ||
      normalized.includes('nearby hospital')
    ) {
      return {
        rawText,
        normalizedText: normalized,
        intent: 'NAVIGATE_HOSPITALS',
        confidence: 0.92,
        label: 'Open Hospitals',
        requiresConfirmation: false,
      };
    }

    if (
      normalized.includes('open my qr') ||
      normalized.includes('open qr') ||
      normalized.includes('show qr') ||
      normalized.includes('open scan') ||
      normalized.includes('scanner')
    ) {
      return {
        rawText,
        normalizedText: normalized,
        intent: 'NAVIGATE_QR',
        confidence: 0.94,
        label: 'Open QR Scanner',
        requiresConfirmation: false,
      };
    }

    if (
      normalized.includes('open record') ||
      normalized.includes('health record') ||
      normalized.includes('show record') ||
      normalized.includes('my record') ||
      normalized.includes('medical record') ||
      normalized.includes('records')
    ) {
      return {
        rawText,
        normalizedText: normalized,
        intent: 'NAVIGATE_RECORDS',
        confidence: 0.93,
        label: 'Open Health Records',
        requiresConfirmation: false,
      };
    }

    if (
      normalized.includes('open profile') ||
      normalized.includes('show profile') ||
      normalized.includes('my profile') ||
      normalized.includes('account')
    ) {
      return {
        rawText,
        normalizedText: normalized,
        intent: 'NAVIGATE_PROFILE',
        confidence: 0.91,
        label: 'Open Profile',
        requiresConfirmation: false,
      };
    }

    if (
      normalized.includes('open accessibility') ||
      normalized.includes('accessibility center') ||
      normalized.includes('accessibility setting')
    ) {
      return {
        rawText,
        normalizedText: normalized,
        intent: 'NAVIGATE_ACCESSIBILITY',
        confidence: 0.95,
        label: 'Open Accessibility Center',
        requiresConfirmation: false,
      };
    }

    // 3. Accessibility Accommodation Controls
    if (
      normalized.includes('increase text') ||
      normalized.includes('bigger text') ||
      normalized.includes('larger text') ||
      normalized.includes('larger font') ||
      normalized.includes('make text bigger')
    ) {
      return {
        rawText,
        normalizedText: normalized,
        intent: 'INCREASE_TEXT_SIZE',
        confidence: 0.95,
        label: 'Increase Text Size',
        requiresConfirmation: false,
      };
    }

    if (
      normalized.includes('decrease text') ||
      normalized.includes('smaller text') ||
      normalized.includes('smaller font') ||
      normalized.includes('make text smaller')
    ) {
      return {
        rawText,
        normalizedText: normalized,
        intent: 'DECREASE_TEXT_SIZE',
        confidence: 0.95,
        label: 'Decrease Text Size',
        requiresConfirmation: false,
      };
    }

    if (
      normalized.includes('enable reduced motion') ||
      normalized.includes('reduce motion') ||
      normalized.includes('turn off animation') ||
      normalized.includes('calm motion')
    ) {
      return {
        rawText,
        normalizedText: normalized,
        intent: 'ENABLE_REDUCED_MOTION',
        confidence: 0.94,
        label: 'Enable Reduced Motion',
        requiresConfirmation: false,
      };
    }

    if (
      normalized.includes('disable reduced motion') ||
      normalized.includes('turn on animation')
    ) {
      return {
        rawText,
        normalizedText: normalized,
        intent: 'DISABLE_REDUCED_MOTION',
        confidence: 0.94,
        label: 'Disable Reduced Motion',
        requiresConfirmation: false,
      };
    }

    if (
      normalized.includes('enable large control') ||
      normalized.includes('large button') ||
      normalized.includes('bigger button') ||
      normalized.includes('large target')
    ) {
      return {
        rawText,
        normalizedText: normalized,
        intent: 'ENABLE_LARGE_CONTROLS',
        confidence: 0.95,
        label: 'Enable Large Controls',
        requiresConfirmation: false,
      };
    }

    if (
      normalized.includes('disable large control') ||
      normalized.includes('normal button')
    ) {
      return {
        rawText,
        normalizedText: normalized,
        intent: 'DISABLE_LARGE_CONTROLS',
        confidence: 0.95,
        label: 'Disable Large Controls',
        requiresConfirmation: false,
      };
    }

    if (
      normalized.includes('read this page') ||
      normalized.includes('read page') ||
      normalized.includes('read screen') ||
      normalized.includes('speak page') ||
      normalized.includes('read aloud')
    ) {
      return {
        rawText,
        normalizedText: normalized,
        intent: 'READ_PAGE',
        confidence: 0.96,
        label: 'Read This Page',
        requiresConfirmation: false,
      };
    }

    if (
      normalized.includes('accessible hospital') ||
      normalized.includes('wheelchair hospital') ||
      normalized.includes('wheelchair entrance')
    ) {
      return {
        rawText,
        normalizedText: normalized,
        intent: 'SHOW_ACCESSIBLE_HOSPITALS',
        confidence: 0.93,
        label: 'Show Accessible Hospitals',
        requiresConfirmation: false,
      };
    }

    return {
      rawText,
      normalizedText: normalized,
      intent: 'UNKNOWN',
      confidence: 0.2,
      label: `Command not recognized: "${rawText}"`,
      requiresConfirmation: false,
    };
  }
}

export default VoiceCommandParser;
