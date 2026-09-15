import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors, spacing, radii, typography } from '../../theme/tokens';
import { AppointmentItem } from '../../types/appointments';
import AppointmentStatusPill from './AppointmentStatusPill';

export interface AppointmentCardProps {
  appointment: AppointmentItem;
  onPress: (appointment: AppointmentItem) => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(appointment)}
      accessibilityRole="button"
      accessibilityLabel={`Appointment at ${appointment.hospitalName}, ${appointment.department} on ${appointment.displayDate} at ${appointment.displayTime}. Status: ${appointment.status}`}
      activeOpacity={0.85}
    >
      {/* Top Header: Facility Icon + Hospital & Dept */}
      <View style={styles.cardHeader}>
        <View style={styles.facilityIconBox}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2zM9 10h6M12 7v6"
              stroke="#0F766E"
              strokeWidth={2.2}
              strokeLinecap="round"
            />
          </Svg>
        </View>

        <View style={styles.titleCol}>
          <Text style={styles.hospitalName} numberOfLines={1}>
            {appointment.hospitalName}
          </Text>
          <Text style={styles.deptName} numberOfLines={1}>
            {appointment.department} {appointment.specialty ? `• ${appointment.specialty}` : ''}
          </Text>
        </View>

        <AppointmentStatusPill status={appointment.status} />
      </View>

      {/* Center Details: Doctor if available */}
      {appointment.doctorName ? (
        <View style={styles.doctorRow}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#64748B" strokeWidth={2} />
            <Rect x={8} y={3} width={8} height={8} rx={4} stroke="#64748B" strokeWidth={2} />
          </Svg>
          <Text style={styles.doctorName}>Dr. {appointment.doctorName}</Text>
        </View>
      ) : null}

      {/* Date & Time Capsule Bar */}
      <View style={styles.timeCapsuleBar}>
        <View style={styles.timeItem}>
          <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
            <Rect x={3} y={4} width={18} height={18} rx={2} stroke="#0F766E" strokeWidth={2} />
            <Path d="M16 2v4M8 2v4M3 10h18" stroke="#0F766E" strokeWidth={2} strokeLinecap="round" />
          </Svg>
          <Text style={styles.timeText}>{appointment.displayDate}</Text>
        </View>

        <View style={styles.timeDivider} />

        <View style={styles.timeItem}>
          <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
            <Rect x={2} y={2} width={20} height={20} rx={10} stroke="#0F766E" strokeWidth={2} />
            <Path d="M12 6v6l4 2" stroke="#0F766E" strokeWidth={2} strokeLinecap="round" />
          </Svg>
          <Text style={styles.timeText}>{appointment.displayTime}</Text>
        </View>
      </View>

      {/* Bottom CTA Action Row */}
      <View style={styles.cardFooter}>
        <Text style={styles.bookingRefText}>
          {appointment.bookingReference ? `Ref: ${appointment.bookingReference}` : 'Hospital Booking'}
        </Text>
        <Text style={styles.detailsActionText}>View Details →</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  facilityIconBox: {
    width: 38,
    height: 38,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(15, 118, 110, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
  },
  hospitalName: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  deptName: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginTop: 1,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  doctorName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  timeCapsuleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: radii.lg,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  timeItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  timeDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#CBD5E1',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.7)',
    paddingTop: 8,
  },
  bookingRefText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  detailsActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F766E',
  },
});

export default AppointmentCard;
