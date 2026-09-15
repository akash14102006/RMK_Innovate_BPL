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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { colors, spacing, typography, radii } from '../theme/tokens';
import { motionTokens } from '../theme/motion';
import useReducedMotion from '../theme/useReducedMotion';
import { useI18n } from '../i18n/I18nContext';
import GlassCard from '../components/GlassCard';
import OtpInputCells from '../components/OtpInputCells';
import LottieHero from '../components/LottieHero';
import AuthenticationService from '../auth/AuthenticationService';
import AuthRouteResolver from '../auth/AuthRouteResolver';
import ConsentService from '../services/ConsentService';
import QRSessionClientService from '../services/QRSessionClientService';

type Props = NativeStackScreenProps<AuthStackParamList, 'OTPVerification'>;

const otpLottie = require('../../assets/animations/otp-verification.json');

export const OTPVerificationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  const { phoneE164, maskedPhone } = route.params || {
    phoneE164: '+919800000000',
    maskedPhone: '+91 98*** **000',
  };

  const [otpValue, setOtpValue] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Resend Countdown Timer State (seconds remaining)
  const [resendCooldown, setResendCooldown] = useState(30);

  // Motion Animators
  const heroScale = useRef(new Animated.Value(reduceMotion ? 1 : 0.96)).current;
  const contentOpacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    console.log('[ROUTE] OTP_SCREEN_MOUNTED');
    console.log('[ROUTE] OTP_VERIFICATION_MOUNTED', { maskedPhone });

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

  // Resend countdown timer interval
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleVerifySubmit = async () => {
    if (otpValue.length !== 6 || isVerifying) return;

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      console.log('[OTP] VERIFICATION_ATTEMPT_STARTED');
      const result = await AuthenticationService.verifyWhatsAppOtp(otpValue);

      if (result.success && result.identity) {
        console.log('[AUTH] OTP_VERIFICATION_SUCCESS');
        console.log('[AUTH] IDENTITY_ESTABLISHED', { id: result.identity.id });

        // Eagerly prefetch and cache offline QR capability pool on mobile
        QRSessionClientService.prefetchCapabilityPool({ count: 5, ttlHours: 24 }).catch(() => {});

        // Reset consent state on new authentication to guarantee Terms & Privacy onboarding
        await ConsentService.clearConsent();

        const nextRoute = await AuthRouteResolver.resolveNextRouteAsync(result.identity);
        console.log('[OTP] RESOLVED_NEXT_ROUTE', nextRoute);
        if (nextRoute === 'TermsConditions') {
          navigation.navigate('TermsConditions');
        } else if (nextRoute === 'PrivacyPolicy') {
          navigation.navigate('PrivacyPolicy');
        } else if (nextRoute === 'BiometricSetup') {
          navigation.navigate('BiometricSetup');
        } else if (nextRoute === 'SecurityPinSetup') {
          navigation.navigate('SecurityPinSetup');
        } else if (nextRoute === 'LocalLock') {
          navigation.navigate('LocalLock');
        } else {
          navigation.navigate('AuthEntry');
        }
      } else {
        setErrorMessage(result.error || t('otp.invalidCode'));
      }
    } catch (err: any) {
      setErrorMessage(err?.message || t('otp.verificationFailed'));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isVerifying) return;

    setErrorMessage(null);
    try {
      console.log('[OTP] RESEND_REQUESTED');
      const res = await AuthenticationService.requestWhatsAppOtp(phoneE164);
      if (res.success && res.challenge) {
        setResendCooldown(30);
        setOtpValue('');
      } else {
        setErrorMessage(res.error || t('otp.resendFailed'));
      }
    } catch (err: any) {
      setErrorMessage(err?.message || t('otp.resendFailed'));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
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
          {/* Lottie Hero Illustration */}
          <Animated.View style={[styles.heroSection, { transform: [{ scale: heroScale }] }]}>
            <LottieHero
              source={otpLottie}
              aspectRatio={800 / 600}
              sizeRatio={0.68}
              maxWidth={260}
              accessibilityLabel={t('otp.accessibilityHero')}
            />
          </Animated.View>

          {/* Heading & Masked Phone Subtitle */}
          <Animated.View style={[styles.headingSection, { opacity: contentOpacity }]}>
            <Text style={styles.title}>{t('otp.title')}</Text>
            <Text style={styles.subtitle}>
              {t('otp.sentInstruction')}{' '}
              <Text style={styles.maskedPhone}>{maskedPhone}</Text>
            </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.changeNumberLink}>{t('otp.changeNumber')}</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Translucent Glass Card containing 6 OTP Cells */}
          <Animated.View style={[styles.cardWrapper, { opacity: contentOpacity }]}>
            <GlassCard style={styles.glassCard}>
              {errorMessage && (
                <View style={styles.errorNotice} accessible accessibilityRole="alert">
                  <Text style={styles.errorNoticeText}>{errorMessage}</Text>
                </View>
              )}

              {/* 6 Logical OTP Cells */}
              <OtpInputCells
                value={otpValue}
                onChangeText={setOtpValue}
                disabled={isVerifying}
                hasError={!!errorMessage}
              />

              {/* Resend Countdown & Action */}
              <View style={styles.resendRow}>
                {resendCooldown > 0 ? (
                  <Text style={styles.timerText}>
                    {t('otp.resendIn')} {resendCooldown}s
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleResendOtp} disabled={isVerifying}>
                    <Text style={styles.resendLink}>{t('otp.resendCode')}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Verify & Continue Action Button */}
              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  (otpValue.length !== 6 || isVerifying) && styles.verifyButtonDisabled,
                ]}
                onPress={handleVerifySubmit}
                disabled={otpValue.length !== 6 || isVerifying}
                accessibilityRole="button"
                accessibilityLabel={t('otp.verifyAction')}
                activeOpacity={0.88}
              >
                {isVerifying ? (
                  <ActivityIndicator color={colors.textInverted} size="small" />
                ) : (
                  <Text style={styles.verifyButtonText}>{t('otp.verifyAction')} →</Text>
                )}
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
    paddingVertical: spacing.md,
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  headingSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.titleLarge.fontSize,
    fontWeight: typography.titleLarge.fontWeight,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.bodyMedium.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  maskedPhone: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  changeNumberLink: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  cardWrapper: {
    width: '100%',
  },
  glassCard: {
    width: '100%',
  },
  errorNotice: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  errorNoticeText: {
    color: colors.danger,
    fontSize: typography.bodySmall.fontSize,
    textAlign: 'center',
  },
  resendRow: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  timerText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
  },
  resendLink: {
    fontSize: typography.bodyMedium.fontSize,
    color: colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  verifyButton: {
    width: '100%',
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  verifyButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyButtonText: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.textInverted,
  },
});

export default OTPVerificationScreen;
