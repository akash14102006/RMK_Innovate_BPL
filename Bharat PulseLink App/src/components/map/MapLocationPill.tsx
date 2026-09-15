/**
 * Bharat PulseLink — Map Location Pill Component (Prompt 44)
 *
 * Floating top location indicator showing active search hub,
 * total hospitals discovered, and trigger to change location.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { GeoLocationState } from '../../types/hospitals';
import { radii, spacing } from '../../theme/tokens';

export interface MapLocationPillProps {
  location: GeoLocationState;
  hospitalsCount: number;
  onPressChangeLocation: () => void;
  activeRadiusKm?: number;
  onExpandRadius?: (radiusKm: number) => void;
}

export const MapLocationPill: React.FC<MapLocationPillProps> = ({
  location,
  hospitalsCount,
  onPressChangeLocation,
  activeRadiusKm,
  onExpandRadius,
}) => {
  const radius = activeRadiusKm || 10;

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.pillCard}
        onPress={onPressChangeLocation}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel={`Search location: ${location.label}. ${hospitalsCount} hospitals discovered within ${radius} km. Tap to change location.`}
      >
        <View style={styles.pinIconBox}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
              stroke="#0F766E"
              strokeWidth={2}
            />
            <Circle cx={12} cy={9} r={2.5} fill="#0F766E" />
          </Svg>
        </View>

        <View style={styles.textCol}>
          <Text style={styles.cityLabel} numberOfLines={1}>
            {location.city || location.label}
          </Text>
          <Text style={styles.countLabel}>
            {hospitalsCount} {hospitalsCount === 1 ? 'Hospital' : 'Hospitals'} (within {radius} km)
          </Text>
        </View>

        <View style={styles.changeBadge}>
          <Text style={styles.changeText}>Change</Text>
        </View>
      </TouchableOpacity>

      {/* When 0 hospitals found in radius, provide quick expansion actions */}
      {hospitalsCount === 0 && onExpandRadius && (
        <View style={styles.radiusPillRow}>
          <Text style={styles.expandPromptText}>Expand radius:</Text>
          {radius < 25 && (
            <TouchableOpacity
              style={styles.radiusQuickBtn}
              onPress={() => onExpandRadius(25)}
              accessibilityRole="button"
              accessibilityLabel="Expand search to 25 kilometers"
            >
              <Text style={styles.radiusQuickBtnText}>25 km</Text>
            </TouchableOpacity>
          )}
          {radius < 50 && (
            <TouchableOpacity
              style={styles.radiusQuickBtn}
              onPress={() => onExpandRadius(50)}
              accessibilityRole="button"
              accessibilityLabel="Expand search to 50 kilometers"
            >
              <Text style={styles.radiusQuickBtnText}>50 km</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
    zIndex: 10,
  },
  pillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: radii.full,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.85)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  pinIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
  },
  cityLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  countLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  changeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
  },
  radiusPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.full,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    gap: 8,
  },
  expandPromptText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  radiusQuickBtn: {
    backgroundColor: '#0F766E',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  radiusQuickBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default MapLocationPill;
