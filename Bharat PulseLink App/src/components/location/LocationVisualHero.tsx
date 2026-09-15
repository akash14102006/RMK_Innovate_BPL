/**
 * Bharat PulseLink — Location Visual Hero Component
 *
 * Professional healthcare location visual featuring concentric
 * calm elevation rings and medical facility pin emblem.
 * Fade + subtle scale only. No radar pulse, no continuous tracking animation.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';

export const LocationVisualHero: React.FC = () => {
  return (
    <View style={styles.container} accessible accessibilityRole="image" accessibilityLabel="Location Discovery Emblem">
      {/* Outer subtle glow ring */}
      <View style={styles.outerRing}>
        {/* Middle elevation ring */}
        <View style={styles.middleRing}>
          {/* Inner core card */}
          <View style={styles.innerCore}>
            <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
              <G opacity={0.15}>
                <Circle cx={12} cy={12} r={10} fill="#0F766E" />
              </G>
              {/* Location Pin */}
              <Path
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                fill="#0F766E"
              />
              {/* White Healthcare Cross inside Pin */}
              <Path
                d="M12 6v6M9 9h6"
                stroke="#FFFFFF"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  outerRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  middleRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCore: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
});

export default LocationVisualHero;
