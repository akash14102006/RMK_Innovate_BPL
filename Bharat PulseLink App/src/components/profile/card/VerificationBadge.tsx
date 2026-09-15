/**
 * Bharat PulseLink — Verification Badge Component
 *
 * Server-authoritative verification badge for ABDM / Aadhaar health identities.
 * Displays only when backend verification is confirmed.
 *
 * Owned by: Patient Profile & UI Design Domain (Prompt 93/Master UI)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

interface VerificationBadgeProps {
  isVerified?: boolean;
  label?: string;
  isDark?: boolean;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  isVerified = false,
  label = 'ABDM Verified',
  isDark = false,
}) => {
  if (!isVerified) return null;

  const bg = isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5';
  const text = isDark ? '#34D399' : '#047857';
  const border = isDark ? 'rgba(52, 211, 153, 0.3)' : '#A7F3D0';

  return (
    <View
      style={[styles.badge, { backgroundColor: bg, borderColor: border }]}
      accessibilityRole="text"
      accessibilityLabel={`Verified status: ${label}`}
    >
      <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" style={styles.icon}>
        <Circle cx={12} cy={12} r={10} fill={text} />
        <Path
          d="M8 12l3 3 5-5"
          stroke="#FFFFFF"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <Text style={[styles.badgeText, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
  },
  icon: {
    marginRight: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default VerificationBadge;
