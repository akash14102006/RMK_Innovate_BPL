import React from 'react';
import useReducedMotion from '../theme/useReducedMotion';
import LottieHero from './LottieHero';

const secureSharingAnimation = require('../../assets/animations/onboarding-screen3.json');

interface OnboardingHeroScreen3Props {
  accessibilityLabel?: string;
}

export const OnboardingHeroScreen3: React.FC<OnboardingHeroScreen3Props> = ({
  accessibilityLabel,
}) => {
  const reduceMotion = useReducedMotion();

  return (
    <LottieHero
      source={secureSharingAnimation}
      autoPlay={true}
      loop={true}
      reducedMotion={reduceMotion}
      accessibilityLabel={accessibilityLabel || 'Secure consent and record sharing animation'}
      aspectRatio={500 / 500}
      sizeRatio={0.78}
      maxWidth={340}
    />
  );
};

export default OnboardingHeroScreen3;
