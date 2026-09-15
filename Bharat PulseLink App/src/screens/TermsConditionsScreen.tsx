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
import ConsentService, { CURRENT_TERMS_VERSION } from '../services/ConsentService';

type Props = NativeStackScreenProps<AuthStackParamList, 'TermsConditions'>;

const termsLottie = require('../../assets/animations/terms-conditions.json');

export const TermsConditionsScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  const [hasAgreed, setHasAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFullDocVisible, setIsFullDocVisible] = useState(false);

  // Motion Animators
  const heroScale = useRef(new Animated.Value(reduceMotion ? 1 : 0.94)).current;
  const contentOpacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    console.log('[ROUTE] TERMS');

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

  const handleContinue = async () => {
    if (!hasAgreed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      console.log('[TERMS] RECORDING_AGREEMENT');
      await ConsentService.recordConsent({
        healthcareDataConsent: true,
        termsVersion: CURRENT_TERMS_VERSION,
      });

      navigation.navigate('PrivacyPolicy');
    } catch (err) {
      console.error('[TERMS] Consent recording error', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header with Back Button and Progress Indicator 1/2 */}
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
              {t('onboarding.common.stepProgress', { current: 1, total: 2 }) || 'Progress: 1 / 2'}
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Hero Illustration */}
          <Animated.View style={[styles.heroSection, { transform: [{ scale: heroScale }] }]}>
            <LottieHero
              source={termsLottie}
              aspectRatio={800 / 600}
              sizeRatio={0.50}
              maxWidth={190}
              accessibilityLabel={t('terms.title')}
            />
          </Animated.View>

          {/* Heading */}
          <Animated.View style={[styles.headingSection, { opacity: contentOpacity }]}>
            <Text style={styles.title}>{t('terms.title') || 'Terms & Conditions'}</Text>
            <Text style={styles.subtitle}>
              {t('terms.subtitle') || 'Please review the terms that govern your use of Bharat PulseLink.'}
            </Text>
          </Animated.View>

          {/* Glass Document Summary Card */}
          <Animated.View style={[styles.cardWrapper, { opacity: contentOpacity }]}>
            <GlassCard style={styles.glassCard}>
              <View style={styles.docCardHeader}>
                <View style={styles.docBadge}>
                  <Text style={styles.docBadgeText}>
                    {t('terms.versionInfo', { version: CURRENT_TERMS_VERSION }) || 'Version 1.0 • Effective August 2026'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsFullDocVisible(true)}
                  style={styles.readFullBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Read full Terms"
                >
                  <Text style={styles.readFullBtnText}>
                    {t('terms.readFull') || 'Read full Terms →'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Summary Paragraphs */}
              <View style={styles.summaryContainer}>
                <Text style={styles.sectionTitle}>{t('terms.section1Title')}</Text>
                <Text style={styles.sectionBody}>{t('terms.section1Body')}</Text>

                <Text style={styles.sectionTitle}>{t('terms.section2Title')}</Text>
                <Text style={styles.sectionBody}>{t('terms.section2Body')}</Text>

                <Text style={styles.sectionTitle}>{t('terms.section3Title')}</Text>
                <Text style={styles.sectionBody}>{t('terms.section3Body')}</Text>
              </View>

              {/* Explicit Consent Checkbox Card */}
              <TouchableOpacity
                style={styles.checkboxCard}
                onPress={() => setHasAgreed(!hasAgreed)}
                activeOpacity={0.88}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: hasAgreed }}
                accessibilityLabel={t('terms.checkboxLabel')}
              >
                <View style={[styles.checkboxBox, hasAgreed && styles.checkboxBoxChecked]}>
                  {hasAgreed && <Text style={styles.checkmarkText}>✓</Text>}
                </View>
                <Text style={styles.checkboxText}>
                  {t('terms.checkboxLabel') || 'I agree to the Terms & Conditions'}
                </Text>
              </TouchableOpacity>

              {/* Primary CTA Button */}
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  (!hasAgreed || isSubmitting) && styles.continueButtonDisabled,
                ]}
                onPress={handleContinue}
                disabled={!hasAgreed || isSubmitting}
                accessibilityRole="button"
                accessibilityLabel={t('terms.continueAction') || 'Agree & Continue'}
                activeOpacity={0.88}
              >
                <Text style={styles.continueButtonText}>
                  {t('terms.continueAction') || 'Agree & Continue'} →
                </Text>
              </TouchableOpacity>
            </GlassCard>
          </Animated.View>
        </ScrollView>

        {/* Full Document Reading Modal */}
        <Modal
          visible={isFullDocVisible}
          animationType="slide"
          onRequestClose={() => setIsFullDocVisible(false)}
        >
          <SafeAreaView style={styles.fullDocSafeArea}>
            <View style={styles.fullDocHeader}>
              <Text style={styles.fullDocTitle}>{t('terms.title')}</Text>
              <TouchableOpacity
                style={styles.fullDocCloseBtn}
                onPress={() => setIsFullDocVisible(false)}
              >
                <Text style={styles.fullDocCloseText}>✕ {t('common.done')}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.fullDocScrollContent}>
              <Text style={styles.fullDocMeta}>
                {t('terms.versionInfo', { version: CURRENT_TERMS_VERSION })}
              </Text>

              <Text style={styles.fullDocSectionTitle}>{t('terms.section1Title')}</Text>
              <Text style={styles.fullDocSectionBody}>{t('terms.section1Body')}</Text>

              <Text style={styles.fullDocSectionTitle}>{t('terms.section2Title')}</Text>
              <Text style={styles.fullDocSectionBody}>{t('terms.section2Body')}</Text>

              <Text style={styles.fullDocSectionTitle}>{t('terms.section3Title')}</Text>
              <Text style={styles.fullDocSectionBody}>{t('terms.section3Body')}</Text>
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
    lineHeight: typography.bodySmall.lineHeight,
  },
  cardWrapper: {
    width: '100%',
  },
  glassCard: {
    width: '100%',
    padding: spacing.md,
  },
  docCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  docBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: radii.sm,
  },
  docBadgeText: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  readFullBtn: {
    paddingVertical: spacing.xxs,
  },
  readFullBtnText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    color: colors.primary,
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.xxs,
    marginBottom: 2,
  },
  sectionBody: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    lineHeight: typography.caption.lineHeight,
    marginBottom: spacing.xs,
  },
  checkboxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 118, 110, 0.04)',
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.15)',
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  checkboxBoxChecked: {
    backgroundColor: colors.primary,
  },
  checkmarkText: {
    color: colors.textInverted,
    fontWeight: '800',
    fontSize: 14,
  },
  checkboxText: {
    flex: 1,
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
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

export default TermsConditionsScreen;
