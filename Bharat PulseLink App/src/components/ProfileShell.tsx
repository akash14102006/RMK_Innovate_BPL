import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import AppLottieView from './common/AppLottieView';
import { colors, spacing, radii, typography } from '../theme/tokens';
import useReducedMotion from '../theme/useReducedMotion';
import MotionContainer from './MotionContainer';
import GlassCard from './GlassCard';

export interface ProfileShellProps {
  stepNumber: number; // 1 to 16
  totalSteps?: number; // Default 16
  title: string;
  subtitle: string;
  heroIcon?: string;
  profileProgressPct?: number; // Dynamic completion %
  onBack?: () => void;
  onNext: () => void;
  onSkip?: () => void;
  onLater?: () => void;
  isNextDisabled?: boolean;
  isNextLoading?: boolean;
  nextButtonText?: string;
  showSkip?: boolean;
  children: React.ReactNode;
}

export const ProfileShell: React.FC<ProfileShellProps> = ({
  stepNumber,
  totalSteps = 16,
  title,
  subtitle,
  heroIcon,
  profileProgressPct = 6,
  onBack,
  onNext,
  onSkip,
  onLater,
  isNextDisabled = false,
  isNextLoading = false,
  nextButtonText = 'Continue →',
  showSkip = true,
  children,
}) => {
  const reduceMotion = useReducedMotion();
  const isCompleteStep = stepNumber === 16;
  const displayPct = isCompleteStep ? 100 : Math.min(99, Math.max(6, Math.round(profileProgressPct)));

  const renderFixedHero = () => {
    let lottieSource = null;

    switch (stepNumber) {
      case 1:
        lottieSource = require('../../assets/animations/basic-information.json');
        break;
      case 2:
        lottieSource = require('../../assets/animations/contact-details.json');
        break;
      case 3:
        lottieSource = require('../../assets/animations/identification-details.json');
        break;
      case 4:
      case 5:
      case 6:
      case 7:
      case 8:
      case 9:
        lottieSource = require('../../assets/animations/health-basics.json');
        break;
      case 10:
        lottieSource = require('../../assets/animations/emergency-contact.json');
        break;
      case 11:
        lottieSource = require('../../assets/animations/insurance-details.json');
        break;
      case 12:
        lottieSource = require('../../assets/animations/document-upload.json');
        break;
      case 13:
        lottieSource = require('../../assets/animations/vital-records.json');
        break;
      case 16:
        lottieSource = require('../../assets/animations/profile-done.json');
        break;
      default:
        lottieSource = null;
        break;
    }

    if (lottieSource) {
      return (
        <View style={styles.fixedLottieWrapper}>
          <AppLottieView
            source={lottieSource}
            autoPlay={!reduceMotion}
            loop={!reduceMotion}
            style={styles.largeHeroLottie}
            resizeMode="contain"
          />
        </View>
      );
    }

    // Fallback vector icon badge for steps 14 & 15 (Review & Security)
    return (
      <View style={styles.fixedHeroBadge}>
        {renderSectionIcon()}
      </View>
    );
  };

  const renderSectionIcon = () => {
    switch (heroIcon) {
      case 'checklist':
        return (
          <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
            <Path d="M9 11l3 3L22 4" stroke={colors.success} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" />
          </Svg>
        );
      case 'shield-check':
      case 'shield':
        return (
          <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
            <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={colors.primary} strokeWidth={2.2} strokeLinejoin="round" />
            <Path d="M9 12l2 2 4-4" stroke={colors.success} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        );
      default:
        return (
          <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={9} stroke={colors.primary} strokeWidth={2} />
          </Svg>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          {/* ==================================================== */}
          {/* 1. FIXED TOP HEADER                                  */}
          {/* ==================================================== */}
          <View style={styles.topHeader}>
            {onBack && !isCompleteStep ? (
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <View style={styles.backButtonRow}>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M19 12H5M12 19l-7-7 7-7"
                      stroke={colors.primary}
                      strokeWidth={2.4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                  <Text style={styles.backText}>Back</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.headerPlaceholder} />
            )}

            <View style={styles.headerProgressBadge}>
              <Text style={styles.progressText}>
                Profile {displayPct}% Complete
              </Text>
            </View>

            {/* Top Right "Later" Pill Button */}
            {!isCompleteStep && (onLater || onSkip) ? (
              <TouchableOpacity
                style={styles.laterButton}
                onPress={onLater || onSkip}
                accessibilityRole="button"
                accessibilityLabel="Build profile later"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.laterText}>Later</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.headerPlaceholder} />
            )}
          </View>

          {/* Progress Bar Track */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${displayPct}%` }]} />
          </View>

          {/* ==================================================== */}
          {/* 2. FIXED HERO + TITLE + DESCRIPTION                  */}
          {/* ==================================================== */}
          <View style={styles.fixedHeroContainer}>
            {renderFixedHero()}
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          </View>

          {/* ==================================================== */}
          {/* 3. SCROLL ONLY: FORM CONTENT                         */}
          {/* ==================================================== */}
          <View style={styles.scrollWrapper}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <MotionContainer>
                <GlassCard style={styles.formCard}>{children}</GlassCard>
              </MotionContainer>
            </ScrollView>
          </View>

          {/* ==================================================== */}
          {/* 4. FIXED BOTTOM CTA                                  */}
          {/* ==================================================== */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.nextButton, isNextDisabled && styles.nextButtonDisabled]}
              onPress={onNext}
              disabled={isNextDisabled || isNextLoading}
              accessibilityRole="button"
              accessibilityLabel={nextButtonText}
              activeOpacity={0.88}
            >
              {isNextLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.nextButtonText}>{nextButtonText}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flexOne: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    height: 48,
  },
  backButton: {
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
    justifyContent: 'center',
  },
  backButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: colors.primary,
  },
  headerProgressBadge: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '700',
    color: colors.success,
    letterSpacing: 0.3,
  },
  laterButton: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: radii.full,
    backgroundColor: 'rgba(15, 118, 110, 0.08)',
    borderColor: 'rgba(15, 118, 110, 0.22)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  laterText: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '700',
    color: colors.primary,
  },
  headerPlaceholder: {
    width: 60,
  },
  progressTrack: {
    height: 5,
    backgroundColor: colors.border,
    borderRadius: radii.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: radii.full,
  },
  fixedHeroContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  fixedLottieWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 155,
    marginBottom: 4,
  },
  largeHeroLottie: {
    width: 155,
    height: 155,
  },
  fixedHeroBadge: {
    width: 68,
    height: 68,
    borderRadius: radii.full,
    backgroundColor: 'rgba(15, 118, 110, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.15)',
  },
  title: {
    fontSize: typography.titleLarge.fontSize,
    fontWeight: typography.titleLarge.fontWeight,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.sm,
    marginBottom: 4,
  },
  scrollWrapper: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.md,
  },
  formCard: {
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  footer: {
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  nextButton: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonDisabled: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  nextButtonText: {
    fontSize: typography.titleMedium.fontSize,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default ProfileShell;
