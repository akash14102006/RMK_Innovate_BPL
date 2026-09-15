/**
 * Bharat PulseLink — Master Patient Profile Card (Hero Card)
 *
 * Direct reference-inspired healthcare profile presentation:
 * 1. Large rounded card (borderRadius: 24, subtle border & soft elevation)
 * 2. Full-width Healthcare Pattern Header (calm medical gradients & pulse motifs)
 * 3. Circular Avatar overlapping header/body exactly 50% with outer white ring
 * 4. Large centered Patient Name & secondary Age/Gender/DOB subtitle
 * 5. Blood group pill & verified provenance badge
 * 6. Server-authoritative profile completion progress
 * 7. Compact action buttons ([ Edit Profile ] solid, [ View QR ] outlined)
 * 8. Light & Dark theme compatibility
 *
 * Owned by: Patient Profile & UI Design Domain (Prompt 93/Master UI)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { HealthcarePatternHeader } from './HealthcarePatternHeader';
import { PatientAvatar } from './PatientAvatar';
import { VerificationBadge } from './VerificationBadge';
import { ProfileCompletionBadge } from './ProfileCompletionBadge';
import { UserAccountProfile } from '../../../types/account';

interface PatientProfileCardProps {
  profile: UserAccountProfile;
  onEditPress: () => void;
  onSecondaryPress?: () => void;
  secondaryActionLabel?: string;
  isDark?: boolean;
}

export const PatientProfileCard: React.FC<PatientProfileCardProps> = ({
  profile,
  onEditPress,
  onSecondaryPress,
  secondaryActionLabel = 'View QR',
  isDark = false,
}) => {
  const calculateAge = (dobString?: string): number | null => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return null;
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  const age = calculateAge(profile.dateOfBirth);
  const formattedGender =
    profile.gender === 'MALE'
      ? 'Male'
      : profile.gender === 'FEMALE'
      ? 'Female'
      : profile.gender === 'OTHER'
      ? 'Other'
      : profile.gender || 'Patient';

  const subtitleText = age ? `${age} yrs • ${formattedGender}` : `${formattedGender}`;

  // Theme palette
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const cardBorder = isDark ? '#334155' : '#E2E8F0';
  const nameColor = isDark ? '#F8FAFC' : '#0F172A';
  const subColor = isDark ? '#94A3B8' : '#64748B';
  const pillBg = isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9';
  const pillBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0';
  const pillText = isDark ? '#CBD5E1' : '#475569';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: cardBorder,
        },
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`Patient Profile Card for ${profile.fullName}`}
    >
      {/* 1. Full-Width Healthcare Geometric Pattern Header */}
      <View style={styles.headerWrapper}>
        <HealthcarePatternHeader height={170} isDark={isDark} />
      </View>

      {/* 2. Overlapping Circular Avatar (50% overlap of header edge) */}
      <View style={styles.avatarWrapper}>
        <PatientAvatar
          fullName={profile.fullName}
          size={104}
          isDark={isDark}
        />
      </View>

      {/* 3. Patient Identity Information */}
      <View style={styles.bodyContent}>
        {/* Patient Name */}
        <Text style={[styles.patientName, { color: nameColor }]} numberOfLines={1}>
          {profile.fullName || 'Patient Profile'}
        </Text>

        {/* Secondary Subtitle (Age • Gender) */}
        <Text style={[styles.patientSubtitle, { color: subColor }]}>
          {subtitleText}
        </Text>

        {/* Badges Row (Blood Group & ABDM Verified) */}
        <View style={styles.badgesRow}>
          {profile.bloodGroup ? (
            <View style={[styles.bloodGroupPill, { backgroundColor: pillBg, borderColor: pillBorder }]}>
              <Text style={[styles.bloodGroupText, { color: pillText }]}>
                Blood Group <Text style={styles.boldText}>{profile.bloodGroup}</Text>
              </Text>
            </View>
          ) : null}

          <VerificationBadge
            isVerified={profile.isAadhaarVerified || Boolean(profile.abhaId)}
            label="ABDM Verified"
            isDark={isDark}
          />
        </View>

        {/* Safe Human-Readable ABHA Identifier */}
        {profile.abhaId ? (
          <View style={styles.abhaIdContainer}>
            <Text style={[styles.abhaNumberText, { color: isDark ? '#38BDF8' : '#0F766E' }]}>
              ABHA: {profile.abhaId}
            </Text>
          </View>
        ) : null}

        {/* 4. Profile Completion Progress */}
        <ProfileCompletionBadge
          percentage={profile.profileCompletionPercentage ?? 100}
          isDark={isDark}
        />

        {/* 5. Compact Action Buttons */}
        <View style={styles.actionsWrapper}>
          {/* Secondary Action (View QR / Share Profile) */}
          {onSecondaryPress ? (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.actionBtnOutlined,
                {
                  borderColor: isDark ? '#38BDF8' : '#0B4F6C',
                },
              ]}
              onPress={onSecondaryPress}
              accessibilityRole="button"
              accessibilityLabel={`Open ${secondaryActionLabel}`}
              activeOpacity={0.7}
            >
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" style={styles.btnIcon}>
                <Rect x="3" y="3" width="7" height="7" stroke={isDark ? '#38BDF8' : '#0B4F6C'} strokeWidth="2" />
                <Rect x="14" y="3" width="7" height="7" stroke={isDark ? '#38BDF8' : '#0B4F6C'} strokeWidth="2" />
                <Rect x="3" y="14" width="7" height="7" stroke={isDark ? '#38BDF8' : '#0B4F6C'} strokeWidth="2" />
                <Path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 18h4v3" stroke={isDark ? '#38BDF8' : '#0B4F6C'} strokeWidth="2" />
              </Svg>
              <Text
                style={[
                  styles.actionBtnTextOutlined,
                  { color: isDark ? '#38BDF8' : '#0B4F6C' },
                ]}
              >
                {secondaryActionLabel}
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* Primary Action (Edit Profile) */}
          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.actionBtnSolid,
              {
                backgroundColor: isDark ? '#0F766E' : '#0B4F6C',
              },
            ]}
            onPress={onEditPress}
            accessibilityRole="button"
            accessibilityLabel="Edit patient profile details"
            activeOpacity={0.8}
          >
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" style={styles.btnIcon}>
              <Path
                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.actionBtnTextSolid}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 20,
  },
  headerWrapper: {
    width: '100%',
    height: 170,
  },
  avatarWrapper: {
    position: 'absolute',
    top: 118, // 170 - (104 / 2) = exactly 50% overlap on header bottom line
    alignSelf: 'center',
    zIndex: 10,
  },
  bodyContent: {
    paddingTop: 60, // Clearance for overlapping avatar
    paddingBottom: 24,
    alignItems: 'center',
    width: '100%',
  },
  patientName: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 20,
    letterSpacing: -0.3,
  },
  patientSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 16,
  },
  bloodGroupPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
  },
  bloodGroupText: {
    fontSize: 11,
    fontWeight: '500',
  },
  boldText: {
    fontWeight: '700',
  },
  abhaIdContainer: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 8,
  },
  abhaNumberText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  actionsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 18,
    width: '100%',
    paddingHorizontal: 24,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    minHeight: 40,
    flex: 1,
  },
  actionBtnSolid: {
    shadowColor: '#0B4F6C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnOutlined: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  btnIcon: {
    marginRight: 6,
  },
  actionBtnTextSolid: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  actionBtnTextOutlined: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default PatientProfileCard;
