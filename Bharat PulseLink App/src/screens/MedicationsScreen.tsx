/**
 * Bharat PulseLink — Production Medications Screen (Prompt 69)
 *
 * Patient active medication regimen manager:
 * 1. Categorized view (Active, Completed, Stopped)
 * 2. Clear provenance distinction (Doctor Prescribed vs Patient Added)
 * 3. Schedule, timing, dosage & clinical purpose
 * 4. Direct CTA to Add Medication (Prompt 70).
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors, spacing, radii } from '../theme/tokens';
import HealthRecordsService from '../services/HealthRecordsService';
import { PatientMedication, MedicationStatus } from '../types/healthRecords';

export const MedicationsScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [medications, setMedications] = useState<PatientMedication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeStatus, setActiveStatus] = useState<MedicationStatus>('ACTIVE');

  const loadMeds = async () => {
    try {
      const data = await HealthRecordsService.getMedications(activeStatus);
      setMedications(data);
    } catch (err) {
      console.warn('[MEDICATIONS] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeds();
  }, [activeStatus]);

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

          <Text style={styles.headerTitle}>Medications</Text>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddMedication')}
            accessibilityRole="button"
            accessibilityLabel="Add new medication"
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M12 5v14M5 12h14" stroke="#0F766E" strokeWidth={2.5} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Status Filter Tabs */}
        <View style={styles.filterBar}>
          {(['ACTIVE', 'COMPLETED', 'STOPPED'] as const).map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.filterChip, activeStatus === st && styles.filterChipActive]}
              onPress={() => {
                setLoading(true);
                setActiveStatus(st);
              }}
            >
              <Text style={[styles.filterChipText, activeStatus === st && styles.filterChipTextActive]}>
                {st === 'ACTIVE' ? 'Active' : st === 'COMPLETED' ? 'Completed' : 'Stopped'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#0F766E" style={{ marginTop: 24 }} />
          ) : medications.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No Medications in this Category</Text>
              <Text style={styles.emptySub}>Tap '+ Add Medication' to record your medicines.</Text>
            </View>
          ) : (
            medications.map((med) => {
              const isDoctorPrescribed = med.provenance === 'DOCTOR_PRESCRIBED';
              return (
                <View key={med.medicationId} style={styles.medCard}>
                  <View style={styles.medCardHeader}>
                    <View style={styles.medIconBox}>
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                        <Circle cx={12} cy={12} r={10} stroke="#0F766E" strokeWidth={2} />
                        <Path d="M12 8v8M8 12h8" stroke="#0F766E" strokeWidth={2} />
                      </Svg>
                    </View>
                    <View style={styles.medTitleCol}>
                      <Text style={styles.medicineName}>{med.medicineName}</Text>
                      {med.genericName && (
                        <Text style={styles.genericName}>{med.genericName}</Text>
                      )}
                    </View>
                    <View style={styles.strengthBadge}>
                      <Text style={styles.strengthBadgeText}>{med.strength}</Text>
                    </View>
                  </View>

                  <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>DOSAGE</Text>
                      <Text style={styles.detailValue}>{med.dosage}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>FREQUENCY</Text>
                      <Text style={styles.detailValue}>{med.frequency}</Text>
                    </View>
                  </View>

                  <View style={styles.timingBox}>
                    <Text style={styles.timingLabel}>SCHEDULE / TIMING</Text>
                    <Text style={styles.timingValue}>{med.timing}</Text>
                  </View>

                  <View style={styles.purposeBox}>
                    <Text style={styles.purposeLabel}>PURPOSE</Text>
                    <Text style={styles.purposeValue}>{med.purpose}</Text>
                  </View>

                  {/* Provenance Badge */}
                  <View style={styles.medFooter}>
                    <View style={[styles.provenancePill, isDoctorPrescribed ? styles.provDoctor : styles.provPatient]}>
                      <Text style={[styles.provenanceText, isDoctorPrescribed ? styles.provTextDoctor : styles.provTextPatient]}>
                        {isDoctorPrescribed ? 'DOCTOR PRESCRIBED' : 'PATIENT ADDED'}
                      </Text>
                    </View>
                    {med.prescribedBy && (
                      <Text style={styles.prescribedByText}>{med.prescribedBy}</Text>
                    )}
                  </View>
                </View>
              );
            })
          )}

          {/* Add Medication CTA */}
          <TouchableOpacity
            style={styles.addMedicationActionBtn}
            onPress={() => navigation.navigate('AddMedication')}
            accessibilityRole="button"
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M12 5v14M5 12h14" stroke="#0F766E" strokeWidth={2.5} strokeLinecap="round" />
            </Svg>
            <Text style={styles.addMedicationActionBtnText}>Add Another Medication</Text>
          </TouchableOpacity>
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
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: 14,
    paddingBottom: 40,
  },
  medCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xxl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    gap: 8,
  },
  medCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  medIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  medTitleCol: {
    flex: 1,
    gap: 2,
  },
  medicineName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  genericName: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },
  strengthBadge: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  strengthBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F766E',
  },
  detailsGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: radii.lg,
    padding: 10,
    marginTop: 4,
    gap: 16,
  },
  detailItem: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  timingBox: {
    gap: 2,
  },
  timingLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  timingValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F766E',
  },
  purposeBox: {
    gap: 2,
  },
  purposeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  purposeValue: {
    fontSize: 12,
    color: '#475569',
  },
  medFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  provenancePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  provDoctor: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  provPatient: {
    backgroundColor: '#F1F5F9',
  },
  provenanceText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  provTextDoctor: {
    color: '#0F766E',
  },
  provTextPatient: {
    color: '#64748B',
  },
  prescribedByText: {
    fontSize: 10,
    color: '#64748B',
  },
  addMedicationActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingVertical: 14,
    borderRadius: radii.xl,
    gap: 8,
    marginTop: 6,
  },
  addMedicationActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F766E',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
    gap: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
  },
});

export default MedicationsScreen;
