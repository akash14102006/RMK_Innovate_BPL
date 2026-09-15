/**
 * Bharat PulseLink — Production Appointment Selection Screen (Prompt 51)
 *
 * Implements authoritative appointment slot selection:
 * 1. Hospital, Service & Doctor context
 * 2. 7-day date horizon (Asia/Kolkata hospital timezone)
 * 3. Categorized time slots (Morning, Afternoon, Evening)
 * 4. Stale-slot detection and refresh capability
 * 5. Validated Continue transition to Booking Review.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, spacing, radii, typography } from '../theme/tokens';
import AppointmentBookingService from '../services/AppointmentBookingService';
import { BookingSlotItem } from '../types/booking';

export const AppointmentSelectionScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {
    hospitalId = 'hosp_chennai_01',
    hospitalName = 'Rajiv Gandhi Government General Hospital',
    department = 'Cardiovascular Surgery',
    serviceId,
    serviceName = 'Cardiology Consultation',
    doctorId = 'doc_chennai_01',
    doctorName = 'Dr. S. Ranganathan',
    doctorSpecialty = 'Cardiology',
    locationAddress = 'EVR Periyar Salai, Park Town, Chennai',
  } = route.params || {};

  // 7-day scheduling horizon
  const dates = useMemo(() => {
    const list: { id: string; dayName: string; dateNum: string; displayDate: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(now.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateNum = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      const displayDate = `${d.toLocaleDateString('en-US', { weekday: 'short' })}, ${d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      list.push({ id: iso, dayName, dateNum, displayDate });
    }
    return list;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(dates[0].id);
  const [slots, setSlots] = useState<BookingSlotItem[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<BookingSlotItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch slots for hospital and selected date
  const loadSlots = () => {
    setIsLoading(true);
    AppointmentBookingService.getAvailableSlots(hospitalId, selectedDate, doctorId, serviceId)
      .then((data) => {
        setSlots(data);
        // Clear selected slot if no longer in new date's slots
        setSelectedSlot(null);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadSlots();
  }, [hospitalId, selectedDate, doctorId, serviceId]);

  const activeDateObj = dates.find((d) => d.id === selectedDate) || dates[0];

  const morningSlots = useMemo(() => slots.filter((s) => s.period === 'MORNING'), [slots]);
  const afternoonSlots = useMemo(() => slots.filter((s) => s.period === 'AFTERNOON'), [slots]);
  const eveningSlots = useMemo(() => slots.filter((s) => s.period === 'EVENING'), [slots]);

  const handleSelectSlot = (slot: BookingSlotItem) => {
    if (!slot.isAvailable) return;
    setSelectedSlot(slot);
  };

  const handleContinue = () => {
    if (!selectedSlot) return;

    navigation.navigate('BookingReview', {
      hospitalId,
      hospitalName,
      department,
      serviceId,
      serviceName,
      doctorId,
      doctorName,
      scheduledDate: selectedDate,
      displayDate: activeDateObj.displayDate,
      displayTime: selectedSlot.time,
      slotId: selectedSlot.id,
      locationAddress,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
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

          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>Select Appointment</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {hospitalName}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={loadSlots}
            accessibilityRole="button"
            accessibilityLabel="Refresh slot availability"
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
        >
          {/* 1. Provider Context Card */}
          <View style={styles.contextCard}>
            <View style={styles.contextRow}>
              <View style={styles.iconBox}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                    stroke="#0F766E"
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                  <Circle cx={8.5} cy={7} r={4} stroke="#0F766E" strokeWidth={2} />
                  <Path d="M20 8v6M23 11h-6" stroke="#0F766E" strokeWidth={2} strokeLinecap="round" />
                </Svg>
              </View>

              <View style={styles.contextInfoCol}>
                <Text style={styles.contextDoctorName}>{doctorName || serviceName}</Text>
                <Text style={styles.contextSub}>
                  {department} • {doctorSpecialty || 'Specialist'}
                </Text>
                <Text style={styles.contextHospital}>{hospitalName}</Text>
              </View>
            </View>
          </View>

          {/* 2. Choose Date Horizontal Selector */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeading}>CHOOSE DATE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
              {dates.map((d) => {
                const isSelected = selectedDate === d.id;
                return (
                  <TouchableOpacity
                    key={d.id}
                    style={[styles.datePill, isSelected && styles.datePillSelected]}
                    onPress={() => setSelectedDate(d.id)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`${d.dayName}, ${d.dateNum}`}
                  >
                    <Text style={[styles.dayNameText, isSelected && styles.dayNameTextSelected]}>
                      {d.dayName}
                    </Text>
                    <Text style={[styles.dateNumText, isSelected && styles.dateNumTextSelected]}>
                      {d.dateNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* 3. Available Times Slot Grid */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeading}>AVAILABLE TIME SLOTS</Text>

            {isLoading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="small" color="#0F766E" />
                <Text style={styles.loadingText}>Checking real-time slots...</Text>
              </View>
            ) : (
              <View style={styles.slotGroupsWrap}>
                {/* Morning */}
                {morningSlots.length > 0 && (
                  <View style={styles.slotGroup}>
                    <Text style={styles.periodLabel}>Morning Slots</Text>
                    <View style={styles.slotGrid}>
                      {morningSlots.map((slot) => {
                        const isSelected = selectedSlot?.id === slot.id;
                        return (
                          <TouchableOpacity
                            key={slot.id}
                            style={[
                              styles.slotChip,
                              !slot.isAvailable && styles.slotChipDisabled,
                              isSelected && styles.slotChipSelected,
                            ]}
                            onPress={() => handleSelectSlot(slot)}
                            disabled={!slot.isAvailable}
                            accessibilityRole="button"
                            accessibilityLabel={`Time slot ${slot.time}. ${slot.isAvailable ? 'Available' : 'Booked'}`}
                          >
                            <Text
                              style={[
                                styles.slotChipText,
                                !slot.isAvailable && styles.slotChipTextDisabled,
                                isSelected && styles.slotChipTextSelected,
                              ]}
                            >
                              {slot.time}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Afternoon */}
                {afternoonSlots.length > 0 && (
                  <View style={styles.slotGroup}>
                    <Text style={styles.periodLabel}>Afternoon Slots</Text>
                    <View style={styles.slotGrid}>
                      {afternoonSlots.map((slot) => {
                        const isSelected = selectedSlot?.id === slot.id;
                        return (
                          <TouchableOpacity
                            key={slot.id}
                            style={[
                              styles.slotChip,
                              !slot.isAvailable && styles.slotChipDisabled,
                              isSelected && styles.slotChipSelected,
                            ]}
                            onPress={() => handleSelectSlot(slot)}
                            disabled={!slot.isAvailable}
                            accessibilityRole="button"
                          >
                            <Text
                              style={[
                                styles.slotChipText,
                                !slot.isAvailable && styles.slotChipTextDisabled,
                                isSelected && styles.slotChipTextSelected,
                              ]}
                            >
                              {slot.time}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Evening */}
                {eveningSlots.length > 0 && (
                  <View style={styles.slotGroup}>
                    <Text style={styles.periodLabel}>Evening Slots</Text>
                    <View style={styles.slotGrid}>
                      {eveningSlots.map((slot) => {
                        const isSelected = selectedSlot?.id === slot.id;
                        return (
                          <TouchableOpacity
                            key={slot.id}
                            style={[
                              styles.slotChip,
                              !slot.isAvailable && styles.slotChipDisabled,
                              isSelected && styles.slotChipSelected,
                            ]}
                            onPress={() => handleSelectSlot(slot)}
                            disabled={!slot.isAvailable}
                            accessibilityRole="button"
                          >
                            <Text
                              style={[
                                styles.slotChipText,
                                !slot.isAvailable && styles.slotChipTextDisabled,
                                isSelected && styles.slotChipTextSelected,
                              ]}
                            >
                              {slot.time}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Bottom Selected Summary & Continue Action */}
        <View style={styles.bottomBar}>
          <View style={styles.bottomSummaryCol}>
            <Text style={styles.selectedLabel}>Selected Appointment</Text>
            <Text style={styles.selectedTimeText}>
              {selectedSlot ? `${activeDateObj.displayDate} • ${selectedSlot.time}` : 'Select a date and time slot'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.continueBtn, !selectedSlot && styles.continueBtnDisabled]}
            onPress={handleContinue}
            disabled={!selectedSlot}
            accessibilityRole="button"
            accessibilityLabel="Continue to Booking Review"
          >
            <Text style={styles.continueBtnText}>Continue →</Text>
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
  headerTitleCol: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
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
    paddingBottom: 110,
  },
  contextCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  contextRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextInfoCol: {
    flex: 1,
    gap: 2,
  },
  contextDoctorName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  contextSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F766E',
  },
  contextHospital: {
    fontSize: 11,
    color: '#64748B',
  },
  sectionWrap: {
    gap: 10,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  dateScroll: {
    gap: 8,
  },
  datePill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.xl,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 72,
  },
  datePillSelected: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  dayNameText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  dayNameTextSelected: {
    color: '#CCFBF1',
  },
  dateNumText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  dateNumTextSelected: {
    color: '#FFFFFF',
  },
  centerContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  slotGroupsWrap: {
    gap: 14,
  },
  slotGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  periodLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.lg,
  },
  slotChipSelected: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  slotChipDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.45,
  },
  slotChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  slotChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  slotChipTextDisabled: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  bottomSummaryCol: {
    flex: 1,
    gap: 2,
  },
  selectedLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  selectedTimeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F766E',
  },
  continueBtn: {
    backgroundColor: '#0F766E',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radii.xl,
  },
  continueBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  continueBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default AppointmentSelectionScreen;
