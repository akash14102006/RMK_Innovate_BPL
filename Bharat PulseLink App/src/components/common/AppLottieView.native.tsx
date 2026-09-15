import React, { forwardRef } from 'react';
import LottieView, { LottieViewProps } from 'lottie-react-native';

export type AppLottieViewProps = LottieViewProps;
export type AppLottieViewRef = LottieView;

export const AppLottieView = forwardRef<LottieView, LottieViewProps>((props, ref) => {
  return <LottieView ref={ref} {...props} />;
});

export default AppLottieView;
