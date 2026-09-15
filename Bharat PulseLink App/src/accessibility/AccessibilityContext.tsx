/**
 * Bharat PulseLink — Central Accessibility Provider & Hook
 *
 * Adaptive Care Access:
 * One accessibility profile controls the entire application.
 * All screens consume the same single source of truth.
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

const defaultContextValue: AccessibilityContextType = {
  preferences: DEFAULT_ACCESSIBILITY_PREFERENCES,
  activeProfile: 'STANDARD',
  fontScale: 1.0,
  isHighContrast: false,
  isReducedMotion: false,
  isLargeControls: false,
  isFocusMode: false,
  isEmergencyMode: false,
  updatePreference: async () => {},
  applyProfile: async () => {},
  resetAccessibility: async () => {},
  announce: async () => {},
  speak: async () => {},
  stopSpeaking: async () => {},
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
  const [systemReduceMotion, setSystemReduceMotion] = useState<boolean>(false);
  const [systemScreenReader, setSystemScreenReader] = useState<boolean>(false);

  // Initialize preferences and system listeners
  useEffect(() => {
    let isMounted = true;

    async function init() {
      const stored = await AccessibilityService.loadPreferences();
      const system = await AccessibilityService.querySystemAccessibility();

      if (isMounted) {
        setPreferences(stored);
        setSystemReduceMotion(system.reduceMotion);
        setSystemScreenReader(system.screenReader);
        setIsReady(true);
      }
    }

    init();

    // Listen to device accessibility changes
    const motionSub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled: boolean) => {
        if (isMounted) setSystemReduceMotion(enabled);
      }
    );

    const readerSub = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (enabled: boolean) => {
        if (isMounted) setSystemScreenReader(enabled);
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

        // Feedback
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

      return next;
    });
  }, []);

  // Reset to default
  const resetAccessibility = useCallback(async () => {
    const defaults = await AccessibilityService.resetPreferences();
    setPreferences(defaults);
    AccessibilityService.triggerHaptic('warning', true);
    AccessibilityService.announce('Accessibility settings have been reset to default.');
  }, []);

  // Semantic announcement
  const announce = useCallback(async (message: string) => {
    AccessibilityService.announce(message);
  }, []);

  // On-device text-to-speech
  const speak = useCallback(
    async (text: string) => {
      if (preferences.ttsEnabled || preferences.readPageEnabled) {
        await AccessibilityService.speak(text, preferences.speechRate);
      } else {
        AccessibilityService.announce(text);
      }
    },
    [preferences.ttsEnabled, preferences.readPageEnabled, preferences.speechRate]
  );

  const stopSpeaking = useCallback(async () => {
    await AccessibilityService.stopSpeaking();
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
  const isReducedMotion = preferences.reducedMotion || systemReduceMotion;
  const isScreenReaderActive = preferences.screenReaderHints || systemScreenReader;

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
      updatePreference,
      applyProfile,
      resetAccessibility,
      announce,
      speak,
      stopSpeaking,
      triggerHaptic,
      isQuickPanelOpen,
      openQuickPanel,
      closeQuickPanel,
    }),
    [
      preferences,
      isReducedMotion,
      updatePreference,
      applyProfile,
      resetAccessibility,
      announce,
      speak,
      stopSpeaking,
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
