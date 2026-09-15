import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { AppointmentItem } from '../../types/profile';
import { colors, spacing, radii, typography } from '../../theme/tokens';

export interface TodayCareSectionProps {
  appointment: AppointmentItem | null;
  onPressFindCare: () => void;
  onPressViewDetails?: (item: AppointmentItem) => void;
}

export const TodayCareSection: React.FC<TodayCareSectionProps> = ({
  appointment,
  onPressFindCare,
  onPressViewDetails,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Today's Care</Text>

      {appointment ? (
        <TouchableOpacity
          style={styles.appointmentCard}
          onPress={() => onPressViewDetails?.(appointment)}
          accessibilityRole="button"
          accessibilityLabel={`Scheduled care at ${appointment.hospitalName}`}
          activeOpacity={0.88}
        >
          <View style={styles.cardHeader}>
            <View style={styles.hospitalDot} />
            <Text style={styles.appointmentTime}>{appointment.displayDateText}</Text>
          </View>
          <Text style={styles.hospitalName}>{appointment.hospitalName}</Text>
          {appointment.department ? (
            <Text style={styles.departmentName}>{appointment.department}</Text>
          ) : null}
        </TouchableOpacity>
      ) : (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconBox}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Circle cx={12} cy={12} r={10} stroke="#0F766E" strokeWidth={1.8} />
              <Path d="M12 6v6l4 2" stroke="#0F766E" strokeWidth={1.8} strokeLinecap="round" />
            </Svg>
          </View>

          <View style={styles.emptyTextCol}>
            <Text style={styles.emptyHeadline}>No upcoming care</Text>
            <Text style={styles.emptySubtitle}>Find verified care when you need it.</Text>
          </View>

          <TouchableOpacity
            style={styles.findCareBtn}
            onPress={onPressFindCare}
            accessibilityRole="button"
            accessibilityLabel="Find verified healthcare facilities"
            activeOpacity={0.85}
          >
            <Text style={styles.findCareBtnText}>Find Care →</Text>
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
  sectionTitle: {
    fontSize: typography.titleSmall.fontSize,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    letterSpacing: -0.2,
  },
  appointmentCard: {
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.2)',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hospitalDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    backgroundColor: '#0F766E',
  },
  appointmentTime: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  hospitalName: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  departmentName: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
  },
  emptyCard: {
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  emptyIconBox: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: 'rgba(15, 118, 110, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTextCol: {
    flex: 1,
  },
  emptyHeadline: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  findCareBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: radii.md,
    backgroundColor: 'rgba(15, 118, 110, 0.08)',
  },
  findCareBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F766E',
  },
});

export default TodayCareSection;
