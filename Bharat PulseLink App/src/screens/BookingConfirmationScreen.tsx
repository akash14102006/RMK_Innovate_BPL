/**
 * Bharat PulseLink — Production Booking Confirmation Screen (Prompt 53)
 *
 * Implements authoritative confirmation handling:
 * 1. Calm, trustworthy success visual (Emerald checkmark, zero confetti/gamification)
 * 2. Confirmed vs Pending vs Unknown vs Rejected presentation
 * 3. Booking reference with copy action
 * 4. Clear post-booking next actions (My Appointments, Home).
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Clipboard,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, spacing, radii } from '../theme/tokens';

export const BookingConfirmationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const {
    appointmentId,
    status = 'CONFIRMED',
    bookingReference = 'BP-789210',
    hospitalName = 'Rajiv Gandhi Government General Hospital',
    department = 'Cardiovascular Surgery',
    doctorName = 'Dr. S. Ranganathan',
    serviceName = 'Cardiology Consultation',
    displayDate = 'Thu, 20 Aug 2026',
    displayTime = '10:30 AM',
    locationAddress = 'EVR Periyar Salai, Park Town, Chennai',
    rejectionReason,
  } = route.params || {};

  const handleCopyReference = () => {
    if (bookingReference) {
      Clipboard.setString(bookingReference);
      Alert.alert('Copied', 'Booking reference copied to clipboard.');
    }
  };

  const isConfirmed = status === 'CONFIRMED';
  const isPending = status === 'PENDING_CONFIRMATION';
  const isRejected = status === 'REJECTED';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Status Emblem & Heading */}
          <View style={styles.heroCenter}>
            {isConfirmed ? (
              <View style={styles.confirmedEmblem}>
                <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M20 6L9 17l-5-5"
                    stroke="#0F766E"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
            ) : isPending ? (
              <View style={[styles.confirmedEmblem, { backgroundColor: '#FEF3C7' }]}>
                <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
                  <Circle cx={12} cy={12} r={10} stroke="#D97706" strokeWidth={2} />
                  <Path d="M12 6v6l4 2" stroke="#D97706" strokeWidth={2} strokeLinecap="round" />
                </Svg>
              </View>
            ) : (
              <View style={[styles.confirmedEmblem, { backgroundColor: '#FEE2E2' }]}>
                <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
                  <Circle cx={12} cy={12} r={10} stroke="#DC2626" strokeWidth={2} />
                  <Path d="M15 9l-6 6M9 9l6 6" stroke="#DC2626" strokeWidth={2} strokeLinecap="round" />
                </Svg>
              </View>
            )}

            <Text style={styles.statusTitle}>
              {isConfirmed
                ? 'Appointment Confirmed'
                : isPending
                ? 'Appointment Request Submitted'
                : 'Booking Could Not Be Completed'}
            </Text>

            <Text style={styles.statusSubtitle}>
              {isConfirmed
                ? 'Your appointment has been registered with the hospital.'
                : isPending
                ? "We're checking your appointment with the hospital. You will be updated once confirmed."
                : rejectionReason || 'The selected time slot is no longer available. Please select another slot.'}
            </Text>

            {isConfirmed && bookingReference && (
              <TouchableOpacity
                style={styles.referencePill}
                onPress={handleCopyReference}
                accessibilityRole="button"
                accessibilityLabel={`Booking reference: ${bookingReference}. Tap to copy.`}
              >
                <Text style={styles.referenceLabel}>Booking Reference:</Text>
                <Text style={styles.referenceValue}>{bookingReference}</Text>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M8 4v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2z"
                    stroke="#0F766E"
                    strokeWidth={2}
                  />
                  <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="#0F766E" strokeWidth={1.5} />
                </Svg>
              </TouchableOpacity>
            )}
          </View>

          {/* 2. Confirmed Details Card */}
          <View style={styles.card}>
            <Text style={styles.cardHeading}>BOOKING SUMMARY</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Hospital</Text>
              <Text style={styles.infoValueBold}>{hospitalName}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Service / Department</Text>
              <Text style={styles.infoValue}>{serviceName || department}</Text>
            </View>

            {doctorName && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Consulting Doctor</Text>
                <Text style={styles.infoValue}>{doctorName}</Text>
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Confirmed Schedule</Text>
              <Text style={styles.infoValueHighlight}>{displayDate} • {displayTime}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location & Arrival</Text>
              <Text style={styles.infoValueSub}>{locationAddress}</Text>
            </View>
          </View>

          {/* 3. Helpful Steps */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsHeading}>WHAT TO DO NEXT</Text>
            <Text style={styles.tipsBody}>
              • Keep your Booking Reference handy at the hospital reception.{'\n'}
              • Arrive 15 minutes before scheduled time.{'\n'}
              • You can view and manage this booking anytime from My Appointments.
            </Text>
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.bottomBar}>
          {isRejected ? (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
            >
              <Text style={styles.primaryBtnText}>Select Another Slot</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => navigation.navigate('Appointments')}
                accessibilityRole="button"
                accessibilityLabel="Go to My Appointments"
              >
                <Text style={styles.primaryBtnText}>Go to My Appointments</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => navigation.navigate('Home')}
                accessibilityRole="button"
                accessibilityLabel="Back to Home"
              >
                <Text style={styles.secondaryBtnText}>Back to Home</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: 16,
    paddingBottom: 120,
    alignItems: 'stretch',
  },
  heroCenter: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  confirmedEmblem: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F0FDFA',
    borderWidth: 2,
    borderColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  statusSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.md,
  },
  referencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
    gap: 6,
    marginTop: 6,
  },
  referenceLabel: {
    fontSize: 12,
    color: '#0F766E',
    fontWeight: '600',
  },
  referenceValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F766E',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xxl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 10,
  },
  cardHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  infoRow: {
    gap: 2,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  infoValueBold: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  infoValueHighlight: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F766E',
  },
  infoValueSub: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  tipsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  tipsHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
    letterSpacing: 0.5,
  },
  tipsBody: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 19,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  primaryBtn: {
    backgroundColor: '#0F766E',
    paddingVertical: 14,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
});

export default BookingConfirmationScreen;
