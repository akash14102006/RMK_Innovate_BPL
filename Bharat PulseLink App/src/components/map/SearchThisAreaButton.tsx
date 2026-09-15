/**
 * Bharat PulseLink — Search This Area Button Component (Prompt 44)
 *
 * Floating button that appears when map is panned away from the
 * active search origin, allowing patient to explicitly search the new region.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { radii, spacing } from '../../theme/tokens';

export interface SearchThisAreaButtonProps {
  visible: boolean;
  onPress: () => void;
}

export const SearchThisAreaButton: React.FC<SearchThisAreaButtonProps> = ({
  visible,
  onPress,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={onPress}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel="Search hospitals in this map area"
      >
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Circle cx={11} cy={11} r={8} stroke="#FFFFFF" strokeWidth={2} />
          <Path d="M21 21l-4.35-4.35" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
        </Svg>
        <Text style={styles.buttonText}>Search this area</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 140,
    alignSelf: 'center',
    zIndex: 25,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radii.full,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});

export default SearchThisAreaButton;
