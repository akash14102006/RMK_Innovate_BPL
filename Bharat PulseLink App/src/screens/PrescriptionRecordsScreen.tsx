/**
 * Bharat PulseLink — Production Prescription Records Screen (Prompt 68)
 *
 * Provider-issued medical orders viewer:
 * 1. Issuing clinician, hospital & diagnosis context
 * 2. Exact medication schedule (Drug, Strength, Dose, Frequency, Duration)
 * 3. Doctor's clinical instructions
 * 4. Provenance distinction from patient medication list.
 */

import React, { useState, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors, spacing, radii } from '../theme/tokens';
import HealthRecordsService from '../services/HealthRecordsService';
import { PrescriptionRecord } from '../types/healthRecords';

export const PrescriptionRecordsScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    HealthRecordsService.getPrescriptions().then((data) => {
      setPrescriptions(data);
      setLoading(false);
    });
  }, []);

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const handleDownloadRx = (rx: PrescriptionRecord) => {
    Alert.alert(
      'Signed Prescription',
      `Downloading digital copy of prescription issued by ${rx.doctorName}.`,
      [{ text: 'OK' }]
    );
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

          <Text style={styles.headerTitle}>Prescriptions</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#0F766E" style={{ marginTop: 24 }} />
          ) : prescriptions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No Prescriptions Found</Text>
              <Text style={styles.emptySub}>No hospital or doctor issued prescriptions recorded.</Text>
            </View>
          ) : (
            prescriptions.map((rx) => (
              <View key={rx.prescriptionId} style={styles.rxCard}>
                {/* Doctor & Hospital Header */}
                <View style={styles.rxHeaderRow}>
                  <View style={styles.rxIconBox}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#0F766E" strokeWidth={2} />
                      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#0F766E" strokeWidth={2} />
                    </Svg>
                  </View>
                  <View style={styles.rxMetaCol}>
                    <Text style={styles.rxDoctorName}>{rx.doctorName}</Text>
                    <Text style={styles.rxHospitalText}>
                      {rx.hospitalName} • {formatDate(rx.issuedDateISO)}
                    </Text>
                  </View>
                </View>

                <View style={styles.diagnosisBox}>
                  <Text style={styles.diagnosisLabel}>DIAGNOSIS CONTEXT</Text>
                  <Text style={styles.diagnosisValue}>{rx.diagnosisContext}</Text>
                </View>

                {/* Medicines List */}
                <View style={styles.medicinesSection}>
                  <Text style={styles.medicinesSectionHeading}>
                    PRESCRIBED MEDICINES ({rx.medicines.length})
                  </Text>

                  {rx.medicines.map((med, mIdx) => (
                    <View key={mIdx} style={styles.medItemCard}>
                      <View style={styles.medItemHeader}>
                        <Text style={styles.medItemName}>{med.medicineName}</Text>
                        <View style={styles.strengthPill}>
                          <Text style={styles.strengthText}>{med.strength}</Text>
                        </View>
                      </View>

                      {med.genericName && (
                        <Text style={styles.genericText}>Generic: {med.genericName}</Text>
                      )}

                      <View style={styles.medScheduleRow}>
                        <Text style={styles.scheduleText}>
                          Dosage: <Text style={{ fontWeight: '700', color: '#0F172A' }}>{med.dosage}</Text>
                        </Text>
                        <Text style={styles.scheduleText}>
                          Duration: <Text style={{ fontWeight: '700', color: '#0F172A' }}>{med.duration}</Text>
                        </Text>
                      </View>

                      <Text style={styles.frequencyText}>{med.frequency}</Text>

                      {med.instructions && (
                        <Text style={styles.instructionsText}>Note: {med.instructions}</Text>
                      )}
                    </View>
                  ))}
                </View>

                {/* Card Footer */}
                <View style={styles.rxCardFooter}>
                  <View style={styles.verifiedRow}>
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                      <Circle cx={12} cy={12} r={10} fill="#0F766E" />
                      <Path d="M8 12l3 3 5-5" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" />
                    </Svg>
                    <Text style={styles.verifiedText}>Doctor Prescribed EHR Order</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.downloadBtn}
                    onPress={() => handleDownloadRx(rx)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.downloadBtnText}>View Signed Rx PDF</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: 16,
    paddingBottom: 40,
  },
  rxCard: {
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
    gap: 10,
  },
  rxHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rxIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rxMetaCol: {
    flex: 1,
    gap: 2,
  },
  rxDoctorName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  rxHospitalText: {
    fontSize: 11,
    color: '#64748B',
  },
  diagnosisBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: radii.lg,
    padding: 10,
    gap: 2,
  },
  diagnosisLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  diagnosisValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  medicinesSection: {
    gap: 8,
    marginTop: 4,
  },
  medicinesSectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  medItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: radii.xl,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  medItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  medItemName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  strengthPill: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  strengthText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
  },
  genericText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },
  medScheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  scheduleText: {
    fontSize: 11,
    color: '#475569',
  },
  frequencyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
  },
  instructionsText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  rxCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F766E',
  },
  downloadBtn: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.md,
  },
  downloadBtnText: {
    fontSize: 11,
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

export default PrescriptionRecordsScreen;
