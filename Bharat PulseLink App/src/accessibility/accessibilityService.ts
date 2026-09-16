/**
 * Bharat PulseLink — World-Class Accessibility Service
 *
 * Encapsulates:
 * 1. Hardware-backed preference persistence via SecureStorageService
 * 2. Android AccessibilityInfo inspection & listeners (TalkBack, Reduce Motion)
 * 3. Safe semantic announcements (AccessibilityInfo.announceForAccessibility)
 * 4. Multi-pattern haptic feedback (Vibration & native haptics)
 * 5. Device-level Text-To-Speech execution with zero cloud PHI transmission
 */

import { AccessibilityInfo, Vibration, Platform } from 'react-native';
import SecureStoreService from '../services/secureStore';
import {
  AccessibilityPreferences,
  AccessibilityProfile,
  FontScale,
} from './types';
import {
  DEFAULT_ACCESSIBILITY_PREFERENCES,
  ACCESSIBILITY_PROFILES,
  CURRENT_PREFERENCES_VERSION,
} from './accessibilityProfiles';

const STORAGE_KEY = 'bharat_accessibility_preferences_v1';

export class AccessibilityService {
  /**
   * Load stored preferences from secure storage with fail-safe fallback to default preferences.
   */
  static async loadPreferences(): Promise<AccessibilityPreferences> {
    try {
      const raw = await SecureStoreService.get(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
            ...DEFAULT_ACCESSIBILITY_PREFERENCES,
            ...parsed,
            preferencesVersion: CURRENT_PREFERENCES_VERSION,
          };
        }
      }
    } catch (err) {
      console.warn('[ACCESSIBILITY_SERVICE] Failed to load stored preferences; using safe defaults', err);
    }
    return { ...DEFAULT_ACCESSIBILITY_PREFERENCES };
  }

  /**
   * Persist accessibility preferences to secure storage.
   */
  static async savePreferences(prefs: AccessibilityPreferences): Promise<void> {
    try {
      const toSave: AccessibilityPreferences = {
        ...prefs,
        lastUpdatedISO: new Date().toISOString(),
      };
      await SecureStoreService.set(STORAGE_KEY, JSON.stringify(toSave));
    } catch (err) {
      console.error('[ACCESSIBILITY_SERVICE] Failed to persist preferences', err);
    }
  }

  /**
   * Reset all preferences to clean defaults without touching auth, medical records, or user profile.
   */
  static async resetPreferences(): Promise<AccessibilityPreferences> {
    const defaults = { ...DEFAULT_ACCESSIBILITY_PREFERENCES };
    await this.savePreferences(defaults);
    return defaults;
  }

  /**
   * Query OS level accessibility states (TalkBack / Screen Reader & Reduced Motion).
   */
  static async querySystemAccessibility(): Promise<{
    screenReader: boolean;
    reduceMotion: boolean;
  }> {
    try {
      const [screenReader, reduceMotion] = await Promise.all([
        AccessibilityInfo.isScreenReaderEnabled(),
        AccessibilityInfo.isReduceMotionEnabled(),
      ]);
      return { screenReader, reduceMotion };
    } catch {
      return { screenReader: false, reduceMotion: false };
    }
  }

  /**
   * Announce a message to TalkBack / VoiceOver screen readers.
   * Strips any raw cryptographic tokens, UUIDs, or sensitive auth keys before announcement.
   */
  static announce(message: string): void {
    if (!message || typeof message !== 'string') return;

    // Security Sanitization: never announce raw hashes or tokens
    const sanitized = message
      .replace(/ey[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g, '[Protected Token]')
      .replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, '[ID]');

    try {
      AccessibilityInfo.announceForAccessibility(sanitized);
    } catch (err) {
      console.warn('[ACCESSIBILITY_SERVICE] Screen reader announcement failed', err);
    }
  }

  /**
   * Safe multi-pattern semantic haptic trigger with native expo-haptics and Vibration fallback.
   */
  static triggerHaptic(
    pattern: 'success' | 'warning' | 'error' | 'selection' | 'emergency' = 'selection',
    enabled: boolean = true
  ): void {
    if (!enabled) return;

    try {
      if (
        Platform.OS === 'web' &&
        typeof navigator !== 'undefined' &&
        'vibrate' in navigator &&
        typeof (navigator as any).vibrate === 'function'
      ) {
        (navigator as any).vibrate(pattern === 'emergency' ? [100, 50, 100] : 30);
        return;
      }

      // Try native expo-haptics first
      try {
        const Haptics = require('expo-haptics');
        if (Haptics) {
          switch (pattern) {
            case 'success':
              if (Haptics.notificationAsync && Haptics.NotificationFeedbackType) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                return;
              }
              break;
            case 'warning':
              if (Haptics.notificationAsync && Haptics.NotificationFeedbackType) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                return;
              }
              break;
            case 'error':
            case 'emergency':
              if (Haptics.notificationAsync && Haptics.NotificationFeedbackType) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                return;
              }
              break;
            case 'selection':
            default:
              if (Haptics.selectionAsync) {
                Haptics.selectionAsync();
                return;
              }
              break;
          }
        }
      } catch {}

      // Fallback to React Native Vibration API
      switch (pattern) {
        case 'success':
          Vibration.vibrate([0, 30, 40, 50]);
          break;
        case 'warning':
          Vibration.vibrate([0, 60, 50, 60]);
          break;
        case 'error':
          Vibration.vibrate([0, 80, 50, 80, 50, 80]);
          break;
        case 'emergency':
          Vibration.vibrate([0, 100, 60, 100, 60, 200]);
          break;
        case 'selection':
        default:
          Vibration.vibrate(25);
          break;
      }
    } catch {
      // Haptics not supported on device; fail silently
    }
  }

  /**
   * Device-native Text-To-Speech output with language code matching.
   * Runs strictly on-device without cloud transmission of patient data.
   */
  static async speak(
    text: string,
    rate: number = 1.0,
    languageCode: string = 'en',
    onDone?: () => void
  ): Promise<void> {
    if (!text) return;

    // Sanitize message: never speak raw cryptographic tokens, UUIDs, or passwords
    const sanitized = text
      .replace(/ey[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g, 'protected security token')
      .replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, 'identifier')
      .replace(/\b(pin|password|token|secret)=([^\s]+)/gi, '$1 hidden');

    // Announce to screen reader
    this.announce(sanitized);

    // If on web, use Web Speech API
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(sanitized);
        utterance.rate = rate;
        utterance.lang = languageCode;
        if (onDone) utterance.onend = onDone;
        window.speechSynthesis.speak(utterance);
        return;
      } catch (e) {
        console.warn('[ACCESSIBILITY_TTS] Web SpeechSynthesis error', e);
      }
    }

    // On native, check if expo-speech is available
    try {
      const ExpoSpeech = require('expo-speech');
      if (ExpoSpeech && typeof ExpoSpeech.speak === 'function') {
        ExpoSpeech.stop();
        ExpoSpeech.speak(sanitized, {
          rate,
          pitch: 1.0,
          language: languageCode,
          onDone: onDone || undefined,
          onStopped: onDone || undefined,
          onError: onDone || undefined,
        });
      }
    } catch {
      // expo-speech unavailable; AccessibilityInfo was already dispatched
      if (onDone) onDone();
    }
  }

  /**
   * Stop any active TTS audio playback.
   */
  static async stopSpeaking(): Promise<void> {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    try {
      const ExpoSpeech = require('expo-speech');
      if (ExpoSpeech && typeof ExpoSpeech.stop === 'function') {
        ExpoSpeech.stop();
      }
    } catch {}
  }

  /**
   * Query if speech synthesis is currently speaking.
   */
  static async isSpeaking(): Promise<boolean> {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      return window.speechSynthesis.speaking;
    }

    try {
      const ExpoSpeech = require('expo-speech');
      if (ExpoSpeech && typeof ExpoSpeech.isSpeakingAsync === 'function') {
        return await ExpoSpeech.isSpeakingAsync();
      }
    } catch {}

    return false;
  }
}

export default AccessibilityService;
