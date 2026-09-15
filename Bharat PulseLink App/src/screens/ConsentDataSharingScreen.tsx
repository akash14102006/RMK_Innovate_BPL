/**
 * Bharat PulseLink — Production Consent & Data Sharing Screen (Prompt 81)
 *
 * Patient privacy & healthcare access control center:
 * 1. Active hospital consents list with granted scopes
 * 2. Expiration timestamps & purpose statements
 * 3. ABDM consent version tracking
 * 4. Authoritative "Revoke Future Access" action with confirmation.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, spacing, radii } from '../theme/tokens';
import AccountManagementService from '../services/AccountManagementService';
import { ActiveConsentRecord } from '../types/account';

export const ConsentDataSharingScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [consents, setConsents] = useState<ActiveConsentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadConsents = async () => {
    try {
      const data = await AccountManagementService.getActiveConsents();
      setConsents(data);
    } catch (err) {
      console.warn('[CONSENT] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsents();
  }, []);

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const handleRevoke = (consent: ActiveConsentRecord) => {
    Alert.alert(
      'Revoke Future Data Access',
      `Are you sure you want to revoke data-sharing authorization for ${consent.recipientName}? The hospital will no longer receive new records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke Access',
          style: 'destructive',
          onPress: async () => {
            await AccountManagementService.revokeConsent(consent.consentId);
            loadConsents();
            Alert.alert('Access Revoked', 'Future data access has been revoked on the server.');
          },
        },
      ]
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

          <Text style={styles.headerTitle}>Consent & Data Sharing</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Circle cx={12} cy={12} r={10} stroke="#0F766E" strokeWidth={2} />
              <Path d="M12 16v-4M12 8h.01" stroke="#0F766E" strokeWidth={2} strokeLinecap="round" />
            </Svg>
            <Text style={styles.infoBannerText}>
              You have complete ownership over your health records. You can review active hospital access grants and revoke them at any time.
            </Text>
          </View>

          {/* Consents List */}
          <View style={styles.consentsSection}>
            <Text style={styles.sectionHeading}>ACTIVE HOSPITAL PERMISSIONS ({consents.length})</Text>

            {loading ? (
              <ActivityIndicator size="small" color="#0F766E" style={{ marginTop: 20 }} />
            ) : consents.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No Active Sharing Grants</Text>
                <Text style={styles.emptySub}>You have not shared health records with any healthcare provider.</Text>
              </View>
            ) : (
              consents.map((con) => (
                <View key={con.consentId} style={styles.consentCard}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.recipientName}>{con.recipientName}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        con.status === 'ACTIVE' ? styles.statusActive : styles.statusRevoked,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          con.status === 'ACTIVE' ? styles.textActive : styles.textRevoked,
                        ]}
                      >
                        {con.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.purposeBox}>
                    <Text style={styles.purposeLabel}>PURPOSE OF ACCESS</Text>
                    <Text style={styles.purposeValue}>{con.purpose}</Text>
                  </View>

                  {/* Scopes Chips */}
                  <View style={styles.scopesBox}>
                    <Text style={styles.scopesLabel}>AUTHORIZED DATA SCOPES</Text>
                    <View style={styles.scopesRow}>
                      {con.grantedScopes.map((scope, sIdx) => (
                        <View key={sIdx} style={styles.scopeChip}>
                          <Text style={styles.scopeChipText}>{scope}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>Granted: {formatDate(con.grantedAtISO)}</Text>
                    <Text style={styles.metaText}>Valid till: {formatDate(con.expiresAtISO)}</Text>
                  </View>

                  {/* Action */}
                  {con.status === 'ACTIVE' && (
                    <TouchableOpacity
                      style={styles.revokeBtn}
                      onPress={() => handleRevoke(con)}
                      accessibilityRole="button"
                    >
                      <Text style={styles.revokeBtnText}>Revoke Future Access</Text>
                    </TouchableOpacity>
                  )}
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
  consentsSection: {
    gap: 10,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  consentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xxl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recipientName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  statusRevoked: {
    backgroundColor: '#FEF2F2',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  textActive: {
    color: '#0F766E',
  },
  textRevoked: {
    color: '#DC2626',
  },
  purposeBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: radii.lg,
    padding: 10,
    gap: 2,
  },
  purposeLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  purposeValue: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
  },
  scopesBox: {
    gap: 4,
  },
  scopesLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  scopesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  scopeChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.md,
  },
  scopeChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  metaText: {
    fontSize: 10,
    color: '#64748B',
  },
  revokeBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radii.xl,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  revokeBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
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

export default ConsentDataSharingScreen;
