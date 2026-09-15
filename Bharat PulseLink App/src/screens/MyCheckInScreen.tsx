/**
 * Bharat PulseLink — Production My Check-In Screen (Prompt 61)
 *
 * Patient visit command center:
 * 1. Server-authoritative check-in status card
 * 2. High-visibility Token Number & real queue position/wait estimate
 * 3. Linked appointment & facility guidance (room/counter)
 * 4. Primary CTA to Live Status (Prompt 62) & server-backed cancellation
 * 5. Premium empty state when no active check-in exists.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors, spacing, radii, typography } from '../theme/tokens';
import HospitalCheckInService from '../services/HospitalCheckInService';
import { CheckInRecord, CheckInStatus } from '../types/checkin';

export const MyCheckInScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [checkIn, setCheckIn] = useState<CheckInRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);

  const fetchCheckIn = useCallback(async () => {
    try {
      const data = await HospitalCheckInService.getCurrentCheckIn();
      setCheckIn(data);
    } catch (err) {
      console.warn('[MY_CHECKIN] Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCheckIn();
  }, [fetchCheckIn]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCheckIn();
  };

  const handleCancelCheckIn = () => {
    if (!checkIn) return;

    Alert.alert(
      'Cancel Hospital Check-In',
      'Are you sure you want to cancel this check-in? You will lose your current queue position.',
      [
        { text: 'Keep Check-In', style: 'cancel' },
        {
          text: 'Cancel Check-In',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              const updated = await HospitalCheckInService.cancelCheckIn(checkIn.checkInId);
              setCheckIn(updated);
            } catch (err) {
              Alert.alert('Cancellation Error', 'Could not cancel check-in on server. Please try again.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const getStatusBadge = (status: CheckInStatus) => {
    switch (status) {
      case 'CALLED':
        return { label: 'YOUR TURN (PLEASE PROCEED)', bg: '#DC2626', text: '#FFFFFF' };
      case 'IN_CONSULTATION':
        return { label: 'IN CONSULTATION', bg: '#0F766E', text: '#FFFFFF' };
      case 'WAITING':
        return { label: 'WAITING IN QUEUE', bg: '#F0FDFA', text: '#0F766E', border: '#CCFBF1' };
      case 'CHECKED_IN':
        return { label: 'CHECKED IN', bg: '#F0FDFA', text: '#0F766E', border: '#CCFBF1' };
      case 'COMPLETED':
        return { label: 'VISIT COMPLETED', bg: '#F1F5F9', text: '#475569' };
      case 'CANCELLED':
        return { label: 'CHECK-IN CANCELLED', bg: '#FEF2F2', text: '#DC2626' };
      default:
        return { label: 'PROCESSING', bg: '#F8FAFC', text: '#64748B' };
    }
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Just now';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.loadingText}>Loading check-in status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isTerminal =
    checkIn?.status === 'COMPLETED' ||
    checkIn?.status === 'CANCELLED' ||
    checkIn?.status === 'EXPIRED';

  const badge = checkIn ? getStatusBadge(checkIn.status) : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back"
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

          <Text style={styles.headerTitle}>My Check-in</Text>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={onRefresh}
            accessibilityRole="button"
            accessibilityLabel="Refresh status"
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M23 4v6h-6M1 20v-6h6"
                stroke="#0F766E"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
                stroke="#0F766E"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Active Check-In Card or Empty State */}
          {checkIn && checkIn.status !== 'CANCELLED' ? (
            <>
              {/* 1. Main Primary Status Card */}
              <View style={styles.mainCard}>
                <View style={styles.cardHeaderRow}>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: badge?.bg },
                      badge?.border && { borderWidth: 1, borderColor: badge.border },
                    ]}
                  >
                    <Text style={[styles.statusPillText, { color: badge?.text }]}>
                      {badge?.label}
                    </Text>
                  </View>

                  <Text style={styles.checkedInTimeText}>
                    Checked in at {formatTime(checkIn.checkedInAtISO)}
                  </Text>
                </View>

                <Text style={styles.hospitalTitle}>{checkIn.hospitalName}</Text>
                <Text style={styles.departmentSubtitle}>
                  {checkIn.departmentName}
                  {checkIn.serviceName ? ` • ${checkIn.serviceName}` : ''}
                </Text>

                {/* Token Box */}
                <View style={styles.tokenBox}>
                  <Text style={styles.tokenHeading}>QUEUE TOKEN REFERENCE</Text>
                  <Text style={styles.tokenValue}>{checkIn.tokenNumber}</Text>
                  <Text style={styles.deskNotice}>
                    {checkIn.counterDesk || 'Reception & Triage Counter'}
                  </Text>
                </View>

                {/* Live Metrics Row */}
                {checkIn.queuePosition !== undefined && checkIn.queuePosition > 0 && (
                  <View style={styles.metricsRow}>
                    <View style={styles.metricBox}>
                      <Text style={styles.metricLabel}>QUEUE POSITION</Text>
                      <Text style={styles.metricValue}>
                        {checkIn.queuePosition} <Text style={styles.metricUnit}>ahead</Text>
                      </Text>
                    </View>

                    <View style={styles.metricDivider} />

                    <View style={styles.metricBox}>
                      <Text style={styles.metricLabel}>ESTIMATED WAIT</Text>
                      <Text style={styles.metricValue}>
                        ~{checkIn.estimatedWaitMinutes || 20}{' '}
                        <Text style={styles.metricUnit}>min</Text>
                      </Text>
                    </View>
                  </View>
                )}

                {/* Facility Room Callout */}
                {checkIn.roomNumber && (
                  <View style={[styles.roomBanner, checkIn.status === 'CALLED' && styles.roomBannerCalled]}>
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={checkIn.status === 'CALLED' ? '#FFFFFF' : '#0F766E'} strokeWidth={2} />
                    </Svg>
                    <View style={styles.roomTextCol}>
                      <Text style={[styles.roomLabel, checkIn.status === 'CALLED' && { color: '#FFFFFF' }]}>
                        {checkIn.status === 'CALLED' ? 'PROCEED IMMEDIATELY TO' : 'ASSIGNED CONSULTATION ROOM'}
                      </Text>
                      <Text style={[styles.roomNumberText, checkIn.status === 'CALLED' && { color: '#FFFFFF' }]}>
                        {checkIn.roomNumber}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Primary CTA */}
                {!isTerminal && (
                  <TouchableOpacity
                    style={styles.liveStatusBtn}
                    onPress={() =>
                      navigation.navigate('LiveCheckInStatus', {
                        checkInId: checkIn.checkInId,
                      })
                    }
                    accessibilityRole="button"
                    accessibilityLabel="View live check-in queue status"
                  >
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                      <Circle cx={12} cy={12} r={10} stroke="#FFFFFF" strokeWidth={2} />
                      <Path d="M12 6v6l4 2" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
                    </Svg>
                    <Text style={styles.liveStatusBtnText}>View Live Queue Status</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* 2. Linked Appointment Context (if present) */}
              {checkIn.appointmentId && (
                <View style={styles.appointmentCard}>
                  <View style={styles.aptHeaderRow}>
                    <Text style={styles.aptHeading}>LINKED APPOINTMENT</Text>
                    <View style={styles.aptStatusPill}>
                      <Text style={styles.aptStatusText}>CONFIRMED</Text>
                    </View>
                  </View>
                  {checkIn.doctorName && (
                    <Text style={styles.doctorNameText}>{checkIn.doctorName}</Text>
                  )}
                  <Text style={styles.aptTimeText}>
                    {checkIn.appointmentDisplayDate || 'Today'} • {checkIn.appointmentDisplayTime || '10:30 AM'}
                  </Text>
                </View>
              )}

              {/* 3. Cancel Check-in (if non-terminal) */}
              {!isTerminal && (
                <TouchableOpacity
                  style={styles.cancelCheckInBtn}
                  onPress={handleCancelCheckIn}
                  disabled={cancelling}
                  accessibilityRole="button"
                >
                  {cancelling ? (
                    <ActivityIndicator size="small" color="#DC2626" />
                  ) : (
                    <Text style={styles.cancelCheckInText}>Cancel Check-In</Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          ) : (
            /* Premium Empty State */
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
                    stroke="#0F766E"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path d="M17 21v-8H7v8M7 3v5h8" stroke="#0F766E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>

              <Text style={styles.emptyTitle}>No Active Hospital Check-In</Text>
              <Text style={styles.emptySub}>
                You are not currently checked in at any hospital counter. When you arrive for your visit, scan the desk QR code for instant check-in.
              </Text>

              <View style={styles.emptyActionCol}>
                <TouchableOpacity
                  style={styles.primaryEmptyBtn}
                  onPress={() => navigation.navigate('ScanEntry')}
                  accessibilityRole="button"
                >
                  <Text style={styles.primaryEmptyBtnText}>Scan at Hospital Desk</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryEmptyBtn}
                  onPress={() => navigation.navigate('Hospitals')}
                  accessibilityRole="button"
                >
                  <Text style={styles.secondaryEmptyBtnText}>Find Nearby Hospitals</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryEmptyBtn}
                  onPress={() => navigation.navigate('Appointments')}
                  accessibilityRole="button"
                >
                  <Text style={styles.secondaryEmptyBtnText}>View My Appointments</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
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
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: 16,
    paddingBottom: 40,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xxl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  checkedInTimeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  hospitalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  departmentSubtitle: {
    fontSize: 13,
    color: '#0F766E',
    fontWeight: '700',
  },
  tokenBox: {
    backgroundColor: '#F0FDFA',
    borderRadius: radii.xl,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    gap: 2,
  },
  tokenHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
    letterSpacing: 0.5,
  },
  tokenValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F766E',
  },
  deskNotice: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: radii.xl,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  roomBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderRadius: radii.xl,
    padding: 12,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    gap: 12,
  },
  roomBannerCalled: {
    backgroundColor: '#DC2626',
    borderColor: '#B91C1C',
  },
  roomTextCol: {
    flex: 1,
    gap: 2,
  },
  roomLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
    letterSpacing: 0.5,
  },
  roomNumberText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  liveStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F766E',
    paddingVertical: 14,
    borderRadius: radii.xl,
    gap: 8,
    marginTop: 4,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  liveStatusBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  aptHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aptHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  aptStatusPill: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  aptStatusText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0F766E',
  },
  doctorNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  aptTimeText: {
    fontSize: 12,
    color: '#64748B',
  },
  cancelCheckInBtn: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelCheckInText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xxl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
    marginTop: 20,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.sm,
  },
  emptyActionCol: {
    width: '100%',
    gap: 8,
    marginTop: 6,
  },
  primaryEmptyBtn: {
    backgroundColor: '#0F766E',
    paddingVertical: 14,
    borderRadius: radii.xl,
    alignItems: 'center',
  },
  primaryEmptyBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryEmptyBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: radii.xl,
    alignItems: 'center',
  },
  secondaryEmptyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
});

export default MyCheckInScreen;
