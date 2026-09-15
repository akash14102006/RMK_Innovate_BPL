/**
 * Bharat PulseLink — Hospital Skeleton Loading Card (Prompt 45)
 *
 * Shimmer placeholder card displayed during hospital discovery queries.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { radii, spacing } from '../../theme/tokens';

export const HospitalSkeletonCard: React.FC = () => {
  return (
    <View style={styles.card} accessible accessibilityLabel="Loading nearby hospital details">
      {/* Top Header Row Placeholder */}
      <View style={styles.topRow}>
        <View style={styles.iconBox} />
        <View style={styles.titleCol}>
          <View style={styles.titleLine} />
          <View style={styles.metaLine} />
        </View>
      </View>

      {/* Stats Bar Placeholder */}
      <View style={styles.statsBar} />

      {/* Services Tags Placeholder */}
      <View style={styles.servicesRow}>
        <View style={styles.tagPill} />
        <View style={[styles.tagPill, { width: 60 }]} />
        <View style={[styles.tagPill, { width: 80 }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: '#F1F5F9',
  },
  titleCol: {
    flex: 1,
    gap: 6,
  },
  titleLine: {
    width: '75%',
    height: 16,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  metaLine: {
    width: '45%',
    height: 12,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
  },
  statsBar: {
    width: '100%',
    height: 28,
    borderRadius: radii.md,
    backgroundColor: '#F8FAFC',
  },
  servicesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tagPill: {
    width: 50,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
});

export default HospitalSkeletonCard;
