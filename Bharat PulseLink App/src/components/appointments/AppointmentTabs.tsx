import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { radii, spacing, typography } from '../../theme/tokens';
import { AppointmentTab } from '../../types/appointments';

export interface AppointmentTabsProps {
  activeTab: AppointmentTab;
  onSelectTab: (tab: AppointmentTab) => void;
  upcomingCount?: number;
  completedCount?: number;
}

export const AppointmentTabs: React.FC<AppointmentTabsProps> = ({
  activeTab,
  onSelectTab,
  upcomingCount,
  completedCount,
}) => {
  const isUpcoming = activeTab === 'UPCOMING';
  const isCompleted = activeTab === 'COMPLETED';

  return (
    <View style={styles.container}>
      <View style={styles.segmentedTrack}>
        {/* Upcoming Tab */}
        <TouchableOpacity
          style={[styles.tabButton, isUpcoming && styles.tabButtonActive]}
          onPress={() => onSelectTab('UPCOMING')}
          accessibilityRole="tab"
          accessibilityState={{ selected: isUpcoming }}
          accessibilityLabel={`Upcoming Appointments, ${upcomingCount ?? 0} scheduled`}
          activeOpacity={0.85}
        >
          <Text style={[styles.tabText, isUpcoming && styles.tabTextActive]}>Upcoming</Text>
          {upcomingCount !== undefined && upcomingCount > 0 && (
            <View style={[styles.countBadge, isUpcoming && styles.countBadgeActive]}>
              <Text style={[styles.countText, isUpcoming && styles.countTextActive]}>{upcomingCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Completed Tab */}
        <TouchableOpacity
          style={[styles.tabButton, isCompleted && styles.tabButtonActive]}
          onPress={() => onSelectTab('COMPLETED')}
          accessibilityRole="tab"
          accessibilityState={{ selected: isCompleted }}
          accessibilityLabel={`Completed Appointments, ${completedCount ?? 0} history`}
          activeOpacity={0.85}
        >
          <Text style={[styles.tabText, isCompleted && styles.tabTextActive]}>Completed</Text>
          {completedCount !== undefined && completedCount > 0 && (
            <View style={[styles.countBadge, isCompleted && styles.countBadgeActive]}>
              <Text style={[styles.countText, isCompleted && styles.countTextActive]}>{completedCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.8)',
  },
  segmentedTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: radii.xl,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: radii.lg,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#0F766E', // Premium brand teal
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.full,
    backgroundColor: '#E2E8F0',
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  countText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  countTextActive: {
    color: '#FFFFFF',
  },
});

export default AppointmentTabs;
