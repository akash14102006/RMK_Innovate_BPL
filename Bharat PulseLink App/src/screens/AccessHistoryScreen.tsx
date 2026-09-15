/**
 * Bharat PulseLink — Production Access History & Audit Screen (Prompt 82)
 *
 * Audit transparency & access logging:
 * 1. Detailed log of every healthcare data access event
 * 2. Accessor identity, organization & clinical purpose
 * 3. Specific clinical data scopes accessed
 * 4. Exact timestamp and authorization outcome.
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
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, spacing, radii } from '../theme/tokens';
import AccountManagementService from '../services/AccountManagementService';
import { AccessAuditLogItem } from '../types/account';

export const AccessHistoryScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [logs, setLogs] = useState<AccessAuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    AccountManagementService.getAccessAuditLogs().then((data) => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
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

          <Text style={styles.headerTitle}>Access History</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Transparency Info Banner */}
          <View style={styles.infoBanner}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Circle cx={12} cy={12} r={10} stroke="#0F766E" strokeWidth={2} />
              <Path d="M12 8v4l3 3" stroke="#0F766E" strokeWidth={2} strokeLinecap="round" />
            </Svg>
            <Text style={styles.infoBannerText}>
              Every time a clinician or hospital accesses your health records via ABDM consent or triage scan, an immutable audit event is recorded here.
            </Text>
          </View>

          {/* Audit Logs List */}
          <View style={styles.logsSection}>
            <Text style={styles.sectionHeading}>ACCESS LOGS ({logs.length})</Text>

            {loading ? (
              <ActivityIndicator size="small" color="#0F766E" style={{ marginTop: 20 }} />
            ) : logs.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No Access Events Recorded</Text>
                <Text style={styles.emptySub}>No healthcare providers have accessed your records recently.</Text>
              </View>
            ) : (
              logs.map((item) => (
                <View key={item.auditId} style={styles.logCard}>
                  <View style={styles.logHeaderRow}>
                    <Text style={styles.accessorName}>{item.accessorName}</Text>
                    <View style={styles.outcomeBadge}>
                      <Text style={styles.outcomeBadgeText}>{item.outcome}</Text>
                    </View>
                  </View>

                  <Text style={styles.orgName}>{item.organizationName}</Text>

                  <View style={styles.purposeBox}>
                    <Text style={styles.purposeLabel}>PURPOSE</Text>
                    <Text style={styles.purposeValue}>{item.purpose}</Text>
                  </View>

                  <View style={styles.dataAccessedBox}>
                    <Text style={styles.dataAccessedLabel}>DATA ACCESSED</Text>
                    <Text style={styles.dataAccessedValue}>{item.dataAccessedSummary}</Text>
                  </View>

                  <View style={styles.timestampRow}>
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                      <Circle cx={12} cy={12} r={10} stroke="#94A3B8" strokeWidth={1.8} />
                      <Path d="M12 6v6l4 2" stroke="#94A3B8" strokeWidth={1.8} strokeLinecap="round" />
                    </Svg>
                    <Text style={styles.timestampText}>{formatDate(item.timestampISO)}</Text>
                  </View>
                </View>
              ))
            )}
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: radii.xl,
    padding: 12,
    gap: 10,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 11,
    color: '#0F766E',
    lineHeight: 16,
  },
  logsSection: {
    gap: 10,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xxl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  logHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accessorName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  outcomeBadge: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  outcomeBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#0F766E',
  },
  orgName: {
    fontSize: 11,
    color: '#0F766E',
    fontWeight: '700',
  },
  purposeBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: radii.lg,
    padding: 8,
    gap: 2,
    marginTop: 2,
  },
  purposeLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  purposeValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  dataAccessedBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: radii.lg,
    padding: 8,
    gap: 2,
  },
  dataAccessedLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  dataAccessedValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  timestampText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 11,
    color: '#64748B',
  },
});

export default AccessHistoryScreen;
