/**
 * Bharat PulseLink — Executive Settings Control Center (Prompt 79)
 *
 * Apple Health × Fintech Security × Enterprise Healthcare:
 * 1. Large icon-led glass/neumorphic tiles with live real-world status badges
 * 2. Strict hierarchical grouping (Account, Healthcare, Security, Preferences, Support)
 * 3. Authoritative route routing to canonical sub-screens
 * 4. High-security Session Sign Out with complete state purge (Prompt 86).
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors, spacing, radii } from '../theme/tokens';
import AccountManagementService from '../services/AccountManagementService';
import SessionManager from '../services/sessionManager';

interface SettingTileProps {
  iconBg: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  statusBadge?: string;
  onPress: () => void;
}

const SettingTile: React.FC<SettingTileProps> = ({
  iconBg,
  icon,
  title,
  subtitle,
  statusBadge,
  onPress,
}) => (
  <TouchableOpacity
    style={styles.settingTile}
    onPress={onPress}
    activeOpacity={0.8}
    accessibilityRole="button"
    accessibilityLabel={title}
  >
    <View style={[styles.tileIconContainer, { backgroundColor: iconBg }]}>
      {icon}
    </View>

    <View style={styles.tileContent}>
      <View style={styles.tileTitleRow}>
        <Text style={styles.tileTitle}>{title}</Text>
        {statusBadge && (
          <View style={styles.tileStatusBadge}>
            <Text style={styles.tileStatusText}>{statusBadge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.tileSubtitle}>{subtitle}</Text>
    </View>

    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke="#94A3B8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  </TouchableOpacity>
);

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [activeConsentsCount, setActiveConsentsCount] = useState<number>(1);
  const [activeInsuranceText, setActiveInsuranceText] = useState<string>('₹10L Active');

  useEffect(() => {
    AccountManagementService.getActiveConsents().then((c) => {
      setActiveConsentsCount(c.filter((item) => item.status === 'ACTIVE').length);
    });
    AccountManagementService.getInsurancePolicies().then((p) => {
      const active = p.find((pol) => pol.status === 'ACTIVE');
      if (active) {
        setActiveInsuranceText(`₹${(active.sumInsuredINR / 100000).toFixed(0)}L Active`);
      }
    });
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out of Bharat PulseLink',
      'This will revoke your active session and completely purge all decrypted health records and cached credentials from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await SessionManager.logout();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Top Header */}
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

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Settings & Controls</Text>
            <Text style={styles.headerSub}>Account & Security Center</Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Group 1: ACCOUNT & IDENTITY */}
          <View style={styles.groupSection}>
            <Text style={styles.groupHeading}>ACCOUNT & IDENTITY</Text>

            <SettingTile
              iconBg="#F0FDFA"
              icon={
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#0F766E" strokeWidth={2} strokeLinecap="round" />
                  <Circle cx={12} cy={7} r={4} stroke="#0F766E" strokeWidth={2} />
                </Svg>
              }
              title="Patient Profile"
              subtitle="ABHA ID 91-2048-9182-4410 • ABDM Verified"
              statusBadge="Verified"
              onPress={() => navigation.navigate('ProfileHome')}
            />

            <SettingTile
              iconBg="#F8FAFC"
              icon={
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#475569" strokeWidth={2} />
                  <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#475569" strokeWidth={2} />
                </Svg>
              }
              title="Edit Personal Information"
              subtitle="Update residential address, contact details"
              onPress={() => navigation.navigate('EditProfile')}
            />

            <SettingTile
              iconBg="#FEF2F2"
              icon={
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#DC2626" strokeWidth={2} />
                </Svg>
              }
              title="Emergency Contacts & Mode"
              subtitle="Priya Kumar (Spouse) • 108 Helpline"
              statusBadge="Configured"
              onPress={() => navigation.navigate('EmergencyContact')}
            />
          </View>

          {/* Group 2: HEALTHCARE & COVERAGE */}
          <View style={styles.groupSection}>
            <Text style={styles.groupHeading}>HEALTHCARE & COVERAGE</Text>

            <SettingTile
              iconBg="#F0FDFA"
              icon={
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" stroke="#0F766E" strokeWidth={2} />
                </Svg>
              }
              title="Health Insurance"
              subtitle="Star Health • Medi Assist Cashless Network"
              statusBadge={activeInsuranceText}
              onPress={() => navigation.navigate('Insurance')}
            />

            <SettingTile
              iconBg="#EEF2FF"
              icon={
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="#4F46E5" strokeWidth={2} />
                </Svg>
              }
              title="Health Summary"
              subtitle="Blood Group O+ • Chronic Conditions"
              onPress={() => navigation.navigate('HealthSummary')}
            />

            <SettingTile
              iconBg="#F0FDF4"
              icon={
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#16A34A" strokeWidth={2} />
                  <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#16A34A" strokeWidth={2} />
                </Svg>
              }
              title="Documents & Vault"
              subtitle="Prescriptions, Discharge Summaries, Lab PDFs"
              onPress={() => navigation.navigate('Documents')}
            />
          </View>

          {/* Group 3: SECURITY & PRIVACY */}
          <View style={styles.groupSection}>
            <Text style={styles.groupHeading}>SECURITY & PRIVACY</Text>

            <SettingTile
              iconBg="#F0FDFA"
              icon={
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Circle cx={12} cy={12} r={10} stroke="#0F766E" strokeWidth={2} />
                  <Path d="M12 8v4l3 3" stroke="#0F766E" strokeWidth={2} strokeLinecap="round" />
                </Svg>
              }
              title="Security Center"
              subtitle="Hardware Biometrics, PIN, Active Sessions"
              statusBadge="Active"
              onPress={() => navigation.navigate('SecurityCenter')}
            />

            <SettingTile
              iconBg="#F8FAFC"
              icon={
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Circle cx={12} cy={12} r={10} stroke="#475569" strokeWidth={2} />
                  <Path d="M12 16v-4M12 8h.01" stroke="#475569" strokeWidth={2} strokeLinecap="round" />
                </Svg>
              }
              title="Consent & Data Sharing"
              subtitle="Review & revoke active hospital permissions"
              statusBadge={`${activeConsentsCount} Active`}
              onPress={() => navigation.navigate('ConsentDataSharing')}
            />

            <SettingTile
              iconBg="#F8FAFC"
              icon={
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M12 8v4l3 3" stroke="#475569" strokeWidth={2} strokeLinecap="round" />
                  <Circle cx={12} cy={12} r={10} stroke="#475569" strokeWidth={2} />
                </Svg>
              }
              title="Access History & Audit"
              subtitle="Immutable record of doctor & hospital access"
              onPress={() => navigation.navigate('AccessHistory')}
            />
          </View>

          {/* Group 4: PREFERENCES */}
          <View style={styles.groupSection}>
            <Text style={styles.groupHeading}>PREFERENCES</Text>

            <SettingTile
              iconBg="#F0FDFA"
              icon={
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#0F766E" strokeWidth={2} />
                  <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#0F766E" strokeWidth={2} />
                </Svg>
              }
              title="Notification Center"
              subtitle="Appointments, test results & security alerts"
              onPress={() => navigation.navigate('NotificationCenter')}
            />

            <SettingTile
              iconBg="#EEF2FF"
              icon={
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Circle cx={12} cy={12} r={10} stroke="#4F46E5" strokeWidth={2} />
                  <Path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="#4F46E5" strokeWidth={2} />
                </Svg>
              }
              title="Language & Region"
              subtitle="English (India) • 10 Indian Languages"
              onPress={() => navigation.navigate('LanguageSettings')}
            />
          </View>

          {/* Group 5: SUPPORT & LEGAL */}
          <View style={styles.groupSection}>
            <Text style={styles.groupHeading}>SUPPORT & LEGAL</Text>

            <SettingTile
              iconBg="#F0FDFA"
              icon={
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Circle cx={12} cy={12} r={10} stroke="#0F766E" strokeWidth={2} />
                  <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke="#0F766E" strokeWidth={2} strokeLinecap="round" />
                </Svg>
              }
              title="Help & Support Center"
              subtitle="24/7 Helpline, FAQs & Support Tickets"
              onPress={() => navigation.navigate('HelpSupport')}
            />

            <SettingTile
              iconBg="#F8FAFC"
              icon={
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#475569" strokeWidth={2} />
                  <Path d="M14 2v6h6" stroke="#475569" strokeWidth={2} />
                </Svg>
              }
              title="Privacy Policy & DPDP Charter"
              subtitle="Digital Personal Data Protection compliance"
              onPress={() => navigation.navigate('PrivacyPolicy')}
            />
          </View>

          {/* Group 6: SESSION SIGN OUT */}
          <View style={styles.groupSection}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              accessibilityRole="button"
              accessibilityLabel="Sign Out of Bharat PulseLink"
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="#DC2626" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={styles.logoutButtonText}>Sign Out of Bharat PulseLink</Text>
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
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 10,
    color: '#0F766E',
    fontWeight: '700',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: 20,
    paddingBottom: 40,
  },
  groupSection: {
    gap: 8,
  },
  groupHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    paddingLeft: 4,
  },
  settingTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xxl,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  tileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileContent: {
    flex: 1,
    gap: 2,
  },
  tileTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 4,
  },
  tileTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  tileStatusBadge: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tileStatusText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0F766E',
  },
  tileSubtitle: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radii.xl,
    paddingVertical: 14,
    gap: 8,
    marginTop: 4,
  },
  logoutButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
});

export default SettingsScreen;
