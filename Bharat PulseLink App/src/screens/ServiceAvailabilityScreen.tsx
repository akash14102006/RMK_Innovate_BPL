/**
 * Bharat PulseLink — Production Service Availability Screen (Prompt 50)
 *
 * Full service catalog and operational availability command center:
 * 1. Department vs Specialty vs Service taxonomy
 * 2. Operational statuses (Available, Limited, Appointment Required)
 * 3. Service hours separate from hospital 24x7 flag
 * 4. Booking capability indicators.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors, spacing, radii } from '../theme/tokens';
import HospitalServiceCatalogService from '../services/HospitalServiceCatalogService';
import { HospitalServiceItem, ServiceCategory } from '../types/hospitalServices';

export const ServiceAvailabilityScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { hospitalId, hospitalName = 'Hospital Services', department: initialDept } =
    route.params || {};

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>(initialDept || 'ALL');
  const [services, setServices] = useState<HospitalServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!hospitalId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    HospitalServiceCatalogService.getServicesForHospital(hospitalId, selectedDept)
      .then((data) => {
        if (searchQuery.trim()) {
          const clean = searchQuery.trim().toLowerCase();
          setServices(
            data.filter(
              (s) =>
                s.name.toLowerCase().includes(clean) ||
                s.department.toLowerCase().includes(clean) ||
                s.specialty.toLowerCase().includes(clean)
            )
          );
        } else {
          setServices(data);
        }
      })
      .finally(() => setIsLoading(false));
  }, [hospitalId, selectedDept, searchQuery]);

  const departmentsList = useMemo(() => {
    return ['ALL', 'Emergency Medicine', 'Cardiovascular Medicine', 'Outpatient Department', 'Pharmacy Services', 'Oncology Sciences'];
  }, []);

  const getCategoryIcon = (category: ServiceCategory) => {
    if (category === 'EMERGENCY') {
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#DC2626" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    }
    if (category === 'PHARMACY') {
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="9" stroke="#0F766E" strokeWidth={2} />
          <Path d="M12 8v8M8 12h8" stroke="#0F766E" strokeWidth={2.5} strokeLinecap="round" />
        </Svg>
      );
    }
    if (category === 'DIAGNOSTIC') {
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="10" stroke="#4F46E5" strokeWidth={2} />
          <Path d="M12 16v-4M12 8h.01" stroke="#4F46E5" strokeWidth={2.5} strokeLinecap="round" />
        </Svg>
      );
    }
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="#0F766E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  };

  const handleBookService = (svc: HospitalServiceItem) => {
    if (!svc.appointmentSupported) return;
    navigation.navigate('AppointmentSelection', {
      serviceId: svc.id,
      serviceName: svc.name,
      department: svc.department,
      hospitalId,
      hospitalName,
      locationAddress: 'Hospital Consultation Wing',
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
            <Text style={styles.headerTitle}>Hospital Services</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {hospitalName}
            </Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarWrapper}>
          <View style={styles.searchInputBox}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Circle cx={11} cy={11} r={8} stroke="#64748B" strokeWidth={2} />
              <Path d="M21 21l-4.35-4.35" stroke="#64748B" strokeWidth={2} strokeLinecap="round" />
            </Svg>
            <TextInput
              style={styles.searchInput}
              placeholder="Search services or departments..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <Path d="M18 6L6 18M6 6l12 12" stroke="#64748B" strokeWidth={2} strokeLinecap="round" />
                </Svg>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Department Filter Bar */}
        <View style={styles.deptScrollWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.deptScroll}>
            {departmentsList.map((dept) => {
              const isSelected = selectedDept === dept;
              return (
                <TouchableOpacity
                  key={dept}
                  style={[styles.deptPill, isSelected && styles.deptPillSelected]}
                  onPress={() => setSelectedDept(dept)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={[styles.deptPillText, isSelected && styles.deptPillTextSelected]}>
                    {dept}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Services List Content */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0F766E" />
            <Text style={styles.loadingText}>Loading Clinical Services...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {services.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No Services Found</Text>
                <Text style={styles.emptySub}>No healthcare services matching your criteria in this facility.</Text>
              </View>
            ) : (
              services.map((svc) => {
                const isAvailable = svc.operationalStatus === 'AVAILABLE';
                const isApptReq = svc.operationalStatus === 'APPOINTMENT_REQUIRED';

                return (
                  <View key={svc.id} style={styles.serviceCard}>
                    {/* Top Row: Icon + Title & Category */}
                    <View style={styles.serviceTopRow}>
                      <View style={styles.serviceIconBox}>{getCategoryIcon(svc.category)}</View>

                      <View style={styles.serviceTitleCol}>
                        <Text style={styles.serviceName}>{svc.name}</Text>
                        <Text style={styles.deptSubText}>
                          {svc.department} • {svc.specialty}
                        </Text>
                      </View>
                    </View>

                    {/* Description */}
                    <Text style={styles.serviceDesc}>{svc.description}</Text>

                    {/* Operational Meta Row */}
                    <View style={styles.metaRow}>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: isAvailable
                              ? '#F0FDFA'
                              : isApptReq
                              ? '#EEF2FF'
                              : '#FEF3C7',
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor: isAvailable
                                ? '#0F766E'
                                : isApptReq
                                ? '#4F46E5'
                                : '#D97706',
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.statusText,
                            {
                              color: isAvailable
                                ? '#0F766E'
                                : isApptReq
                                ? '#4F46E5'
                                : '#B45309',
                            },
                          ]}
                        >
                          {isAvailable
                            ? 'Available Now'
                            : isApptReq
                            ? 'Appointment Required'
                            : 'Limited Availability'}
                        </Text>
                      </View>

                      <Text style={styles.hoursText}>⏱ {svc.hoursText}</Text>
                    </View>

                    {/* Action Button */}
                    <TouchableOpacity
                      style={[
                        styles.serviceActionBtn,
                        !svc.appointmentSupported && styles.serviceActionBtnWalkIn,
                      ]}
                      onPress={() => handleBookService(svc)}
                      disabled={!svc.appointmentSupported}
                      accessibilityRole="button"
                    >
                      <Text
                        style={[
                          styles.serviceActionBtnText,
                          !svc.appointmentSupported && styles.serviceActionBtnTextWalkIn,
                        ]}
                      >
                        {svc.appointmentSupported ? 'Book Service →' : 'Walk-in Care Desk'}
                      </Text>
                    </TouchableOpacity>
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
  searchBarWrapper: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: '#FFFFFF',
  },
  searchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: radii.xl,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  deptScrollWrapper: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  deptScroll: {
    paddingHorizontal: spacing.md,
    gap: 8,
  },
  deptPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radii.full,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deptPillSelected: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  deptPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  deptPillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
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
    gap: 12,
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
  serviceCard: {
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
  serviceTopRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  serviceIconBox: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTitleCol: {
    flex: 1,
    gap: 2,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  deptSubText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  serviceDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  metaRow: {
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
  hoursText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  serviceActionBtn: {
    backgroundColor: '#0F766E',
    paddingVertical: 10,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceActionBtnWalkIn: {
    backgroundColor: '#F1F5F9',
  },
  serviceActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  serviceActionBtnTextWalkIn: {
    color: '#64748B',
  },
});

export default ServiceAvailabilityScreen;
