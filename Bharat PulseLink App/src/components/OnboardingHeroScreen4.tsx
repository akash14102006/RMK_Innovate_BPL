import React from 'react';
import useReducedMotion from '../theme/useReducedMotion';
import LottieHero from './LottieHero';

const hospitalAnimation = require('../../assets/animations/onboarding-hospital.json');

interface OnboardingHeroScreen4Props {
  accessibilityLabel?: string;
}

export const OnboardingHeroScreen4: React.FC<OnboardingHeroScreen4Props> = ({
  accessibilityLabel,
}) => {
  const reduceMotion = useReducedMotion();

  return (
    <LottieHero
      source={hospitalAnimation}
      autoPlay={true}
      loop={true}
      reducedMotion={reduceMotion}
      accessibilityLabel={accessibilityLabel || 'Complete connected health journey animation'}
      aspectRatio={800 / 600}
      sizeRatio={0.78}
      maxWidth={340}
    />
  );
};

export default OnboardingHeroScreen4;

