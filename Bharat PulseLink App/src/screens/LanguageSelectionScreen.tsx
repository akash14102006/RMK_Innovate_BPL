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
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography, radii } from '../theme/tokens';
import { motionTokens } from '../theme/motion';
import useReducedMotion from '../theme/useReducedMotion';
import { useI18n } from '../i18n/I18nContext';
import { SUPPORTED_LANGUAGES, LanguageDescriptor } from '../i18n/languages';
import LanguageHeroVisual from '../components/LanguageHeroVisual';
import LanguageOptionCard from '../components/LanguageOptionCard';

type Props = NativeStackScreenProps<RootStackParamList, 'LanguageSelection'>;

export const LanguageSelectionScreen: React.FC<Props> = ({ navigation }) => {
  const { language, setLanguage, t } = useI18n();
  const reduceMotion = useReducedMotion();
  const isNavigatingRef = useRef(false);

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    console.log('[ROUTE] LANGUAGE');

    if (reduceMotion) {
      contentOpacity.setValue(1);
      contentTranslateY.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: motionTokens.duration.normal,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: motionTokens.duration.normal,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [reduceMotion]);

  const handleSelectLanguage = async (code: string) => {
    await setLanguage(code);
  };

  const handleContinue = () => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    navigation.navigate('AuthStack', { screen: 'AuthEntry' });

    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Outer Card Frame Matching Reference Visual Hierarchy */}
        <Animated.View
          style={[
            styles.cardFrame,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslateY }],
            },
          ]}
        >
          {/* Header Step Pill */}
          <View style={styles.headerPill}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>3</Text>
            </View>
            <Text style={styles.headerPillText}>
              {t('languageSelection.title')}
            </Text>
          </View>

          {/* Large Authoritative Lottie Animation Hero (165dp) */}
          <View style={styles.heroSection}>
            <LanguageHeroVisual
              size={165}
              accessibilityLabel={t('languageSelection.accessibilityHero')}
            />
          </View>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            {t('languageSelection.subtitle')}
          </Text>

          {/* Vertically Scrollable Language List */}
          <ScrollView
            style={styles.optionsScrollView}
            contentContainerStyle={styles.optionsScrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {SUPPORTED_LANGUAGES.map((langDesc: LanguageDescriptor) => {
              const isSelected = language === langDesc.code;
              return (
                <LanguageOptionCard
                  key={langDesc.id}
                  descriptor={langDesc}
                  isSelected={isSelected}
                  onSelect={handleSelectLanguage}
                  accessibilityLabel={
                    isSelected
                      ? t('languageSelection.accessibilityOptionSelected', {
                          language: langDesc.name,
                        })
                      : t('languageSelection.accessibilityOption', {
                          language: langDesc.name,
                        })
                  }
                />
              );
            })}
          </ScrollView>

          {/* Bottom Action Bar */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
              accessibilityRole="button"
              accessibilityLabel={t('languageSelection.continue')}
              activeOpacity={0.88}
            >
              <Text style={styles.continueButtonText}>
                {t('languageSelection.continue')} →
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
  },
  cardFrame: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs + 2,
    borderRadius: radii.full,
    marginBottom: spacing.xs,
  },
  stepBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  headerPillText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
  },
  subtitle: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    lineHeight: typography.bodySmall.lineHeight,
    paddingHorizontal: spacing.sm,
  },
  optionsScrollView: {
    flex: 1,
    marginVertical: spacing.xs,
  },
  optionsScrollContent: {
    paddingVertical: spacing.xxs,
    paddingBottom: spacing.md,
  },
  bottomBar: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    alignItems: 'center',
  },
  continueButton: {
    width: '100%',
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 2,
  },
  continueButtonText: {
    fontSize: typography.bodyMedium.fontSize + 1,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default LanguageSelectionScreen;
