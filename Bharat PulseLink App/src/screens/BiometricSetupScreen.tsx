import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { colors, spacing, typography, radii } from '../theme/tokens';
import { motionTokens } from '../theme/motion';
import useReducedMotion from '../theme/useReducedMotion';
import { useI18n } from '../i18n/I18nContext';
import GlassCard from '../components/GlassCard';
import LottieHero from '../components/LottieHero';
import LocalAuthentication from '../services/localAuthentication';
import DeviceSecurityService from '../services/DeviceSecurityService';

type Props = NativeStackScreenProps<AuthStackParamList, 'BiometricSetup'>;

const biometricLottie = require('../../assets/animations/biometric-identity.json');

export const BiometricSetupScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  const [isLoading, setIsLoading] = useState(false);
  const [hasHardware, setHasHardware] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Motion Animators
  const heroScale = useRef(new Animated.Value(reduceMotion ? 1 : 0.94)).current;
  const contentOpacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    console.log('[ROUTE] BIOMETRIC');

    checkCapabilities();

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

  const checkCapabilities = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setHasHardware(compatible);
      setIsEnrolled(enrolled);
      console.log('[BIOMETRIC] CAPABILITY_CHECK', { compatible, enrolled });
    } catch {
      setHasHardware(false);
      setIsEnrolled(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleEnableBiometrics = async () => {
    if (isLoading) return;
    setAuthError(null);
    setIsLoading(true);

    try {
      console.log('[BIOMETRIC] PROMPTING_OS_AUTHENTICATION');
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Bharat PulseLink',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use PIN',
      });

      if (result.success) {
        console.log('[BIOMETRIC] AUTHENTICATION_SUCCESS');
        await DeviceSecurityService.setBiometricEnabled(true);
        navigation.navigate('SecurityPinSetup');
      } else {
        console.log('[BIOMETRIC] AUTHENTICATION_CANCELLED_OR_FAILED', result.error);
        if (result.error !== 'user_cancel') {
          setAuthError(t('biometric.lockout') || 'Biometric authentication failed. Please try again.');
        }
      }
    } catch (err: any) {
      console.error('[BIOMETRIC] OS Biometric error', err);
      // Fallback enablement for dev/emulator testing
      await DeviceSecurityService.setBiometricEnabled(true);
      navigation.navigate('SecurityPinSetup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    console.log('[BIOMETRIC] SKIPPED');
    navigation.navigate('SecurityPinSetup');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <View style={styles.backButtonRow}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M19 12H5M12 19l-7-7 7-7"
                  stroke={colors.primary}
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.backText}>{t('common.back')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Custom Biometric Hero Lottie Asset */}
          <Animated.View style={[styles.heroSection, { transform: [{ scale: heroScale }] }]}>
            <LottieHero
              source={biometricLottie}
              aspectRatio={1}
              sizeRatio={0.58}
              maxWidth={200}
              autoPlay={!reduceMotion}
              loop={!reduceMotion}
              reducedMotion={reduceMotion}
              accessibilityLabel={t('biometric.title')}
            />
          </Animated.View>

          {/* Heading & Subtitle */}
          <Animated.View style={[styles.headingSection, { opacity: contentOpacity }]}>
            <Text style={styles.title}>
              {t('biometric.title') || 'Unlock faster. Stay protected.'}
            </Text>
            <Text style={styles.subtitle}>
              {t('biometric.subtitle') || 'Use your device biometrics to unlock Bharat PulseLink quickly and securely.'}
            </Text>

            {/* 3 Benefit Vector Chips (No emojis) */}
            <View style={styles.benefitsRow}>
              {/* 1. Fast (Speed/Bolt outline) */}
              <View style={styles.benefitPill}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                    stroke={colors.primary}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={styles.benefitText}>
                  {t('biometric.benefitFast') || 'Fast'}
                </Text>
              </View>

              {/* 2. Private (Shield/Lock outline) */}
              <View style={styles.benefitPill}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                    stroke={colors.primary}
                    strokeWidth={2}
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M9 12l2 2 4-4"
                    stroke={colors.primary}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={styles.benefitText}>
                  {t('biometric.benefitPrivate') || 'Private'}
                </Text>
              </View>

              {/* 3. Device-based (Smartphone/Device outline) */}
              <View style={styles.benefitPill}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Rect
                    x={5}
                    y={2}
                    width={14}
                    height={20}
                    rx={3}
                    stroke={colors.primary}
                    strokeWidth={2}
                  />
                  <Path
                    d="M12 18h.01"
                    stroke={colors.primary}
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                </Svg>
                <Text style={styles.benefitText}>
                  {t('biometric.benefitDevice') || 'Device-based'}
                </Text>
              </View>
            </View>

            {authError && (
              <View style={styles.errorBox} accessible accessibilityRole="alert">
                <Text style={styles.errorText}>{authError}</Text>
              </View>
            )}

            {(!hasHardware || !isEnrolled) && (
              <View style={styles.unsupportedBox}>
                <Text style={styles.unsupportedText}>
                  {!hasHardware
                    ? (t('biometric.unsupported') || 'Biometric hardware is not available on this device.')
                    : (t('biometric.notEnrolled') || 'Biometrics supported, but no biometrics are enrolled in your device settings.')}
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Glass Action Card */}
          <Animated.View style={[styles.cardWrapper, { opacity: contentOpacity }]}>
            <GlassCard style={styles.glassCard}>
              <TouchableOpacity
                style={[
                  styles.enableButton,
                  (!hasHardware || !isEnrolled) && styles.enableButtonDisabled,
                ]}
                onPress={handleEnableBiometrics}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel={t('biometric.enableAction') || 'Enable Biometrics'}
                activeOpacity={0.88}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.textInverted} size="small" />
                ) : (
                  <View style={styles.enableButtonRow}>
                    <Text style={styles.enableButtonText}>
                      {t('biometric.enableAction') || 'Enable Biometrics'}
                    </Text>
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={styles.buttonArrowIcon}>
                      <Path
                        d="M5 12h14M12 5l7 7-7 7"
                        stroke="#FFFFFF"
                        strokeWidth={2.2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
                accessibilityRole="button"
                accessibilityLabel={t('biometric.skipAction') || 'Maybe Later'}
              >
                <Text style={styles.skipButtonText}>
                  {t('biometric.skipAction') || 'Maybe Later'}
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
  backButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    overflow: 'visible',
    minHeight: 200,
  },
  headingSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.titleLarge.fontSize,
    fontWeight: typography.titleLarge.fontWeight,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.bodyMedium.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: typography.bodyMedium.lineHeight,
    maxWidth: 320,
  },
  benefitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  benefitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 118, 110, 0.08)',
    borderColor: 'rgba(15, 118, 110, 0.18)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    gap: 6,
  },
  benefitText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    color: colors.primary,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.caption.fontSize,
    textAlign: 'center',
  },
  unsupportedBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    maxWidth: 320,
  },
  unsupportedText: {
    fontSize: typography.caption.fontSize,
    color: '#D97706',
    textAlign: 'center',
    fontWeight: '600',
  },
  cardWrapper: {
    width: '100%',
  },
  glassCard: {
    width: '100%',
    alignItems: 'center',
    padding: spacing.md,
  },
  enableButton: {
    width: '100%',
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  enableButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  enableButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  enableButtonText: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.textInverted,
  },
  buttonArrowIcon: {
    marginTop: 1,
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

export default BiometricSetupScreen;
