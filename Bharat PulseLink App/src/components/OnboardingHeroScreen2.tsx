import React from 'react';
import useReducedMotion from '../theme/useReducedMotion';
import LottieHero from './LottieHero';

const locationAnimation = require('../../assets/animations/onboarding-location.json');

interface OnboardingHeroScreen2Props {
  accessibilityLabel?: string;
}

export const OnboardingHeroScreen2: React.FC<OnboardingHeroScreen2Props> = ({
  accessibilityLabel,
}) => {
  const reduceMotion = useReducedMotion();

  return (
    <LottieHero
      source={locationAnimation}
      autoPlay={true}
      loop={true}
      reducedMotion={reduceMotion}
      accessibilityLabel={accessibilityLabel || 'Map animation showing nearby healthcare facilities'}
      aspectRatio={1080 / 1200}
      sizeRatio={0.78}
      maxWidth={340}
    />
  );
};

export default OnboardingHeroScreen2;

