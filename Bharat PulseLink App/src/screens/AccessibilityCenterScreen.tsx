/**
 * Bharat PulseLink — Biomorphic Accessibility Center
 * (Enterprise Adaptive Care Access Platform)
 *
 * Visual Control Dashboard:
 * 1. Visual Comprehension in 1–2 seconds (No 5-line paragraphs)
 * 2. Biomorphic Card Architecture (Organic forms, soft depth, healthcare teal highlights)
 * 3. Clinical Profile Selector (Standard, Low Vision, Screen Reader, Hearing, Motor, Cognitive, Senior, Emergency)
 * 4. Immediate Quick Controls Matrix:
 *    - Text Size: [ A- ] 130% [ A+ ]
 *    - Contrast: Segmented [ Normal ] [ High ]
 *    - Motion: Reduced Motion Switch
 *    - Controls: Large Touch Controls (48–56dp) Switch
 *    - Reading: Read Page [ ▶ Play / ⏹ Stop ]
 *    - Voice: Voice Assistant [ 🎙 Speak ]
 *    - Alerts: Visual & Haptic Alerts Switch
 * 5. Screen Reader Support & TalkBack System Settings Bridge
 * 6. Collapsible Deep Accommodations (Motor, Cognitive, Languages, Privacy)
 * 7. Restore Defaults Safeguard
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
import { AccessibilityProfile, FontScale } from '../accessibility/types';
import { useI18n } from '../i18n/I18nContext';
import { VoiceAssistantModal } from '../components/accessibility/VoiceAssistantModal';

const FONT_SCALES: FontScale[] = [1.0, 1.15, 1.3, 1.5, 1.75, 2.0];

const CORE_PROFILES: { key: AccessibilityProfile; name: string; subtitle: string; iconSymbol: string }[] = [
  { key: 'STANDARD', name: 'Standard', subtitle: 'Default healthcare view', iconSymbol: '✦' },
  { key: 'LOW_VISION', name: 'Low Vision', subtitle: '150% text & high contrast', iconSymbol: '👁' },
  { key: 'BLIND_SCREEN_READER', name: 'Screen Reader', subtitle: 'TalkBack semantics ready', iconSymbol: '◉' },
  { key: 'HEARING_SUPPORT', name: 'Hearing', subtitle: 'Visual & haptic banners', iconSymbol: '🔔' },
  { key: 'MOTOR_SUPPORT', name: 'Motor', subtitle: 'Large 56dp touch targets', iconSymbol: '⬛' },
  { key: 'COGNITIVE_SUPPORT', name: 'Cognitive', subtitle: 'Focus mode & calm UI', iconSymbol: '🧠' },
  { key: 'SENIOR_FRIENDLY', name: 'Senior', subtitle: 'Large font & strong clarity', iconSymbol: '♥' },
  { key: 'EMERGENCY_ACCESS', name: 'Emergency', subtitle: 'Critical high-contrast actions', iconSymbol: '⚡' },
];

export const AccessibilityCenterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const {
    preferences,
    updatePreference,
    applyProfile,
    resetAccessibility,
    activeProfile,
    capabilities,
    isSpeaking,
    readPage,
    stopSpeaking,
    openSystemAccessibilitySettings,
    triggerHaptic,
    announce,
    isLargeControls,
    isHighContrast,
  } = useAccessibility();
  const { descriptor } = useI18n();

  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Stepper handlers
  const handleDecreaseText = () => {
    const currentIndex = FONT_SCALES.indexOf(preferences.fontScale);
    if (currentIndex > 0) {
      const prevScale = FONT_SCALES[currentIndex - 1];
      updatePreference('fontScale', prevScale);
      triggerHaptic('selection');
      announce(`Text size decreased to ${Math.round(prevScale * 100)} percent`);
    }
  };

  const handleIncreaseText = () => {
    const currentIndex = FONT_SCALES.indexOf(preferences.fontScale);
    if (currentIndex < FONT_SCALES.length - 1) {
      const nextScale = FONT_SCALES[currentIndex + 1];
      updatePreference('fontScale', nextScale);
      triggerHaptic('selection');
      announce(`Text size increased to ${Math.round(nextScale * 100)} percent`);
    }
  };

  const handleToggleReadPage = async () => {
    if (isSpeaking) {
      await stopSpeaking();
      triggerHaptic('selection');
    } else {
      triggerHaptic('success');
      await readPage('Accessibility Center. Make Bharat PulseLink work for you. Quick controls ready for text size, contrast, reduced motion, and large controls.');
    }
  };

  const handleOpenSettings = async () => {
    triggerHaptic('selection');
    await openSystemAccessibilitySettings();
  };

  const handleResetConfirm = () => {
    Alert.alert(
      'Reset Accessibility Settings',
      'Restore all accessibility preferences to clinical standards? Your patient records, language, and session remain untouched.',
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

  const toggleAccordion = (key: string) => {
    triggerHaptic('selection');
    setExpandedSection(expandedSection === key ? null : key);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={[styles.header, isHighContrast && styles.highContrastBorder]}>
        <TouchableOpacity
          style={[styles.backBtn, isLargeControls && styles.largeBackBtn]}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#0F172A" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Accessibility</Text>
          <Text style={styles.headerSubtitle}>Make Bharat PulseLink work for you</Text>
        </View>

        <TouchableOpacity
          style={styles.resetHeaderBtn}
          onPress={handleResetConfirm}
          accessibilityRole="button"
          accessibilityLabel="Reset accessibility settings"
        >
          <Text style={styles.resetHeaderBtnText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. ACCESSIBILITY PROFILES ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>ACCESSIBILITY PROFILE</Text>
          <Text style={styles.sectionBadge}>{activeProfile}</Text>
        </View>

        <View style={styles.profilesGrid}>
          {CORE_PROFILES.map((p) => {
            const isSelected = activeProfile === p.key;
            return (
              <TouchableOpacity
                key={p.key}
                style={[
                  styles.profileTile,
                  isSelected && styles.profileTileActive,
                  isHighContrast && isSelected && styles.highContrastActiveTile,
                  isLargeControls && styles.largeProfileTile,
                ]}
                onPress={() => applyProfile(p.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${p.name} profile: ${p.subtitle}. ${isSelected ? 'Active.' : 'Tap to apply.'}`}
                activeOpacity={0.8}
              >
                <View style={styles.profileTileTop}>
                  <Text style={[styles.profileSymbol, isSelected && styles.profileSymbolActive]}>
                    {p.iconSymbol}
                  </Text>
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                </View>
                <Text style={[styles.profileTileName, isSelected && styles.profileTileNameActive]}>
                  {p.name}
                </Text>
                <Text style={styles.profileTileSub} numberOfLines={1}>
                  {p.subtitle}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── 2. PRIMARY QUICK CONTROLS ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>QUICK CONTROLS</Text>
        </View>

        <View style={[styles.biomorphicCard, isHighContrast && styles.highContrastCard]}>
          {/* Row 1: Text Size Stepper */}
          <View style={styles.controlRow}>
            <View style={styles.controlInfo}>
              <Text style={styles.controlTitle}>Text Size</Text>
              <Text style={styles.controlSubtitle}>Scales typography app-wide</Text>
            </View>
            <View style={styles.stepperContainer}>
              <TouchableOpacity
                style={[styles.stepperBtn, isLargeControls && styles.largeStepperBtn]}
                onPress={handleDecreaseText}
                accessibilityRole="button"
                accessibilityLabel="Decrease text size"
                disabled={preferences.fontScale <= 1.0}
              >
                <Text style={[styles.stepperBtnText, preferences.fontScale <= 1.0 && styles.disabledText]}>
                  A−
                </Text>
              </TouchableOpacity>
              <View style={styles.stepperValueBox}>
                <Text style={styles.stepperValueText}>
                  {Math.round(preferences.fontScale * 100)}%
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.stepperBtn, isLargeControls && styles.largeStepperBtn]}
                onPress={handleIncreaseText}
                accessibilityRole="button"
                accessibilityLabel="Increase text size"
                disabled={preferences.fontScale >= 2.0}
              >
                <Text style={[styles.stepperBtnText, preferences.fontScale >= 2.0 && styles.disabledText]}>
                  A+
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Row 2: Contrast Mode */}
          <View style={styles.divider} />
          <View style={styles.controlRow}>
            <View style={styles.controlInfo}>
              <Text style={styles.controlTitle}>Contrast</Text>
              <Text style={styles.controlSubtitle}>Stronger borders & high-visibility text</Text>
            </View>
            <View style={styles.segmentedContainer}>
              <TouchableOpacity
                style={[
                  styles.segmentChip,
                  !preferences.highContrast && styles.segmentChipActive,
                ]}
                onPress={() => updatePreference('highContrast', false)}
                accessibilityRole="button"
                accessibilityLabel="Normal contrast"
              >
                <Text style={[styles.segmentText, !preferences.highContrast && styles.segmentTextActive]}>
                  Normal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segmentChip,
                  preferences.highContrast && styles.segmentChipActive,
                ]}
                onPress={() => updatePreference('highContrast', true)}
                accessibilityRole="button"
                accessibilityLabel="High contrast"
              >
                <Text style={[styles.segmentText, preferences.highContrast && styles.segmentTextActive]}>
                  High
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Row 3: Reduced Motion */}
          <View style={styles.divider} />
          <View style={styles.controlRow}>
            <View style={styles.controlInfo}>
              <Text style={styles.controlTitle}>Reduced Motion</Text>
              <Text style={styles.controlSubtitle}>Suppresses decorative animations</Text>
            </View>
            <Switch
              value={preferences.reducedMotion}
              onValueChange={(val) => updatePreference('reducedMotion', val)}
              trackColor={{ false: '#CBD5E1', true: '#0F766E' }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Reduced Motion Switch"
            />
          </View>

          {/* Row 4: Large Touch Controls */}
          <View style={styles.divider} />
          <View style={styles.controlRow}>
            <View style={styles.controlInfo}>
              <Text style={styles.controlTitle}>Large Controls</Text>
              <Text style={styles.controlSubtitle}>Expands buttons & tabs to 48–56dp</Text>
            </View>
            <Switch
              value={preferences.largeControls}
              onValueChange={(val) => updatePreference('largeControls', val)}
              trackColor={{ false: '#CBD5E1', true: '#0F766E' }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Large Controls Switch"
            />
          </View>

          {/* Row 5: Read Page */}
          <View style={styles.divider} />
          <View style={styles.controlRow}>
            <View style={styles.controlInfo}>
              <Text style={styles.controlTitle}>Read Page</Text>
              <Text style={styles.controlSubtitle}>
                {isSpeaking ? 'Speaking page content aloud...' : 'Speaks important screen information'}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.actionPill,
                isSpeaking && styles.actionPillActive,
                isLargeControls && styles.largeActionPill,
              ]}
              onPress={handleToggleReadPage}
              accessibilityRole="button"
              accessibilityLabel={isSpeaking ? 'Stop speaking' : 'Play text-to-speech'}
            >
              <Text style={[styles.actionPillText, isSpeaking && styles.actionPillTextActive]}>
                {isSpeaking ? '⏹ Stop' : '▶ Play'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Row 6: Voice Control */}
          <View style={styles.divider} />
          <View style={styles.controlRow}>
            <View style={styles.controlInfo}>
              <Text style={styles.controlTitle}>Voice Control</Text>
              <Text style={styles.controlSubtitle}>
                {capabilities.speechInputStatus === 'SUPPORTED' ? '● READY' : 'Unavailable on device'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.voicePill, isLargeControls && styles.largeActionPill]}
              onPress={() => setIsVoiceModalOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Open voice assistant"
            >
              <Text style={styles.voicePillText}>🎙 Speak</Text>
            </TouchableOpacity>
          </View>

          {/* Row 7: Visual & Haptic Alerts */}
          <View style={styles.divider} />
          <View style={styles.controlRow}>
            <View style={styles.controlInfo}>
              <Text style={styles.controlTitle}>Visual & Haptic Alerts</Text>
              <Text style={styles.controlSubtitle}>Multi-sensory banners for QR & check-in</Text>
            </View>
            <Switch
              value={preferences.visualAlerts}
              onValueChange={(val) => updatePreference('visualAlerts', val)}
              trackColor={{ false: '#CBD5E1', true: '#0F766E' }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Visual & Haptic Alerts Switch"
            />
          </View>
        </View>

        {/* ─── 3. SCREEN READER SUPPORT (TRUTHFUL TALKBACK) ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>SCREEN READER SUPPORT</Text>
        </View>

        <View style={[styles.talkBackCard, isHighContrast && styles.highContrastCard]}>
          <View style={styles.talkBackTopRow}>
            <View style={styles.talkBackIconCapsule}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Circle cx={12} cy={12} r={10} stroke="#0F766E" strokeWidth={2} />
                <Circle cx={12} cy={8} r={2} fill="#0F766E" />
                <Path d="M8 16c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="#0F766E" strokeWidth={2} strokeLinecap="round" />
              </Svg>
            </View>
            <View style={styles.talkBackInfo}>
              <Text style={styles.talkBackTitle}>
                {capabilities.talkBackDetected ? 'TalkBack Detected' : 'Screen Reader Semantics Active'}
              </Text>
              <Text style={styles.talkBackSubtitle}>
                {capabilities.talkBackDetected
                  ? 'System screen reader is actively reading Bharat PulseLink.'
                  : 'All labels, roles, and focus orders are optimized for TalkBack.'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.settingsBridgeBtn, isLargeControls && styles.largeSettingsBridgeBtn]}
            onPress={handleOpenSettings}
            accessibilityRole="button"
            accessibilityLabel="Open Android Accessibility Settings"
          >
            <Text style={styles.settingsBridgeBtnText}>Open Device Accessibility Settings</Text>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path d="M9 18l6-6-6-6" stroke="#0F766E" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* ─── 4. MORE ACCOMMODATIONS (COLLAPSIBLE) ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>MORE ACCOMMODATIONS</Text>
        </View>

        {/* Accordion 1: Cognitive Focus */}
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => toggleAccordion('cognitive')}
          accessibilityRole="button"
          accessibilityLabel="Cognitive & Focus Mode section"
        >
          <Text style={styles.accordionTitle}>Cognitive Focus Mode</Text>
          <Text style={styles.accordionArrow}>{expandedSection === 'cognitive' ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {expandedSection === 'cognitive' && (
          <View style={styles.accordionContent}>
            <View style={styles.controlRow}>
              <View style={styles.controlInfo}>
                <Text style={styles.controlTitle}>Simplified Presentation</Text>
                <Text style={styles.controlSubtitle}>Collapses secondary metadata</Text>
              </View>
              <Switch
                value={preferences.simplifiedMode}
                onValueChange={(val) => updatePreference('simplifiedMode', val)}
                trackColor={{ false: '#CBD5E1', true: '#0F766E' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        )}

        {/* Accordion 2: Motor & Dexterity */}
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => toggleAccordion('motor')}
          accessibilityRole="button"
          accessibilityLabel="Motor & Dexterity section"
        >
          <Text style={styles.accordionTitle}>Motor & Dexterity</Text>
          <Text style={styles.accordionArrow}>{expandedSection === 'motor' ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {expandedSection === 'motor' && (
          <View style={styles.accordionContent}>
            <View style={styles.controlRow}>
              <View style={styles.controlInfo}>
                <Text style={styles.controlTitle}>Tap Alternatives for Gestures</Text>
                <Text style={styles.controlSubtitle}>Provides tap buttons instead of swipes</Text>
              </View>
              <Switch
                value={preferences.gestureAlternatives}
                onValueChange={(val) => updatePreference('gestureAlternatives', val)}
                trackColor={{ false: '#CBD5E1', true: '#0F766E' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        )}

        {/* Accordion 3: Multilingual (23 Locales) */}
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => navigation.navigate('LanguageSettings')}
          accessibilityRole="button"
          accessibilityLabel="Language settings"
        >
          <View>
            <Text style={styles.accordionTitle}>Active Language</Text>
            <Text style={styles.accordionSubtitle}>
              {descriptor.nativeName} ({descriptor.englishName}) • 23 Locales & RTL
            </Text>
          </View>
          <Text style={styles.accordionArrow}>→</Text>
        </TouchableOpacity>

        {/* Accordion 4: Privacy & Security */}
        <View style={styles.privacyCard}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#0F766E" strokeWidth={2} />
          </Svg>
          <Text style={styles.privacyText}>
            Zero cloud PHI transmission. All screen reading, speech recognition, and preferences run 100% locally on your device.
          </Text>
        </View>

        {/* ─── 5. RESTORE DEFAULTS ─── */}
        <TouchableOpacity
          style={[styles.resetBtn, isLargeControls && styles.largeResetBtn]}
          onPress={handleResetConfirm}
          accessibilityRole="button"
          accessibilityLabel="Reset all accessibility settings"
        >
          <Text style={styles.resetBtnText}>Restore Clinical Defaults</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        visible={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
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
  highContrastBorder: {
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeBackBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
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
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  sectionBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
    backgroundColor: 'rgba(15, 118, 110, 0.1)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radii.full,
  },
  profilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  profileTile: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 18,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  profileTileActive: {
    borderColor: '#0F766E',
    backgroundColor: '#F0FDFA',
  },
  highContrastActiveTile: {
    borderColor: '#000000',
    borderWidth: 2.5,
  },
  largeProfileTile: {
    paddingVertical: 16,
  },
  profileTileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  profileSymbol: {
    fontSize: 16,
    color: '#64748B',
  },
  profileSymbolActive: {
    color: '#0F766E',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#0F766E',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0F766E',
  },
  profileTileName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  profileTileNameActive: {
    color: '#0F766E',
  },
  profileTileSub: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  biomorphicCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  highContrastCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  controlInfo: {
    flex: 1,
    paddingRight: 12,
  },
  controlTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  controlSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  stepperBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(15, 118, 110, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeStepperBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  stepperBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F766E',
  },
  disabledText: {
    color: '#CBD5E1',
  },
  stepperValueBox: {
    paddingHorizontal: 10,
  },
  stepperValueText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: radii.md,
    padding: 3,
    gap: 4,
  },
  segmentChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.sm,
  },
  segmentChipActive: {
    backgroundColor: '#0F766E',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  actionPill: {
    backgroundColor: 'rgba(15, 118, 110, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.25)',
  },
  actionPillActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F766E',
  },
  actionPillTextActive: {
    color: '#FFFFFF',
  },
  voicePill: {
    backgroundColor: '#0F766E',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.md,
  },
  voicePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  largeActionPill: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    minHeight: 48,
  },
  talkBackCard: {
    backgroundColor: '#F0FDFA',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(15, 118, 110, 0.25)',
    gap: 12,
  },
  talkBackTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  talkBackIconCapsule: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 118, 110, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  talkBackInfo: {
    flex: 1,
  },
  talkBackTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F766E',
  },
  talkBackSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#475569',
    marginTop: 2,
    lineHeight: 16,
  },
  settingsBridgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.3)',
    borderRadius: radii.lg,
    paddingVertical: 11,
  },
  largeSettingsBridgeBtn: {
    paddingVertical: 15,
  },
  settingsBridgeBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F766E',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  accordionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  accordionSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#0F766E',
    marginTop: 2,
  },
  accordionArrow: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
  },
  accordionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: -8,
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: radii.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  privacyText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 16,
  },
  resetBtn: {
    paddingVertical: 14,
    borderRadius: radii.lg,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  largeResetBtn: {
    paddingVertical: 18,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
});

export default AccessibilityCenterScreen;
