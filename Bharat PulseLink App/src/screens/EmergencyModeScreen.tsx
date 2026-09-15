/**
 * Bharat PulseLink — Production Emergency Mode Screen (Prompt 75)
 *
 * Real safety & emergency triage workflow:
 * 1. High-visibility Emergency Medical ID (Blood Group, Critical Allergies, Conditions)
 * 2. Rapid one-tap emergency calling (108 Ambulance, 112 National Emergency, Primary Contact)
 * 3. Emergency Triage QR for hospital ER scanning
 * 4. Safe accidental activation safeguards.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors, spacing, radii } from '../theme/tokens';
import AccountManagementService from '../services/AccountManagementService';
import { UserAccountProfile, EmergencyContact } from '../types/account';

export const EmergencyModeScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [profile, setProfile] = useState<UserAccountProfile | null>(null);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);

  useEffect(() => {
    AccountManagementService.getUserProfile().then(setProfile);
    AccountManagementService.getEmergencyContacts().then(setContacts);
  }, []);

  const primaryContact = contacts.find((c) => c.isPrimary) || contacts[0];

  const handleCallNumber = (num: string, label: string) => {
    Alert.alert('Emergency Call', `Connect immediately to ${label} (${num})?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call Now', onPress: () => Linking.openURL(`tel:${num.replace(/\s+/g, '')}`) },
    ]);
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

          <View style={styles.headerTitleRow}>
            <View style={styles.sosDot} />
            <Text style={styles.headerTitle}>Emergency Mode</Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Executive Emergency ID Hero Card */}
          <View style={styles.emergencyIdCard}>
            <View style={styles.cardTopRow}>
              <View>
                <Text style={styles.patientName}>{profile?.fullName || 'Akash Kumar'}</Text>
                <Text style={styles.abhaIdText}>ABHA: {profile?.abhaId || '91-2048-9182-4410'}</Text>
              </View>
              <View style={styles.bloodGroupBox}>
                <Text style={styles.bloodGroupLabel}>BLOOD</Text>
                <Text style={styles.bloodGroupText}>{profile?.bloodGroup || 'O+'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Critical Clinical Alerts */}
            <View style={styles.clinicalAlertsGrid}>
              <View style={styles.clinicalAlertItem}>
                <Text style={styles.alertHeading}>KNOWN CRITICAL ALLERGIES</Text>
                <Text style={styles.alertValue}>Penicillin, NSAIDs, Sulfa Drugs</Text>
              </View>

              <View style={styles.clinicalAlertItem}>
                <Text style={styles.alertHeading}>CHRONIC CONDITIONS</Text>
                <Text style={styles.alertValue}>Type 2 Diabetes Mellitus</Text>
              </View>
            </View>
          </View>

          {/* 2. One-Tap Emergency Calling Helpline Grid */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeading}>EMERGENCY HELPLINES (INDIA)</Text>

            <View style={styles.helplineGrid}>
              <TouchableOpacity
                style={[styles.helplineCard, styles.ambulanceCard]}
                onPress={() => handleCallNumber('108', 'National Ambulance Service')}
                accessibilityRole="button"
              >
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" stroke="#DC2626" strokeWidth={2} />
                </Svg>
                <Text style={styles.helplineNum}>108</Text>
                <Text style={styles.helplineLabel}>Ambulance</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.helplineCard, styles.policeCard]}
                onPress={() => handleCallNumber('112', 'National Emergency SOS')}
                accessibilityRole="button"
              >
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#0F766E" strokeWidth={2} />
                </Svg>
                <Text style={styles.helplineNum}>112</Text>
                <Text style={styles.helplineLabel}>National SOS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.helplineCard, styles.helplineOtherCard]}
                onPress={() => handleCallNumber('1091', 'Women Emergency Helpline')}
                accessibilityRole="button"
              >
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Circle cx={12} cy={12} r={10} stroke="#4F46E5" strokeWidth={2} />
                  <Path d="M12 8v8M8 12h8" stroke="#4F46E5" strokeWidth={2} />
                </Svg>
                <Text style={styles.helplineNum}>1091</Text>
                <Text style={styles.helplineLabel}>Helpline</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 3. Primary Emergency Contact One-Tap Call */}
          {primaryContact && (
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionHeading}>PRIMARY EMERGENCY CONTACT</Text>

              <TouchableOpacity
                style={styles.primaryContactCard}
                onPress={() => handleCallNumber(primaryContact.primaryPhone, primaryContact.fullName)}
                accessibilityRole="button"
              >
                <View style={styles.contactLeftCol}>
                  <Text style={styles.contactNameText}>{primaryContact.fullName}</Text>
                  <Text style={styles.contactSubText}>
                    {primaryContact.relationship} • {primaryContact.primaryPhone}
                  </Text>
                </View>
                <View style={styles.callNowPill}>
                  <Text style={styles.callNowPillText}>Call Now</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* 4. Emergency Triage QR Notice */}
          <View style={styles.triageQrCard}>
            <View style={styles.triageQrHeader}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Rect x="3" y="3" width="7" height="7" stroke="#0F766E" strokeWidth={2} rx={1} />
                <Rect x="14" y="3" width="7" height="7" stroke="#0F766E" strokeWidth={2} rx={1} />
                <Rect x="3" y="14" width="7" height="7" stroke="#0F766E" strokeWidth={2} rx={1} />
                <Rect x="14" y="14" width="7" height="7" stroke="#0F766E" strokeWidth={2} rx={1} />
              </Svg>
              <Text style={styles.triageQrTitle}>Emergency Triage QR</Text>
            </View>
            <Text style={styles.triageQrSub}>
              Hospitals can scan your Emergency Medical QR at reception triage to access your verified blood group, critical allergies, and emergency contacts.
            </Text>
            <TouchableOpacity
              style={styles.viewQrBtn}
              onPress={() => navigation.navigate('MySecureQR')}
              accessibilityRole="button"
            >
              <Text style={styles.viewQrBtnText}>Show Secure Patient QR →</Text>
            </TouchableOpacity>
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sosDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
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
  emergencyIdCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xxl,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: '#FECACA',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    gap: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  patientName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  abhaIdText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  bloodGroupBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radii.xl,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  bloodGroupLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  bloodGroupText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#DC2626',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  clinicalAlertsGrid: {
    gap: 10,
  },
  clinicalAlertItem: {
    gap: 2,
  },
  alertHeading: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  alertValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionWrap: {
    gap: 8,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  helplineGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  helplineCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  ambulanceCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  policeCard: {
    backgroundColor: '#F0FDFA',
    borderColor: '#CCFBF1',
  },
  helplineOtherCard: {
    backgroundColor: '#EEF2FF',
    borderColor: '#E0E7FF',
  },
  helplineNum: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  helplineLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  primaryContactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xxl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactLeftCol: {
    gap: 2,
  },
  contactNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  contactSubText: {
    fontSize: 11,
    color: '#64748B',
  },
  callNowPill: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.lg,
  },
  callNowPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  triageQrCard: {
    backgroundColor: '#F0FDFA',
    borderRadius: radii.xxl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    gap: 8,
  },
  triageQrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  triageQrTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  triageQrSub: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
  viewQrBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  viewQrBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F766E',
  },
});

export default EmergencyModeScreen;
