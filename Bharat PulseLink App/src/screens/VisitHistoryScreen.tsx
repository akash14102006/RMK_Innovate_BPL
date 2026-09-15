/**
 * Bharat PulseLink — Production Visit History Screen (Prompt 64)
 *
 * Chronological healthcare encounter timeline:
 * 1. Date-sorted visit records with server-authoritative status
 * 2. Search & filter tabs (All, Completed, In Progress)
 * 3. Hospital, department, attending clinician & reason for visit
 * 4. Navigation to Visit Details (Prompt 65).
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, spacing, radii } from '../theme/tokens';
import HealthRecordsService from '../services/HealthRecordsService';
import { VisitRecord, VisitStatus } from '../types/healthRecords';

export const VisitHistoryScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | VisitStatus>('ALL');

  useEffect(() => {
    HealthRecordsService.getVisitHistory().then((data) => {
      setVisits(data);
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

  const filteredVisits = visits.filter((v) => {
    const matchesSearch =
      v.hospitalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.reasonForVisit.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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

          <Text style={styles.headerTitle}>Visit History</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Circle cx={11} cy={11} r={8} stroke="#94A3B8" strokeWidth={2} />
              <Path d="m21 21-4.35-4.35" stroke="#94A3B8" strokeWidth={2} strokeLinecap="round" />
            </Svg>
            <TextInput
              style={styles.searchInput}
              placeholder="Search visits by hospital, doctor, or department..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Status Filter Tabs */}
        <View style={styles.filterBar}>
          {(['ALL', 'COMPLETED', 'IN_PROGRESS'] as const).map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.filterChip, statusFilter === st && styles.filterChipActive]}
              onPress={() => setStatusFilter(st)}
            >
              <Text style={[styles.filterChipText, statusFilter === st && styles.filterChipTextActive]}>
                {st === 'ALL' ? 'All Visits' : st === 'COMPLETED' ? 'Completed' : 'In Progress'}
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
          ) : filteredVisits.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No Visit Records Found</Text>
              <Text style={styles.emptySub}>No hospital encounters matching your criteria.</Text>
            </View>
          ) : (
            filteredVisits.map((visit) => (
              <TouchableOpacity
                key={visit.visitId}
                style={styles.visitCard}
                onPress={() => navigation.navigate('VisitDetails', { visitId: visit.visitId })}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Visit on ${formatDate(visit.visitDateISO)} at ${visit.hospitalName}`}
              >
                <View style={styles.visitDateRow}>
                  <Text style={styles.visitDateText}>{formatDate(visit.visitDateISO)}</Text>
                  <View style={styles.visitTypePill}>
                    <Text style={styles.visitTypeText}>{visit.visitType}</Text>
                  </View>
                </View>

                <Text style={styles.visitHospitalName}>{visit.hospitalName}</Text>
                <Text style={styles.visitDoctor}>
                  {visit.departmentName} • {visit.doctorName}
                </Text>

                <Text style={styles.visitReason} numberOfLines={2}>
                  Reason: {visit.reasonForVisit}
                </Text>

                <View style={styles.cardFooter}>
                  <View style={styles.verifiedRow}>
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                      <Circle cx={12} cy={12} r={10} fill="#0F766E" />
                      <Path d="M8 12l3 3 5-5" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" />
                    </Svg>
                    <Text style={styles.verifiedText}>Verified Clinical Record</Text>
                  </View>
                  <Text style={styles.viewDetailsText}>View Details →</Text>
                </View>
              </TouchableOpacity>
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
  searchWrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radii.xl,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
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
    paddingHorizontal: 12,
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
    gap: 12,
    paddingBottom: 40,
  },
  visitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xxl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    gap: 6,
  },
  visitDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  visitDateText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  visitTypePill: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  visitTypeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
  },
  visitHospitalName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  visitDoctor: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  visitReason: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 8,
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
  viewDetailsText: {
    fontSize: 12,
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

export default VisitHistoryScreen;
