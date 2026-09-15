import React, { forwardRef } from 'react';
import LottieView, { LottieViewProps } from 'lottie-react-native';
import { useAccessibility } from '../../accessibility/AccessibilityContext';

export type AppLottieViewProps = LottieViewProps;
export type AppLottieViewRef = LottieView;

export const AppLottieView = forwardRef<LottieView, LottieViewProps>((props, ref) => {
  let isReducedMotion = false;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const accessibility = useAccessibility();
    isReducedMotion = accessibility?.isReducedMotion || false;
  } catch {
    // Fail-safe if rendered outside AccessibilityProvider
  }

  // When reduced motion is active, disable infinite loops and auto-playing animations
  const effectiveProps: LottieViewProps = isReducedMotion
    ? {
        ...props,
        autoPlay: false,
        loop: false,
        progress: 0.5,
      }
    : props;

  return <LottieView ref={ref} {...effectiveProps} />;
});

export default AppLottieView;
