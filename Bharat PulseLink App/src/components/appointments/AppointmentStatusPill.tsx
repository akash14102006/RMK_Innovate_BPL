import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { radii } from '../../theme/tokens';
import { AppointmentStatus } from '../../types/appointments';

export interface AppointmentStatusPillProps {
  status: AppointmentStatus;
}

export const AppointmentStatusPill: React.FC<AppointmentStatusPillProps> = ({ status }) => {
  const getStatusConfig = (st: AppointmentStatus) => {
    switch (st) {
      case 'CONFIRMED':
        return {
          label: 'Confirmed',
          textColor: '#059669',
          bgColor: 'rgba(5, 150, 105, 0.1)',
          borderColor: 'rgba(5, 150, 105, 0.2)',
        };
      case 'PENDING':
        return {
          label: 'Pending',
          textColor: '#D97706',
          bgColor: 'rgba(217, 119, 6, 0.1)',
          borderColor: 'rgba(217, 119, 6, 0.2)',
        };
      case 'RESCHEDULED':
        return {
          label: 'Rescheduled',
          textColor: '#0284C7',
          bgColor: 'rgba(2, 132, 199, 0.1)',
          borderColor: 'rgba(2, 132, 199, 0.2)',
        };
      case 'COMPLETED':
        return {
          label: 'Completed',
          textColor: '#0F766E',
          bgColor: 'rgba(15, 118, 110, 0.1)',
          borderColor: 'rgba(15, 118, 110, 0.2)',
        };
      case 'CANCELLED':
        return {
          label: 'Cancelled',
          textColor: '#64748B',
          bgColor: 'rgba(100, 116, 139, 0.1)',
          borderColor: 'rgba(100, 116, 139, 0.2)',
        };
      case 'NO_SHOW':
        return {
          label: 'No Show',
          textColor: '#EA580C',
          bgColor: 'rgba(234, 88, 12, 0.1)',
          borderColor: 'rgba(234, 88, 12, 0.2)',
        };
      case 'REQUIRES_ACTION':
        return {
          label: 'Action Required',
          textColor: '#DC2626',
          bgColor: 'rgba(220, 38, 38, 0.1)',
          borderColor: 'rgba(220, 38, 38, 0.2)',
        };
      case 'EXPIRED':
      default:
        return {
          label: 'Expired',
          textColor: '#94A3B8',
          bgColor: 'rgba(148, 163, 184, 0.1)',
          borderColor: 'rgba(148, 163, 184, 0.2)',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <View style={[styles.pill, { backgroundColor: config.bgColor, borderColor: config.borderColor }]}>
      <View style={[styles.dot, { backgroundColor: config.textColor }]} />
      <Text style={[styles.label, { color: config.textColor }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
    borderWidth: 1,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radii.full,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
});

export default AppointmentStatusPill;
