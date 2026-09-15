import React, { useEffect, useRef } from 'react';
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
import { OnboardingStackParamList } from '../navigation/types';
import { colors, spacing, typography, radii } from '../theme/tokens';
import { motionTokens } from '../theme/motion';
import useReducedMotion from '../theme/useReducedMotion';
import OnboardingProgressIndicator from '../components/OnboardingProgressIndicator';
import OnboardingHeroScreen1 from '../components/OnboardingHeroScreen1';
import OnboardingManager from '../services/onboardingManager';
import { useI18n } from '../i18n/I18nContext';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingScreen1'>;

export const OnboardingScreen1: React.FC<Props> = ({ navigation }) => {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    console.log('[ROUTE] ONBOARDING_1');

    if (reduceMotion) {
      contentOpacity.setValue(1);
      contentTranslateY.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: motionTokens.duration.normal,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: motionTokens.duration.normal,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [reduceMotion]);

  const handleSkip = async () => {
    try {
      console.log('[ROUTE] ONBOARDING_SKIPPED');
      await OnboardingManager.setOnboardingCompleted();
      const parent = navigation.getParent();
      if (parent) {
        console.log('[ROUTE] NAVIGATING_TO_LANGUAGE_SELECTION');
        (parent as any).navigate('LanguageSelection');
      } else {
        (navigation as any).navigate('LanguageSelection');
      }
    } catch (_err) {
      (navigation as any).navigate('LanguageSelection');
    }
  };

  const handleContinue = () => {
    navigation.navigate('OnboardingScreen2');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header: Progress Indicator + Skip */}
        <View style={styles.header}>
          <OnboardingProgressIndicator currentStep={1} totalSteps={4} />
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.common.skip')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.skipText}>{t('onboarding.common.skip')}</Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable Content Area */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Hero Visual Area */}
          <View style={styles.heroSection}>
            <OnboardingHeroScreen1
              accessibilityLabel={t('onboarding.screen1.accessibilityHero')}
            />
          </View>

          {/* Text Content Area */}
          <Animated.View
            style={[
              styles.textSection,
              {
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslateY }],
              },
            ]}
          >
            <Text style={styles.eyebrow}>{t('onboarding.screen1.eyebrow')}</Text>
            <Text style={styles.title}>{t('onboarding.screen1.title')}</Text>
            <Text style={styles.description}>
              {t('onboarding.screen1.description')}
            </Text>
          </Animated.View>
        </ScrollView>

        {/* Bottom Action Area */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.common.continue')}
            activeOpacity={0.88}
          >
            <Text style={styles.continueButtonText}>
              {t('onboarding.common.continue')} →
            </Text>
          </TouchableOpacity>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    height: 56,
  },
  skipButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  skipText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.lg,
  },
  textSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  eyebrow: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  title: {
    fontSize: typography.titleLarge.fontSize,
    fontWeight: typography.titleLarge.fontWeight,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    lineHeight: typography.titleLarge.lineHeight,
  },
  description: {
    fontSize: typography.bodyMedium.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.bodyMedium.lineHeight,
    maxWidth: 320,
  },
  bottomBar: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  continueButton: {
    width: '100%',
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  continueButtonText: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.textInverted,
  },
});

export default OnboardingScreen1;
