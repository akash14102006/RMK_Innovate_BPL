import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { colors, spacing, typography, radii } from '../theme/tokens';
import { motionTokens } from '../theme/motion';
import useReducedMotion from '../theme/useReducedMotion';
import { useI18n } from '../i18n/I18nContext';
import GlassCard from '../components/GlassCard';
import LottieHero from '../components/LottieHero';
import DeviceSecurityService from '../services/DeviceSecurityService';

type Props = NativeStackScreenProps<AuthStackParamList, 'SecurityPinSetup'>;

const pinSecurityLottie = require('../../assets/animations/pin-security.json');

export const SecurityPinSetupScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  const [step, setStep] = useState<'CREATE' | 'CONFIRM'>('CREATE');
  const [firstPin, setFirstPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Motion Animators
  const heroScale = useRef(new Animated.Value(reduceMotion ? 1 : 0.94)).current;
  const contentOpacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  const currentPin = step === 'CREATE' ? firstPin : confirmPin;

  useEffect(() => {
    console.log('[ROUTE] PIN');

    if (reduceMotion) return;

    Animated.parallel([
      Animated.spring(heroScale, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: motionTokens.duration.normal,
        delay: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [reduceMotion]);

  const handleBack = () => {
    if (step === 'CONFIRM') {
      setStep('CREATE');
      setConfirmPin('');
      setErrorMessage(null);
    } else {
      navigation.goBack();
    }
  };

  const handleKeyPress = (digit: string) => {
    if (currentPin.length >= 6 || isSubmitting) return;
    setErrorMessage(null);

    const nextPin = currentPin + digit;
    if (step === 'CREATE') {
      setFirstPin(nextPin);
    } else {
      setConfirmPin(nextPin);
    }
  };

  const handleDelete = () => {
    if (isSubmitting) return;
    setErrorMessage(null);
    if (step === 'CREATE') {
      setFirstPin((prev) => prev.slice(0, -1));
    } else {
      setConfirmPin((prev) => prev.slice(0, -1));
    }
  };

  const handleContinue = async () => {
    if (isSubmitting) return;

    if (step === 'CREATE') {
      if (firstPin.length !== 6) return;

      if (DeviceSecurityService.isWeakPin(firstPin)) {
        setErrorMessage(t('pin.weakPinNotice') || 'Notice: This PIN is easily guessable. Consider a stronger PIN.');
      }
      setStep('CONFIRM');
      return;
    }

    if (step === 'CONFIRM') {
      if (confirmPin.length !== 6) return;

      if (confirmPin !== firstPin) {
        setErrorMessage(t('pin.mismatchError') || 'PINs do not match. Please re-enter.');
        setConfirmPin('');
        return;
      }

      setIsSubmitting(true);
      try {
        console.log('[PIN] CONFIGURING_SECURITY_PIN');
        await DeviceSecurityService.configureSecurityPin(confirmPin);
        navigation.navigate('ProfileSetup' as any);
      } catch (err: any) {
        setErrorMessage(err?.message || t('pin.saveError'));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSkip = () => {
    console.log('[PIN] SKIPPED');
    navigation.navigate('ProfileSetup' as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Text style={styles.backText}>← {t('common.back')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Secure Lock Hero Illustration */}
          <Animated.View style={[styles.heroSection, { transform: [{ scale: heroScale }] }]}>
            <LottieHero
              source={pinSecurityLottie}
              aspectRatio={316.81 / 319.05}
              sizeRatio={0.58}
              maxWidth={200}
              autoPlay={!reduceMotion}
              loop={!reduceMotion}
              reducedMotion={reduceMotion}
              accessibilityLabel={t('pin.title')}
            />
          </Animated.View>

          {/* Heading */}
          <Animated.View style={[styles.headingSection, { opacity: contentOpacity }]}>
            <Text style={styles.title}>{t('pin.title') || 'Protect your app'}</Text>
            <Text style={styles.subtitle}>
              {t('pin.subtitle') || 'Create an optional Security PIN for local access to Bharat PulseLink.'}
            </Text>
            <Text style={styles.stepTitle}>
              {step === 'CREATE'
                ? (t('pin.createTitle') || 'Create Security PIN')
                : (t('pin.confirmTitle') || 'Confirm Security PIN')}
            </Text>
          </Animated.View>

          {/* Glass Input Card */}
          <Animated.View style={[styles.cardWrapper, { opacity: contentOpacity }]}>
            <GlassCard style={styles.glassCard}>
              {errorMessage && (
                <View style={styles.errorNotice} accessible accessibilityRole="alert">
                  <Text style={styles.errorNoticeText}>{errorMessage}</Text>
                </View>
              )}

              {/* 6 Masked PIN Indicator Dots (● ● ● ● ● ●) */}
              <View style={styles.dotsRow}>
                {[0, 1, 2, 3, 4, 5].map((index) => {
                  const filled = currentPin.length > index;
                  return (
                    <View
                      key={index}
                      style={[styles.dotCell, filled && styles.dotCellFilled]}
                    >
                      {filled && <View style={styles.dotInner} />}
                    </View>
                  );
                })}
              </View>

              {/* Custom Numeric Keypad */}
              <View style={styles.keypadGrid}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map(
                  (key, idx) => {
                    if (key === '') return <View key={idx} style={styles.keypadCell} />;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={styles.keypadCell}
                        onPress={() => (key === '⌫' ? handleDelete() : handleKeyPress(key))}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.keypadText}>{key}</Text>
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  (currentPin.length !== 6 || isSubmitting) && styles.continueButtonDisabled,
                ]}
                onPress={handleContinue}
                disabled={currentPin.length !== 6 || isSubmitting}
                accessibilityRole="button"
                accessibilityLabel={t('pin.continueAction') || 'Continue'}
                activeOpacity={0.88}
              >
                <Text style={styles.continueButtonText}>
                  {t('pin.continueAction') || 'Continue'} →
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
                accessibilityRole="button"
                accessibilityLabel={t('pin.skipAction') || 'Skip for now'}
              >
                <Text style={styles.skipButtonText}>
                  {t('pin.skipAction') || 'Skip for now'}
                </Text>
              </TouchableOpacity>
            </GlassCard>
          </Animated.View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    height: 48,
    justifyContent: 'center',
  },
  backButton: {
    paddingVertical: spacing.xs,
  },
  backText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    overflow: 'visible',
    minHeight: 200,
  },
  headingSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.titleLarge.fontSize,
    fontWeight: typography.titleLarge.fontWeight,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xxs,
  },
  subtitle: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: spacing.xs,
  },
  stepTitle: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: colors.primary,
  },
  cardWrapper: {
    width: '100%',
  },
  glassCard: {
    width: '100%',
    alignItems: 'center',
    padding: spacing.md,
  },
  errorNotice: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    width: '100%',
  },
  errorNoticeText: {
    color: colors.danger,
    fontSize: typography.caption.fontSize,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  dotCell: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.textMuted,
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCellFilled: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(15, 118, 110, 0.12)',
  },
  dotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  keypadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 240,
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  keypadCell: {
    width: 70,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 5,
    borderRadius: radii.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  keypadText: {
    fontSize: typography.titleMedium.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  continueButton: {
    width: '100%',
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  continueButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  continueButtonText: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.textInverted,
  },
  skipButton: {
    paddingVertical: spacing.xs,
  },
  skipButtonText: {
    fontSize: typography.bodyMedium.fontSize,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});

export default SecurityPinSetupScreen;
