/**
 * Bharat PulseLink — Production Advanced Filter Modal (Prompt 46)
 *
 * Multi-dimensional healthcare filter bottom-sheet:
 * 1. Ownership (All, Government, Private)
 * 2. Hospital Type (Super Specialty, Multi Specialty, Teaching, etc.)
 * 3. Facilities (24x7, Emergency, ICU, Pharmacy, Diagnostics)
 * 4. Maximum Distance (5 km, 10 km, 25 km, Any)
 * 5. Specialties (Cardiology, Oncology, Pediatrics, etc.)
 * 6. Clean Reset and Apply actions with live active count.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, spacing, radii } from '../../theme/tokens';
import type { HospitalFilterState, HospitalCategory } from '../../types/hospitals';
import { INITIAL_ADVANCED_FILTERS } from '../../hooks/useHospitalDiscovery';

export interface AdvancedFilterModalProps {
  visible: boolean;
  filters: HospitalFilterState;
  onClose: () => void;
  onApply: (newFilters: HospitalFilterState) => void;
  onReset: () => void;
}

const HOSPITAL_TYPE_OPTIONS: { id: HospitalCategory; label: string }[] = [
  { id: 'SUPER_SPECIALTY', label: 'Super Specialty' },
  { id: 'MULTI_SPECIALTY', label: 'Multi Specialty' },
  { id: 'TEACHING_HOSPITAL', label: 'Teaching Hospital' },
  { id: 'GENERAL', label: 'General Hospital' },
  { id: 'DISTRICT_HOSPITAL', label: 'District Hospital' },
  { id: 'CLINIC', label: 'Clinic / Primary Care' },
];

const SPECIALTY_OPTIONS = [
  'Cardiology',
  'Oncology',
  'Orthopedics',
  'Neurosurgery',
  'Pediatrics',
  'Gastroenterology',
  'Trauma Center',
];

const DISTANCE_OPTIONS: { value?: number; label: string }[] = [
  { value: 5, label: 'Within 5 km' },
  { value: 10, label: 'Within 10 km' },
  { value: 25, label: 'Within 25 km' },
  { value: undefined, label: 'Any Distance' },
];

export const AdvancedFilterModal: React.FC<AdvancedFilterModalProps> = ({
  visible,
  filters,
  onClose,
  onApply,
  onReset,
}) => {
  const [draftFilters, setDraftFilters] = useState<HospitalFilterState>(filters);

  useEffect(() => {
    if (visible) {
      setDraftFilters(filters);
    }
  }, [visible, filters]);

  const handleToggleOwnership = (ownership: 'ALL' | 'GOVERNMENT' | 'PRIVATE') => {
    setDraftFilters((prev) => ({ ...prev, ownership }));
  };

  const handleToggleHospitalType = (typeId: HospitalCategory) => {
    setDraftFilters((prev) => {
      const current = prev.hospitalTypes || [];
      const updated = current.includes(typeId)
        ? current.filter((t) => t !== typeId)
        : [...current, typeId];
      return { ...prev, hospitalTypes: updated };
    });
  };

  const handleToggleFacility = (key: keyof NonNullable<HospitalFilterState['facilities']>) => {
    setDraftFilters((prev) => {
      const currentFacilities = prev.facilities || {};
      return {
        ...prev,
        facilities: {
          ...currentFacilities,
          [key]: !currentFacilities[key],
        },
      };
    });
  };

  const handleSelectDistance = (distance?: number) => {
    setDraftFilters((prev) => ({ ...prev, maxDistanceKm: distance }));
  };

  const handleToggleSpecialty = (spec: string) => {
    setDraftFilters((prev) => {
      const current = prev.specialties || [];
      const updated = current.includes(spec)
        ? current.filter((s) => s !== spec)
        : [...current, spec];
      return { ...prev, specialties: updated };
    });
  };

  const handleReset = () => {
    setDraftFilters(INITIAL_ADVANCED_FILTERS);
    onReset();
  };

  const handleApply = () => {
    onApply(draftFilters);
    onClose();
  };

  // Count active draft filters
  let draftCount = 0;
  if (draftFilters.ownership && draftFilters.ownership !== 'ALL') draftCount++;
  if (draftFilters.hospitalTypes?.length) draftCount += draftFilters.hospitalTypes.length;
  if (draftFilters.facilities?.twentyFourSeven) draftCount++;
  if (draftFilters.facilities?.emergency) draftCount++;
  if (draftFilters.facilities?.icu) draftCount++;
  if (draftFilters.facilities?.pharmacy) draftCount++;
  if (draftFilters.facilities?.diagnostics) draftCount++;
  if (draftFilters.maxDistanceKm) draftCount++;
  if (draftFilters.specialties?.length) draftCount += draftFilters.specialties.length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              {/* Top Drag Indicator */}
              <View style={styles.dragBar} />

              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>
                  Filters {draftCount > 0 && `(${draftCount})`}
                </Text>

                <View style={styles.headerActions}>
                  <TouchableOpacity
                    onPress={handleReset}
                    accessibilityRole="button"
                    accessibilityLabel="Reset all filters"
                  >
                    <Text style={styles.resetText}>Reset</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close filters"
                  >
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M18 6L6 18M6 6l12 12"
                        stroke="#64748B"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView
                style={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollInner}
              >
                {/* 1. Ownership Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>OWNERSHIP</Text>
                  <View style={styles.chipRow}>
                    {(['ALL', 'GOVERNMENT', 'PRIVATE'] as const).map((opt) => {
                      const isSelected = (draftFilters.ownership || 'ALL') === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.choicePill, isSelected && styles.choicePillSelected]}
                          onPress={() => handleToggleOwnership(opt)}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: isSelected }}
                        >
                          <Text
                            style={[
                              styles.choicePillText,
                              isSelected && styles.choicePillTextSelected,
                            ]}
                          >
                            {opt === 'ALL' ? 'All' : opt === 'GOVERNMENT' ? 'Government' : 'Private'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* 2. Maximum Distance Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>MAXIMUM DISTANCE</Text>
                  <View style={styles.chipRow}>
                    {DISTANCE_OPTIONS.map((opt) => {
                      const isSelected = draftFilters.maxDistanceKm === opt.value;
                      return (
                        <TouchableOpacity
                          key={opt.label}
                          style={[styles.choicePill, isSelected && styles.choicePillSelected]}
                          onPress={() => handleSelectDistance(opt.value)}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: isSelected }}
                        >
                          <Text
                            style={[
                              styles.choicePillText,
                              isSelected && styles.choicePillTextSelected,
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* 3. Facilities & Care Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>FACILITIES & SERVICES</Text>
                  <View style={styles.checkboxGrid}>
                    {[
                      { key: 'twentyFourSeven', label: '24x7 Open' },
                      { key: 'emergency', label: 'Emergency & Trauma' },
                      { key: 'icu', label: 'ICU Facility' },
                      { key: 'pharmacy', label: '24x7 Pharmacy' },
                      { key: 'diagnostics', label: 'Diagnostic Lab / Imaging' },
                    ].map((item) => {
                      const isChecked = Boolean(
                        draftFilters.facilities?.[item.key as keyof typeof draftFilters.facilities]
                      );
                      return (
                        <TouchableOpacity
                          key={item.key}
                          style={[styles.checkboxRow, isChecked && styles.checkboxRowSelected]}
                          onPress={() =>
                            handleToggleFacility(
                              item.key as keyof NonNullable<HospitalFilterState['facilities']>
                            )
                          }
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: isChecked }}
                        >
                          <View
                            style={[styles.checkboxBox, isChecked && styles.checkboxBoxChecked]}
                          >
                            {isChecked && (
                              <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                                <Path
                                  d="M20 6L9 17l-5-5"
                                  stroke="#FFFFFF"
                                  strokeWidth={3}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </Svg>
                            )}
                          </View>
                          <Text
                            style={[styles.checkboxLabel, isChecked && styles.checkboxLabelChecked]}
                          >
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* 4. Hospital Category Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>HOSPITAL TYPE</Text>
                  <View style={styles.chipRowWrap}>
                    {HOSPITAL_TYPE_OPTIONS.map((opt) => {
                      const isSelected = Boolean(draftFilters.hospitalTypes?.includes(opt.id));
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          style={[styles.choicePill, isSelected && styles.choicePillSelected]}
                          onPress={() => handleToggleHospitalType(opt.id)}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: isSelected }}
                        >
                          <Text
                            style={[
                              styles.choicePillText,
                              isSelected && styles.choicePillTextSelected,
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* 5. Medical Specialties Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>MEDICAL SPECIALTIES</Text>
                  <View style={styles.chipRowWrap}>
                    {SPECIALTY_OPTIONS.map((spec) => {
                      const isSelected = Boolean(draftFilters.specialties?.includes(spec));
                      return (
                        <TouchableOpacity
                          key={spec}
                          style={[styles.choicePill, isSelected && styles.choicePillSelected]}
                          onPress={() => handleToggleSpecialty(spec)}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: isSelected }}
                        >
                          <Text
                            style={[
                              styles.choicePillText,
                              isSelected && styles.choicePillTextSelected,
                            ]}
                          >
                            {spec}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>

              {/* Sticky Footer */}
              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.applyBtn}
                  onPress={handleApply}
                  accessibilityRole="button"
                  accessibilityLabel="Apply filters"
                >
                  <Text style={styles.applyBtnText}>
                    Apply Filters {draftCount > 0 ? `(${draftCount})` : ''}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    maxHeight: '88%',
    paddingBottom: spacing.lg,
  },
  dragBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  resetText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F766E',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 0,
  },
  scrollInner: {
    padding: spacing.md,
    gap: 20,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'nowrap',
  },
  chipRowWrap: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  choicePill: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
  },
  choicePillSelected: {
    backgroundColor: '#F0FDFA',
    borderColor: '#0F766E',
  },
  choicePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  choicePillTextSelected: {
    color: '#0F766E',
    fontWeight: '800',
  },
  checkboxGrid: {
    gap: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.lg,
    gap: 10,
  },
  checkboxRowSelected: {
    backgroundColor: '#F0FDFA',
    borderColor: '#CCFBF1',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxBoxChecked: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  checkboxLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  checkboxLabelChecked: {
    fontWeight: '800',
    color: '#0F766E',
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  applyBtn: {
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
  applyBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});

export default AdvancedFilterModal;
