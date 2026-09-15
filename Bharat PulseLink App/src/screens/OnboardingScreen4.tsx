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
import OnboardingHeroScreen4 from '../components/OnboardingHeroScreen4';
import OnboardingManager from '../services/onboardingManager';
import { useI18n } from '../i18n/I18nContext';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingScreen4'>;

export const OnboardingScreen4: React.FC<Props> = ({ navigation }) => {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    console.log('[ROUTE] ONBOARDING_4');
    console.log('[ROUTE] ONBOARDING_SCREEN_4_MOUNTED');

    if (reduceMotion) {
      contentOpacity.setValue(1);
      contentTranslateY.setValue(0);
      return;
    }

    Animated.parallel([
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

  const handleFinish = async () => {
    try {
      console.log('[ROUTE] ONBOARDING_COMPLETED');
      await OnboardingManager.setOnboardingCompleted();
      const parentNav = navigation.getParent();
      if (parentNav) {
        console.log('[ROUTE] LANGUAGE_SELECTION_ROUTE');
        (parentNav as any).navigate('LanguageSelection');
      } else {
        (navigation as any).navigate('LanguageSelection');
      }
    } catch (_err) {
      const parentNav = navigation.getParent();
      if (parentNav) {
        (parentNav as any).navigate('LanguageSelection');
      }
    }
  };

  const handleBack = () => {
    navigation.goBack();
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
            accessibilityLabel={t('onboarding.common.back')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.backText}>← {t('onboarding.common.back')}</Text>
          </TouchableOpacity>

          <OnboardingProgressIndicator currentStep={4} totalSteps={4} />

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleFinish}
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
            <OnboardingHeroScreen4
              accessibilityLabel={t('onboarding.screen4.accessibilityHero')}
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
            <Text style={styles.eyebrow}>{t('onboarding.screen4.eyebrow')}</Text>
            <Text style={styles.title}>{t('onboarding.screen4.title')}</Text>
            <Text style={styles.description}>
              {t('onboarding.screen4.description')}
            </Text>
          </Animated.View>
        </ScrollView>

        {/* Bottom Action Area */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleFinish}
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.common.getStarted')}
            activeOpacity={0.88}
          >
            <Text style={styles.continueButtonText}>
              {t('onboarding.common.getStarted')} →
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
  backButton: {
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
  },
  backText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: colors.primary,
  },
  skipButton: {
    paddingVertical: spacing.xs,
    paddingLeft: spacing.sm,
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

export default OnboardingScreen4;
