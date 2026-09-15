/**
 * Bharat PulseLink — Production Scan Entry Screen (Prompt 54)
 *
 * Point-of-care digital check-in command center:
 * 1. Hero overview of secure hospital exchange
 * 2. Primary: Scan Hospital QR (triggers camera permission only on tap)
 * 3. Secondary: Show My Secure QR
 * 4. Active Check-In Banner (when patient is checked in at a hospital)
 * 5. Privacy & Consent principles.
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
import { colors, spacing, radii, typography } from '../theme/tokens';
import SecureQRExchangeService from '../services/SecureQRExchangeService';
import { ActiveCheckInSession } from '../types/scan';
import BottomTabBar, { TabId } from '../components/home/BottomTabBar';

export const ScanEntryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [activeSession, setActiveSession] = useState<ActiveCheckInSession | null>(null);

  useEffect(() => {
    SecureQRExchangeService.getActiveCheckInSession().then((session) => {
      setActiveSession(session);
    });
  }, []);

  const handleEndSession = () => {
    Alert.alert(
      'End Hospital Session',
      'Are you sure you want to end your active check-in session at this hospital?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: async () => {
            await SecureQRExchangeService.clearActiveSession();
            setActiveSession(null);
          },
        },
      ]
    );
  };

  const handleTabSelect = (tab: TabId) => {
    if (tab === 'Home') navigation.navigate('Home');
    else if (tab === 'Hospitals') navigation.navigate('Hospitals');
    else if (tab === 'Records') navigation.navigate('HealthRecordsHome');
    else if (tab === 'Profile') navigation.navigate('HealthSummary');
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

          <Text style={styles.headerTitle}>Scan at Hospital</Text>

          <TouchableOpacity
            style={styles.helpBtn}
            onPress={() =>
              Alert.alert(
                'How Scanning Works',
                '1. Scan Hospital QR: Point your camera at the desk QR code to register instantly.\n\n2. Show My Secure QR: Present your temporary QR code to hospital staff.\n\nYour medical data is shared only after you grant explicit consent.'
              )
            }
            accessibilityRole="button"
            accessibilityLabel="Scan help information"
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Circle cx={12} cy={12} r={10} stroke="#0F766E" strokeWidth={2} />
              <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke="#0F766E" strokeWidth={2} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Active Session Banner (if present) */}
          {activeSession && (
            <TouchableOpacity
              style={styles.activeSessionBanner}
              onPress={() => navigation.navigate('MyCheckIn')}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Active check-in at ${activeSession.hospitalName}. Tap to view live queue.`}
            >
              <View style={styles.sessionHeaderRow}>
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>ACTIVE CHECK-IN</Text>
                </View>
                {activeSession.tokenNumber && (
                  <View style={styles.tokenPill}>
                    <Text style={styles.tokenText}>{activeSession.tokenNumber}</Text>
                  </View>
                )}
              </View>

              <Text style={styles.sessionHospitalName}>{activeSession.hospitalName}</Text>
              <Text style={styles.sessionDepartment}>
                {activeSession.departmentName} • {activeSession.counterDesk || 'Reception Desk'}
              </Text>

              <View style={styles.sessionFooterRow}>
                <Text style={styles.viewDetailsHint}>Tap to view live queue status →</Text>
                <TouchableOpacity style={styles.endSessionBtn} onPress={handleEndSession} accessibilityRole="button">
                  <Text style={styles.endSessionBtnText}>End</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}

          {/* Hero Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroIconBox}>
              <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"
                  stroke="#0F766E"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Rect x="7" y="7" width="10" height="10" rx="2" stroke="#0F766E" strokeWidth={2} />
                <Circle cx="12" cy="12" r="2" fill="#0F766E" />
              </Svg>
            </View>

            <Text style={styles.heroTitle}>Point-of-Care Digital Check-In</Text>
            <Text style={styles.heroSubtitle}>
              Connect with any verified Bharat PulseLink hospital desk in seconds. Share your medical history securely without paper forms.
            </Text>

            {/* Primary Action */}
            <TouchableOpacity
              style={styles.primaryScanBtn}
              onPress={() => navigation.navigate('QRScanner')}
              accessibilityRole="button"
              accessibilityLabel="Scan Hospital QR Code"
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Circle cx="12" cy="13" r="4" stroke="#FFFFFF" strokeWidth={2} />
              </Svg>
              <Text style={styles.primaryScanBtnText}>Scan Hospital QR</Text>
            </TouchableOpacity>

            {/* Secondary Action */}
            <TouchableOpacity
              style={styles.secondaryQRBtn}
              onPress={() => navigation.navigate('MySecureQR')}
              accessibilityRole="button"
              accessibilityLabel="Show My Secure QR Code"
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Rect x="3" y="3" width="7" height="7" rx="1" stroke="#0F766E" strokeWidth={2} />
                <Rect x="14" y="3" width="7" height="7" rx="1" stroke="#0F766E" strokeWidth={2} />
                <Rect x="3" y="14" width="7" height="7" rx="1" stroke="#0F766E" strokeWidth={2} />
                <Path d="M14 14h3v3h-3zM18 18h3v3h-3z" fill="#0F766E" />
              </Svg>
              <Text style={styles.secondaryQRBtnText}>Show My Secure QR</Text>
            </TouchableOpacity>
          </View>

          {/* Privacy & Trust Highlights */}
          <View style={styles.trustSection}>
            <Text style={styles.trustHeading}>PRIVACY & SECURITY GUARANTEES</Text>

            <View style={styles.trustCard}>
              <View style={styles.trustRow}>
                <View style={styles.trustIconBox}>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#0F766E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </View>
                <View style={styles.trustTextCol}>
                  <Text style={styles.trustTitle}>Granular Consent Control</Text>
                  <Text style={styles.trustBody}>
                    You review and authorize individual data categories (Allergies, Medications, Reports) before anything is shared.
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.trustCard}>
              <View style={styles.trustRow}>
                <View style={styles.trustIconBox}>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Circle cx={12} cy={12} r={10} stroke="#0F766E" strokeWidth={2} />
                    <Path d="M12 6v6l4 2" stroke="#0F766E" strokeWidth={2} strokeLinecap="round" />
                  </Svg>
                </View>
                <View style={styles.trustTextCol}>
                  <Text style={styles.trustTitle}>Short-Lived Opaque Sessions</Text>
                  <Text style={styles.trustBody}>
                    QR codes contain zero Aadhaar, PAN, or phone numbers. All sessions expire in 5 minutes with nonce protection.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Shared Bottom Tab Bar */}
        <BottomTabBar activeTab="Scan" onSelectTab={handleTabSelect} />
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
    letterSpacing: -0.3,
  },
  helpBtn: {
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
    gap: 16,
    paddingBottom: 40,
  },
  activeSessionBanner: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: radii.xl,
    padding: spacing.md,
    gap: 6,
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0F766E',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F766E',
    letterSpacing: 0.5,
  },
  tokenPill: {
    backgroundColor: '#0F766E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  tokenText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sessionHospitalName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  sessionDepartment: {
    fontSize: 12,
    color: '#0F766E',
    fontWeight: '600',
  },
  sessionFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  viewDetailsHint: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  endSessionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  endSessionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  heroCard: {
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
    alignItems: 'center',
    gap: 12,
  },
  heroIconBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: spacing.sm,
  },
  primaryScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F766E',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.xl,
    width: '100%',
    gap: 10,
    marginTop: 6,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryScanBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryQRBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.xl,
    width: '100%',
    gap: 8,
  },
  secondaryQRBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F766E',
  },
  trustSection: {
    gap: 10,
    marginTop: 4,
  },
  trustHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  trustCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  trustRow: {
    flexDirection: 'row',
    gap: 12,
  },
  trustIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustTextCol: {
    flex: 1,
    gap: 2,
  },
  trustTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  trustBody: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
});

export default ScanEntryScreen;
