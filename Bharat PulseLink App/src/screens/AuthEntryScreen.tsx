import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
  ActivityIndicator,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AppLottieView from '../components/common/AppLottieView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { colors, spacing, typography, radii } from '../theme/tokens';
import { motionTokens } from '../theme/motion';
import useReducedMotion from '../theme/useReducedMotion';
import { useI18n } from '../i18n/I18nContext';
import GlassCard from '../components/GlassCard';
import AuthenticationService from '../auth/AuthenticationService';
import WhatsAppOtpProvider from '../auth/WhatsAppOtpProvider';
import AuthRouteResolver from '../auth/AuthRouteResolver';

type Props = NativeStackScreenProps<AuthStackParamList, 'AuthEntry'>;

const logoImg = require('../../assets/logo.png');
const googleLottie = require('../../assets/animations/google-icon.json');
const whatsappLottie = require('../../assets/animations/whatsapp-icon.json');

export const AuthEntryScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingWhatsApp, setIsLoadingWhatsApp] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Phone Modal State for WhatsApp OTP Challenge Request
  const [isPhoneModalVisible, setIsPhoneModalVisible] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Staggered Motion Animators
  const logoScale = useRef(new Animated.Value(reduceMotion ? 1 : 0.96)).current;
  const contentOpacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const contentTranslateY = useRef(new Animated.Value(reduceMotion ? 0 : 16)).current;

  useEffect(() => {
    console.log('[ROUTE] AUTH');

    if (reduceMotion) return;

    Animated.parallel([
      Animated.spring(logoScale, {
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
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: motionTokens.duration.normal,
        delay: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [reduceMotion]);

  const handleGoogleSignIn = async () => {
    if (isLoadingGoogle || isLoadingWhatsApp) return;
    setIsLoadingGoogle(true);
    setErrorMessage(null);

    try {
      console.log('[AUTH_ENTRY] GOOGLE_SIGN_IN_PRESSED');
      const result = await AuthenticationService.authenticateWithProvider('google');

      if (result.success && result.identity) {
        console.log('[AUTH_ENTRY] GOOGLE_SUCCESS', result.identity.id);
        const nextRoute = await AuthRouteResolver.resolveNextRouteAsync(result.identity);
        console.log('[AUTH_ENTRY] RESOLVED_NEXT_ROUTE', nextRoute);
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
        }
      } else if (result.isBlocked) {
        setErrorMessage(result.error || t('auth.providerBlocked'));
      } else {
        setErrorMessage(result.error || t('auth.errorOccurred'));
      }
    } catch (err: any) {
      setErrorMessage(err?.message || t('auth.errorOccurred'));
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const handleWhatsAppPress = () => {
    if (isLoadingGoogle || isLoadingWhatsApp) return;
    console.log('[AUTH] WHATSAPP_START');
    setPhoneError(null);
    setIsPhoneModalVisible(true);
  };

  const handleRequestOtpSubmit = async () => {
    if (!phoneInput.trim()) {
      setPhoneError(t('auth.enterPhonePrompt'));
      return;
    }

    console.log('[AUTH] PHONE_SUBMIT');
    console.log('[AUTH] OTP_REQUEST_START');

    setIsLoadingWhatsApp(true);
    setPhoneError(null);

    try {
      const normalized = WhatsAppOtpProvider.normalizePhoneNumber(phoneInput);
      const res = await AuthenticationService.requestWhatsAppOtp(normalized);
      console.log('[AUTH] OTP_REQUEST_RESULT', res.success);

      if (res.success && res.challenge) {
        console.log('[AUTH] OTP_ROUTE');
        setIsPhoneModalVisible(false);
        // Defer screen navigation slightly to let native modal dismissal finish cleanly
        setTimeout(() => {
          navigation.navigate('OTPVerification', {
            phoneE164: res.challenge!.phoneE164,
            maskedPhone: res.challenge!.maskedPhone,
            challengeId: res.challenge!.challengeId,
          });
        }, 100);
      } else {
        setPhoneError(res.error || t('auth.invalidPhone'));
      }
    } catch (err: any) {
      console.error('[AUTH] OTP request error', err);
      setPhoneError(err?.message || t('auth.otpRequestFailed'));
    } finally {
      setIsLoadingWhatsApp(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header Branding */}
          <Animated.View style={[styles.brandingSection, { transform: [{ scale: logoScale }] }]}>
            <Image
              source={logoImg}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel={t('common.appName')}
            />
          </Animated.View>

          {/* Welcome & Trust Copy */}
          <Animated.View
            style={[
              styles.headingSection,
              {
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslateY }],
              },
            ]}
          >
            <Text style={styles.title}>{t('auth.welcomeTitle')}</Text>
            <Text style={styles.trustCopy}>{t('common.tagline')}</Text>
          </Animated.View>

          {/* Glassmorphism Choices Container */}
          <Animated.View
            style={[
              styles.choicesWrapper,
              {
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslateY }],
              },
            ]}
          >
            <GlassCard style={styles.glassCard}>
              {errorMessage && (
                <View style={styles.errorNotice} accessible accessibilityRole="alert">
                  <Text style={styles.errorNoticeText}>{errorMessage}</Text>
                </View>
              )}

              {/* Google Choice Button */}
              <TouchableOpacity
                style={[styles.providerButton, styles.googleButton]}
                onPress={handleGoogleSignIn}
                disabled={isLoadingGoogle || isLoadingWhatsApp}
                accessibilityRole="button"
                accessibilityLabel={t('auth.continueWithGoogle')}
                activeOpacity={0.88}
              >
                {isLoadingGoogle ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <>
                    <View style={styles.googleIconBacking}>
                      <AppLottieView
                        source={googleLottie}
                        autoPlay={!reduceMotion}
                        loop={!reduceMotion}
                        style={styles.googleLottie}
                        resizeMode="contain"
                      />
                    </View>
                    <Text style={styles.googleButtonText}>{t('auth.continueWithGoogle')}</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* OR Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t('auth.orDivider')}</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* WhatsApp Choice Button */}
              <TouchableOpacity
                style={[styles.providerButton, styles.whatsappButton]}
                onPress={handleWhatsAppPress}
                disabled={isLoadingGoogle || isLoadingWhatsApp}
                accessibilityRole="button"
                accessibilityLabel={t('auth.continueWithWhatsApp')}
                activeOpacity={0.88}
              >
                {isLoadingWhatsApp ? (
                  <ActivityIndicator color={colors.textInverted} size="small" />
                ) : (
                  <>
                    <View style={styles.whatsappIconBacking}>
                      <AppLottieView
                        source={whatsappLottie}
                        autoPlay={!reduceMotion}
                        loop={!reduceMotion}
                        style={styles.whatsappLottie}
                        resizeMode="contain"
                      />
                    </View>
                    <Text style={styles.whatsappButtonText}>{t('auth.continueWithWhatsApp')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </GlassCard>
          </Animated.View>

          {/* Footer Terms / Privacy Policy */}
          <View style={styles.footer}>
            <Text style={styles.legalText}>
              {t('auth.termsPrefix')}{' '}
              <Text style={styles.legalLink}>{t('common.terms')}</Text> &{' '}
              <Text style={styles.legalLink}>{t('common.privacy')}</Text>
            </Text>
          </View>
        </ScrollView>

        {/* Reworked WhatsApp Phone Entry Modal */}
        <Modal
          visible={isPhoneModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsPhoneModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              {/* Header with WhatsApp Lottie Icon */}
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalWhatsappBadge}>
                  <AppLottieView
                    source={whatsappLottie}
                    autoPlay={!reduceMotion}
                    loop={!reduceMotion}
                    style={styles.modalWhatsappLottie}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.modalTitle}>
                  {t('auth.phoneModalHeader') || 'Continue with WhatsApp'}
                </Text>
              </View>

              <Text style={styles.modalSubtitle}>
                {t('auth.phoneModalSubtitle') || 'Enter your mobile number to receive a secure verification code.'}
              </Text>

              {phoneError && (
                <View style={styles.modalErrorBanner} accessible accessibilityRole="alert">
                  <Text style={styles.modalErrorText}>{phoneError}</Text>
                </View>
              )}

              {/* Input Field Label */}
              <Text style={styles.fieldLabel}>
                {t('auth.phoneLabel') || 'Mobile Number'}
              </Text>

              {/* Phone Input Row */}
              <View style={styles.phoneInputRow}>
                <View style={styles.countryCodeBadge}>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <TextInput
                  style={styles.phoneTextInput}
                  value={phoneInput}
                  onChangeText={setPhoneInput}
                  placeholder={t('auth.phonePlaceholder') || '98765 43210'}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  maxLength={10}
                  autoFocus={true}
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setIsPhoneModalVisible(false)}
                  accessibilityRole="button"
                  accessibilityLabel={t('auth.cancelButton') || 'Cancel'}
                >
                  <Text style={styles.modalCancelText}>{t('auth.cancelButton') || 'Cancel'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSubmitBtn}
                  onPress={handleRequestOtpSubmit}
                  disabled={isLoadingWhatsApp}
                  accessibilityRole="button"
                  accessibilityLabel={t('auth.submitButton') || 'Continue'}
                >
                  {isLoadingWhatsApp ? (
                    <ActivityIndicator color={colors.textInverted} size="small" />
                  ) : (
                    <Text style={styles.modalSubmitText}>
                      {t('auth.submitButton') || 'Continue'} →
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  brandingSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logo: {
    width: 220,
    height: 72,
  },
  headingSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.titleLarge.fontSize,
    fontWeight: typography.titleLarge.fontWeight,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  trustCopy: {
    fontSize: typography.bodyMedium.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: typography.bodyMedium.lineHeight,
  },
  choicesWrapper: {
    width: '100%',
    marginBottom: spacing.xl,
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
    marginBottom: spacing.md,
  },
  errorNoticeText: {
    color: colors.danger,
    fontSize: typography.bodySmall.fontSize,
    textAlign: 'center',
  },
  providerButton: {
    height: 52,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  googleIconBacking: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  googleLottie: {
    width: 32,
    height: 32,
    backgroundColor: 'transparent',
  },
  whatsappIconBacking: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  whatsappLottie: {
    width: 32,
    height: 32,
    backgroundColor: 'transparent',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  googleButtonText: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  whatsappButtonText: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.textInverted,
    marginLeft: spacing.sm,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: spacing.md,
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    letterSpacing: 1,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  legalText: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  legalLink: {
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.xl,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  modalWhatsappBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  modalWhatsappLottie: {
    width: 32,
    height: 32,
    backgroundColor: 'transparent',
  },
  modalTitle: {
    fontSize: typography.titleMedium.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: typography.bodySmall.lineHeight,
  },
  fieldLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  modalErrorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  modalErrorText: {
    color: colors.danger,
    fontSize: typography.bodySmall.fontSize,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: radii.md,
    height: 52,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  countryCodeBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: spacing.md,
    height: '100%',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  countryCodeText: {
    fontWeight: '700',
    color: colors.textPrimary,
    fontSize: typography.bodyMedium.fontSize,
  },
  phoneTextInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: spacing.md,
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalCancelBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  modalSubmitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    height: 44,
    justifyContent: 'center',
  },
  modalSubmitText: {
    color: colors.textInverted,
    fontWeight: '700',
  },
});

export default AuthEntryScreen;
