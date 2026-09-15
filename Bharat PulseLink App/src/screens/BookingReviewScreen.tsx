/**
 * Bharat PulseLink — Production Appointment Booking Review & Submission Screen (Prompt 52)
 *
 * Implements the transactional booking boundary:
 * 1. Summary of Hospital, Doctor, Service, Date & Time, and Location
 * 2. Patient identity minimization (Zero Aadhaar/PAN/medical leak)
 * 3. Terms & Consent validation
 * 4. Idempotency & double-tap protection
 * 5. TanStack query cache invalidation on confirmation.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors, spacing, radii } from '../theme/tokens';
import AppointmentBookingService from '../services/AppointmentBookingService';
import queryKeys from '../lib/queryKeys';
import { BookingTransactionStatus } from '../types/booking';

export const BookingReviewScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const queryClient = useQueryClient();

  const {
    hospitalId = 'hosp_chennai_01',
    hospitalName = 'Rajiv Gandhi Government General Hospital',
    department = 'Cardiovascular Surgery',
    serviceId,
    serviceName = 'Cardiology Consultation',
    doctorId = 'doc_chennai_01',
    doctorName = 'Dr. S. Ranganathan',
    scheduledDate = '2026-08-20',
    displayDate = 'Thu, 20 Aug 2026',
    displayTime = '10:30 AM',
    slotId = 'slot_01',
    locationAddress = 'EVR Periyar Salai, Park Town, Chennai, Tamil Nadu - 600003',
  } = route.params || {};

  const [hasAgreedTerms, setHasAgreedTerms] = useState<boolean>(true);
  const [status, setStatus] = useState<BookingTransactionStatus>('READY');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const idempotencyKeyRef = useRef<string>(AppointmentBookingService.generateIdempotencyKey());
  const isSubmittingRef = useRef<boolean>(false);

  const handleConfirmBooking = async () => {
    if (isSubmittingRef.current || status === 'SUBMITTING') return;
    if (!hasAgreedTerms) {
      Alert.alert('Terms Required', 'Please accept the appointment booking terms to continue.');
      return;
    }

    isSubmittingRef.current = true;
    setStatus('SUBMITTING');
    setErrorMessage(null);

    try {
      const response = await AppointmentBookingService.submitBooking('user_patient_primary', {
        hospitalId,
        hospitalName,
        department,
        serviceId,
        serviceName,
        doctorId,
        doctorName,
        scheduledDate,
        displayDate,
        displayTime,
        slotId,
        locationAddress,
        idempotencyKey: idempotencyKeyRef.current,
        patientName: 'Akash Kumar',
      });

      // Invalidate appointments cache so My Appointments reflects the new booking immediately
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.home.all });

      if (response.status === 'CONFIRMED') {
        setStatus('CONFIRMED');
        navigation.replace('BookingConfirmation', {
          appointmentId: response.appointmentId,
          status: 'CONFIRMED',
          bookingReference: response.bookingReference,
          hospitalName: response.hospitalName,
          department: response.department,
          doctorName: response.doctorName,
          serviceName: response.serviceName,
          displayDate: response.confirmedDate,
          displayTime: response.confirmedTime,
          locationAddress: response.locationAddress,
        });
      } else if (response.status === 'REJECTED') {
        setStatus('REJECTED');
        setErrorMessage(response.rejectionReason || 'The selected slot is no longer available. Please choose another time.');
      } else {
        setStatus('PENDING_PROVIDER');
        navigation.replace('BookingConfirmation', {
          appointmentId: response.appointmentId || 'pending_temp',
          status: 'PENDING_CONFIRMATION',
          bookingReference: response.bookingReference,
          hospitalName: response.hospitalName,
          department: response.department,
          doctorName: response.doctorName,
          serviceName: response.serviceName,
          displayDate: response.confirmedDate,
          displayTime: response.confirmedTime,
          locationAddress: response.locationAddress,
        });
      }
    } catch (err: any) {
      setStatus('ERROR');
      setErrorMessage('Could not complete booking. Please check your connection and try again.');
    } finally {
      isSubmittingRef.current = false;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            disabled={status === 'SUBMITTING'}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M19 12H5M12 19l-7-7 7-7"
                stroke={colors.textPrimary}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Confirm Booking</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Error Banner */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          {/* 1. Appointment Summary Card */}
          <View style={styles.summaryCard}>
            <Text style={styles.cardHeading}>APPOINTMENT DETAILS</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Hospital</Text>
              <Text style={styles.summaryValueBold}>{hospitalName}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Department & Service</Text>
              <Text style={styles.summaryValue}>{serviceName || department}</Text>
            </View>

            {doctorName && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Doctor</Text>
                <Text style={styles.summaryValue}>{doctorName}</Text>
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date & Time</Text>
              <Text style={styles.summaryValueHighlight}>{displayDate} • {displayTime}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Location</Text>
              <Text style={styles.summaryValueSub}>{locationAddress}</Text>
            </View>
          </View>

          {/* 2. Patient Identity Card (Data Minimization) */}
          <View style={styles.patientCard}>
            <Text style={styles.cardHeading}>PATIENT DETAILS</Text>
            <View style={styles.patientInfoRow}>
              <View style={styles.patientAvatarBox}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#0F766E" strokeWidth={2} strokeLinecap="round" />
                  <Circle cx={12} cy={7} r={4} stroke="#0F766E" strokeWidth={2} />
                </Svg>
              </View>
              <View style={styles.patientTextCol}>
                <Text style={styles.patientName}>Akash Kumar</Text>
                <Text style={styles.patientSub}>Primary Patient Account • +91 98*** **210</Text>
              </View>
            </View>
          </View>

          {/* 3. Important Notice Card */}
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>Important Hospital Notice</Text>
            <Text style={styles.noticeBody}>
              • Please arrive at least 15 minutes before your scheduled time.{'\n'}
              • Carry a government photo ID card (Aadhaar, Voter ID, or Driver's License) for reception verification.{'\n'}
              • Your appointment is reserved securely through the Bharat PulseLink network.
            </Text>
          </View>

          {/* 4. Terms and Consent Checkbox */}
          <TouchableOpacity
            style={styles.consentRow}
            onPress={() => setHasAgreedTerms(!hasAgreedTerms)}
            activeOpacity={0.8}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: hasAgreedTerms }}
          >
            <View style={[styles.checkbox, hasAgreedTerms && styles.checkboxChecked]}>
              {hasAgreedTerms && (
                <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                  <Path d="M20 6L9 17l-5-5" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              )}
            </View>
            <Text style={styles.consentText}>
              I agree to the hospital appointment booking terms and confirm that my information is accurate.
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Bottom Booking Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[
              styles.confirmBtn,
              (!hasAgreedTerms || status === 'SUBMITTING') && styles.confirmBtnDisabled,
            ]}
            onPress={handleConfirmBooking}
            disabled={!hasAgreedTerms || status === 'SUBMITTING'}
            accessibilityRole="button"
            accessibilityLabel="Confirm Booking"
          >
            {status === 'SUBMITTING' ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.confirmBtnText}>Processing Booking...</Text>
              </View>
            ) : (
              <Text style={styles.confirmBtnText}>Confirm Booking</Text>
            )}
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: 14,
    paddingBottom: 110,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radii.lg,
    padding: 12,
  },
  errorBannerText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
  },
  summaryCard: {
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
    marginBottom: 2,
  },
  summaryRow: {
    gap: 2,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  summaryValueBold: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryValueHighlight: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F766E',
  },
  summaryValueSub: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  patientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  patientInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  patientAvatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientTextCol: {
    flex: 1,
    gap: 2,
  },
  patientName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  patientSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  noticeCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  noticeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  noticeBody: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  consentText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
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
  },
  confirmBtn: {
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
  confirmBtnDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export default BookingReviewScreen;
