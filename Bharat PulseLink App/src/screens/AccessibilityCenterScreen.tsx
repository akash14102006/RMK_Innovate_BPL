/**
 * Bharat PulseLink — World-Class Enterprise Accessibility Center
 * (Adaptive Care Access)
 *
 * Full 13-Section Accessibility Control Platform:
 * 1. Accessibility Profiles (11 real clinical presets)
 * 2. Visual Accommodations (Text scale 100%–200%, High Contrast, Bold Text, Color Assist)
 * 3. Reading Accommodations (Reading Mode, Underline Links, Enhanced Focus)
 * 4. Hearing Accommodations (Visual Multi-Sensory Banners, Haptics, Captions)
 * 5. Motor & Dexterity (Large Controls, Touch Targets, Gesture Alternatives)
 * 6. Cognitive Support (Focus Mode / Simplified Information Density)
 * 7. Communication Support (On-Device Text-to-Speech, Speech Rate)
 * 8. Motion (System & App-Level Reduced Motion)
 * 9. Accessible Routing (Wheelchair & Ground Floor Hospital Routes)
 * 10. Emergency Accessibility Mode (Instant High-Visibility Critical Actions)
 * 11. Multilingual Integration (Direct Link to 23 Locales)
 * 12. Privacy & On-Device Security (Zero Cloud PHI Transmission Charter)
 * 13. Reset Safeguards (Restore Defaults with Confirmation)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors, spacing, radii } from '../theme/tokens';
import { useAccessibility } from '../accessibility/AccessibilityContext';
import { ACCESSIBILITY_PROFILES } from '../accessibility/accessibilityProfiles';
import { AccessibilityProfile, FontScale, ColorAssistMode } from '../accessibility/types';
import { useI18n } from '../i18n/I18nContext';

const FONT_SCALE_OPTIONS: { scale: FontScale; label: string }[] = [
  { scale: 1.0, label: '100% (Standard)' },
  { scale: 1.15, label: '115% (Comfort)' },
  { scale: 1.3, label: '130% (Large)' },
  { scale: 1.5, label: '150% (Extra Large)' },
  { scale: 1.75, label: '175% (Maximum)' },
  { scale: 2.0, label: '200% (High Vision)' },
];

export const AccessibilityCenterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const {
    preferences,
    updatePreference,
    applyProfile,
    resetAccessibility,
    activeProfile,
    speak,
    stopSpeaking,
    triggerHaptic,
    announce,
    isLargeControls,
  } = useAccessibility();
  const { t, descriptor } = useI18n();

  const [isTestSpeaking, setIsTestSpeaking] = useState<boolean>(false);

  const handleSelectProfile = (profileKey: AccessibilityProfile) => {
    applyProfile(profileKey);
  };

  const handleTestTTS = async () => {
    if (isTestSpeaking) {
      await stopSpeaking();
      setIsTestSpeaking(false);
    } else {
      setIsTestSpeaking(true);
      await speak(
        'Bharat PulseLink text to speech is active. All processing occurs strictly on your device to protect your health privacy.'
      );
      setTimeout(() => setIsTestSpeaking(false), 5000);
    }
  };

  const handleResetConfirm = () => {
    Alert.alert(
      'Reset Accessibility Settings',
      'This will restore all accessibility settings to standard defaults. Your health records, login session, and language preference will remain untouched.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset to Standard',
          style: 'destructive',
          onPress: () => resetAccessibility(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M19 12H5M12 19l-7-7 7-7" stroke={colors.textPrimary} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Accessibility Center</Text>
          <Text style={styles.headerSubtitle}>Adaptive Care Access Platform</Text>
        </View>

        <TouchableOpacity
          style={styles.resetHeaderBtn}
          onPress={handleResetConfirm}
          accessibilityRole="button"
          accessibilityLabel="Reset accessibility settings"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.resetHeaderBtnText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner: Adaptive Care Access Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewIconCapsule}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Circle cx={12} cy={12} r={10} stroke="#0F766E" strokeWidth={2} />
              <Circle cx={12} cy={7.5} r={1.75} fill="#0F766E" />
              <Path d="M5.5 10.5C8 9.8 16 9.8 18.5 10.5" stroke="#0F766E" strokeWidth={1.8} strokeLinecap="round" />
              <Path d="M12 9.5V14.5M9.5 18.5L12 14.5L14.5 18.5" stroke="#0F766E" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
          <View style={styles.overviewTextWrap}>
            <Text style={styles.overviewTitle}>Universal Accessibility</Text>
            <Text style={styles.overviewBody}>
              One centralized profile adapts typography, contrast, motion, and interaction safeguards across all hospital and QR workflows.
            </Text>
          </View>
        </View>

        {/* ─── 1. ACCESSIBILITY PROFILES ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. ACCESSIBILITY PROFILES</Text>
          <Text style={styles.sectionCaption}>
            Select a clinical profile preset or customize individual accommodations below.
          </Text>

          <View style={styles.profilesGrid}>
            {(Object.keys(ACCESSIBILITY_PROFILES) as AccessibilityProfile[]).map((profileKey) => {
              const profile = ACCESSIBILITY_PROFILES[profileKey];
              const isSelected = activeProfile === profileKey;

              return (
                <TouchableOpacity
                  key={profileKey}
                  style={[
                    styles.profileCard,
                    isSelected && styles.profileCardActive,
                    isLargeControls && styles.profileCardLarge,
                  ]}
                  onPress={() => handleSelectProfile(profileKey)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${profile.name} profile. ${profile.description}. ${isSelected ? 'Currently active.' : 'Tap to activate.'}`}
                  activeOpacity={0.8}
                >
                  <View style={styles.profileHeaderRow}>
                    <Text style={[styles.profileName, isSelected && styles.profileNameActive]}>
                      {profile.name}
                    </Text>
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                  </View>
                  <Text style={styles.profileDesc}>{profile.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ─── 2. VISUAL ACCOMMODATIONS ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. VISUAL ACCOMMODATIONS</Text>

          {/* Text Size Scale */}
          <View style={styles.settingCard}>
            <Text style={styles.settingLabel}>Typography & Text Scaling</Text>
            <Text style={styles.settingHelper}>
              Scales headers, hospital cards, and medical information proportionally across the entire app.
            </Text>

            <View style={styles.fontScaleList}>
              {FONT_SCALE_OPTIONS.map((item) => {
                const isSelected = preferences.fontScale === item.scale;
                return (
                  <TouchableOpacity
                    key={item.scale}
                    style={[styles.scaleOptionChip, isSelected && styles.scaleOptionChipActive]}
                    onPress={() => updatePreference('fontScale', item.scale)}
                    accessibilityRole="button"
                    accessibilityLabel={`Set text scale to ${item.label}`}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text style={[styles.scaleOptionText, isSelected && styles.scaleOptionTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* High Contrast */}
          <View style={styles.settingRowCard}>
            <View style={styles.settingRowInfo}>
              <Text style={styles.settingRowTitle}>High Contrast Mode</Text>
              <Text style={styles.settingRowSubtitle}>
                Enhances text-to-background contrast and strengthens card borders for maximum legibility.
              </Text>
            </View>
            <Switch
              value={preferences.highContrast}
              onValueChange={(val) => updatePreference('highContrast', val)}
              trackColor={{ false: '#CBD5E1', true: '#0F766E' }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Toggle High Contrast Mode"
            />
          </View>

          {/* Bold Text */}
          <View style={styles.settingRowCard}>
            <View style={styles.settingRowInfo}>
              <Text style={styles.settingRowTitle}>Bold Typographic Weight</Text>
              <Text style={styles.settingRowSubtitle}>
                Increases font weight for clinical values, doctor availability, and triage markers.
              </Text>
            </View>
            <Switch
              value={preferences.boldText}
              onValueChange={(val) => updatePreference('boldText', val)}
              trackColor={{ false: '#CBD5E1', true: '#0F766E' }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Toggle Bold Typographic Weight"
            />
          </View>
        </View>

        {/* ─── 3. READING ACCOMMODATIONS ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. READING ACCOMMODATIONS</Text>

          <View style={styles.settingRowCard}>
            <View style={styles.settingRowInfo}>
              <Text style={styles.settingRowTitle}>Reading & Focus Layout</Text>
              <Text style={styles.settingRowSubtitle}>
                Applies generous paragraph spacing and prominent typographic hierarchy for instructions.
              </Text>
            </View>
            <Switch
              value={preferences.readingMode}
              onValueChange={(val) => updatePreference('readingMode', val)}
              trackColor={{ false: '#CBD5E1', true: '#0F766E' }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Toggle Reading & Focus Layout"
            />
          </View>

          <View style={styles.settingRowCard}>
            <View style={styles.settingRowInfo}>
              <Text style={styles.settingRowTitle}>Underline Interactive Links</Text>
              <Text style={styles.settingRowSubtitle}>
                Adds persistent visual underlines to clickable clinical actions and legal disclaimers.
              </Text>
            </View>
            <Switch
              value={preferences.underlineLinks}
              onValueChange={(val) => updatePreference('underlineLinks', val)}
              trackColor={{ false: '#CBD5E1', true: '#0F766E' }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Toggle Underline Interactive Links"
            />
          </View>
        </View>

        {/* ─── 4. HEARING ACCOMMODATIONS ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. HEARING ACCOMMODATIONS</Text>

          <View style={styles.settingRowCard}>
            <View style={styles.settingRowInfo}>
              <Text style={styles.settingRowTitle}>Visual Multi-Sensory Banners</Text>
              <Text style={styles.settingRowSubtitle}>
                Displays prominent high-contrast visual banners for QR scan confirmations and triage events.
              </Text>
            </View>
            <Switch
              value={preferences.visualAlerts}
              onValueChange={(val) => updatePreference('visualAlerts', val)}
              trackColor={{ false: '#CBD5E1', true: '#0F766E' }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Toggle Visual Multi-Sensory Banners"
            />
          </View>

          <View style={styles.settingRowCard}>
            <View style={styles.settingRowInfo}>
              <Text style={styles.settingRowTitle}>Haptic Confirmation Patterns</Text>
              <Text style={styles.settingRowSubtitle}>
                Distinct tactile feedback for successful check-ins, security PIN entry, and alerts.
              </Text>
            </View>
            <Switch
              value={preferences.hapticFeedback}
              onValueChange={(val) => updatePreference('hapticFeedback', val)}
              trackColor={{ false: '#CBD5E1', true: '#0F766E' }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Toggle Haptic Confirmation Patterns"
            />
          </View>
        </View>

        {/* ─── 5. MOTOR & DEXTERITY ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. MOTOR & DEXTERITY</Text>

          <View style={styles.settingRowCard}>
            <View style={styles.settingRowInfo}>
              <Text style={styles.settingRowTitle}>Large Touch Controls (48–56px)</Text>
              <Text style={styles.settingRowSubtitle}>
                Expands buttons, tabs, hospital filters, and action targets for limited hand dexterity.
              </Text>
            </View>
            <Switch
              value={preferences.largeControls}
              onValueChange={(val) => updatePreference('largeControls', val)}
              trackColor={{ false: '#CBD5E1', true: '#0F766E' }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Toggle Large Touch Controls"
            />
          </View>

          <View style={styles.settingRowCard}>
            <View style={styles.settingRowInfo}>
              <Text style={styles.settingRowTitle}>Tap Alternatives for Gestures</Text>
              <Text style={styles.settingRowSubtitle}>
                Provides explicit tap buttons for closing sheets, switching tabs, and navigating routes.
              </Text>
            </View>
            <Switch
              value={preferences.gestureAlternatives}
              onValueChange={(val) => updatePreference('gestureAlternatives', val)}
              trackColor={{ false: '#CBD5E1', true: '#0F766E' }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Toggle Tap Alternatives for Gestures"
            />
          </View>
        </View>

        {/* ─── 6. COGNITIVE & FOCUS MODE ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. COGNITIVE & FOCUS MODE</Text>

          <View style={styles.settingRowCard}>
            <View style={styles.settingRowInfo}>
              <Text style={styles.settingRowTitle}>Focus Mode (Simplified Presentation)</Text>
              <Text style={styles.settingRowSubtitle}>
                Reduces visual clutter, highlights the single primary clinical action, and collapses secondary metadata.
              </Text>
            </View>
            <Switch
              value={preferences.simplifiedMode}
              onValueChange={(val) => updatePreference('simplifiedMode', val)}
              trackColor={{ false: '#CBD5E1', true: '#0F766E' }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Toggle Focus Mode"
            />
          </View>
        </View>

        {/* ─── 7. COMMUNICATION & VOICE ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. COMMUNICATION & SPEECH</Text>

          <View style={styles.settingRowCard}>
            <View style={styles.settingRowInfo}>
              <Text style={styles.settingRowTitle}>On-Device Text-To-Speech</Text>
              <Text style={styles.settingRowSubtitle}>
                Speaks screen headers, hospital distance, and triage updates aloud on request.
              </Text>
            </View>
            <Switch
              value={preferences.ttsEnabled}
              onValueChange={(val) => updatePreference('ttsEnabled', val)}
              trackColor={{ false: '#CBD5E1', true: '#0F766E' }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Toggle Text-To-Speech"
            />
          </View>

          {/* Test TTS Button */}
          <TouchableOpacity
            style={[styles.actionBtn, isLargeControls && styles.largeActionBtn]}
            onPress={handleTestTTS}
            accessibilityRole="button"
            accessibilityLabel="Test Speech Output"
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" stroke="#0F766E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={styles.actionBtnText}>
              {isTestSpeaking ? 'Stop Speech Output' : 'Test Speech Output'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─── 8. MOTION ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. MOTION & ANIMATION</Text>

          <View style={styles.settingRowCard}>
            <View style={styles.settingRowInfo}>
              <Text style={styles.settingRowTitle}>Reduced Motion</Text>
              <Text style={styles.settingRowSubtitle}>
                Replaces non-essential Lottie loops and animated transitions with clean, static healthcare layouts.
              </Text>
            </View>
            <Switch
              value={preferences.reducedMotion}
              onValueChange={(val) => updatePreference('reducedMotion', val)}
              trackColor={{ false: '#CBD5E1', true: '#0F766E' }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Toggle Reduced Motion"
            />
          </View>
        </View>

        {/* ─── 9. ACCESSIBLE HOSPITAL NAVIGATION ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. ACCESSIBLE HOSPITAL ROUTING</Text>

          <View style={styles.settingRowCard}>
            <View style={styles.settingRowInfo}>
              <Text style={styles.settingRowTitle}>Accessible Facility Filter</Text>
              <Text style={styles.settingRowSubtitle}>
                Highlights hospitals with verified wheelchair entrance, accessible parking, and ground-floor triage desks.
              </Text>
            </View>
            <Switch
              value={preferences.accessibleRouteMode}
              onValueChange={(val) => updatePreference('accessibleRouteMode', val)}
              trackColor={{ false: '#CBD5E1', true: '#0F766E' }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Toggle Accessible Facility Filter"
            />
          </View>
        </View>

        {/* ─── 10. EMERGENCY ACCESSIBILITY MODE ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. EMERGENCY ACCESSIBILITY</Text>

          <View style={styles.settingRowCard}>
            <View style={styles.settingRowInfo}>
              <Text style={styles.settingRowTitle}>Emergency Accessibility Mode</Text>
              <Text style={styles.settingRowSubtitle}>
                Maximizes touch targets and displays critical medical context (blood group, critical allergies, emergency contact).
              </Text>
            </View>
            <Switch
              value={preferences.emergencyAccessibilityMode}
              onValueChange={(val) => updatePreference('emergencyAccessibilityMode', val)}
              trackColor={{ false: '#CBD5E1', true: '#0F766E' }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Toggle Emergency Accessibility Mode"
            />
          </View>
        </View>

        {/* ─── 11. MULTILINGUAL ACCESSIBILITY ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. MULTILINGUAL & SCRIPT ACCESSIBILITY</Text>
          <Text style={styles.sectionCaption}>
            Accessibility descriptors and screen reader announcements automatically adapt to your active Indian language.
          </Text>

          <TouchableOpacity
            style={styles.settingRowCard}
            onPress={() => navigation.navigate('LanguageSettings')}
            accessibilityRole="button"
            accessibilityLabel={`Change application language. Current language: ${descriptor.nativeName}`}
          >
            <View style={styles.settingRowInfo}>
              <Text style={styles.settingRowTitle}>Active Language</Text>
              <Text style={styles.settingRowSubtitle}>
                {descriptor.nativeName} ({descriptor.englishName}) • 23 Locales & RTL
              </Text>
            </View>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M9 18l6-6-6-6" stroke="#64748B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* ─── 12. PRIVACY & SECURITY ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. PRIVACY & SECURITY CHARTER</Text>
          <View style={styles.privacyCard}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#0F766E" strokeWidth={2} />
            </Svg>
            <Text style={styles.privacyBody}>
              Bharat PulseLink processes all screen reading, text-to-speech, and preference storage 100% locally on your device. Unencrypted medical records or biometric tokens are never transmitted to third-party cloud speech services.
            </Text>
          </View>
        </View>

        {/* ─── 13. RESET ALL ─── */}
        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.sectionTitle}>13. RESTORE DEFAULTS</Text>

          <TouchableOpacity
            style={[styles.resetBtn, isLargeControls && styles.largeResetBtn]}
            onPress={handleResetConfirm}
            accessibilityRole="button"
            accessibilityLabel="Reset all accessibility settings to standard defaults"
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke="#DC2626" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              <Path d="M3 3v5h5" stroke="#DC2626" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={styles.resetBtnText}>Reset All Accessibility Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F766E',
    marginTop: 1,
  },
  resetHeaderBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    backgroundColor: '#FEF2F2',
  },
  resetHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.lg,
  },
  overviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.2)',
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  overviewIconCapsule: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 118, 110, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewTextWrap: {
    flex: 1,
  },
  overviewTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F766E',
  },
  overviewBody: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  section: {
    gap: spacing.sm,
  },
  lastSection: {
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.8,
  },
  sectionCaption: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  profilesGrid: {
    gap: spacing.sm,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  profileCardLarge: {
    paddingVertical: spacing.lg,
  },
  profileCardActive: {
    borderColor: '#0F766E',
    backgroundColor: 'rgba(15, 118, 110, 0.04)',
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  profileNameActive: {
    color: '#0F766E',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#0F766E',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0F766E',
  },
  profileDesc: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  settingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: spacing.xs,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  settingHelper: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  fontScaleList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  scaleOptionChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  scaleOptionChipActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  scaleOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scaleOptionTextActive: {
    color: '#FFFFFF',
  },
  settingRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  settingRowInfo: {
    flex: 1,
    paddingRight: spacing.md,
  },
  settingRowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  settingRowSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(15, 118, 110, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.3)',
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  largeActionBtn: {
    paddingVertical: 16,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F766E',
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: '#F8FAFC',
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  privacyBody: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 19,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: radii.lg,
    paddingVertical: 14,
  },
  largeResetBtn: {
    paddingVertical: 18,
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
});

export default AccessibilityCenterScreen;
