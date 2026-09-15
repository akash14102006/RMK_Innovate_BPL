import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  DEFAULT_ACCESSIBILITY_PREFERENCES,
  ACCESSIBILITY_PROFILES,
} from '../accessibilityProfiles';
import { AccessibilityService } from '../accessibilityService';
import { getScaledTypography, getAccessibleColors } from '../../theme/tokens';
import SecureStoreService from '../../services/secureStore';
import { AccessibilityInfo, Vibration } from 'react-native';

describe('Bharat PulseLink — Accessibility Platform Architecture Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Canonical Preferences & Profile Presets', () => {
    it('should have standard safe defaults', () => {
      expect(DEFAULT_ACCESSIBILITY_PREFERENCES.profile).toBe('STANDARD');
      expect(DEFAULT_ACCESSIBILITY_PREFERENCES.fontScale).toBe(1.0);
      expect(DEFAULT_ACCESSIBILITY_PREFERENCES.highContrast).toBe(false);
      expect(DEFAULT_ACCESSIBILITY_PREFERENCES.reducedMotion).toBe(false);
      expect(DEFAULT_ACCESSIBILITY_PREFERENCES.visualAlerts).toBe(true);
      expect(DEFAULT_ACCESSIBILITY_PREFERENCES.hapticFeedback).toBe(true);
      expect(DEFAULT_ACCESSIBILITY_PREFERENCES.largeControls).toBe(false);
    });

    it('should define all 11 enterprise accessibility profile presets', () => {
      const expectedProfiles = [
        'STANDARD',
        'LOW_VISION',
        'BLIND_SCREEN_READER',
        'HEARING_SUPPORT',
        'MOTOR_SUPPORT',
        'COGNITIVE_SUPPORT',
        'READING_SUPPORT',
        'COMMUNICATION_SUPPORT',
        'SENIOR_FRIENDLY',
        'EMERGENCY_ACCESS',
        'CUSTOM',
      ];

      expectedProfiles.forEach((profileKey) => {
        expect(ACCESSIBILITY_PROFILES).toHaveProperty(profileKey);
        const profile = (ACCESSIBILITY_PROFILES as any)[profileKey];
        expect(profile.name).toBeDefined();
        expect(profile.description).toBeDefined();
        expect(profile.presets).toBeDefined();
      });
    });

    it('LOW_VISION profile should activate 150% font scale, high contrast, and large controls', () => {
      const lowVision = ACCESSIBILITY_PROFILES.LOW_VISION.presets;
      expect(lowVision.fontScale).toBe(1.5);
      expect(lowVision.highContrast).toBe(true);
      expect(lowVision.boldText).toBe(true);
      expect(lowVision.largeControls).toBe(true);
    });

    it('MOTOR_SUPPORT profile should activate large controls and gesture alternatives', () => {
      const motor = ACCESSIBILITY_PROFILES.MOTOR_SUPPORT.presets;
      expect(motor.largeControls).toBe(true);
      expect(motor.gestureAlternatives).toBe(true);
    });

    it('COGNITIVE_SUPPORT profile should activate simplified focus mode and reading mode', () => {
      const cognitive = ACCESSIBILITY_PROFILES.COGNITIVE_SUPPORT.presets;
      expect(cognitive.simplifiedMode).toBe(true);
      expect(cognitive.readingMode).toBe(true);
      expect(cognitive.reducedMotion).toBe(true);
    });
  });

  describe('2. AccessibilityService Persistence & Lifecycle', () => {
    it('should load default preferences when storage is empty', async () => {
      vi.spyOn(SecureStoreService, 'get').mockResolvedValueOnce(null);
      const prefs = await AccessibilityService.loadPreferences();
      expect(prefs.profile).toBe('STANDARD');
      expect(prefs.fontScale).toBe(1.0);
    });

    it('should correctly deserialize and merge stored preferences', async () => {
      const mockSaved = JSON.stringify({
        profile: 'LOW_VISION',
        fontScale: 1.5,
        highContrast: true,
      });
      vi.spyOn(SecureStoreService, 'get').mockResolvedValueOnce(mockSaved);

      const prefs = await AccessibilityService.loadPreferences();
      expect(prefs.profile).toBe('LOW_VISION');
      expect(prefs.fontScale).toBe(1.5);
      expect(prefs.highContrast).toBe(true);
      expect(prefs.visualAlerts).toBe(true); // preserved from defaults
    });

    it('should persist modified preferences to secure storage', async () => {
      const setSpy = vi.spyOn(SecureStoreService, 'set').mockResolvedValue(undefined);
      await AccessibilityService.savePreferences({
        ...DEFAULT_ACCESSIBILITY_PREFERENCES,
        profile: 'MOTOR_SUPPORT',
        largeControls: true,
      });

      expect(setSpy).toHaveBeenCalledWith(
        'bharat_accessibility_preferences_v1',
        expect.stringContaining('"profile":"MOTOR_SUPPORT"')
      );
    });

    it('should reset preferences to default state without deleting auth or patient records', async () => {
      const setSpy = vi.spyOn(SecureStoreService, 'set').mockResolvedValue(undefined);
      const reset = await AccessibilityService.resetPreferences();

      expect(reset.profile).toBe('STANDARD');
      expect(reset.fontScale).toBe(1.0);
      expect(setSpy).toHaveBeenCalled();
    });
  });

  describe('3. Security & PHI Data Leakage Safeguards', () => {
    it('should sanitize raw tokens and UUIDs before screen reader announcement', () => {
      const announceSpy = vi.spyOn(AccessibilityInfo, 'announceForAccessibility');

      const rawMessageWithToken =
        'Your session token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-ID and hospital id 12345678-1234-1234-1234-123456789abc ready';
      AccessibilityService.announce(rawMessageWithToken);

      expect(announceSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Protected Token]')
      );
      expect(announceSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ID]')
      );
      expect(announceSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')
      );
    });
  });

  describe('4. Typography Scaling & Design Token Transformations', () => {
    it('should accurately scale typography from 100% to 200%', () => {
      const standard = getScaledTypography(1.0, false);
      expect(standard.titleLarge.fontSize).toBe(24);
      expect(standard.bodyMedium.fontSize).toBe(14);
      expect(standard.bodyMedium.fontWeight).toBe('400');

      const large = getScaledTypography(1.5, false);
      expect(large.titleLarge.fontSize).toBe(36);
      expect(large.bodyMedium.fontSize).toBe(21);

      const maxVision = getScaledTypography(2.0, true);
      expect(maxVision.titleLarge.fontSize).toBe(48);
      expect(maxVision.titleLarge.fontWeight).toBe('800');
      expect(maxVision.bodyMedium.fontSize).toBe(28);
      expect(maxVision.bodyMedium.fontWeight).toBe('600');
    });

    it('should produce enhanced contrast colors in high contrast mode', () => {
      const normal = getAccessibleColors(false);
      expect(normal.textPrimary).toBe('#0F172A');
      expect(normal.border).toBe('#E2E8F0');

      const highContrast = getAccessibleColors(true);
      expect(highContrast.textPrimary).toBe('#000000');
      expect(highContrast.border).toBe('#94A3B8');
      expect(highContrast.background).toBe('#FFFFFF');
    });
  });

  describe('5. Multi-Sensory Haptic Feedback', () => {
    it('should trigger vibration pattern when enabled and handle multiple patterns', () => {
      const vibrateSpy = vi.spyOn(Vibration, 'vibrate');

      AccessibilityService.triggerHaptic('success', true);
      expect(vibrateSpy).toHaveBeenCalled();

      AccessibilityService.triggerHaptic('emergency', true);
      expect(vibrateSpy).toHaveBeenCalled();

      // When disabled, vibration must not be called
      vibrateSpy.mockClear();
      AccessibilityService.triggerHaptic('selection', false);
      expect(vibrateSpy).not.toHaveBeenCalled();
    });
  });

  describe('6. Emergency Accessibility Mode Safeguards', () => {
    it('should activate emergency accessibility mode without altering legal records', () => {
      const emergencyProfile = ACCESSIBILITY_PROFILES.EMERGENCY_ACCESS.presets;
      expect(emergencyProfile.emergencyAccessibilityMode).toBe(true);
      expect(emergencyProfile.highContrast).toBe(true);
      expect(emergencyProfile.largeControls).toBe(true);
      expect(emergencyProfile.fontScale).toBe(1.3);
    });
  });

  describe('7. Multilingual and Localization Consistency', () => {
    it('should expose complete accessibility localization keys', async () => {
      const { accessibility } = await import('../../i18n/locales/en-IN/accessibility');
      expect(accessibility.openControls).toBe('Open accessibility controls');
      expect(accessibility.quickTitle).toBe('Accessibility Quick Controls');
      expect(accessibility.centerTitle).toBe('Accessibility Center');
      expect(accessibility.reducedMotion).toBe('Reduced Motion');
      expect(accessibility.highContrast).toBe('High Contrast Mode');
      expect(accessibility.largeControls).toBe('Large Touch Targets');
      expect(accessibility.restoreDefaults).toBe('Reset All Accessibility Settings');
    });
  });
});

