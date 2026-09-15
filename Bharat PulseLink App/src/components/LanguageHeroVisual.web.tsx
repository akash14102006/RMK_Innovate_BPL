import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import useReducedMotion from '../theme/useReducedMotion';

interface LanguageHeroVisualProps {
  size?: number;
  accessibilityLabel?: string;
}

export const LanguageHeroVisual: React.FC<LanguageHeroVisualProps> = ({
  size = 180,
  accessibilityLabel = 'Language Selection Visual',
}) => {
  const reduceMotion = useReducedMotion();
  const fadeAnim = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(reduceMotion ? 1 : 0.95)).current;

  useEffect(() => {
    if (!reduceMotion) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [reduceMotion]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={[styles.badgeCircle, { width: size * 0.75, height: size * 0.75, borderRadius: (size * 0.75) / 2 }]}>
        <Svg width={size * 0.4} height={size * 0.4} viewBox="0 0 24 24" fill="none">
          <Path
            d="M5 8L10 19M19 19L14 8M2 5H14M7 2V5M17 11C16.3333 13.6667 14.5 17.5 11 19M11 11C11.6667 13 13.5 16.5 17 18"
            stroke="#0F766E"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  badgeCircle: {
    backgroundColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#99F6E4',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
});

export default LanguageHeroVisual;
