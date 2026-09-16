/**
 * Bharat PulseLink — Central Accessibility Provider & Hook
 *
 * Adaptive Care Access:
 * One accessibility profile controls the entire application.
 * All screens consume the same single source of truth.
 * Full Device Capability Truth Model & Multi-Sensory Accommodations.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { AccessibilityInfo } from 'react-native';
import {
  AccessibilityPreferences,
  AccessibilityProfile,
  AccessibilityContextType,
  FontScale,
} from './types';
import {
  DEFAULT_ACCESSIBILITY_PREFERENCES,
  ACCESSIBILITY_PROFILES,
} from './accessibilityProfiles';
import AccessibilityService from './accessibilityService';
import CapabilityDetector, { AccessibilityCapabilities } from './capabilities';
import VoiceCommandParser, { VoiceCommandResult } from './voiceCommandParser';
import { triggerAccessibilityAlert } from './accessibilityAlertEvents';

const defaultCapabilities: AccessibilityCapabilities = {
  talkBackDetected: false,
  talkBackStatus: 'DEVICE_DEPENDENT',
  speechInputStatus: 'SUPPORTED',
  ttsStatus: 'SUPPORTED',
  hapticsStatus: 'SUPPORTED',
  storageStatus: 'SUPPORTED',
  highContrastSupported: true,
  largeControlsSupported: true,
  reducedMotionSupported: true,
};

const defaultContextValue: AccessibilityContextType = {
  preferences: DEFAULT_ACCESSIBILITY_PREFERENCES,
  activeProfile: 'STANDARD',
  fontScale: 1.0,
  isHighContrast: false,
  isReducedMotion: false,
  isLargeControls: false,
  isFocusMode: false,
  isEmergencyMode: false,
  capabilities: defaultCapabilities,
  isSpeaking: false,
  updatePreference: async () => {},
  applyProfile: async () => {},
  resetAccessibility: async () => {},
  announce: async () => {},
  speak: async () => {},
  stopSpeaking: async () => {},
  readPage: async () => {},
  executeVoiceCommand: () => ({
    rawText: '',
    normalizedText: '',
    intent: 'UNKNOWN',
    confidence: 0,
    label: '',
    requiresConfirmation: false,
  }),
  openSystemAccessibilitySettings: async () => false,
  triggerHaptic: () => {},
  isQuickPanelOpen: false,
  openQuickPanel: () => {},
  closeQuickPanel: () => {},
};

export const AccessibilityContext = createContext<AccessibilityContextType>(defaultContextValue);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(
    DEFAULT_ACCESSIBILITY_PREFERENCES
  );
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isQuickPanelOpen, setIsQuickPanelOpen] = useState<boolean>(false);
  const [capabilities, setCapabilities] = useState<AccessibilityCapabilities>(defaultCapabilities);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Initialize preferences, capabilities, and system listeners
  useEffect(() => {
    let isMounted = true;

    async function init() {
      const [stored, detectedCaps] = await Promise.all([
        AccessibilityService.loadPreferences(),
        CapabilityDetector.detectCapabilities(),
      ]);

      if (isMounted) {
        setPreferences(stored);
        setCapabilities(detectedCaps);
        setIsReady(true);
      }
    }

    init();

    // Listen to device accessibility changes
    const motionSub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled: boolean) => {
        if (isMounted) {
          setCapabilities((prev) => ({
            ...prev,
            reducedMotionSupported: true,
          }));
        }
      }
    );

    const readerSub = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (enabled: boolean) => {
        if (isMounted) {
          setCapabilities((prev) => ({
            ...prev,
            talkBackDetected: enabled,
            talkBackStatus: enabled ? 'SUPPORTED' : 'DEVICE_DEPENDENT',
          }));
        }
      }
    );

    return () => {
      isMounted = false;
      if (motionSub && typeof motionSub.remove === 'function') motionSub.remove();
      if (readerSub && typeof readerSub.remove === 'function') readerSub.remove();
    };
  }, []);

  // Update a single preference
  const updatePreference = useCallback(
    async <K extends keyof AccessibilityPreferences>(
      key: K,
      value: AccessibilityPreferences[K]
    ) => {
      setPreferences((prev) => {
        const next: AccessibilityPreferences = {
          ...prev,
          [key]: value,
          profile: key === 'profile' ? (value as AccessibilityProfile) : 'CUSTOM',
          lastUpdatedISO: new Date().toISOString(),
        };

        // Asynchronously persist
        AccessibilityService.savePreferences(next);

        // Multi-sensory feedback
        AccessibilityService.triggerHaptic('selection', next.hapticFeedback);

        return next;
      });
    },
    []
  );

  // Apply an entire profile preset
  const applyProfile = useCallback(async (profile: AccessibilityProfile) => {
    const profileDef = ACCESSIBILITY_PROFILES[profile];
    if (!profileDef) return;

    setPreferences((prev) => {
      const next: AccessibilityPreferences = {
        ...prev,
        ...profileDef.presets,
        profile,
        lastUpdatedISO: new Date().toISOString(),
      };

      AccessibilityService.savePreferences(next);

      // Multi-sensory confirmation
      AccessibilityService.triggerHaptic('success', next.hapticFeedback);
      AccessibilityService.announce(`${profileDef.name} accessibility profile activated`);

      // Visual alert if visualAlerts enabled
      if (next.visualAlerts) {
        triggerAccessibilityAlert({
          type: 'SUCCESS',
          title: `${profileDef.name} Profile`,
          message: 'Accessibility accommodations applied across all healthcare screens.',
        });
      }

      return next;
    });
  }, []);

  // Reset to default
  const resetAccessibility = useCallback(async () => {
    const defaults = await AccessibilityService.resetPreferences();
    setPreferences(defaults);
    AccessibilityService.triggerHaptic('warning', true);
    AccessibilityService.announce('Accessibility settings have been reset to default.');
    triggerAccessibilityAlert({
      type: 'WARNING',
      title: 'Accessibility Reset',
      message: 'All accessibility settings restored to clinical defaults.',
    });
  }, []);

  // Semantic announcement
  const announce = useCallback(async (message: string) => {
    AccessibilityService.announce(message);
  }, []);

  // On-device text-to-speech
  const speak = useCallback(
    async (text: string, lang: string = 'en') => {
      setIsSpeaking(true);
      await AccessibilityService.speak(text, preferences.speechRate, lang, () => {
        setIsSpeaking(false);
      });
    },
    [preferences.speechRate]
  );

  const stopSpeaking = useCallback(async () => {
    await AccessibilityService.stopSpeaking();
    setIsSpeaking(false);
  }, []);

  // Read semantic active page
  const readPage = useCallback(
    async (customText?: string) => {
      const textToRead =
        customText ||
        'Bharat PulseLink Healthcare Platform. Universal Accessibility active. Quick controls ready for hospitals, emergency triage, and digital health records.';

      if (isSpeaking) {
        await stopSpeaking();
      } else {
        await speak(textToRead);
      }
    },
    [isSpeaking, speak, stopSpeaking]
  );

  // Voice Command Execution
  const executeVoiceCommand = useCallback(
    (spokenText: string): VoiceCommandResult => {
      const parsed = VoiceCommandParser.parse(spokenText);

      // Execute harmless accommodation actions immediately
      if (!parsed.requiresConfirmation && parsed.intent !== 'UNKNOWN') {
        switch (parsed.intent) {
          case 'INCREASE_TEXT_SIZE': {
            const fontScales: FontScale[] = [1.0, 1.15, 1.3, 1.5, 1.75, 2.0];
            const currentIndex = fontScales.indexOf(preferences.fontScale);
            const nextIndex = Math.min(currentIndex + 1, fontScales.length - 1);
            updatePreference('fontScale', fontScales[nextIndex]);
            break;
          }
          case 'DECREASE_TEXT_SIZE': {
            const fontScales: FontScale[] = [1.0, 1.15, 1.3, 1.5, 1.75, 2.0];
            const currentIndex = fontScales.indexOf(preferences.fontScale);
            const nextIndex = Math.max(currentIndex - 1, 0);
            updatePreference('fontScale', fontScales[nextIndex]);
            break;
          }
          case 'ENABLE_REDUCED_MOTION':
            updatePreference('reducedMotion', true);
            break;
          case 'DISABLE_REDUCED_MOTION':
            updatePreference('reducedMotion', false);
            break;
          case 'ENABLE_LARGE_CONTROLS':
            updatePreference('largeControls', true);
            break;
          case 'DISABLE_LARGE_CONTROLS':
            updatePreference('largeControls', false);
            break;
          case 'READ_PAGE':
            readPage();
            break;
          case 'SHOW_ACCESSIBLE_HOSPITALS':
            updatePreference('accessibleRouteMode', true);
            break;
        }

        AccessibilityService.triggerHaptic('success', preferences.hapticFeedback);
        announce(`Voice command executed: ${parsed.label}`);
      }

      return parsed;
    },
    [preferences.fontScale, preferences.hapticFeedback, updatePreference, readPage, announce]
  );

  const openSystemAccessibilitySettings = useCallback(async () => {
    return await CapabilityDetector.openSystemAccessibilitySettings();
  }, []);

  const triggerHaptic = useCallback(
    (pattern: 'success' | 'warning' | 'error' | 'selection' | 'emergency' = 'selection') => {
      AccessibilityService.triggerHaptic(pattern, preferences.hapticFeedback);
    },
    [preferences.hapticFeedback]
  );

  const openQuickPanel = useCallback(() => {
    setIsQuickPanelOpen(true);
    triggerHaptic('selection');
    AccessibilityService.announce('Accessibility quick panel opened');
  }, [triggerHaptic]);

  const closeQuickPanel = useCallback(() => {
    setIsQuickPanelOpen(false);
    triggerHaptic('selection');
  }, [triggerHaptic]);

  // Derived states
  const isReducedMotion = preferences.reducedMotion;

  const value = useMemo<AccessibilityContextType>(
    () => ({
      preferences,
      activeProfile: preferences.profile,
      fontScale: preferences.fontScale,
      isHighContrast: preferences.highContrast,
      isReducedMotion,
      isLargeControls: preferences.largeControls,
      isFocusMode: preferences.simplifiedMode,
      isEmergencyMode: preferences.emergencyAccessibilityMode,
      capabilities,
      isSpeaking,
      updatePreference,
      applyProfile,
      resetAccessibility,
      announce,
      speak,
      stopSpeaking,
      readPage,
      executeVoiceCommand,
      openSystemAccessibilitySettings,
      triggerHaptic,
      isQuickPanelOpen,
      openQuickPanel,
      closeQuickPanel,
    }),
    [
      preferences,
      isReducedMotion,
      capabilities,
      isSpeaking,
      updatePreference,
      applyProfile,
      resetAccessibility,
      announce,
      speak,
      stopSpeaking,
      readPage,
      executeVoiceCommand,
      openSystemAccessibilitySettings,
      triggerHaptic,
      isQuickPanelOpen,
      openQuickPanel,
      closeQuickPanel,
    ]
  );

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export function useAccessibility(): AccessibilityContextType {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

export default AccessibilityProvider;
