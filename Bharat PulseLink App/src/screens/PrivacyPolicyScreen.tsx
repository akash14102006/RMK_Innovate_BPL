import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Modal,
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
import ConsentService, { CURRENT_PRIVACY_VERSION } from '../services/ConsentService';

type Props = NativeStackScreenProps<AuthStackParamList, 'PrivacyPolicy'>;

const privacyLottie = require('../../assets/animations/privacy-policy.json');

export const PrivacyPolicyScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFullDocVisible, setIsFullDocVisible] = useState(false);

  // Motion Animators
  const heroScale = useRef(new Animated.Value(reduceMotion ? 1 : 0.94)).current;
  const contentOpacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    console.log('[ROUTE] PRIVACY');

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
    navigation.goBack();
  };

  const handleAcceptAndContinue = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      console.log('[PRIVACY] RECORDING_CONSENT');
      console.log('[ROUTE] CONSENT_FINALIZATION');
      await ConsentService.recordConsent({
        healthcareDataConsent: true,
        analyticsConsent: false,
        privacyVersion: CURRENT_PRIVACY_VERSION,
      });

      navigation.navigate('BiometricSetup');
    } catch (err) {
      console.error('[PRIVACY] Consent recording error', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header with Back Button and Progress Indicator 2/2 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Text style={styles.backText}>← {t('common.back')}</Text>
          </TouchableOpacity>

          <View style={styles.progressBadge}>
            <Text style={styles.progressBadgeText}>
              {t('onboarding.common.stepProgress', { current: 2, total: 2 }) || 'Progress: 2 / 2'}
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Privacy Shield Hero Illustration */}
          <Animated.View style={[styles.heroSection, { transform: [{ scale: heroScale }] }]}>
            <LottieHero
              source={privacyLottie}
              aspectRatio={800 / 600}
              sizeRatio={0.48}
              maxWidth={180}
              accessibilityLabel={t('privacy.title')}
            />
          </Animated.View>

          {/* Heading */}
          <Animated.View style={[styles.headingSection, { opacity: contentOpacity }]}>
            <Text style={styles.title}>{t('privacy.title') || 'Your Privacy Matters'}</Text>
            <Text style={styles.subtitle}>
              {t('privacy.subtitle') || 'Understand how Bharat PulseLink handles your information.'}
            </Text>
          </Animated.View>

          {/* 4 Glass Highlight Cards Container */}
          <Animated.View style={[styles.cardWrapper, { opacity: contentOpacity }]}>
            <GlassCard style={styles.glassCard}>
              <View style={styles.highlightsContainer}>
                {/* 1. What we collect */}
                <View style={styles.highlightItem}>
                  <Text style={styles.highlightTitle}>{t('privacy.cardCollectTitle') || 'What we collect'}</Text>
                  <Text style={styles.highlightBody}>{t('privacy.cardCollectBody')}</Text>
                </View>

                {/* 2. Why we use it */}
                <View style={styles.highlightItem}>
                  <Text style={styles.highlightTitle}>{t('privacy.cardUseTitle') || 'Why we use it'}</Text>
                  <Text style={styles.highlightBody}>{t('privacy.cardUseBody')}</Text>
                </View>

                {/* 3. How it is protected */}
                <View style={styles.highlightItem}>
                  <Text style={styles.highlightTitle}>{t('privacy.cardProtectTitle') || 'How it is protected'}</Text>
                  <Text style={styles.highlightBody}>{t('privacy.cardProtectBody')}</Text>
                </View>

                {/* 4. Your privacy choices */}
                <View style={styles.highlightItem}>
                  <Text style={styles.highlightTitle}>{t('privacy.cardControlsTitle') || 'Your privacy choices'}</Text>
                  <Text style={styles.highlightBody}>{t('privacy.cardControlsBody')}</Text>
                </View>
              </View>

              {/* Version Info & Read Full Link */}
              <View style={styles.docFooterRow}>
                <Text style={styles.versionText}>
                  {t('privacy.versionInfo', { version: CURRENT_PRIVACY_VERSION })}
                </Text>

                <TouchableOpacity
                  onPress={() => setIsFullDocVisible(true)}
                  style={styles.readFullBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Read full Privacy Policy"
                >
                  <Text style={styles.readFullBtnText}>
                    {t('privacy.readFull') || 'Read full Privacy Policy →'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Primary CTA Button */}
              <TouchableOpacity
                style={[styles.continueButton, isSubmitting && styles.continueButtonDisabled]}
                onPress={handleAcceptAndContinue}
                disabled={isSubmitting}
                accessibilityRole="button"
                accessibilityLabel={t('common.continue')}
                activeOpacity={0.88}
              >
                <Text style={styles.continueButtonText}>
                  {t('common.continue')} →
                </Text>
              </TouchableOpacity>
            </GlassCard>
          </Animated.View>
        </ScrollView>

        {/* Full Privacy Policy Modal */}
        <Modal
          visible={isFullDocVisible}
          animationType="slide"
          onRequestClose={() => setIsFullDocVisible(false)}
        >
          <SafeAreaView style={styles.fullDocSafeArea}>
            <View style={styles.fullDocHeader}>
              <Text style={styles.fullDocTitle}>{t('privacy.title')}</Text>
              <TouchableOpacity
                style={styles.fullDocCloseBtn}
                onPress={() => setIsFullDocVisible(false)}
              >
                <Text style={styles.fullDocCloseText}>✕ {t('common.done')}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.fullDocScrollContent}>
              <Text style={styles.fullDocMeta}>
                {t('privacy.versionInfo', { version: CURRENT_PRIVACY_VERSION })}
              </Text>

              <Text style={styles.fullDocSectionTitle}>{t('privacy.cardCollectTitle')}</Text>
              <Text style={styles.fullDocSectionBody}>{t('privacy.cardCollectBody')}</Text>

              <Text style={styles.fullDocSectionTitle}>{t('privacy.cardUseTitle')}</Text>
              <Text style={styles.fullDocSectionBody}>{t('privacy.cardUseBody')}</Text>

              <Text style={styles.fullDocSectionTitle}>{t('privacy.cardProtectTitle')}</Text>
              <Text style={styles.fullDocSectionBody}>{t('privacy.cardProtectBody')}</Text>

              <Text style={styles.fullDocSectionTitle}>{t('privacy.cardControlsTitle')}</Text>
              <Text style={styles.fullDocSectionBody}>{t('privacy.cardControlsBody')}</Text>
            </ScrollView>
          </SafeAreaView>
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
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    paddingVertical: spacing.xs,
  },
  backText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: colors.primary,
  },
  progressBadge: {
    backgroundColor: 'rgba(15, 118, 110, 0.08)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.full,
  },
  progressBadgeText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    color: colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  headingSection: {
    alignItems: 'center',
    marginBottom: spacing.sm,
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
    lineHeight: typography.bodySmall.lineHeight,
  },
  cardWrapper: {
    width: '100%',
  },
  glassCard: {
    width: '100%',
    padding: spacing.md,
  },
  highlightsContainer: {
    marginBottom: spacing.xs,
  },
  highlightItem: {
    marginBottom: spacing.xs,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.sm,
    padding: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  highlightTitle: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  highlightBody: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    lineHeight: typography.caption.lineHeight,
  },
  docFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingTop: spacing.xxs,
  },
  versionText: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  readFullBtn: {
    paddingVertical: spacing.xxs,
  },
  readFullBtnText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    color: colors.primary,
  },
  continueButton: {
    width: '100%',
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  continueButtonText: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.textInverted,
  },
  fullDocSafeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fullDocHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  fullDocTitle: {
    fontSize: typography.titleMedium.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  fullDocCloseBtn: {
    paddingVertical: spacing.xs,
  },
  fullDocCloseText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: colors.primary,
  },
  fullDocScrollContent: {
    padding: spacing.lg,
  },
  fullDocMeta: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  fullDocSectionTitle: {
    fontSize: typography.titleSmall.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  fullDocSectionBody: {
    fontSize: typography.bodyMedium.fontSize,
    color: colors.textSecondary,
    lineHeight: typography.bodyMedium.lineHeight,
  },
});

export default PrivacyPolicyScreen;
