import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions, StyleProp, ViewStyle } from 'react-native';
import AppLottieView, { AppLottieViewRef } from './common/AppLottieView';

export interface LottieHeroProps {
  /** Lottie animation JSON source asset (via require or JSON object) */
  source: any;
  /** Whether the animation should autoPlay (default: true) */
  autoPlay?: boolean;
  /** Whether the animation should loop (default: true) */
  loop?: boolean;
  /** Reduced motion flag (default: false). When true, disables autoplay/looping and freezes at frame 0 */
  reducedMotion?: boolean;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
  /** Source composition aspect ratio (width / height). E.g. 1080/1200 = 0.9 */
  aspectRatio?: number;
  /** Target percentage of viewport width (0.70 to 0.82 recommended, default 0.78) */
  sizeRatio?: number;
  /** Maximum allowable hero width (default: 340) */
  maxWidth?: number;
  /** Optional custom container style overrides */
  style?: StyleProp<ViewStyle>;
}

export const LottieHero: React.FC<LottieHeroProps> = ({
  source,
  autoPlay = true,
  loop = true,
  reducedMotion = false,
  accessibilityLabel,
  aspectRatio = 1,
  sizeRatio = 0.78,
  maxWidth = 340,
  style,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const lottieRef = useRef<AppLottieViewRef>(null);

  // Calculate responsive hero bounds preserving source aspect ratio
  const heroWidth = Math.min(maxWidth, Math.max(220, windowWidth * sizeRatio));
  const heroHeight = heroWidth / aspectRatio;

  useEffect(() => {
    if (reducedMotion) {
      lottieRef.current?.pause();
    }
  }, [reducedMotion]);

  return (
    <View
      style={[styles.container, { width: heroWidth, height: heroHeight }, style]}
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel || 'Onboarding illustration'}
    >
      <AppLottieView
        ref={lottieRef}
        source={source}
        autoPlay={reducedMotion ? false : autoPlay}
        loop={reducedMotion ? false : loop}
        style={styles.lottie}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },
  lottie: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
});

export default LottieHero;
