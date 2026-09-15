/**
 * Bharat PulseLink — Patient Avatar Component
 *
 * Circular avatar overlapping header and card body.
 * Features:
 * - 104dp circular frame with 4dp outer border ring & soft depth shadow
 * - Graceful fallback hierarchy: Custom Photo -> Initials -> Medical Silhouette SVG
 * - Light and Dark theme compatibility
 *
 * Owned by: Patient Profile & UI Design Domain (Prompt 93/Master UI)
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';

interface PatientAvatarProps {
  photoUrl?: string | null;
  fullName?: string | null;
  size?: number;
  isDark?: boolean;
}

export const PatientAvatar: React.FC<PatientAvatarProps> = ({
  photoUrl,
  fullName,
  size = 104,
  isDark = false,
}) => {
  const getInitials = (name?: string | null): string => {
    if (!name || !name.trim()) return 'P';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(fullName);
  const ringColor = isDark ? '#1E293B' : '#FFFFFF';
  const innerBg = isDark ? '#0F766E' : '#0B4F6C';

  return (
    <View
      style={[
        styles.outerRing,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: ringColor,
          borderColor: ringColor,
        },
      ]}
      accessibilityRole="image"
      accessibilityLabel={`Patient avatar for ${fullName || 'Patient'}`}
    >
      {photoUrl ? (
        <Image
          source={{ uri: photoUrl }}
          style={[styles.avatarImage, { width: size - 8, height: size - 8, borderRadius: (size - 8) / 2 }]}
          resizeMode="cover"
        />
      ) : fullName && fullName.trim().length > 0 ? (
        <View
          style={[
            styles.initialsContainer,
            {
              width: size - 8,
              height: size - 8,
              borderRadius: (size - 8) / 2,
              backgroundColor: innerBg,
            },
          ]}
        >
          <Text style={styles.initialsText}>{initials}</Text>
        </View>
      ) : (
        /* Healthcare Silhouette Fallback */
        <View
          style={[
            styles.initialsContainer,
            {
              width: size - 8,
              height: size - 8,
              borderRadius: (size - 8) / 2,
              backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
            },
          ]}
        >
          <Svg width={size - 24} height={size - 24} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="8" r="4" fill={isDark ? '#94A3B8' : '#64748B'} />
            <Path
              d="M4 20c0-4 4-6 8-6s8 2 8 6"
              stroke={isDark ? '#94A3B8' : '#64748B'}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </Svg>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  outerRing: {
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarImage: {
    overflow: 'hidden',
  },
  initialsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default PatientAvatar;
