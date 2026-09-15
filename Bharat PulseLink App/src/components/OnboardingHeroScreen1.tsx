import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../theme/tokens';
import useReducedMotion from '../theme/useReducedMotion';

interface OnboardingHeroScreen1Props {
  accessibilityLabel?: string;
}

export const OnboardingHeroScreen1: React.FC<OnboardingHeroScreen1Props> = ({
  accessibilityLabel,
}) => {
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  // Responsive hero dimension
  const heroSize = Math.min(320, Math.max(240, width * 0.70));

  // Animation values
  const auraOpacity = useRef(new Animated.Value(0)).current;
  const auraScale = useRef(new Animated.Value(0.92)).current;
  const pathOpacity = useRef(new Animated.Value(0)).current;
  const centerNodeScale = useRef(new Animated.Value(0.85)).current;
  const node1Opacity = useRef(new Animated.Value(0)).current;
  const node2Opacity = useRef(new Animated.Value(0)).current;
  const node3Opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      auraOpacity.setValue(1);
      auraScale.setValue(1);
      pathOpacity.setValue(1);
      centerNodeScale.setValue(1);
      node1Opacity.setValue(1);
      node2Opacity.setValue(1);
      node3Opacity.setValue(1);
      return;
    }

    // Sequential Motion Timeline
    Animated.sequence([
      // Stage 1: Aura & Center Node reveal
      Animated.parallel([
        Animated.timing(auraOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(auraScale, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(centerNodeScale, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Stage 2: Flowing path reveal
      Animated.timing(pathOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Stage 3: Sequential memory nodes
      Animated.stagger(150, [
        Animated.timing(node1Opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(node2Opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(node3Opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [reduceMotion]);

  return (
    <View
      style={[styles.container, { width: heroSize, height: heroSize }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel || 'Patient health continuity illustration'}
    >
      {/* Soft Pale-Teal Background Aura */}
      <Animated.View
        style={[
          styles.auraCircle,
          {
            width: heroSize,
            height: heroSize,
            borderRadius: heroSize / 2,
            opacity: auraOpacity,
            transform: [{ scale: auraScale }],
          },
        ]}
      />

      {/* Connected Flowing Health Path SVG */}
      <Animated.View style={[styles.svgContainer, { opacity: pathOpacity }]}>
        <Svg width={heroSize} height={heroSize} viewBox="0 0 240 240">
          <Defs>
            <LinearGradient id="pathGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={colors.primary} stopOpacity={0.8} />
              <Stop offset="50%" stopColor={colors.accent} stopOpacity={0.9} />
              <Stop offset="100%" stopColor={colors.primaryLight} stopOpacity={0.8} />
            </LinearGradient>
          </Defs>

          {/* Continuous Flowing Timeline Curve */}
          <Path
            d="M 40 160 C 70 80, 110 60, 120 120 C 130 180, 170 160, 200 80"
            fill="none"
            stroke="url(#pathGrad)"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Node 1: Hospital Record */}
          <Circle cx="40" cy="160" r="8" fill={colors.primary} />
          <Circle cx="40" cy="160" r="14" fill={colors.primary} fillOpacity={0.2} />

          {/* Node 2: Diagnostic Memory */}
          <Circle cx="120" cy="120" r="10" fill={colors.accent} />
          <Circle cx="120" cy="120" r="18" fill={colors.accent} fillOpacity={0.25} />

          {/* Node 3: Prescriptions / Identity */}
          <Circle cx="200" cy="80" r="8" fill={colors.primaryLight} />
          <Circle cx="200" cy="80" r="14" fill={colors.primaryLight} fillOpacity={0.2} />
        </Svg>
      </Animated.View>

      {/* Central Patient Identity Emblem */}
      <Animated.View
        style={[
          styles.centerNode,
          {
            transform: [{ scale: centerNodeScale }],
          },
        ]}
      >
        <View style={styles.centerNodeInner}>
          <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              fill={colors.accent}
            />
            <Path
              d="M12 8v6M9 11h6"
              stroke={colors.surface}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </Svg>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  auraCircle: {
    position: 'absolute',
    backgroundColor: '#A6EBDC', // Matching pale-teal brand aura
  },
  svgContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  centerNode: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  centerNodeInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default OnboardingHeroScreen1;
