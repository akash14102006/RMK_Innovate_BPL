import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors, radii, spacing } from '../theme/tokens';
import useReducedMotion from '../theme/useReducedMotion';

interface OnboardingProgressIndicatorProps {
  currentStep: number; // 1-indexed (1, 2, 3, 4)
  totalSteps?: number;
}

export const OnboardingProgressIndicator: React.FC<OnboardingProgressIndicatorProps> = ({
  currentStep,
  totalSteps = 4,
}) => {
  const reduceMotion = useReducedMotion();

  // Create animated values for each step width
  const stepWidths = useRef(
    Array.from({ length: totalSteps }, (_, index) =>
      new Animated.Value(index + 1 === currentStep ? 24 : 8)
    )
  ).current;

  useEffect(() => {
    stepWidths.forEach((animVal, index) => {
      const isTarget = index + 1 === currentStep;
      Animated.timing(animVal, {
        toValue: isTarget ? 24 : 8,
        duration: reduceMotion ? 0 : 300,
        useNativeDriver: false,
      }).start();
    });
  }, [currentStep, reduceMotion, stepWidths]);

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${currentStep} of ${totalSteps}`}
    >
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isCurrent = index + 1 === currentStep;
        return (
          <Animated.View
            key={`step-dot-${index}`}
            style={[
              styles.dot,
              {
                width: stepWidths[index],
                backgroundColor: isCurrent ? colors.primary : colors.border,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  dot: {
    height: 8,
    borderRadius: radii.full,
  },
});

export default OnboardingProgressIndicator;
