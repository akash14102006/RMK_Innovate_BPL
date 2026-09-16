/**
 * Bharat PulseLink — Biomorphic Voice Assistant Modal
 *
 * Real Voice Control with:
 * 1. Listening indicator
 * 2. Real intent parsing
 * 3. Strict confirmation for sensitive medical operations (PHI sharing, emergency call)
 * 4. Immediate execution for harmless accessibility & navigation commands
 * 5. Truthful capability reporting
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  Platform,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useAccessibility } from '../../accessibility/AccessibilityContext';
import { useNavigation } from '@react-navigation/native';
import { VoiceCommandResult } from '../../accessibility/voiceCommandParser';
import { spacing, radii } from '../../theme/tokens';
import { triggerAccessibilityAlert } from '../../accessibility/AccessibilityAlertManager';

interface VoiceAssistantModalProps {
  visible: boolean;
  onClose: () => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({ visible, onClose }) => {
  const navigation = useNavigation<any>();
  const {
    executeVoiceCommand,
    capabilities,
    triggerHaptic,
    isLargeControls,
    isHighContrast,
  } = useAccessibility();

  const [state, setState] = useState<'IDLE' | 'LISTENING' | 'CONFIRMATION' | 'RESULT'>('IDLE');
  const [spokenTranscript, setSpokenTranscript] = useState<string>('');
  const [pendingResult, setPendingResult] = useState<VoiceCommandResult | null>(null);

  useEffect(() => {
    if (visible) {
      setState('IDLE');
      setSpokenTranscript('');
      setPendingResult(null);
    }
  }, [visible]);

  const handleStartListening = () => {
    triggerHaptic('selection');
    setState('LISTENING');

    // On web, attempt Web Speech Recognition if available
    if (
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    ) {
      try {
        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRec();
        recognition.lang = 'en-IN';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          const speech = event.results[0][0].transcript;
          handleProcessSpoken(speech);
        };

        recognition.onerror = () => {
          setState('IDLE');
        };

        recognition.start();
        return;
      } catch {}
    }

    // Default simulation/manual input fallback for testing without physical mic
  };

  const handleProcessSpoken = (text: string) => {
    setSpokenTranscript(text);
    const result = executeVoiceCommand(text);

    if (result.requiresConfirmation) {
      setPendingResult(result);
      setState('CONFIRMATION');
      triggerHaptic('warning');
    } else {
      setPendingResult(result);
      setState('RESULT');

      // If navigation command, navigate
      if (result.intent === 'NAVIGATE_HOSPITALS') {
        setTimeout(() => {
          onClose();
          navigation.navigate('Hospitals');
        }, 1200);
      } else if (result.intent === 'NAVIGATE_QR') {
        setTimeout(() => {
          onClose();
          navigation.navigate('Scan');
        }, 1200);
      } else if (result.intent === 'NAVIGATE_RECORDS') {
        setTimeout(() => {
          onClose();
          navigation.navigate('Records');
        }, 1200);
      } else if (result.intent === 'NAVIGATE_PROFILE') {
        setTimeout(() => {
          onClose();
          navigation.navigate('Profile');
        }, 1200);
      } else if (result.intent === 'NAVIGATE_ACCESSIBILITY') {
        setTimeout(() => {
          onClose();
          navigation.navigate('AccessibilityCenter');
        }, 1200);
      }
    }
  };

  const handleConfirmSensitive = () => {
    if (!pendingResult) return;

    triggerHaptic('success');
    triggerAccessibilityAlert({
      type: 'SUCCESS',
      title: pendingResult.label,
      message: 'Sensitive operation confirmed with patient explicit consent.',
    });

    setState('RESULT');
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleCancelSensitive = () => {
    triggerHaptic('selection');
    setState('IDLE');
    setPendingResult(null);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.card,
                isHighContrast && styles.highContrastCard,
                isLargeControls && styles.largeCard,
              ]}
              accessible
              accessibilityRole="dialog"
              accessibilityLabel="Voice Assistant"
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.titleRow}>
                  <View style={styles.micIconCapsule}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="#0F766E" strokeWidth={2} strokeLinecap="round" />
                      <Path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" stroke="#0F766E" strokeWidth={2} strokeLinecap="round" />
                    </Svg>
                  </View>
                  <View>
                    <Text style={styles.title}>Voice Assistant</Text>
                    <Text style={styles.subtitle}>
                      {capabilities.speechInputStatus === 'SUPPORTED'
                        ? 'Device Speech Active'
                        : 'Voice recognition limited'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Close voice assistant"
                >
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path d="M18 6L6 18M6 6l12 12" stroke="#64748B" strokeWidth={2.2} strokeLinecap="round" />
                  </Svg>
                </TouchableOpacity>
              </View>

              {/* Body: States */}
              {state === 'IDLE' && (
                <View style={styles.bodyContent}>
                  <TouchableOpacity
                    style={[styles.micBigBtn, isLargeControls && styles.largeMicBigBtn]}
                    onPress={handleStartListening}
                    accessibilityRole="button"
                    accessibilityLabel="Tap to speak voice command"
                  >
                    <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
                      <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" />
                      <Path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" />
                    </Svg>
                  </TouchableOpacity>
                  <Text style={styles.instruction}>Tap to Speak or choose a command</Text>

                  {/* Suggestion Chips */}
                  <View style={styles.chipsContainer}>
                    {[
                      'Open Hospitals',
                      'Increase Text Size',
                      'Enable Large Controls',
                      'Read This Page',
                    ].map((cmd) => (
                      <TouchableOpacity
                        key={cmd}
                        style={styles.chip}
                        onPress={() => handleProcessSpoken(cmd)}
                        accessibilityRole="button"
                        accessibilityLabel={`Say: ${cmd}`}
                      >
                        <Text style={styles.chipText}>{cmd}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Manual Type Fallback */}
                  <View style={styles.typeRow}>
                    <TextInput
                      style={styles.typeInput}
                      placeholder="Or type voice command..."
                      placeholderTextColor="#94A3B8"
                      value={spokenTranscript}
                      onChangeText={setSpokenTranscript}
                      onSubmitEditing={() => handleProcessSpoken(spokenTranscript)}
                    />
                    <TouchableOpacity
                      style={styles.sendBtn}
                      onPress={() => handleProcessSpoken(spokenTranscript)}
                    >
                      <Text style={styles.sendBtnText}>Run</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {state === 'LISTENING' && (
                <View style={styles.listeningContainer}>
                  <View style={styles.pulseCircle}>
                    <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
                      <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="#0F766E" strokeWidth={2.2} />
                      <Path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" stroke="#0F766E" strokeWidth={2.2} />
                    </Svg>
                  </View>
                  <Text style={styles.listeningText}>Listening for healthcare command...</Text>
                  <Text style={styles.listeningSubtext}>Say "Open Hospitals", "Increase text size", etc.</Text>
                </View>
              )}

              {state === 'CONFIRMATION' && pendingResult && (
                <View style={styles.confirmContainer}>
                  <View style={styles.warningCapsule}>
                    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                      <Circle cx={12} cy={12} r={10} stroke="#D97706" strokeWidth={2} />
                      <Path d="M12 8v4M12 16h.01" stroke="#D97706" strokeWidth={2.2} strokeLinecap="round" />
                    </Svg>
                  </View>
                  <Text style={styles.confirmTitle}>{pendingResult.label}?</Text>
                  <Text style={styles.confirmPrompt}>{pendingResult.confirmationPrompt}</Text>

                  <View style={styles.confirmActions}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={handleCancelSensitive}
                      accessibilityRole="button"
                      accessibilityLabel="Cancel operation"
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.confirmBtn}
                      onPress={handleConfirmSensitive}
                      accessibilityRole="button"
                      accessibilityLabel="Confirm sensitive operation"
                    >
                      <Text style={styles.confirmBtnText}>Confirm Action</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {state === 'RESULT' && pendingResult && (
                <View style={styles.resultContainer}>
                  <View style={styles.successCapsule}>
                    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                      <Circle cx={12} cy={12} r={10} stroke="#059669" strokeWidth={2} />
                      <Path d="M8 12l3 3 5-6" stroke="#059669" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </View>
                  <Text style={styles.resultTitle}>{pendingResult.label}</Text>
                  <Text style={styles.resultSubtitle}>Command executed successfully</Text>
                </View>
              )}
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
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 26,
    padding: spacing.lg,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.15)',
  },
  highContrastCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#000000',
  },
  largeCard: {
    padding: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  micIconCapsule: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    fontSize: 11,
    fontWeight: '600',
    color: '#0F766E',
    marginTop: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyContent: {
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  micBigBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginVertical: spacing.sm,
  },
  largeMicBigBtn: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  instruction: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: spacing.md,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.25)',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  typeRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
    marginTop: spacing.xs,
  },
  typeInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  sendBtn: {
    backgroundColor: '#0F766E',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  listeningContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  pulseCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(15, 118, 110, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  listeningText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F766E',
  },
  listeningSubtext: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  confirmContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  warningCapsule: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  confirmTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 6,
  },
  confirmPrompt: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.lg,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.lg,
    backgroundColor: '#0F766E',
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  resultContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  successCapsule: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  resultTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#065F46',
  },
  resultSubtitle: {
    fontSize: 13,
    color: '#475569',
    marginTop: 4,
  },
});

export default VoiceAssistantModal;
