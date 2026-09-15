/**
 * Bharat PulseLink — Hospital Map Marker Component (Prompt 44)
 *
 * Tactile neumorphic marker with color-coded ownership:
 * - Teal: Government / Teaching Hospitals
 * - Indigo: Private / Super Specialty
 * - Red emergency dot: 24x7 Emergency Ready
 * - Selected state: Highlight glow ring and expanded title bubble
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { HospitalMapMarkerData } from '../../types/map';

export interface HospitalMapMarkerProps {
  marker: HospitalMapMarkerData;
  isSelected: boolean;
  onPress: (marker: HospitalMapMarkerData) => void;
}

export const HospitalMapMarker: React.FC<HospitalMapMarkerProps> = ({
  marker,
  isSelected,
  onPress,
}) => {
  const isGovt = marker.ownership === 'GOVERNMENT' || marker.ownership === 'PUBLIC_SECTOR';
  const themeColor = isGovt ? '#0F766E' : '#4F46E5';

  return (
    <TouchableOpacity
      style={styles.touchArea}
      onPress={() => onPress(marker)}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${marker.name}, ${isGovt ? 'Government' : 'Private'} Hospital, ${marker.distanceKm} km away, ${marker.is24x7 ? '24x7 Emergency' : ''}`}
    >
      {/* Selected Title Capsule */}
      {isSelected && (
        <View style={styles.selectedCallout}>
          <Text style={styles.selectedTitle} numberOfLines={1}>
            {marker.name}
          </Text>
          <Text style={styles.selectedDistance}>
            {marker.distanceKm.toFixed(1)} km
          </Text>
        </View>
      )}

      {/* Main Marker Pin Body */}
      <View
        style={[
          styles.markerBody,
          { borderColor: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.9)' },
          isSelected && styles.markerBodySelected,
        ]}
      >
        <View
          style={[
            styles.innerPill,
            { backgroundColor: isSelected ? themeColor : '#FFFFFF' },
          ]}
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d="M3 21h18M5 21V7l8-4v18M13 21V3l6 4v14"
              stroke={isSelected ? '#FFFFFF' : themeColor}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>

        {/* 24x7 Emergency Indicator Dot */}
        {marker.is24x7 && (
          <View style={styles.emergencyDot} accessible={false} />
        )}
      </View>

      {/* Pin Pointer Tail */}
      <View
        style={[
          styles.pinTail,
          { borderTopColor: isSelected ? '#0F172A' : '#FFFFFF' },
        ]}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCallout: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 200,
  },
  selectedTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    flexShrink: 1,
  },
  selectedDistance: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2DD4BF',
  },
  markerBody: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },
  markerBodySelected: {
    transform: [{ scale: 1.15 }],
    shadowColor: '#0F766E',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  innerPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    alignSelf: 'center',
    marginTop: -1,
  },
});

export default HospitalMapMarker;
