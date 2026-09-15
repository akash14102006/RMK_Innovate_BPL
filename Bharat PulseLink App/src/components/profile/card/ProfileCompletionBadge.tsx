/**
 * Bharat PulseLink — Profile Completion Badge
 *
 * Displays server-authoritative profile completion status.
 * Integrated with Prompt 90 Patient Completion Engine.
 *
 * Owned by: Patient Profile & UI Design Domain (Prompt 93/Master UI)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProfileCompletionBadgeProps {
  percentage: number;
  isDark?: boolean;
}

export const ProfileCompletionBadge: React.FC<ProfileCompletionBadgeProps> = ({
  percentage = 100,
  isDark = false,
}) => {
  const boundedPercentage = Math.min(Math.max(percentage, 0), 100);
  const isComplete = boundedPercentage === 100;

  const trackBg = isDark ? '#334155' : '#E2E8F0';
  const fillBg = isComplete
    ? (isDark ? '#34D399' : '#059669')
    : (isDark ? '#38BDF8' : '#0284C7');
  const labelColor = isDark ? '#94A3B8' : '#64748B';
  const percentColor = isDark ? '#F1F5F9' : '#0F172A';

  return (
    <View
      style={styles.container}
      accessibilityRole="text"
      accessibilityLabel={`Profile is ${boundedPercentage} percent complete`}
    >
      <View style={styles.textRow}>
        <Text style={[styles.label, { color: labelColor }]}>
          {isComplete ? 'Profile Complete' : 'Profile Completion'}
        </Text>
        <Text style={[styles.percentage, { color: percentColor }]}>
          {boundedPercentage}%
        </Text>
      </View>

      <View style={[styles.progressBarTrack, { backgroundColor: trackBg }]}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${boundedPercentage}%`,
              backgroundColor: fillBg,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 12,
  },
  textRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  percentage: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});

export default ProfileCompletionBadge;
