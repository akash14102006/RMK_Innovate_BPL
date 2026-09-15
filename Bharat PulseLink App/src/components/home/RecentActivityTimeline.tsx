import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ActivityFeedItem } from '../../types/profile';
import { colors, spacing, radii, typography } from '../../theme/tokens';

export interface RecentActivityTimelineProps {
  activities: ActivityFeedItem[];
  onPressViewAll: () => void;
}

export const RecentActivityTimeline: React.FC<RecentActivityTimelineProps> = ({
  activities,
  onPressViewAll,
}) => {
  if (!activities || activities.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Recent Health Activity</Text>
        <TouchableOpacity onPress={onPressViewAll} accessibilityRole="button" accessibilityLabel="View all recent activity">
          <Text style={styles.viewAllText}>View Vault →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {activities.map((item) => (
          <View key={item.id} style={styles.activityCard}>
            <View style={styles.iconCircle}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                  stroke="#4F46E5"
                  strokeWidth={2}
                />
                <Path d="M9 12l2 2 4-4" stroke="#4F46E5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>

            <View style={styles.textCol}>
              <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
            </View>

            <View style={styles.timePill}>
              <Text style={styles.timeText}>{item.timestampText}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.titleSmall.fontSize,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  list: {
    gap: 8,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    gap: spacing.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  description: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  timePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
    backgroundColor: colors.background,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

export default RecentActivityTimeline;
