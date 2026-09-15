import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { AppointmentItem } from '../../types/profile';
import { colors, spacing, radii, typography } from '../../theme/tokens';

export interface TodayCareTimelineProps {
  careItems: AppointmentItem[];
  onPressBookCare: () => void;
  onPressItem?: (item: AppointmentItem) => void;
}

export const TodayCareTimeline: React.FC<TodayCareTimelineProps> = ({
  careItems,
  onPressBookCare,
  onPressItem,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Today at a Glance</Text>
        <Text style={styles.dateBadge}>Today</Text>
      </View>

      {careItems && careItems.length > 0 ? (
        <View style={styles.timelineList}>
          {careItems.map((item, index) => (
            <TouchableOpacity
              key={item.id || index}
              style={styles.timelineCard}
              onPress={() => onPressItem?.(item)}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel={`Scheduled care: ${item.hospitalName} at ${item.displayDateText}`}
            >
              <View style={styles.timeCol}>
                <View style={styles.timelineDot} />
                {index < careItems.length - 1 && <View style={styles.timelineLine} />}
              </View>

              <View style={styles.careDetails}>
                <Text style={styles.careTime}>{item.displayDateText}</Text>
                <Text style={styles.careHospital}>{item.hospitalName}</Text>
                {item.department ? <Text style={styles.careDept}>{item.department}</Text> : null}
              </View>

              <View style={styles.statusPill}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Circle cx={12} cy={12} r={10} stroke="#4F46E5" strokeWidth={1.8} />
              <Path d="M12 6v6l4 2" stroke="#4F46E5" strokeWidth={1.8} strokeLinecap="round" />
            </Svg>
          </View>
          <View style={styles.emptyTextCol}>
            <Text style={styles.emptyTitle}>No Clinical Visits Scheduled Today</Text>
            <Text style={styles.emptyDesc}>Your vitals and active records are safe. Book hospital care when needed.</Text>
          </View>
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={onPressBookCare}
            accessibilityRole="button"
            accessibilityLabel="Find Hospital and Book Care"
          >
            <Text style={styles.bookBtnText}>Find Care →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
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
  dateBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    backgroundColor: colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timelineList: {
    gap: 8,
  },
  timelineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  timeCol: {
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: radii.full,
    backgroundColor: '#4F46E5',
  },
  timelineLine: {
    width: 2,
    height: 30,
    backgroundColor: 'rgba(79, 70, 229, 0.2)',
    marginTop: 2,
  },
  careDetails: {
    flex: 1,
  },
  careTime: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
    marginBottom: 2,
  },
  careHospital: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  careDept: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginTop: 1,
  },
  statusPill: {
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4F46E5',
  },
  emptyCard: {
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  emptyIconCircle: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTextCol: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptyDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  bookBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.md,
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
  },
  bookBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
});

export default TodayCareTimeline;
