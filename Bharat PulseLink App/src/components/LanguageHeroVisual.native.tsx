import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import AppLottieView from './common/AppLottieView';
import useReducedMotion from '../theme/useReducedMotion';

interface LanguageHeroVisualProps {
  size?: number;
  accessibilityLabel?: string;
}

const lottieSource = require('../../assets/language-translator.json');

export const LanguageHeroVisual: React.FC<LanguageHeroVisualProps> = ({
  size = 180,
  accessibilityLabel = 'Language Translation Animation',
}) => {
  const reduceMotion = useReducedMotion();
  const lottieRef = useRef<any>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[styles.container, { width: size, height: size, opacity: fadeAnim }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      <AppLottieView
        ref={lottieRef}
        source={lottieSource}
        autoPlay={!reduceMotion}
        loop={!reduceMotion}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
});

export default LanguageHeroVisual;
