import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AppointmentItem } from '../../types/profile';
import { colors, spacing, radii, typography } from '../../theme/tokens';

export interface NextAppointmentCardProps {
  appointment: AppointmentItem | null;
  onPressViewDetails: () => void;
  onPressFindHospital: () => void;
}

export const NextAppointmentCard: React.FC<NextAppointmentCardProps> = ({
  appointment,
  onPressViewDetails,
  onPressFindHospital,
}) => {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        {/* Top Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Next Appointment</Text>
          <View style={styles.hospitalIcon}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2zM9 10h6M12 7v6"
                stroke="rgba(255, 255, 255, 0.7)"
                strokeWidth={2}
                strokeLinecap="round"
              />
            </Svg>
          </View>
        </View>

        {appointment ? (
          <>
            {/* Populated Appointment Details */}
            <Text style={styles.hospitalName} numberOfLines={1}>
              {appointment.hospitalName}
            </Text>
            <Text style={styles.appointmentTime}>
              {appointment.displayDateText}
              {appointment.department ? ` • ${appointment.department}` : ''}
            </Text>

            <TouchableOpacity
              style={styles.detailsButton}
              onPress={onPressViewDetails}
              accessibilityRole="button"
              accessibilityLabel="View Appointment Details"
              activeOpacity={0.9}
            >
              <Text style={styles.detailsButtonText}>View Details</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Honest Empty State */}
            <Text style={styles.emptyTitle}>No upcoming appointments</Text>
            <Text style={styles.emptySubtitle}>
              Find a verified hospital or clinic when you need medical care.
            </Text>

            <TouchableOpacity
              style={styles.detailsButton}
              onPress={onPressFindHospital}
              accessibilityRole="button"
              accessibilityLabel="Find Hospitals and book care"
              activeOpacity={0.9}
            >
              <Text style={styles.detailsButtonText}>Find Hospitals →</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: spacing.md,
  },
  card: {
    padding: spacing.md,
    borderRadius: radii.xl,
    backgroundColor: '#4F46E5', // Indigo primary healthcare gradient tone
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.2,
  },
  hospitalIcon: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hospitalName: {
    fontSize: typography.titleLarge.fontSize,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  appointmentTime: {
    fontSize: typography.bodyMedium.fontSize,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.titleMedium.fontSize,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  emptySubtitle: {
    fontSize: typography.bodySmall.fontSize,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  detailsButton: {
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  detailsButtonText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: '#4F46E5',
  },
});

export default NextAppointmentCard;
