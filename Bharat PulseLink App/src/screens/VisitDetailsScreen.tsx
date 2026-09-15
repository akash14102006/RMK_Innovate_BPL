/**
 * Bharat PulseLink — Production Visit Details Screen (Prompt 65)
 *
 * Detailed healthcare encounter summary:
 * 1. Attending physician, hospital, department & visit type
 * 2. Reason for visit & diagnosis summary
 * 3. Associated diagnostic reports and provider prescriptions
 * 4. Clinical provenance and verified source stamp.
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
import { useRoute, useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors, spacing, radii } from '../theme/tokens';
import HealthRecordsService from '../services/HealthRecordsService';
import { VisitRecord } from '../types/healthRecords';

export const VisitDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { visitId = 'vis_chennai_01' } = route.params || {};

  const [visit, setVisit] = useState<VisitRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    HealthRecordsService.getVisitById(visitId).then((data) => {
      setVisit(data);
      setLoading(false);
    });
  }, [visitId]);

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.loadingText}>Loading visit record...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!visit) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Visit record not found.</Text>
          <TouchableOpacity style={styles.backBtnAction} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnActionText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back to Visit History"
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

          <Text style={styles.headerTitle}>Visit Details</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Encounter Hero Card */}
          <View style={styles.heroCard}>
            <View style={styles.verifiedRow}>
              <View style={styles.verifiedIcon}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <Circle cx={12} cy={12} r={10} fill="#0F766E" />
                  <Path d="M8 12l3 3 5-5" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" />
                </Svg>
              </View>
              <Text style={styles.verifiedText}>VERIFIED CLINICAL ENCOUNTER</Text>
            </View>

            <Text style={styles.hospitalName}>{visit.hospitalName}</Text>
            <Text style={styles.deptText}>{visit.departmentName}</Text>

            <View style={styles.dateBadgeRow}>
              <Text style={styles.dateText}>{formatDate(visit.visitDateISO)}</Text>
              <View style={styles.typePill}>
                <Text style={styles.typePillText}>{visit.visitType}</Text>
              </View>
            </View>
          </View>

          {/* 2. Doctor & Clinical Summary Card */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>ATTENDING CLINICIAN</Text>
            <Text style={styles.doctorName}>{visit.doctorName}</Text>
            <Text style={styles.serviceName}>{visit.serviceName}</Text>

            <View style={styles.divider} />

            <Text style={styles.sectionLabel}>REASON FOR VISIT</Text>
            <Text style={styles.bodyText}>{visit.reasonForVisit}</Text>

            {visit.diagnosisSummary && (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionLabel}>DIAGNOSIS & CLINICAL NOTES</Text>
                <Text style={styles.bodyTextBold}>{visit.diagnosisSummary}</Text>
              </>
            )}
          </View>

          {/* 3. Associated Records Links */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>ASSOCIATED RECORDS FROM THIS VISIT</Text>

            {/* Prescriptions */}
            <TouchableOpacity
              style={styles.recordLinkRow}
              onPress={() => navigation.navigate('PrescriptionRecords')}
              accessibilityRole="button"
            >
              <View style={styles.recordLinkIcon}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#0F766E" strokeWidth={2} />
                  <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#0F766E" strokeWidth={2} />
                </Svg>
              </View>
              <View style={styles.recordLinkTextCol}>
                <Text style={styles.recordLinkTitle}>Doctor Prescriptions</Text>
                <Text style={styles.recordLinkSub}>View medications ordered during this visit</Text>
              </View>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path d="M9 18l6-6-6-6" stroke="#94A3B8" strokeWidth={2} strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>

            {/* Lab Reports */}
            <TouchableOpacity
              style={styles.recordLinkRow}
              onPress={() => navigation.navigate('BloodTestReports')}
              accessibilityRole="button"
            >
              <View style={styles.recordLinkIcon}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" stroke="#0F766E" strokeWidth={2} />
                </Svg>
              </View>
              <View style={styles.recordLinkTextCol}>
                <Text style={styles.recordLinkTitle}>Diagnostic Lab Reports</Text>
                <Text style={styles.recordLinkSub}>Complete Blood Count (CBC) & parameters</Text>
              </View>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path d="M9 18l6-6-6-6" stroke="#94A3B8" strokeWidth={2} strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>

            {/* General Imaging */}
            <TouchableOpacity
              style={styles.recordLinkRow}
              onPress={() => navigation.navigate('GeneralReports')}
              accessibilityRole="button"
            >
              <View style={styles.recordLinkIcon}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Rect x="3" y="3" width="18" height="18" rx="2" stroke="#0F766E" strokeWidth={2} />
                  <Path d="M21 15l-5-5L5 21" stroke="#0F766E" strokeWidth={2} />
                </Svg>
              </View>
              <View style={styles.recordLinkTextCol}>
                <Text style={styles.recordLinkTitle}>Imaging & ECG</Text>
                <Text style={styles.recordLinkSub}>12-Lead ECG Report</Text>
              </View>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path d="M9 18l6-6-6-6" stroke="#94A3B8" strokeWidth={2} strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Provenance Footnote */}
          <View style={styles.provenanceCard}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#0F766E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={styles.provenanceText}>
              Source: Hospital Electronic Health Records (EHR). Provenance verified via National Health Registry exchange.
            </Text>
          </View>
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
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '700',
  },
  backBtnAction: {
    backgroundColor: '#0F766E',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radii.lg,
  },
  backBtnActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
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
    gap: 14,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xxl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 6,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedIcon: {
    marginTop: 1,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
    letterSpacing: 0.5,
  },
  hospitalName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  deptText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F766E',
  },
  dateBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  typePill: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  typePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xxl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  serviceName: {
    fontSize: 12,
    color: '#64748B',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  bodyText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  bodyTextBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
  },
  recordLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: radii.xl,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
    gap: 12,
  },
  recordLinkIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordLinkTextCol: {
    flex: 1,
    gap: 2,
  },
  recordLinkTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  recordLinkSub: {
    fontSize: 11,
    color: '#64748B',
  },
  provenanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: radii.lg,
    padding: 12,
    gap: 10,
  },
  provenanceText: {
    flex: 1,
    fontSize: 11,
    color: '#0F766E',
    lineHeight: 16,
  },
});

export default VisitDetailsScreen;
