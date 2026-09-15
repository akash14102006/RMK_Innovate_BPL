import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { radii, spacing, typography } from '../../theme/tokens';

export interface ProfileHeroCardProps {
  percentage: number;
  isComplete: boolean;
  onPressCTA: () => void;
}

export const ProfileHeroCard: React.FC<ProfileHeroCardProps> = ({
  percentage,
  isComplete,
  onPressCTA,
}) => {
  const displayPct = Math.min(100, Math.max(0, Math.round(percentage)));

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Top Tag & Pulse Icon */}
        <View style={styles.topRow}>
          <View style={styles.badgePill}>
            <Text style={styles.badgeText}>PROFILE HEALTH</Text>
          </View>
          <View style={styles.iconCircle}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                stroke="rgba(255, 255, 255, 0.8)"
                strokeWidth={1.8}
              />
              <Path d="M7 12h2.5l1.5-3 2 6 1.5-3H17" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
        </View>

        {/* Center: Large Percentage & Headline */}
        <View style={styles.centerSection}>
          <View style={styles.percentageRow}>
            <Text style={styles.percentageNumber}>{displayPct}</Text>
            <Text style={styles.percentageSymbol}>%</Text>
          </View>
          <Text style={styles.headline}>
            {isComplete || displayPct === 100 ? 'Profile Ready' : 'Profile in Progress'}
          </Text>
          <Text style={styles.supportingText}>
            {isComplete || displayPct === 100
              ? 'Your health profile is complete and verified for hospital triage.'
              : 'Complete remaining details for instant QR emergency access.'}
          </Text>
        </View>

        {/* Progress Track */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${displayPct}%` }]} />
        </View>

        {/* Bottom CTA Button */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={onPressCTA}
          accessibilityRole="button"
          accessibilityLabel={isComplete ? 'View Profile Summary' : 'Complete remaining details'}
          activeOpacity={0.88}
        >
          <Text style={styles.ctaButtonText}>
            {isComplete || displayPct === 100 ? 'View Profile Summary →' : 'Complete remaining details →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: '#0F766E', // Rich medical brand teal
    borderRadius: 24,
    padding: spacing.lg,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSection: {
    alignItems: 'flex-start',
  },
  percentageRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginBottom: 2,
  },
  percentageNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 52,
    letterSpacing: -1,
  },
  percentageSymbol: {
    fontSize: 22,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  headline: {
    fontSize: typography.titleMedium.fontSize,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  supportingText: {
    fontSize: typography.bodySmall.fontSize,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
  },
  progressTrack: {
    height: 6,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radii.full,
    backgroundColor: '#34D399', // Radiant emerald fill
  },
  ctaButton: {
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  ctaButtonText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '800',
    color: '#0F766E',
    letterSpacing: -0.1,
  },
});

export default ProfileHeroCard;
