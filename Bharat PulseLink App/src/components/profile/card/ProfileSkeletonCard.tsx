/**
 * Bharat PulseLink — Profile Skeleton Card
 *
 * Polished placeholder loading state for Patient Profile Card.
 * Avoids flashing fake patient data during network/cache retrieval.
 *
 * Owned by: Patient Profile & UI Design Domain (Prompt 93/Master UI)
 */

import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';

interface ProfileSkeletonCardProps {
  isDark?: boolean;
}

export const ProfileSkeletonCard: React.FC<ProfileSkeletonCardProps> = ({ isDark = false }) => {
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const headerBg = isDark ? '#06283D' : '#E2E8F0';
  const shimmerBg = isDark ? '#334155' : '#F1F5F9';
  const ringBg = isDark ? '#1E293B' : '#FFFFFF';

  return (
    <View style={[styles.card, { backgroundColor: cardBg }]} accessibilityLabel="Loading patient profile">
      {/* Header skeleton */}
      <View style={[styles.headerSkeleton, { backgroundColor: headerBg }]} />

      {/* Avatar skeleton */}
      <View style={[styles.avatarRing, { backgroundColor: ringBg }]}>
        <View style={[styles.avatarInner, { backgroundColor: shimmerBg }]}>
          <ActivityIndicator size="small" color={isDark ? '#38BDF8' : '#0F766E'} />
        </View>
      </View>

      {/* Body skeleton */}
      <View style={styles.body}>
        <View style={[styles.line, { width: 160, height: 20, backgroundColor: shimmerBg }]} />
        <View style={[styles.line, { width: 110, height: 14, marginTop: 8, backgroundColor: shimmerBg }]} />
        <View style={[styles.line, { width: 220, height: 24, marginTop: 14, borderRadius: 12, backgroundColor: shimmerBg }]} />
        <View style={[styles.line, { width: '85%', height: 8, marginTop: 16, borderRadius: 4, backgroundColor: shimmerBg }]} />

        {/* Buttons skeleton */}
        <View style={styles.btnRow}>
          <View style={[styles.btn, { backgroundColor: shimmerBg }]} />
          <View style={[styles.btn, { backgroundColor: shimmerBg }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 3,
  },
  headerSkeleton: {
    height: 170,
    width: '100%',
  },
  avatarRing: {
    position: 'absolute',
    top: 118,
    alignSelf: 'center',
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  avatarInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    paddingTop: 60,
    paddingBottom: 24,
    alignItems: 'center',
    width: '100%',
  },
  line: {
    borderRadius: 6,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
    paddingHorizontal: 24,
  },
  btn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
  },
});

export default ProfileSkeletonCard;
