/**
 * Bharat PulseLink — Hospital Empty & Error States (Prompt 45)
 *
 * Dedicated empty and error state presentations for:
 * 1. No hospitals found in location
 * 2. Search query returned no matches
 * 3. Filter criteria returned no matches
 * 4. API / network error with retry trigger
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { radii, spacing } from '../../theme/tokens';

export interface HospitalEmptyStateProps {
  type: 'SEARCH' | 'FILTER' | 'LOCATION' | 'ERROR';
  searchQuery?: string;
  activeRadiusKm?: number;
  onResetFilters?: () => void;
  onClearSearch?: () => void;
  onChangeLocation?: () => void;
  onExpandRadius?: (radiusKm: number) => void;
  onRetry?: () => void;
}

export const HospitalEmptyState: React.FC<HospitalEmptyStateProps> = ({
  type,
  searchQuery,
  activeRadiusKm,
  onResetFilters,
  onClearSearch,
  onChangeLocation,
  onExpandRadius,
  onRetry,
}) => {
  if (type === 'ERROR') {
    return (
      <View style={styles.container}>
        <View style={[styles.iconBox, { backgroundColor: '#FEF2F2' }]}>
          <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={10} stroke="#DC2626" strokeWidth={2} />
            <Path d="M12 8v4M12 16h.01" stroke="#DC2626" strokeWidth={2} strokeLinecap="round" />
          </Svg>
        </View>
        <Text style={styles.title}>Unable to Load Hospitals</Text>
        <Text style={styles.subtitle}>
          We couldn't connect to the national health registry. Check your connection or retry.
        </Text>
        {onRetry && (
          <TouchableOpacity style={styles.actionBtn} onPress={onRetry} accessibilityRole="button">
            <Text style={styles.actionBtnText}>Retry Search</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (type === 'SEARCH') {
    return (
      <View style={styles.container}>
        <View style={styles.iconBox}>
          <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Circle cx={11} cy={11} r={8} stroke="#0F766E" strokeWidth={2} />
            <Path d="M21 21l-4.35-4.35" stroke="#0F766E" strokeWidth={2} strokeLinecap="round" />
          </Svg>
        </View>
        <Text style={styles.title}>No Hospitals Matching "{searchQuery}"</Text>
        <Text style={styles.subtitle}>
          Try searching by medical department (e.g. Cardiology, OPD, ICU) or hospital name.
        </Text>
        {onClearSearch && (
          <TouchableOpacity style={styles.actionBtn} onPress={onClearSearch} accessibilityRole="button">
            <Text style={styles.actionBtnText}>Clear Search</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (type === 'FILTER') {
    return (
      <View style={styles.container}>
        <View style={styles.iconBox}>
          <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" stroke="#0F766E" strokeWidth={2} />
          </Svg>
        </View>
        <Text style={styles.title}>No Hospitals Match Active Filter</Text>
        <Text style={styles.subtitle}>
          No healthcare facilities found matching your selected category in this area.
        </Text>
        {onResetFilters && (
          <TouchableOpacity style={styles.actionBtn} onPress={onResetFilters} accessibilityRole="button">
            <Text style={styles.actionBtnText}>Show All Hospitals</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Location Empty State
  const radius = activeRadiusKm || 10;

  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
            stroke="#0F766E"
            strokeWidth={2}
          />
          <Circle cx={12} cy={9} r={2.5} fill="#0F766E" />
        </Svg>
      </View>
      <Text style={styles.title}>No hospitals found within {radius} km</Text>
      <Text style={styles.subtitle}>
        No verified healthcare facilities found within {radius} km of your location. Expand search radius to view regional medical centres.
      </Text>

      {/* Radius expansion action buttons */}
      {onExpandRadius && (
        <View style={styles.radiusActionRow}>
          {radius < 25 && (
            <TouchableOpacity
              style={styles.expandActionBtn}
              onPress={() => onExpandRadius(25)}
              accessibilityRole="button"
              accessibilityLabel="Search within 25 kilometers"
            >
              <Text style={styles.expandActionBtnText}>Search 25 km</Text>
            </TouchableOpacity>
          )}
          {radius < 50 && (
            <TouchableOpacity
              style={styles.expandActionBtn}
              onPress={() => onExpandRadius(50)}
              accessibilityRole="button"
              accessibilityLabel="Search within 50 kilometers"
            >
              <Text style={styles.expandActionBtnText}>Search 50 km</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {onChangeLocation && (
        <TouchableOpacity
          style={[styles.actionBtn, onExpandRadius ? styles.secondaryActionBtn : null]}
          onPress={onChangeLocation}
          accessibilityRole="button"
        >
          <Text style={[styles.actionBtnText, onExpandRadius ? styles.secondaryActionBtnText : null]}>
            Change Location
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: spacing.lg,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: spacing.md,
    maxWidth: 320,
  },
  radiusActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: spacing.md,
  },
  expandActionBtn: {
    backgroundColor: '#0F766E',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: radii.full,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  expandActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryActionBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#0F766E',
    shadowOpacity: 0,
    elevation: 0,
  },
  secondaryActionBtnText: {
    color: '#0F766E',
  },
  actionBtn: {
    backgroundColor: '#0F766E',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radii.full,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default HospitalEmptyState;
