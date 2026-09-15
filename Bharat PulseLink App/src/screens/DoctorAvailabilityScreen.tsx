/**
 * Bharat PulseLink — Production Doctor Availability Screen (Prompt 49)
 *
 * Scheduling-aware doctor availability command center:
 * 1. Date selector (Today, Tomorrow, Next 5 Days)
 * 2. Specialty filtering
 * 3. Doctor profiles with qualifications and ratings
 * 4. Real-time time slot chips grouped by period (Morning, Afternoon, Evening)
 * 5. Booking handoff.
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
import { colors, spacing, radii } from '../theme/tokens';
import DoctorAvailabilityService from '../services/DoctorAvailabilityService';
import { DoctorProfile, DoctorDailySchedule, TimeSlot } from '../types/doctors';

export const DoctorAvailabilityScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { hospitalId, hospitalName = 'Hospital Doctors', specialty: initialSpecialty } =
    route.params || {};

  // Generate next 7 dates
  const dates = useMemo(() => {
    const list: { id: string; dayName: string; dateNum: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(now.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateNum = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      list.push({ id: iso, dayName, dateNum, label: `${dayName}, ${dateNum}` });
    }
    return list;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(dates[0].id);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(initialSpecialty || 'ALL');
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [schedules, setSchedules] = useState<Record<string, DoctorDailySchedule>>({});
  const [selectedSlots, setSelectedSlots] = useState<Record<string, TimeSlot>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load doctors for hospital
  useEffect(() => {
    if (!hospitalId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    DoctorAvailabilityService.getDoctorsForHospital(hospitalId, selectedSpecialty)
      .then(async (docs) => {
        setDoctors(docs);
        // Load schedule for each doctor
        const schedMap: Record<string, DoctorDailySchedule> = {};
        for (const doc of docs) {
          const sched = await DoctorAvailabilityService.getDoctorSchedule(doc.id, selectedDate);
          schedMap[doc.id] = sched;
        }
        setSchedules(schedMap);
      })
      .finally(() => setIsLoading(false));
  }, [hospitalId, selectedSpecialty, selectedDate]);

  const handleSelectSlot = (doctorId: string, slot: TimeSlot) => {
    if (!slot.isAvailable) return;
    setSelectedSlots((prev) => ({
      ...prev,
      [doctorId]: slot,
    }));
  };

  const handleBookDoctor = (doc: DoctorProfile) => {
    const slot = selectedSlots[doc.id];
    if (!slot) return;
    const dateObj = dates.find((d) => d.id === selectedDate) || dates[0];
    navigation.navigate('BookingReview', {
      hospitalId,
      hospitalName,
      department: doc.department,
      doctorId: doc.id,
      doctorName: doc.name,
      scheduledDate: selectedDate,
      displayDate: dateObj.label,
      displayTime: slot.time,
      slotId: slot.id,
      locationAddress: 'Main Hospital Pavilion',
    });
  };

  const specialtiesList = useMemo(() => {
    const set = new Set<string>();
    doctors.forEach((d) => set.add(d.specialty));
    return ['ALL', ...Array.from(set)];
  }, [doctors]);

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
            <Text style={styles.headerTitle}>Doctor Availability</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {hospitalName}
            </Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* Date Selector Row */}
        <View style={styles.dateSelectorContainer}>
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

        {/* Doctor List Content */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0F766E" />
            <Text style={styles.loadingText}>Checking Doctor Schedules...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {doctors.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No Doctors Found</Text>
                <Text style={styles.emptySub}>No specialists currently registered for this department.</Text>
              </View>
            ) : (
              doctors.map((doc) => {
                const schedule = schedules[doc.id];
                const selectedSlot = selectedSlots[doc.id];
                const isAvailable = schedule?.status === 'AVAILABLE' || schedule?.status === 'LIMITED';

                return (
                  <View key={doc.id} style={styles.doctorCard}>
                    {/* Doctor Top Identity Row */}
                    <View style={styles.docHeaderRow}>
                      <View style={styles.docAvatarBox}>
                        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
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

                      <View style={styles.docInfoCol}>
                        <View style={styles.docNameRow}>
                          <Text style={styles.docName}>{doc.name}</Text>
                          {doc.rating && (
                            <View style={styles.ratingTag}>
                              <Text style={styles.ratingText}>★ {doc.rating.toFixed(1)}</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.docSpecialty}>{doc.specialty} • {doc.department}</Text>
                        <Text style={styles.docQual}>{doc.qualificationSummary}</Text>
                      </View>
                    </View>

                    {/* Status Badge & Next Available */}
                    <View style={styles.statusRow}>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              schedule?.status === 'AVAILABLE'
                                ? '#F0FDFA'
                                : schedule?.status === 'LIMITED'
                                ? '#FEF3C7'
                                : '#F1F5F9',
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor:
                                schedule?.status === 'AVAILABLE'
                                  ? '#0F766E'
                                  : schedule?.status === 'LIMITED'
                                  ? '#D97706'
                                  : '#64748B',
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.statusText,
                            {
                              color:
                                schedule?.status === 'AVAILABLE'
                                  ? '#0F766E'
                                  : schedule?.status === 'LIMITED'
                                  ? '#B45309'
                                  : '#64748B',
                            },
                          ]}
                        >
                          {schedule?.status === 'AVAILABLE'
                            ? 'Available Today'
                            : schedule?.status === 'LIMITED'
                            ? 'Limited Slots'
                            : 'Fully Booked'}
                        </Text>
                      </View>

                      {doc.nextAvailableText && (
                        <Text style={styles.nextAvailText}>⏱ {doc.nextAvailableText}</Text>
                      )}
                    </View>

                    {/* Available Time Slot Chips */}
                    {isAvailable && schedule?.slots && (
                      <View style={styles.slotsSection}>
                        <Text style={styles.slotsHeader}>SELECT TIME SLOT</Text>
                        <View style={styles.slotsWrap}>
                          {schedule.slots.map((slot) => {
                            const isSlotSelected = selectedSlot?.id === slot.id;
                            return (
                              <TouchableOpacity
                                key={slot.id}
                                style={[
                                  styles.slotChip,
                                  !slot.isAvailable && styles.slotChipDisabled,
                                  isSlotSelected && styles.slotChipSelected,
                                ]}
                                onPress={() => handleSelectSlot(doc.id, slot)}
                                disabled={!slot.isAvailable}
                                accessibilityRole="button"
                                accessibilityLabel={`Time slot: ${slot.time}. ${slot.isAvailable ? 'Available' : 'Booked'}`}
                              >
                                <Text
                                  style={[
                                    styles.slotChipText,
                                    !slot.isAvailable && styles.slotChipTextDisabled,
                                    isSlotSelected && styles.slotChipTextSelected,
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

                    {/* Book Button for Selected Slot */}
                    {isAvailable && (
                      <TouchableOpacity
                        style={[styles.bookBtn, !selectedSlot && styles.bookBtnInactive]}
                        onPress={() => handleBookDoctor(doc)}
                        accessibilityRole="button"
                      >
                        <Text style={styles.bookBtnText}>
                          {selectedSlot ? `Book Consultation (${selectedSlot.time})` : 'Select a Time Slot'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
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
  dateSelectorContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  dateScroll: {
    paddingHorizontal: spacing.md,
    gap: 8,
  },
  datePill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.xl,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 70,
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
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  dateNumTextSelected: {
    color: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: 14,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
  },
  doctorCard: {
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
    gap: 12,
  },
  docHeaderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  docAvatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfoCol: {
    flex: 1,
    gap: 2,
  },
  docNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  docName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  ratingTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  docSpecialty: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  docQual: {
    fontSize: 11,
    color: '#64748B',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  nextAvailText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  slotsSection: {
    gap: 8,
    paddingTop: 4,
  },
  slotsHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  slotsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.lg,
  },
  slotChipSelected: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  slotChipDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.5,
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
  bookBtn: {
    backgroundColor: '#0F766E',
    paddingVertical: 12,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  bookBtnInactive: {
    backgroundColor: '#E2E8F0',
  },
  bookBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default DoctorAvailabilityScreen;
