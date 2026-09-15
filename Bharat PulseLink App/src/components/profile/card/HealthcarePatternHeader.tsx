/**
 * Bharat PulseLink — Healthcare Pattern Header
 *
 * Full-width responsive healthcare geometric pattern header for the Patient Profile Card.
 * Combines calm medical dual-tone gradients, subtle heartbeat/pulse wave geometry,
 * and clean abstract health shapes.
 *
 * Owned by: Patient Profile & UI Design Domain (Prompt 93/Master UI)
 */

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Path,
  G,
  Circle,
  Polygon,
} from 'react-native-svg';

interface HealthcarePatternHeaderProps {
  height?: number;
  isDark?: boolean;
}

export const HealthcarePatternHeader: React.FC<HealthcarePatternHeaderProps> = ({
  height = 175,
  isDark = false,
}) => {
  const width = Dimensions.get('window').width;

  const bgStart = isDark ? '#06283D' : '#0B4F6C';
  const bgEnd = isDark ? '#0F4C5C' : '#00A896';
  const accentColor = isDark ? '#028090' : '#48CAE4';
  const patternOpacity = isDark ? 0.08 : 0.12;

  return (
    <View style={[styles.container, { height }]} accessibilityRole="image" accessibilityLabel="Healthcare gradient pattern header">
      <Svg width="100%" height={height} viewBox="0 0 400 175" preserveAspectRatio="xMidYMid slice">
        <Defs>
          {/* Main Background Gradient */}
          <LinearGradient id="headerGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={bgStart} />
            <Stop offset="50%" stopColor="#0E7490" />
            <Stop offset="100%" stopColor={bgEnd} />
          </LinearGradient>

          {/* Soft Glow Highlight */}
          <LinearGradient id="glowGrad" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.2" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Base Gradient Surface */}
        <Rect width="100%" height="100%" fill="url(#headerGrad)" />

        {/* Geometric Abstract Healthcare Polygons (Inspired by reference pattern) */}
        <G fill="#FFFFFF" fillOpacity={patternOpacity}>
          <Polygon points="0,0 60,0 30,50" />
          <Polygon points="60,0 120,0 90,50" />
          <Polygon points="30,50 90,50 60,100" />
          <Polygon points="90,50 150,50 120,100" />
          <Polygon points="0,100 60,100 30,150" />
          <Polygon points="60,100 120,100 90,150" />

          <Polygon points="280,0 340,0 310,50" />
          <Polygon points="340,0 400,0 370,50" />
          <Polygon points="310,50 370,50 340,100" />
          <Polygon points="340,100 400,100 370,150" />
          <Polygon points="250,50 310,50 280,100" />
          <Polygon points="280,100 340,100 310,150" />
        </G>

        {/* Subtle Decorative Ambient Circles */}
        <Circle cx="40" cy="30" r="45" fill={accentColor} fillOpacity={0.15} />
        <Circle cx="360" cy="140" r="60" fill="#00A896" fillOpacity={0.2} />
        <Circle cx="380" cy="20" r="30" fill="#FFFFFF" fillOpacity={0.08} />

        {/* Subtle Medical Pulse / Heartbeat Line across the banner */}
        <Path
          d="M0,90 L70,90 L85,65 L100,120 L115,75 L130,100 L145,90 L255,90 L270,75 L285,115 L300,65 L315,95 L330,90 L400,90"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeOpacity="0.28"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Subtle Medical Cross Watermarks */}
        <G fill="#FFFFFF" fillOpacity={0.1}>
          <Rect x="30" y="115" width="16" height="4" rx="2" />
          <Rect x="36" y="109" width="4" height="16" rx="2" />

          <Rect x="340" y="30" width="18" height="4.5" rx="2" />
          <Rect x="346.75" y="23.25" width="4.5" height="18" rx="2" />
        </G>

        {/* Top Soft Gloss Overlay */}
        <Rect width="100%" height="45" fill="url(#glowGrad)" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
});

export default HealthcarePatternHeader;
