/**
 * Bharat PulseLink — Biomorphic Quick Accessibility Panel
 *
 * Real, device-aware quick accessibility capability tiles:
 * 1. Text Size: Stepper (100% -> 200%)
 * 2. Reduced Motion: Real instant suppression
 * 3. Screen Reader: Truthful TalkBack detection & semantics status
 * 4. Voice Control: Interactive voice launcher
 * 5. Large Controls: Physical touch target expansion
 * 6. Visual Alerts: Multi-sensory banner alerts toggle
 * 7. Read Screen: On-device TTS page reader (Play / Stop)
 * 8. View All: Full Accessibility Center navigation
 */

import React, { useState } from 'react';
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
import { useAccessibility } from '../../accessibility/AccessibilityContext';
import { useI18n } from '../../i18n/I18nContext';
import { FontScale } from '../../accessibility/types';
import { VoiceAssistantModal } from './VoiceAssistantModal';
import { spacing, radii } from '../../theme/tokens';

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
    isHighContrast,
    capabilities,
    isSpeaking,
    readPage,
    stopSpeaking,
    triggerHaptic,
    announce,
  } = useAccessibility();
  const { t } = useI18n();

  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

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

  const handleToggleLargeControls = (value: boolean) => {
    updatePreference('largeControls', value);
    triggerHaptic('selection');
    announce(`Large touch controls ${value ? 'enabled' : 'disabled'}`);
  };

  const handleToggleVisualAlerts = (value: boolean) => {
    updatePreference('visualAlerts', value);
    triggerHaptic('selection');
    announce(`Visual alerts ${value ? 'enabled' : 'disabled'}`);
  };

  const handleToggleReadPage = async () => {
    if (isSpeaking) {
      await stopSpeaking();
      triggerHaptic('selection');
    } else {
      triggerHaptic('success');
      await readPage('Bharat PulseLink Quick Access active. Your accessibility accommodations are active across hospital and clinical workflows.');
    }
  };

  const handleOpenVoice = () => {
    setIsVoiceModalOpen(true);
  };

  const handleNavigateToCenter = () => {
    closeQuickPanel();
    navigation.navigate('AccessibilityCenter');
  };

  return (
    <>
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
              <View
                style={[
                  styles.biomorphicSheet,
                  isHighContrast && styles.highContrastSheet,
                  isLargeControls && styles.largeSheet,
                ]}
                accessible
                accessibilityLabel="Accessibility Quick Access"
              >
                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.headerLeft}>
                    <View style={styles.iconCapsule}>
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                        <Circle cx={12} cy={12} r={10} stroke="#0F766E" strokeWidth={2} />
                        <Circle cx={12} cy={7.5} r={1.75} fill="#0F766E" />
                        <Path d="M5.5 10.5C8 9.8 16 9.8 18.5 10.5" stroke="#0F766E" strokeWidth={1.8} strokeLinecap="round" />
                        <Path d="M12 9.5V14.5M9.5 18.5L12 14.5L14.5 18.5" stroke="#0F766E" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    </View>
                    <View>
                      <Text style={styles.title}>Accessibility</Text>
                      <Text style={styles.subtitle}>Quick access • {activeProfile}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={closeQuickPanel}
                    accessibilityRole="button"
                    accessibilityLabel="Close accessibility panel"
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
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
                  {/* Tile 1: Text Size */}
                  <View style={styles.tile}>
                    <View style={styles.tileLeft}>
                      <Text style={styles.tileSymbol}>A+</Text>
                      <View>
                        <Text style={styles.tileTitle}>Text Size</Text>
                        <Text style={styles.tileStatus}>
                          {Math.round(preferences.fontScale * 100)}% scale
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.stepperAction, isLargeControls && styles.largeActionBtn]}
                      onPress={handleCycleFontScale}
                      accessibilityRole="button"
                      accessibilityLabel={`Text size ${Math.round(preferences.fontScale * 100)} percent. Tap to enlarge.`}
                    >
                      <Text style={styles.stepperActionText}>
                        {Math.round(preferences.fontScale * 100)}% →
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Tile 2: Reduced Motion */}
                  <View style={styles.tile}>
                    <View style={styles.tileLeft}>
                      <Text style={styles.tileSymbol}>◒</Text>
                      <View>
                        <Text style={styles.tileTitle}>Reduced Motion</Text>
                        <Text style={styles.tileStatus}>
                          {preferences.reducedMotion ? 'ON' : 'OFF'}
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={preferences.reducedMotion}
                      onValueChange={handleToggleReducedMotion}
                      trackColor={{ false: '#CBD5E1', true: '#0F766E' }}
                      thumbColor="#FFFFFF"
                      accessibilityLabel="Reduced motion toggle"
                    />
                  </View>

                  {/* Tile 3: Screen Reader Support (Truthful TalkBack) */}
                  <View style={styles.tile}>
                    <View style={styles.tileLeft}>
                      <Text style={styles.tileSymbol}>◉</Text>
                      <View>
                        <Text style={styles.tileTitle}>Screen Reader</Text>
                        <Text style={styles.tileStatus}>
                          {capabilities.talkBackDetected ? 'TalkBack active' : 'Semantics ready'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.readyBadge}>
                      <Text style={styles.readyBadgeText}>
                        {capabilities.talkBackDetected ? 'ACTIVE' : 'READY'}
                      </Text>
                    </View>
                  </View>

                  {/* Tile 4: Voice Control */}
                  <View style={styles.tile}>
                    <View style={styles.tileLeft}>
                      <Text style={styles.tileSymbol}>🎙</Text>
                      <View>
                        <Text style={styles.tileTitle}>Voice Control</Text>
                        <Text style={styles.tileStatus}>
                          {capabilities.speechInputStatus === 'SUPPORTED' ? 'Ready to listen' : 'Unavailable'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.voiceActionBtn, isLargeControls && styles.largeActionBtn]}
                      onPress={handleOpenVoice}
                      accessibilityRole="button"
                      accessibilityLabel="Open voice assistant"
                    >
                      <Text style={styles.voiceActionBtnText}>Speak</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Tile 5: Large Controls */}
                  <View style={styles.tile}>
                    <View style={styles.tileLeft}>
                      <Text style={styles.tileSymbol}>⬛</Text>
                      <View>
                        <Text style={styles.tileTitle}>Large Controls</Text>
                        <Text style={styles.tileStatus}>
                          {preferences.largeControls ? 'ON (48–56dp)' : 'OFF'}
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={preferences.largeControls}
                      onValueChange={handleToggleLargeControls}
                      trackColor={{ false: '#CBD5E1', true: '#0F766E' }}
                      thumbColor="#FFFFFF"
                      accessibilityLabel="Large controls toggle"
                    />
                  </View>

                  {/* Tile 6: Visual & Haptic Alerts */}
                  <View style={styles.tile}>
                    <View style={styles.tileLeft}>
                      <Text style={styles.tileSymbol}>🔔</Text>
                      <View>
                        <Text style={styles.tileTitle}>Visual Alerts</Text>
                        <Text style={styles.tileStatus}>
                          {preferences.visualAlerts ? 'ON' : 'OFF'}
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={preferences.visualAlerts}
                      onValueChange={handleToggleVisualAlerts}
                      trackColor={{ false: '#CBD5E1', true: '#0F766E' }}
                      thumbColor="#FFFFFF"
                      accessibilityLabel="Visual alerts toggle"
                    />
                  </View>

                  {/* Tile 7: Read Screen */}
                  <View style={styles.tile}>
                    <View style={styles.tileLeft}>
                      <Text style={styles.tileSymbol}>▶</Text>
                      <View>
                        <Text style={styles.tileTitle}>Read Screen</Text>
                        <Text style={styles.tileStatus}>
                          {isSpeaking ? 'Speaking...' : 'Ready'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.readPageBtn,
                        isSpeaking && styles.readPageBtnActive,
                        isLargeControls && styles.largeActionBtn,
                      ]}
                      onPress={handleToggleReadPage}
                      accessibilityRole="button"
                      accessibilityLabel={isSpeaking ? 'Stop reading' : 'Read screen aloud'}
                    >
                      <Text
                        style={[
                          styles.readPageBtnText,
                          isSpeaking && styles.readPageBtnTextActive,
                        ]}
                      >
                        {isSpeaking ? 'Stop' : 'Play'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>

                {/* VIEW ALL ACCESSIBILITY */}
                <TouchableOpacity
                  style={[styles.viewAllBtn, isLargeControls && styles.largeViewAllBtn]}
                  onPress={handleNavigateToCenter}
                  accessibilityRole="button"
                  accessibilityLabel="Open Full Accessibility Center"
                >
                  <Text style={styles.viewAllBtnText}>VIEW ALL ACCESSIBILITY →</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Embedded Voice Assistant Modal */}
      <VoiceAssistantModal
        visible={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
    justifyContent: 'flex-end',
  },
  biomorphicSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 22,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    maxHeight: '84%',
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 24,
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.1)',
  },
  highContrastSheet: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 2,
    borderColor: '#000000',
  },
  largeSheet: {
    paddingBottom: spacing.xxl,
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
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
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
    gap: spacing.xs + 2,
    paddingVertical: spacing.xs,
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  tileSymbol: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F766E',
    width: 28,
    textAlign: 'center',
  },
  tileTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  tileStatus: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  stepperAction: {
    backgroundColor: 'rgba(15, 118, 110, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.25)',
  },
  stepperActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F766E',
  },
  readyBadge: {
    backgroundColor: 'rgba(15, 118, 110, 0.1)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.full,
  },
  readyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
    letterSpacing: 0.5,
  },
  voiceActionBtn: {
    backgroundColor: '#0F766E',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radii.md,
  },
  voiceActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  readPageBtn: {
    backgroundColor: 'rgba(15, 118, 110, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.25)',
  },
  readPageBtnActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  readPageBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F766E',
  },
  readPageBtnTextActive: {
    color: '#FFFFFF',
  },
  largeActionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F766E',
    paddingVertical: 14,
    borderRadius: 20,
    marginTop: spacing.xs,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  largeViewAllBtn: {
    paddingVertical: 18,
  },
  viewAllBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
});

export default AccessibilityQuickPanel;
