/**
 * Bharat PulseLink — Neumorphic Quick Accessibility Panel
 *
 * Provides instant on-the-fly accommodations without navigating away:
 * 1. VISUAL: Text Size Stepper (100% -> 200%)
 * 2. MOTION: Reduced Motion Toggle
 * 3. READING: Screen Reader Mode Toggle
 * 4. COMMUNICATION: Voice & TTS Toggle
 * 5. HEARING: Visual Multi-Sensory Alerts Toggle
 * 6. CONTROLS: Large Touch Targets Toggle
 * 7. VIEW ALL ACCESSIBILITY: Navigation to Full Accessibility Center
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors, spacing, radii } from '../../theme/tokens';
import { useAccessibility } from '../../accessibility/AccessibilityContext';
import { useI18n } from '../../i18n/I18nContext';
import { FontScale } from '../../accessibility/types';

const FONT_SCALES: FontScale[] = [1.0, 1.15, 1.3, 1.5, 1.75, 2.0];

export const AccessibilityQuickPanel: React.FC = () => {
  const navigation = useNavigation<any>();
  const {
    isQuickPanelOpen,
    closeQuickPanel,
    preferences,
    updatePreference,
    activeProfile,
    isLargeControls,
    triggerHaptic,
    announce,
  } = useAccessibility();
  const { t } = useI18n();

  if (!isQuickPanelOpen) return null;

  const handleCycleFontScale = () => {
    const currentIndex = FONT_SCALES.indexOf(preferences.fontScale);
    const nextIndex = (currentIndex + 1) % FONT_SCALES.length;
    const nextScale = FONT_SCALES[nextIndex];
    updatePreference('fontScale', nextScale);
    triggerHaptic('selection');
    announce(`Text size set to ${Math.round(nextScale * 100)} percent`);
  };

  const handleToggleReducedMotion = (value: boolean) => {
    updatePreference('reducedMotion', value);
    triggerHaptic('selection');
    announce(`Reduced motion ${value ? 'enabled' : 'disabled'}`);
  };

  const handleToggleScreenReader = (value: boolean) => {
    updatePreference('screenReaderHints', value);
    triggerHaptic('selection');
    announce(`Screen reader hints ${value ? 'enabled' : 'disabled'}`);
  };

  const handleToggleVoice = (value: boolean) => {
    updatePreference('ttsEnabled', value);
    updatePreference('readPageEnabled', value);
    triggerHaptic('selection');
    announce(`Voice and audio assist ${value ? 'enabled' : 'disabled'}`);
  };

  const handleToggleVisualAlerts = (value: boolean) => {
    updatePreference('visualAlerts', value);
    triggerHaptic('selection');
    announce(`Visual alerts ${value ? 'enabled' : 'disabled'}`);
  };

  const handleToggleLargeControls = (value: boolean) => {
    updatePreference('largeControls', value);
    triggerHaptic('selection');
    announce(`Large touch controls ${value ? 'enabled' : 'disabled'}`);
  };

  const handleNavigateToCenter = () => {
    closeQuickPanel();
    navigation.navigate('AccessibilityCenter');
  };

  return (
    <Modal
      visible={isQuickPanelOpen}
      transparent
      animationType="fade"
      onRequestClose={closeQuickPanel}
      accessibilityViewIsModal
    >
      <TouchableWithoutFeedback onPress={closeQuickPanel}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer} accessible accessibilityLabel="Accessibility Quick Controls">
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={styles.iconCapsule}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Circle cx={12} cy={12} r={10} stroke="#0F766E" strokeWidth={2} />
                      <Circle cx={12} cy={7.5} r={1.75} fill="#0F766E" />
                      <Path d="M5.5 10.5C8 9.8 16 9.8 18.5 10.5" stroke="#0F766E" strokeWidth={1.8} strokeLinecap="round" />
                      <Path d="M12 9.5V14.5M9.5 18.5L12 14.5L14.5 18.5" stroke="#0F766E" strokeWidth={1.8} strokeLinecap="round" />
                    </Svg>
                  </View>
                  <View>
                    <Text style={styles.title}>
                      {t('accessibility.quickTitle') || 'Accessibility Quick Controls'}
                    </Text>
                    <Text style={styles.subtitle}>
                      {t('accessibility.activeProfile') || 'Active'}: {activeProfile}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={closeQuickPanel}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.close') || 'Close dialog'}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path d="M18 6L6 18M6 6l12 12" stroke="#64748B" strokeWidth={2.2} strokeLinecap="round" />
                  </Svg>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.contentScroll}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
              >
                {/* 1. VISUAL: Text Size */}
                <View style={styles.controlRow}>
                  <View style={styles.controlInfo}>
                    <Text style={styles.controlCategory}>VISUAL</Text>
                    <Text style={styles.controlLabel}>{t('accessibility.textSize') || 'Text Size'}</Text>
                    <Text style={styles.controlStatus}>
                      {Math.round(preferences.fontScale * 100)}% scale
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.stepperBtn, isLargeControls && styles.largeBtn]}
                    onPress={handleCycleFontScale}
                    accessibilityRole="button"
                    accessibilityLabel={`Text size ${Math.round(preferences.fontScale * 100)} percent, tap to cycle`}
                  >
                    <Text style={styles.stepperBtnText}>
                      {Math.round(preferences.fontScale * 100)}%
                    </Text>
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                      <Path d="M9 18l6-6-6-6" stroke="#0F766E" strokeWidth={2.2} strokeLinecap="round" />
                    </Svg>
                  </TouchableOpacity>
                </View>

                {/* 2. MOTION: Reduced Motion */}
                <View style={styles.controlRow}>
                  <View style={styles.controlInfo}>
                    <Text style={styles.controlCategory}>MOTION</Text>
                    <Text style={styles.controlLabel}>{t('accessibility.reducedMotion') || 'Reduced Motion'}</Text>
                    <Text style={styles.controlStatus}>
                      {preferences.reducedMotion ? 'Enabled • Calmer UI' : 'Disabled'}
                    </Text>
                  </View>
                  <Switch
                    value={preferences.reducedMotion}
                    onValueChange={handleToggleReducedMotion}
                    trackColor={{ false: '#CBD5E1', true: '#0F766E' }}
                    thumbColor="#FFFFFF"
                    accessibilityLabel="Reduced Motion Switch"
                  />
                </View>

                {/* 3. READING: Screen Reader */}
                <View style={styles.controlRow}>
                  <View style={styles.controlInfo}>
                    <Text style={styles.controlCategory}>READING</Text>
                    <Text style={styles.controlLabel}>{t('accessibility.screenReader') || 'Screen Reader Hints'}</Text>
                    <Text style={styles.controlStatus}>
                      {preferences.screenReaderHints ? 'Enabled • High Guidance' : 'Disabled'}
                    </Text>
                  </View>
                  <Switch
                    value={preferences.screenReaderHints}
                    onValueChange={handleToggleScreenReader}
                    trackColor={{ false: '#CBD5E1', true: '#0F766E' }}
                    thumbColor="#FFFFFF"
                    accessibilityLabel="Screen Reader Switch"
                  />
                </View>

                {/* 4. COMMUNICATION: Voice & Audio */}
                <View style={styles.controlRow}>
                  <View style={styles.controlInfo}>
                    <Text style={styles.controlCategory}>COMMUNICATION</Text>
                    <Text style={styles.controlLabel}>{t('accessibility.voiceControl') || 'Voice & Audio Assist'}</Text>
                    <Text style={styles.controlStatus}>
                      {preferences.ttsEnabled ? 'Enabled • Text-to-Speech' : 'Disabled'}
                    </Text>
                  </View>
                  <Switch
                    value={preferences.ttsEnabled}
                    onValueChange={handleToggleVoice}
                    trackColor={{ false: '#CBD5E1', true: '#0F766E' }}
                    thumbColor="#FFFFFF"
                    accessibilityLabel="Voice Assist Switch"
                  />
                </View>

                {/* 5. HEARING: Visual Alerts */}
                <View style={styles.controlRow}>
                  <View style={styles.controlInfo}>
                    <Text style={styles.controlCategory}>HEARING</Text>
                    <Text style={styles.controlLabel}>{t('accessibility.visualAlerts') || 'Visual & Haptic Alerts'}</Text>
                    <Text style={styles.controlStatus}>
                      {preferences.visualAlerts ? 'Enabled • Flash & Vibration' : 'Disabled'}
                    </Text>
                  </View>
                  <Switch
                    value={preferences.visualAlerts}
                    onValueChange={handleToggleVisualAlerts}
                    trackColor={{ false: '#CBD5E1', true: '#0F766E' }}
                    thumbColor="#FFFFFF"
                    accessibilityLabel="Visual Alerts Switch"
                  />
                </View>

                {/* 6. CONTROLS: Large Touch */}
                <View style={styles.controlRow}>
                  <View style={styles.controlInfo}>
                    <Text style={styles.controlCategory}>CONTROLS</Text>
                    <Text style={styles.controlLabel}>{t('accessibility.largeControls') || 'Large Touch Targets'}</Text>
                    <Text style={styles.controlStatus}>
                      {preferences.largeControls ? 'Enabled • 48px Minimum' : 'Disabled'}
                    </Text>
                  </View>
                  <Switch
                    value={preferences.largeControls}
                    onValueChange={handleToggleLargeControls}
                    trackColor={{ false: '#CBD5E1', true: '#0F766E' }}
                    thumbColor="#FFFFFF"
                    accessibilityLabel="Large Touch Controls Switch"
                  />
                </View>
              </ScrollView>

              {/* View All Accessibility Button */}
              <TouchableOpacity
                style={[styles.viewAllBtn, isLargeControls && styles.largeViewAllBtn]}
                onPress={handleNavigateToCenter}
                accessibilityRole="button"
                accessibilityLabel="Open Full Accessibility Center"
              >
                <Text style={styles.viewAllBtnText}>
                  {t('accessibility.viewAll') || 'VIEW ALL ACCESSIBILITY'}
                </Text>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M5 12h14M12 5l7 7-7 7" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" />
                </Svg>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconCapsule: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(15, 118, 110, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0F766E',
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentScroll: {
    marginVertical: spacing.sm,
  },
  contentContainer: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  controlInfo: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  controlCategory: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0F766E',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  controlStatus: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 1,
  },
  stepperBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 118, 110, 0.12)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.25)',
  },
  largeBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  stepperBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F766E',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#0F766E',
    paddingVertical: 14,
    borderRadius: radii.xl,
    marginTop: spacing.sm,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  largeViewAllBtn: {
    paddingVertical: 18,
  },
  viewAllBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

export default AccessibilityQuickPanel;
