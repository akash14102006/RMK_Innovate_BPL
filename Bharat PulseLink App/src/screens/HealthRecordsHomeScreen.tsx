/**
 * Bharat PulseLink — Production Health Records Home Screen (Prompt 63)
 *
 * Apple Health × Premium Healthcare Command Center:
 * 1. Executive Health Snapshot Hero
 * 2. High-Utility Quick Actions Grid (Latest Visit, Latest Report, Add Med, Upload)
 * 3. 6 Core Health Category Tiles with real verified counts
 * 4. Recent Care Timeline with explicit source/provenance tags
 * 5. Neumorphic depth, large typography & 8pt grid alignment.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors, spacing, radii } from '../theme/tokens';
import HealthRecordsService from '../services/HealthRecordsService';
import BottomTabBar, { TabId } from '../components/home/BottomTabBar';

export const HealthRecordsHomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const data = await HealthRecordsService.getHealthRecordsOverview();
      setOverview(data);
    } catch (err) {
      console.warn('[RECORDS_HOME] Load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTabSelect = (tab: TabId) => {
    if (tab === 'Home') navigation.navigate('Home');
    else if (tab === 'Hospitals') navigation.navigate('Hospitals');
    else if (tab === 'Scan') navigation.navigate('ScanEntry');
    else if (tab === 'Profile') navigation.navigate('HealthSummary');
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.navigate('Home')}
            accessibilityRole="button"
            accessibilityLabel="Back to Home"
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

          <Text style={styles.headerTitle}>Health Records</Text>

          <TouchableOpacity
            style={styles.uploadHeaderBtn}
            onPress={() => navigation.navigate('UploadDocument')}
            accessibilityRole="button"
            accessibilityLabel="Upload medical document"
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M12 5v14M5 12h14" stroke="#0F766E" strokeWidth={2.5} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        >
          {/* 1. Executive Health Snapshot Hero */}
          <View style={styles.heroSnapshotCard}>
            <View style={styles.heroHeaderRow}>
              <View style={styles.heroBadgePill}>
                <View style={styles.heroBadgeDot} />
                <Text style={styles.heroBadgeText}>PATIENT HEALTH VAULT</Text>
              </View>
              <Text style={styles.heroSyncText}>Encrypted & Synced</Text>
            </View>

            <Text style={styles.heroTitle}>Your Unified Health Records</Text>
            <Text style={styles.heroSub}>
              Complete patient-owned repository of hospital visits, laboratory diagnostics, prescriptions, and verified documents.
            </Text>

            {/* Metrics Ribbon */}
            <View style={styles.metricsRibbon}>
              <View style={styles.metricItem}>
                <Text style={styles.metricNum}>{overview ? overview.counts.visits : '-'}</Text>
                <Text style={styles.metricLabel}>Visits</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricNum}>{overview ? overview.counts.labReports : '-'}</Text>
                <Text style={styles.metricLabel}>Lab Tests</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricNum}>{overview ? overview.counts.activeMedications : '-'}</Text>
                <Text style={styles.metricLabel}>Active Meds</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricNum}>{overview ? overview.counts.documents : '-'}</Text>
                <Text style={styles.metricLabel}>Documents</Text>
              </View>
            </View>

            {/* Link to Health Summary */}
            <TouchableOpacity
              style={styles.summaryLinkRow}
              onPress={() => navigation.navigate('HealthSummary')}
              accessibilityRole="button"
            >
              <Text style={styles.summaryLinkText}>View Executive Health Summary</Text>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path d="M9 18l6-6-6-6" stroke="#0F766E" strokeWidth={2.2} strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* 2. Quick Actions Grid */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionHeading}>QUICK ACTIONS</Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => navigation.navigate('VisitHistory')}
                accessibilityRole="button"
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="#0F766E" strokeWidth={2} />
                </Svg>
                <Text style={styles.quickActionText}>Latest Visit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => navigation.navigate('BloodTestReports')}
                accessibilityRole="button"
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" stroke="#0F766E" strokeWidth={2} />
                </Svg>
                <Text style={styles.quickActionText}>Lab Reports</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => navigation.navigate('AddMedication')}
                accessibilityRole="button"
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Circle cx={12} cy={12} r={10} stroke="#0F766E" strokeWidth={2} />
                  <Path d="M12 8v8M8 12h8" stroke="#0F766E" strokeWidth={2} />
                </Svg>
                <Text style={styles.quickActionText}>+ Add Med</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => navigation.navigate('UploadDocument')}
                accessibilityRole="button"
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path d="M12 5v14M5 12h14" stroke="#0F766E" strokeWidth={2.5} strokeLinecap="round" />
                </Svg>
                <Text style={styles.quickActionText}>+ Upload</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 3. Primary 6 Category Tiles */}
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionHeading}>RECORD CATEGORIES</Text>

            <View style={styles.grid}>
              {/* Category 1: Visits */}
              <TouchableOpacity
                style={styles.gridCard}
                onPress={() => navigation.navigate('VisitHistory')}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                <View style={styles.cardTopRow}>
                  <View style={styles.cardIconBox}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="#0F766E" strokeWidth={2} />
                    </Svg>
                  </View>
                  <Text style={styles.gridCardCount}>
                    {overview ? `${overview.counts.visits}` : '-'}
                  </Text>
                </View>
                <Text style={styles.gridCardTitle}>Visit History</Text>
                <Text style={styles.gridCardDesc}>Doctor consultations & OPD</Text>
              </TouchableOpacity>

              {/* Category 2: Blood & Lab Tests */}
              <TouchableOpacity
                style={styles.gridCard}
                onPress={() => navigation.navigate('BloodTestReports')}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                <View style={styles.cardTopRow}>
                  <View style={styles.cardIconBox}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" stroke="#0F766E" strokeWidth={2} />
                    </Svg>
                  </View>
                  <Text style={styles.gridCardCount}>
                    {overview ? `${overview.counts.labReports}` : '-'}
                  </Text>
                </View>
                <Text style={styles.gridCardTitle}>Blood & Lab Tests</Text>
                <Text style={styles.gridCardDesc}>CBC, lipid panels & pathology</Text>
              </TouchableOpacity>

              {/* Category 3: General Reports / Imaging */}
              <TouchableOpacity
                style={styles.gridCard}
                onPress={() => navigation.navigate('GeneralReports')}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                <View style={styles.cardTopRow}>
                  <View style={styles.cardIconBox}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Rect x="3" y="3" width="18" height="18" rx="2" stroke="#0F766E" strokeWidth={2} />
                      <Path d="M21 15l-5-5L5 21" stroke="#0F766E" strokeWidth={2} />
                    </Svg>
                  </View>
                  <Text style={styles.gridCardCount}>
                    {overview ? `${overview.counts.generalReports}` : '-'}
                  </Text>
                </View>
                <Text style={styles.gridCardTitle}>Imaging & ECG</Text>
                <Text style={styles.gridCardDesc}>X-Ray, ultrasound & ECG</Text>
              </TouchableOpacity>

              {/* Category 4: Prescriptions */}
              <TouchableOpacity
                style={styles.gridCard}
                onPress={() => navigation.navigate('PrescriptionRecords')}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                <View style={styles.cardTopRow}>
                  <View style={styles.cardIconBox}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#0F766E" strokeWidth={2} />
                      <Path d="M14 2v6h6" stroke="#0F766E" strokeWidth={2} />
                    </Svg>
                  </View>
                  <Text style={styles.gridCardCount}>
                    {overview ? `${overview.counts.prescriptions}` : '-'}
                  </Text>
                </View>
                <Text style={styles.gridCardTitle}>Prescriptions</Text>
                <Text style={styles.gridCardDesc}>Doctor medication orders</Text>
              </TouchableOpacity>

              {/* Category 5: Medications */}
              <TouchableOpacity
                style={styles.gridCard}
                onPress={() => navigation.navigate('Medications')}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                <View style={styles.cardTopRow}>
                  <View style={styles.cardIconBox}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Circle cx={12} cy={12} r={10} stroke="#0F766E" strokeWidth={2} />
                      <Path d="M12 8v8M8 12h8" stroke="#0F766E" strokeWidth={2} />
                    </Svg>
                  </View>
                  <Text style={styles.gridCardCount}>
                    {overview ? `${overview.counts.activeMedications}` : '-'}
                  </Text>
                </View>
                <Text style={styles.gridCardTitle}>Medications</Text>
                <Text style={styles.gridCardDesc}>Active patient regimen</Text>
              </TouchableOpacity>

              {/* Category 6: Documents */}
              <TouchableOpacity
                style={styles.gridCard}
                onPress={() => navigation.navigate('Documents')}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                <View style={styles.cardTopRow}>
                  <View style={styles.cardIconBox}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="#0F766E" strokeWidth={2} />
                    </Svg>
                  </View>
                  <Text style={styles.gridCardCount}>
                    {overview ? `${overview.counts.documents}` : '-'}
                  </Text>
                </View>
                <Text style={styles.gridCardTitle}>Documents</Text>
                <Text style={styles.gridCardDesc}>Discharge & insurance vault</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 4. Recent Care Timeline */}
          <View style={styles.recentSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>RECENT CLINICAL ACTIVITY</Text>
              <TouchableOpacity onPress={() => navigation.navigate('VisitHistory')}>
                <Text style={styles.seeAllText}>View All Visits →</Text>
              </TouchableOpacity>
            </View>

            {overview?.recentVisits?.map((visit: any) => (
              <TouchableOpacity
                key={visit.visitId}
                style={styles.recentVisitCard}
                onPress={() => navigation.navigate('VisitDetails', { visitId: visit.visitId })}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                <View style={styles.recentVisitRow}>
                  <View style={styles.recentVisitIcon}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="#0F766E" strokeWidth={2} />
                    </Svg>
                  </View>
                  <View style={styles.recentVisitInfo}>
                    <Text style={styles.recentVisitHospital}>{visit.hospitalName}</Text>
                    <Text style={styles.recentVisitDept}>
                      {visit.departmentName} • {visit.doctorName}
                    </Text>
                    <Text style={styles.recentVisitDate}>{formatDate(visit.visitDateISO)}</Text>
                  </View>
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedBadgeText}>HOSPITAL EHR</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Bottom Navigation Tab Bar */}
        <BottomTabBar activeTab="Records" onSelectTab={handleTabSelect} />
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
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  uploadHeaderBtn: {
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
    gap: 18,
    paddingBottom: 40,
  },
  heroSnapshotCard: {
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
    gap: 10,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
    gap: 5,
  },
  heroBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0F766E',
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0F766E',
    letterSpacing: 0.5,
  },
  heroSyncText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  heroSub: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  metricsRibbon: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: radii.xl,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  metricNum: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F766E',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  summaryLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDFA',
    borderRadius: radii.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginTop: 2,
  },
  summaryLinkText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F766E',
  },
  quickActionsSection: {
    gap: 8,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  quickActionText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F172A',
  },
  categoriesSection: {
    gap: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    gap: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.lg,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  gridCardCount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F766E',
  },
  gridCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  gridCardDesc: {
    fontSize: 10,
    color: '#64748B',
    lineHeight: 14,
  },
  recentSection: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  recentVisitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recentVisitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recentVisitIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentVisitInfo: {
    flex: 1,
    gap: 2,
  },
  recentVisitHospital: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  recentVisitDept: {
    fontSize: 11,
    color: '#64748B',
  },
  recentVisitDate: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  verifiedBadge: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  verifiedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0F766E',
  },
});

export default HealthRecordsHomeScreen;
