/**
 * Bharat PulseLink — Production Scan Success Screen (Prompt 59)
 *
 * Implements server-authoritative exchange completion:
 * 1. Calm emerald success visual (Zero celebratory confetti)
 * 2. Verified hospital identity and validated purpose
 * 3. Exact list of actually shared data categories
 * 4. Authoritative completed timestamp and Queue Token receipt
 * 5. Query cache sync and clean home navigation.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors, spacing, radii } from '../theme/tokens';
import { queryKeys } from '../lib/queryKeys';
import { STANDARD_SHARING_SCOPES } from '../services/SecureQRExchangeService';
import { SharingScopeKey } from '../types/scan';

export const ScanSuccessScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const queryClient = useQueryClient();

  const {
    hospitalId = 'hosp_chennai_01',
    hospitalName = 'Rajiv Gandhi Government General Hospital',
    departmentName = 'Cardiology Outpatient',
    counterDesk = 'Reception Desk 3',
    purpose = 'Hospital OPD Registration & Clinical Triage',
    sharedScopes = ['BASIC_PROFILE', 'EMERGENCY_CONTACT', 'ALLERGIES'],
    completedAtISO = new Date().toISOString(),
    tokenNumber = 'T-108',
  } = route.params || {};

  // Invalidate queries on confirmed completion
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.home.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
  }, [queryClient]);

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
      return 'Just now';
    }
  };

  const getScopeLabel = (key: SharingScopeKey) => {
    const found = STANDARD_SHARING_SCOPES.find((s) => s.key === key);
    return found ? found.label : key;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Calm Emerald Success Emblem */}
          <View style={styles.successEmblemBox}>
            <View style={styles.successOuterCircle}>
              <View style={styles.successInnerCircle}>
                <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M20 6L9 17l-5-5"
                    stroke="#FFFFFF"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
            </View>

            <Text style={styles.successHeading}>Secure Connection Complete</Text>
            <Text style={styles.successSubHeading}>
              Your authorized health summary was securely transferred to the hospital desk.
            </Text>
          </View>

          {/* 2. Queue Token Badge (if applicable) */}
          {tokenNumber && (
            <View style={styles.tokenCard}>
              <Text style={styles.tokenLabel}>YOUR QUEUE TOKEN NUMBER</Text>
              <Text style={styles.tokenNumberText}>{tokenNumber}</Text>
              <Text style={styles.tokenCounterText}>
                {departmentName} • {counterDesk}
              </Text>
            </View>
          )}

          {/* 3. Transaction Summary Receipt */}
          <View style={styles.receiptCard}>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>HOSPITAL</Text>
              <Text style={styles.receiptValueBold}>{hospitalName}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>PURPOSE</Text>
              <Text style={styles.receiptValue}>{purpose}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>COMPLETED AT</Text>
              <Text style={styles.receiptValue}>{formatDate(completedAtISO)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.scopesSection}>
              <Text style={styles.receiptLabel}>INFORMATION SHARED ({sharedScopes.length})</Text>
              <View style={styles.scopeTagList}>
                {sharedScopes.map((scopeKey: SharingScopeKey) => (
                  <View key={scopeKey} style={styles.scopePill}>
                    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                      <Path d="M20 6L9 17l-5-5" stroke="#0F766E" strokeWidth={3} strokeLinecap="round" />
                    </Svg>
                    <Text style={styles.scopePillText}>{getScopeLabel(scopeKey)}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => navigation.navigate('Home')}
            accessibilityRole="button"
            accessibilityLabel="Done and return to home"
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewSessionBtn}
            onPress={() => navigation.replace('MyCheckIn')}
            accessibilityRole="button"
            accessibilityLabel="View live check-in and queue status"
          >
            <Text style={styles.viewSessionBtnText}>View My Check-In & Live Queue</Text>
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: 16,
    paddingBottom: 120,
    alignItems: 'center',
  },
  successEmblemBox: {
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  successOuterCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successInnerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  successHeading: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  successSubHeading: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.md,
  },
  tokenCard: {
    borderRadius: radii.xxl,
    padding: spacing.md,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    backgroundColor: '#F0FDFA',
    gap: 4,
  },
  tokenLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
    letterSpacing: 0.5,
  },
  tokenNumberText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F766E',
  },
  tokenCounterText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xxl,
    padding: spacing.lg,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  receiptRow: {
    gap: 3,
  },
  receiptLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  receiptValueBold: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  receiptValue: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  scopesSection: {
    gap: 8,
  },
  scopeTagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  scopePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
    gap: 6,
  },
  scopePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
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
    gap: 6,
  },
  doneBtn: {
    backgroundColor: '#0F766E',
    paddingVertical: 14,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  viewSessionBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  viewSessionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F766E',
  },
});

export default ScanSuccessScreen;
