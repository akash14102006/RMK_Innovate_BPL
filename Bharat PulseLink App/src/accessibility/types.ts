/**
 * Bharat PulseLink — World-Class Enterprise Accessibility Platform
 * Canonical Types & Preference Schema (Adaptive Care Access)
 *
 * Single Source of Truth for all accessibility preferences, profile presets,
 * font scaling factors, and multi-sensory accommodations.
 */

export type AccessibilityProfile =
  | 'STANDARD'
  | 'LOW_VISION'
  | 'BLIND_SCREEN_READER'
  | 'HEARING_SUPPORT'
  | 'MOTOR_SUPPORT'
  | 'COGNITIVE_SUPPORT'
  | 'READING_SUPPORT'
  | 'COMMUNICATION_SUPPORT'
  | 'SENIOR_FRIENDLY'
  | 'EMERGENCY_ACCESS'
  | 'CUSTOM';

export type FontScale = 1.0 | 1.15 | 1.3 | 1.5 | 1.75 | 2.0;

export type ColorAssistMode = 'NONE' | 'PROTANOPIA' | 'DEUTERANOPIA' | 'TRITANOPIA' | 'HIGH_CONTRAST';

export interface AccessibilityPreferences {
  // Profile Identifier
  profile: AccessibilityProfile;

  // Visual Accommodations
  fontScale: FontScale;
  highContrast: boolean;
  boldText: boolean;
  colorAssistMode: ColorAssistMode;
  underlineLinks: boolean;
  enhancedFocus: boolean;

  // Motion Accommodations
  reducedMotion: boolean;

  // Reading & Auditory Accommodations
  screenReaderHints: boolean;
  readPageEnabled: boolean;
  ttsEnabled: boolean;
  speechInputEnabled: boolean;
  speechRate: number; // 0.8 - 1.5

  // Hearing Accommodations
  visualAlerts: boolean;
  hapticFeedback: boolean;
  captionsEnabled: boolean;

  // Motor & Touch Accommodations
  largeControls: boolean;
  touchSlopEnlarged: boolean;
  gestureAlternatives: boolean;

  // Cognitive & Focus Accommodations
  simplifiedMode: boolean; // Focus Mode: reduces secondary noise
  readingMode: boolean;    // Simplified typography & paragraph spacing

  // Specialized Navigation & Emergency
  accessibleRouteMode: boolean; // Filters routes for wheelchair/ground-floor
  emergencyAccessibilityMode: boolean; // Instant large high-contrast emergency card

  // Versioning & Reset Tracker
  preferencesVersion: number;
  lastUpdatedISO: string;
}

import { AccessibilityCapabilities } from './capabilities';
import { VoiceCommandResult } from './voiceCommandParser';

export interface AccessibilityContextType {
  preferences: AccessibilityPreferences;
  activeProfile: AccessibilityProfile;
  fontScale: FontScale;
  isHighContrast: boolean;
  isReducedMotion: boolean;
  isLargeControls: boolean;
  isFocusMode: boolean;
  isEmergencyMode: boolean;
  capabilities: AccessibilityCapabilities;
  isSpeaking: boolean;
  updatePreference: <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => Promise<void>;
  applyProfile: (profile: AccessibilityProfile) => Promise<void>;
  resetAccessibility: () => Promise<void>;
  announce: (message: string) => Promise<void>;
  speak: (text: string, lang?: string) => Promise<void>;
  stopSpeaking: () => Promise<void>;
  readPage: (customText?: string) => Promise<void>;
  executeVoiceCommand: (spokenText: string) => VoiceCommandResult;
  openSystemAccessibilitySettings: () => Promise<boolean>;
  triggerHaptic: (pattern?: 'success' | 'warning' | 'error' | 'selection' | 'emergency') => void;
  isQuickPanelOpen: boolean;
  openQuickPanel: () => void;
  closeQuickPanel: () => void;
}

