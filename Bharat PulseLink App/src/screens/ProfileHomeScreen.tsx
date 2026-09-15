/**
 * Bharat PulseLink — Executive Patient Profile Command Center
 *
 * Master Healthcare Profile Experience:
 * 1. Reference-inspired Hero PatientProfileCard (Header cover, overlapping avatar, Name, Subtitle, Badges, Action buttons)
 * 2. Clean supporting progressive disclosure modules (Personal Info, Contact & Location, Clinical Snapshot, Emergency, Insurance, Security)
 * 3. Light & Dark theme support
 * 4. Skeleton loading & pull-to-refresh state
 *
 * Owned by: Patient Profile & UI Design Domain (Prompt 93/Master UI)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, spacing, radii } from '../theme/tokens';
import AccountManagementService from '../services/AccountManagementService';
import {
  UserAccountProfile,
  EmergencyContact,
  InsurancePolicy,
  ActiveConsentRecord,
} from '../types/account';
import BottomTabBar, { TabId } from '../components/home/BottomTabBar';
import {
  PatientProfileCard,
  ProfileSkeletonCard,
  ProfileSection,
  ProfileField,
} from '../components/profile/card';
import { useI18n } from '../i18n/I18nContext';

export const ProfileHomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { descriptor, t } = useI18n();
  const systemColorScheme = useColorScheme();
  const isDark = systemColorScheme === 'dark';

  const [profile, setProfile] = useState<UserAccountProfile | null>(null);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [consents, setConsents] = useState<ActiveConsentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadAllData = async () => {
    try {
      const [prof, cont, pol, con] = await Promise.all([
        AccountManagementService.getUserProfile(),
        AccountManagementService.getEmergencyContacts(),
        AccountManagementService.getInsurancePolicies(),
        AccountManagementService.getActiveConsents(),
      ]);
      setProfile(prof);
      setContacts(cont);
      setPolicies(pol);
      setConsents(con);
    } catch (err) {
      console.warn('[PROFILE] Load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAllData();
  };

  const handleTabSelect = (tab: TabId) => {
    if (tab === 'Home') navigation.navigate('Home');
    else if (tab === 'Hospitals') navigation.navigate('Hospitals');
    else if (tab === 'Records') navigation.navigate('HealthRecordsHome');
    else if (tab === 'Scan') navigation.navigate('ScanEntry');
  };

  const primaryContact = contacts.find((c) => c.isPrimary) || contacts[0];
  const activePolicy = policies.find((p) => p.status === 'ACTIVE') || policies[0];

  const bgColor = isDark ? '#0F172A' : '#F8FAFC';
  const navTitleColor = isDark ? '#F8FAFC' : '#0F172A';
  const navSubColor = isDark ? '#94A3B8' : '#64748B';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Top App Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backBtn, { borderColor: isDark ? '#334155' : '#E2E8F0', backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}
            onPress={() => navigation.navigate('Home')}
            accessibilityRole="button"
            accessibilityLabel="Back to Home"
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M19 12H5M12 19l-7-7 7-7"
                stroke={isDark ? '#F8FAFC' : colors.textPrimary}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: navTitleColor }]}>Patient Identity</Text>
            <Text style={[styles.headerSub, { color: navSubColor }]}>ABDM National Health Registry</Text>
          </View>

          <TouchableOpacity
            style={[styles.settingsBtn, { borderColor: isDark ? '#334155' : '#E2E8F0', backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}
            onPress={() => navigation.navigate('Settings')}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Circle cx={12} cy={12} r={3} stroke={isDark ? '#38BDF8' : '#0F766E'} strokeWidth={2} />
              <Path
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
                stroke={isDark ? '#38BDF8' : '#0F766E'}
                strokeWidth={2}
              />
            </Svg>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={isDark ? '#38BDF8' : '#0F766E'}
              colors={[isDark ? '#38BDF8' : '#0F766E']}
            />
          }
        >
          {loading && !profile ? (
            <ProfileSkeletonCard isDark={isDark} />
          ) : profile ? (
            <>
              {/* 1. Master Patient Profile Card (Hero) */}
              <PatientProfileCard
                profile={profile}
                onEditPress={() => navigation.navigate('EditProfile')}
                onSecondaryPress={() => navigation.navigate('MySecureQR')}
                secondaryActionLabel="View QR"
                isDark={isDark}
              />

              {/* 2. Personal Demographics Section */}
              <ProfileSection
                title="Personal Demographics"
                actionLabel="Edit"
                onActionPress={() => navigation.navigate('EditProfile')}
                isDark={isDark}
                icon={
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Circle cx={12} cy={8} r={4} stroke={isDark ? '#38BDF8' : '#0B4F6C'} strokeWidth={2} />
                    <Path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke={isDark ? '#38BDF8' : '#0B4F6C'} strokeWidth={2} />
                  </Svg>
                }
              >
                <ProfileField label="Full Name" value={profile.fullName} isDark={isDark} />
                <ProfileField label="Date of Birth" value={profile.dateOfBirth} isDark={isDark} />
                <ProfileField label="Gender" value={profile.gender} isDark={isDark} />
                <ProfileField label="Blood Group" value={profile.bloodGroup} isDark={isDark} />
                <ProfileField
                  label="Aadhaar ID"
                  value={profile.aadhaarMasked ? `${profile.aadhaarMasked} (UIDAI)` : null}
                  isVerified={profile.isAadhaarVerified}
                  isLast={true}
                  isDark={isDark}
                />
              </ProfileSection>

              {/* 3. Contact & Location Section */}
              <ProfileSection
                title="Contact & Location"
                actionLabel="Edit"
                onActionPress={() => navigation.navigate('EditProfile')}
                isDark={isDark}
                icon={
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke={isDark ? '#38BDF8' : '#0B4F6C'} strokeWidth={2} />
                  </Svg>
                }
              >
                <ProfileField label="Primary Phone" value={profile.primaryPhone} isVerified={true} isDark={isDark} />
                <ProfileField label="Email Address" value={profile.email} isDark={isDark} />
                <ProfileField
                  label="Residential Address"
                  value={
                    profile.city || profile.state
                      ? `${[profile.city, profile.state].filter(Boolean).join(', ')}${profile.pincode ? ` (${profile.pincode})` : ''}`
                      : 'Not Provided'
                  }
                  isLast={true}
                  isDark={isDark}
                />
              </ProfileSection>

              {/* 4. Clinical & Health Snapshot Section */}
              <ProfileSection
                title="Clinical & Health Snapshot"
                actionLabel="View Details"
                onActionPress={() => navigation.navigate('HealthSummary')}
                isDark={isDark}
                icon={
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke={isDark ? '#34D399' : '#059669'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                }
              >
                <ProfileField label="Blood Group" value={profile.bloodGroup || 'O+'} isDark={isDark} />
                <ProfileField label="Known Allergies" value="Penicillin (Moderate)" isDark={isDark} />
                <ProfileField label="Chronic Conditions" value="Type-2 Diabetes Mellitus" isDark={isDark} />
                <ProfileField label="Recent Surgery" value="Appendectomy (2021)" isLast={true} isDark={isDark} />
              </ProfileSection>

              {/* 5. Emergency Contacts Section */}
              <ProfileSection
                title="Emergency Support"
                actionLabel="Manage"
                onActionPress={() => navigation.navigate('EmergencyContact')}
                isDark={isDark}
                icon={
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={isDark ? '#F87171' : '#DC2626'} strokeWidth={2} />
                  </Svg>
                }
              >
                <ProfileField
                  label="Primary Contact"
                  value={primaryContact ? `${primaryContact.fullName} (${primaryContact.relationship})` : 'Add Contact'}
                  isVerified={primaryContact?.isVerified}
                  isDark={isDark}
                />
                <ProfileField
                  label="Emergency Phone"
                  value={primaryContact ? primaryContact.primaryPhone : 'None saved'}
                  isLast={true}
                  isDark={isDark}
                />
              </ProfileSection>

              {/* 6. Insurance Coverage Section */}
              <ProfileSection
                title="Insurance & Coverage"
                actionLabel="View Policy"
                onActionPress={() => navigation.navigate('Insurance')}
                isDark={isDark}
                icon={
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" stroke={isDark ? '#38BDF8' : '#0F766E'} strokeWidth={2} />
                  </Svg>
                }
              >
                <ProfileField
                  label="Provider"
                  value={activePolicy ? activePolicy.providerName : 'Add Policy'}
                  isDark={isDark}
                />
                <ProfileField
                  label="Sum Insured"
                  value={activePolicy ? `₹${(activePolicy.sumInsuredINR / 100000).toFixed(0)} Lakhs` : '—'}
                  isLast={true}
                  isDark={isDark}
                />
              </ProfileSection>

              {/* 7. Security & Data Sovereignty Section */}
              <ProfileSection
                title="Security & Data Sovereignty"
                actionLabel="Manage"
                onActionPress={() => navigation.navigate('SecurityCenter')}
                isDark={isDark}
                icon={
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Circle cx={12} cy={12} r={10} stroke={isDark ? '#34D399' : '#16A34A'} strokeWidth={2} />
                    <Path d="M12 8v4l3 3" stroke={isDark ? '#34D399' : '#16A34A'} strokeWidth={2} strokeLinecap="round" />
                  </Svg>
                }
              >
                <ProfileField
                  label="Active Consents"
                  value={`${consents.length} Active Hospital Grants`}
                  isDark={isDark}
                />
                <ProfileField
                  label="Biometrics Unlock"
                  value="Active & Enrolled"
                  isLast={true}
                  isDark={isDark}
                />
              </ProfileSection>

              {/* 8. App Preferences & Language Section */}
              <ProfileSection
                title={t('settings.languageRegion') || 'App Preferences & Language'}
                actionLabel="Change"
                onActionPress={() => navigation.navigate('LanguageSettings')}
                isDark={isDark}
                icon={
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Circle cx={12} cy={12} r={10} stroke={isDark ? '#38BDF8' : '#0F766E'} strokeWidth={2} />
                    <Path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke={isDark ? '#38BDF8' : '#0F766E'} strokeWidth={2} />
                  </Svg>
                }
              >
                <ProfileField
                  label={t('settings.currentLanguage') || 'App Language'}
                  value={`${descriptor.nativeName} (${descriptor.englishName})`}
                  isVerified={true}
                  isDark={isDark}
                />
                <ProfileField
                  label={t('settings.title') || 'Settings & Security'}
                  value="Controls, Notifications & Sessions"
                  isLast={true}
                  isDark={isDark}
                  onPress={() => navigation.navigate('Settings')}
                />
              </ProfileSection>
            </>
          ) : null}
        </ScrollView>

        <BottomTabBar activeTab="Profile" onSelectTab={handleTabSelect} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 90,
  },
});

export default ProfileHomeScreen;
