/**
 * Bharat PulseLink — Canonical Accessibility Profile Presets
 *
 * Real profile presets for diverse accessibility needs.
 * Profiles are user-selected preference presets; users can freely customize after applying.
 */

import { AccessibilityPreferences, AccessibilityProfile } from './types';

export const CURRENT_PREFERENCES_VERSION = 1;

export const DEFAULT_ACCESSIBILITY_PREFERENCES: AccessibilityPreferences = {
  profile: 'STANDARD',
  fontScale: 1.0,
  highContrast: false,
  boldText: false,
  colorAssistMode: 'NONE',
  underlineLinks: false,
  enhancedFocus: false,
  reducedMotion: false,
  screenReaderHints: true,
  readPageEnabled: false,
  ttsEnabled: false,
  speechInputEnabled: false,
  speechRate: 1.0,
  visualAlerts: true,
  hapticFeedback: true,
  captionsEnabled: false,
  largeControls: false,
  touchSlopEnlarged: false,
  gestureAlternatives: false,
  simplifiedMode: false,
  readingMode: false,
  accessibleRouteMode: false,
  emergencyAccessibilityMode: false,
  preferencesVersion: CURRENT_PREFERENCES_VERSION,
  lastUpdatedISO: new Date().toISOString(),
};

export const ACCESSIBILITY_PROFILES: Record<
  AccessibilityProfile,
  {
    name: string;
    description: string;
    icon: string;
    presets: Partial<AccessibilityPreferences>;
  }
> = {
  STANDARD: {
    name: 'Standard Care',
    description: 'Default healthcare experience with balanced typography and standard motion.',
    icon: 'smile',
    presets: {
      ...DEFAULT_ACCESSIBILITY_PREFERENCES,
      profile: 'STANDARD',
    },
  },
  LOW_VISION: {
    name: 'Low Vision',
    description: 'Enlarged text (150%), strong high-contrast borders, bold typography, and large controls.',
    icon: 'eye',
    presets: {
      fontScale: 1.5,
      highContrast: true,
      boldText: true,
      largeControls: true,
      underlineLinks: true,
      enhancedFocus: true,
      touchSlopEnlarged: true,
      profile: 'LOW_VISION',
    },
  },
  BLIND_SCREEN_READER: {
    name: 'Screen Reader & TalkBack',
    description: 'Full TalkBack semantics, high-priority accessibility hints, and audio announcements.',
    icon: 'volume-2',
    presets: {
      screenReaderHints: true,
      readPageEnabled: true,
      ttsEnabled: true,
      reducedMotion: true,
      largeControls: true,
      enhancedFocus: true,
      profile: 'BLIND_SCREEN_READER',
    },
  },
  HEARING_SUPPORT: {
    name: 'Hearing Support',
    description: 'Multi-sensory visual banners, clear text alerts, and distinct haptic confirmation patterns.',
    icon: 'bell',
    presets: {
      visualAlerts: true,
      hapticFeedback: true,
      captionsEnabled: true,
      profile: 'HEARING_SUPPORT',
    },
  },
  MOTOR_SUPPORT: {
    name: 'Motor & Dexterity Support',
    description: 'Generous 52px touch targets, tap alternatives for swipe gestures, and no double taps.',
    icon: 'hand',
    presets: {
      largeControls: true,
      touchSlopEnlarged: true,
      gestureAlternatives: true,
      reducedMotion: true,
      profile: 'MOTOR_SUPPORT',
    },
  },
  COGNITIVE_SUPPORT: {
    name: 'Cognitive Focus Mode',
    description: 'Reduced information density, highlighted primary actions, and simplified wording.',
    icon: 'zap',
    presets: {
      simplifiedMode: true,
      readingMode: true,
      reducedMotion: true,
      fontScale: 1.15,
      profile: 'COGNITIVE_SUPPORT',
    },
  },
  READING_SUPPORT: {
    name: 'Reading Support',
    description: 'High typographic contrast, 130% font scale, generous line height, and clean sans-serif layouts.',
    icon: 'book-open',
    presets: {
      fontScale: 1.3,
      boldText: true,
      readingMode: true,
      underlineLinks: true,
      profile: 'READING_SUPPORT',
    },
  },
  COMMUNICATION_SUPPORT: {
    name: 'Communication Support',
    description: 'Text-to-speech audio playback and voice navigation assistance.',
    icon: 'message-circle',
    presets: {
      ttsEnabled: true,
      readPageEnabled: true,
      visualAlerts: true,
      profile: 'COMMUNICATION_SUPPORT',
    },
  },
  SENIOR_FRIENDLY: {
    name: 'Senior Friendly',
    description: 'Large text (130%), high contrast, large buttons, gentle haptics, and simplified screens.',
    icon: 'heart',
    presets: {
      fontScale: 1.3,
      highContrast: true,
      largeControls: true,
      boldText: true,
      simplifiedMode: true,
      hapticFeedback: true,
      profile: 'SENIOR_FRIENDLY',
    },
  },
  EMERGENCY_ACCESS: {
    name: 'Emergency Accessibility',
    description: 'High-visibility rapid actions for location, emergency contacts, critical allergies, and nearest hospital.',
    icon: 'shield-alert',
    presets: {
      emergencyAccessibilityMode: true,
      highContrast: true,
      largeControls: true,
      fontScale: 1.3,
      visualAlerts: true,
      profile: 'EMERGENCY_ACCESS',
    },
  },
  CUSTOM: {
    name: 'Custom Preferences',
    description: 'Personalized configuration tailored to specific accessibility accommodations.',
    icon: 'sliders',
    presets: {
      profile: 'CUSTOM',
    },
  },
};
