import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { HospitalPreviewItem } from '../../types/profile';
import { colors, spacing, radii, typography } from '../../theme/tokens';

export interface HospitalDiscoveryCardProps {
  hospital: HospitalPreviewItem;
  onPressExplore: () => void;
}

export const HospitalDiscoveryCard: React.FC<HospitalDiscoveryCardProps> = ({ hospital, onPressExplore }) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Hospital & Emergency Care</Text>
        <View style={styles.livePill}>
          <Text style={styles.livePillText}>24/7 Verified</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.card}
        onPress={onPressExplore}
        accessibilityRole="button"
        accessibilityLabel={`Nearby Hospital: ${hospital.hospitalName}, ${hospital.distanceKmText}`}
        activeOpacity={0.88}
      >
        <View style={styles.cardTop}>
          <View style={styles.iconCircle}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path
                d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2zM9 10h6M12 7v6"
                stroke="#059669"
                strokeWidth={2.2}
                strokeLinecap="round"
              />
            </Svg>
          </View>
          <View style={styles.textCol}>
            <Text style={styles.hospitalName} numberOfLines={1}>
              {hospital.hospitalName}
            </Text>
            <Text style={styles.categoryText}>{hospital.category}</Text>
          </View>
        </View>

        <View style={styles.cardBottom}>
          <View style={styles.distanceBadge}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z" stroke="#059669" strokeWidth={2} />
              <Path d="M12 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="#059669" />
            </Svg>
            <Text style={styles.distanceText}>{hospital.distanceKmText}</Text>
          </View>

          <Text style={styles.exploreText}>View Facility & Directions →</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.titleSmall.fontSize,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  livePill: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  livePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  card: {
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.15)',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: spacing.sm,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
  },
  hospitalName: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  categoryText: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  exploreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
});

export default HospitalDiscoveryCard;
