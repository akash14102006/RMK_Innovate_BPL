import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { HealthSnapshotSummary } from '../../types/profile';
import { colors, spacing, radii, typography } from '../../theme/tokens';

export interface HealthSnapshotCardProps {
  data: HealthSnapshotSummary;
  onPress: () => void;
}

export const HealthSnapshotCard: React.FC<HealthSnapshotCardProps> = ({ data, onPress }) => {
  const percentage = data.completionPercentage !== undefined ? data.completionPercentage : 100;
  const isComplete = percentage >= 100;

  const badgeColor = isComplete ? '#059669' : percentage >= 50 ? '#2563EB' : '#D97706';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${data.statusTitle}: ${data.statusBadge}. ${data.statusDescription}. Tap to manage profile.`}
      activeOpacity={0.88}
    >
      <View style={styles.cardTopRow}>
        <View style={styles.cardLeft}>
          <View style={[styles.iconBox, isComplete && styles.iconBoxComplete]}>
            <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                stroke="#FFFFFF"
                strokeWidth={2}
                fill="rgba(255, 255, 255, 0.2)"
              />
              <Path
                d="M7 12h2.5l1.5-3 2 6 1.5-3H17"
                stroke="#FFFFFF"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.label}>{data.statusTitle}</Text>
            <View style={styles.statusRow}>
              <Text style={[styles.statusBadgeText, { color: badgeColor }]}>{data.statusBadge}</Text>
              {isComplete && (
                <View style={styles.verifiedPill}>
                  <Text style={styles.verifiedText}>✓ Verified</Text>
                </View>
              )}
            </View>
            <Text style={styles.subtext} numberOfLines={1}>{data.statusDescription}</Text>
          </View>
        </View>

        <View style={styles.chevronBox}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M9 18l6-6-6-6" stroke={colors.textSecondary} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
      </View>

      {/* Real-time Progress Bar if not 100% */}
      {!isComplete && (
        <View style={styles.progressSection}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: badgeColor }]} />
          </View>
          <Text style={styles.progressNote}>Tap to complete remaining profile steps →</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.12)',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: radii.lg,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  iconBoxComplete: {
    backgroundColor: '#059669',
    shadowColor: '#059669',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBadgeText: {
    fontSize: typography.titleLarge.fontSize,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  verifiedPill: {
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  subtext: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chevronBox: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressSection: {
    gap: 4,
    paddingTop: 2,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(226, 232, 240, 0.8)',
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radii.full,
  },
  progressNote: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
});

export default HealthSnapshotCard;
