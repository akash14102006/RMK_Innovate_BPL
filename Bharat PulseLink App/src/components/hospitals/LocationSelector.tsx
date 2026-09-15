import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing, radii, typography } from '../../theme/tokens';
import { GeoLocationState } from '../../types/hospitals';

export interface LocationSelectorProps {
  location: GeoLocationState;
  onPress: () => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({ location, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Current search location: ${location.label}. Tap to change.`}
      activeOpacity={0.85}
    >
      <View style={styles.leftRow}>
        <View style={styles.pinIconBox}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 21s-8-7.5-8-12a8 8 0 1 1 16 0c0 4.5-8 12-8 12z"
              stroke="#0F766E"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
              stroke="#0F766E"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>

        <Text style={styles.locationText} numberOfLines={1}>
          {location.label}
        </Text>
      </View>

      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M9 18l6-6-6-6" stroke="#94A3B8" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  pinIconBox: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: 'rgba(15, 118, 110, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
    flex: 1,
  },
});

export default LocationSelector;
