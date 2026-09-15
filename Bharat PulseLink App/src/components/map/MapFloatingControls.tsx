/**
 * Bharat PulseLink — Map Floating Controls Component (Prompt 44)
 *
 * Stack of floating utility controls on map canvas:
 * 1. Recenter to user search origin
 * 2. Fit all hospital markers into viewport
 * 3. Quick toggle to List View
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { radii, spacing } from '../../theme/tokens';

export interface MapFloatingControlsProps {
  onRecenter: () => void;
  onFitBounds: () => void;
  onToggleListView: () => void;
}

export const MapFloatingControls: React.FC<MapFloatingControlsProps> = ({
  onRecenter,
  onFitBounds,
  onToggleListView,
}) => {
  return (
    <View style={styles.container}>
      {/* 1. Recenter Location */}
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={onRecenter}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Recenter map to search location"
      >
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={3} fill="#0F766E" />
          <Path
            d="M12 2v3M12 19v3M2 12h3M19 12h3"
            stroke="#0F766E"
            strokeWidth={2}
            strokeLinecap="round"
          />
          <Circle cx={12} cy={12} r={7} stroke="#0F766E" strokeWidth={1.8} />
        </Svg>
      </TouchableOpacity>

      {/* 2. Fit All Markers */}
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={onFitBounds}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Fit all nearby hospitals in view"
      >
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path
            d="M15 3h6v6M9 21H3v-6M21 9l-7 7M3 15l7-7"
            stroke="#475569"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>

      {/* 3. Toggle to List View */}
      <TouchableOpacity
        style={[styles.actionBtn, styles.listToggleBtn]}
        onPress={onToggleListView}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Switch to Hospital List View"
      >
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path
            d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
            stroke="#0F766E"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: spacing.md,
    bottom: 230,
    gap: 10,
    zIndex: 20,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  listToggleBtn: {
    backgroundColor: '#F0FDFA',
    borderColor: '#CCFBF1',
  },
});

export default MapFloatingControls;
