import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors, spacing, radii, typography } from '../../theme/tokens';
import { AppointmentItem } from '../../types/appointments';
import AppointmentStatusPill from './AppointmentStatusPill';

export interface AppointmentDetailsModalProps {
  visible: boolean;
  appointment: AppointmentItem | null;
  onClose: () => void;
  onCancelAppointment?: (appointmentId: string) => void;
}

export const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({
  visible,
  appointment,
  onClose,
  onCancelAppointment,
}) => {
  if (!appointment) return null;

  const canCancel =
    appointment.status === 'CONFIRMED' ||
    appointment.status === 'PENDING' ||
    appointment.status === 'RESCHEDULED';

  const handleCancel = () => {
    Alert.alert(
      'Cancel Appointment',
      `Are you sure you want to cancel your appointment at ${appointment.hospitalName}?`,
      [
        { text: 'Keep Appointment', style: 'cancel' },
        {
          text: 'Cancel Appointment',
          style: 'destructive',
          onPress: () => {
            onCancelAppointment?.(appointment.id);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheetPanel}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Appointment Details</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close Details">
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path d="M18 6L6 18M6 6l12 12" stroke="#64748B" strokeWidth={2.2} strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Status & Booking Ref */}
            <View style={styles.statusRow}>
              <AppointmentStatusPill status={appointment.status} />
              {appointment.bookingReference && (
                <Text style={styles.refText}>ID: {appointment.bookingReference}</Text>
              )}
            </View>

            {/* Hospital & Department */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>HEALTHCARE FACILITY</Text>
              <Text style={styles.hospitalName}>{appointment.hospitalName}</Text>
              <Text style={styles.deptName}>{appointment.department} {appointment.specialty ? `• ${appointment.specialty}` : ''}</Text>
              {appointment.locationAddress && (
                <Text style={styles.addressText}>{appointment.locationAddress}</Text>
              )}
            </View>

            {/* Date & Time */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>SCHEDULED TIMING</Text>
              <View style={styles.dateTimeRow}>
                <View style={styles.dateTimeCol}>
                  <Text style={styles.timeVal}>{appointment.displayDate}</Text>
                  <Text style={styles.timeSub}>Date</Text>
                </View>
                <View style={styles.dateTimeDivider} />
                <View style={styles.dateTimeCol}>
                  <Text style={styles.timeVal}>{appointment.displayTime}</Text>
                  <Text style={styles.timeSub}>Time</Text>
                </View>
              </View>
            </View>

            {/* Doctor Info if available */}
            {appointment.doctorName && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionLabel}>ATTENDING PHYSICIAN</Text>
                <Text style={styles.doctorName}>Dr. {appointment.doctorName}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionsGroup}>
              <TouchableOpacity
                style={styles.directionsBtn}
                onPress={() => Alert.alert('Directions', `Navigating to ${appointment.hospitalName}`)}
                accessibilityRole="button"
                accessibilityLabel="Get Directions to Hospital"
              >
                <Text style={styles.directionsBtnText}>Get Directions to Facility</Text>
              </TouchableOpacity>

              {canCancel && (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={handleCancel}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel this Appointment"
                >
                  <Text style={styles.cancelBtnText}>Cancel Appointment</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheetPanel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 34,
    paddingHorizontal: spacing.md,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.8)',
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  content: {
    gap: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  refText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  sectionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    marginBottom: spacing.xs,
    gap: 4,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  hospitalName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  deptName: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  addressText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dateTimeCol: {
    flex: 1,
    alignItems: 'center',
  },
  dateTimeDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#CBD5E1',
  },
  timeVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F766E',
  },
  timeSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  doctorName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  actionsGroup: {
    gap: 8,
    marginTop: spacing.sm,
  },
  directionsBtn: {
    height: 44,
    borderRadius: radii.md,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionsBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cancelBtn: {
    height: 42,
    borderRadius: radii.md,
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.danger,
  },
});

export default AppointmentDetailsModal;
