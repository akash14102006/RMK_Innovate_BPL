/**
 * Bharat PulseLink — Production Security Center Screen (Prompt 80)
 *
 * Real device security & session control plane:
 * 1. Hardware Biometric Unlock toggle (FaceID / Fingerprint)
 * 2. 4-Digit Security PIN management & Change PIN
 * 3. Active Sessions list with remote session revocation
 * 4. Real Security Activity audit timeline (no fake score).
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, spacing, radii } from '../theme/tokens';
import DeviceSecurityService from '../services/DeviceSecurityService';
import AccountManagementService from '../services/AccountManagementService';
import { ActiveSessionRecord, SecurityEventRecord } from '../types/account';

export const SecurityCenterScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [biometricEnabled, setBiometricEnabled] = useState<boolean>(false);
  const [sessions, setSessions] = useState<ActiveSessionRecord[]>([]);
  const [events, setEvents] = useState<SecurityEventRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadSecurityState = async () => {
    try {
      const config = await DeviceSecurityService.getConfig();
      const sess = await AccountManagementService.getActiveSessions();
      const evt = await AccountManagementService.getSecurityEvents();
      setBiometricEnabled(config.biometricEnabled);
      setSessions(sess);
      setEvents(evt);
    } catch (err) {
      console.warn('[SECURITY] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSecurityState();
  }, []);

  const handleToggleBiometric = async (value: boolean) => {
    await DeviceSecurityService.setBiometricEnabled(value);
    setBiometricEnabled(value);
  };

  const handleRevokeOtherSessions = () => {
    Alert.alert(
      'Revoke Other Sessions',
      'Sign out all other logged-in browsers and devices?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke Sessions',
          style: 'destructive',
          onPress: async () => {
            await AccountManagementService.revokeOtherSessions();
            loadSecurityState();
            Alert.alert('Sessions Revoked', 'All other active sessions have been terminated.');
          },
        },
      ]
    );
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
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

          <Text style={styles.headerTitle}>Security Center</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Device Authentication Controls */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>DEVICE AUTHENTICATION</Text>

            {/* Biometric Toggle */}
            <View style={styles.authRow}>
              <View style={styles.authIconBox}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path d="M12 2a10 10 0 0 0-10 10c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" stroke="#0F766E" strokeWidth={1.5} />
                </Svg>
              </View>
              <View style={styles.authTextCol}>
                <Text style={styles.authTitle}>Biometric Unlock</Text>
                <Text style={styles.authSub}>Face ID / Fingerprint Keystore</Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleToggleBiometric}
                trackColor={{ false: '#CBD5E1', true: '#0F766E' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Security PIN */}
            <View style={styles.authRow}>
              <View style={styles.authIconBox}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Circle cx={12} cy={12} r={10} stroke="#0F766E" strokeWidth={2} />
                  <Path d="M12 8v4l3 3" stroke="#0F766E" strokeWidth={2} strokeLinecap="round" />
                </Svg>
              </View>
              <View style={styles.authTextCol}>
                <Text style={styles.authTitle}>4-Digit Security PIN</Text>
                <Text style={styles.authSub}>Configured & Active</Text>
              </View>
              <TouchableOpacity
                style={styles.changePinBtn}
                onPress={() => navigation.navigate('SecurityPinSetup')}
                accessibilityRole="button"
              >
                <Text style={styles.changePinBtnText}>Change PIN</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 2. Active Logged-in Sessions */}
          <View style={styles.sectionCard}>
            <View style={styles.sessionsHeaderRow}>
              <Text style={styles.sectionHeading}>ACTIVE SESSIONS ({sessions.length})</Text>
              {sessions.length > 1 && (
                <TouchableOpacity onPress={handleRevokeOtherSessions}>
                  <Text style={styles.revokeAllText}>Sign out others</Text>
                </TouchableOpacity>
              )}
            </View>

            {sessions.map((s) => (
              <View key={s.sessionId} style={styles.sessionItem}>
                <View style={styles.sessionIconBox}>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path d="M4 6h16M4 12h16M4 18h16" stroke="#0F766E" strokeWidth={2} strokeLinecap="round" />
                  </Svg>
                </View>
                <View style={styles.sessionMetaCol}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.sessionDeviceName}>{s.deviceName}</Text>
                    {s.isCurrentDevice && (
                      <View style={styles.currentDevicePill}>
                        <Text style={styles.currentDevicePillText}>THIS DEVICE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.sessionSubText}>
                    {s.locationCity} • {formatDate(s.lastActiveISO)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* 3. Security Activity Audit Stream */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>RECENT SECURITY EVENTS</Text>

            {events.map((evt) => (
              <View key={evt.eventId} style={styles.eventItem}>
                <View style={styles.eventDot} />
                <View style={styles.eventContent}>
                  <Text style={styles.eventDesc}>{evt.description}</Text>
                  <Text style={styles.eventSub}>
                    {evt.deviceSummary} • {formatDate(evt.timestampISO)}
                  </Text>
                </View>
              </View>
            ))}
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
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xxl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  authRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  authIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authTextCol: {
    flex: 1,
    gap: 2,
  },
  authTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  authSub: {
    fontSize: 11,
    color: '#64748B',
  },
  changePinBtn: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.md,
  },
  changePinBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F766E',
  },
  sessionsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  revokeAllText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  sessionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionMetaCol: {
    flex: 1,
    gap: 2,
  },
  sessionDeviceName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  currentDevicePill: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currentDevicePillText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#0F766E',
  },
  sessionSubText: {
    fontSize: 11,
    color: '#64748B',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 6,
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0F766E',
    marginTop: 5,
  },
  eventContent: {
    flex: 1,
    gap: 2,
  },
  eventDesc: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  eventSub: {
    fontSize: 10,
    color: '#64748B',
  },
});

export default SecurityCenterScreen;
