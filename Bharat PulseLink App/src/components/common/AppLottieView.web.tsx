import React, { forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet } from 'react-native';

export interface AppLottieViewProps {
  source?: any;
  autoPlay?: boolean;
  loop?: boolean;
  style?: any;
  resizeMode?: 'cover' | 'contain' | 'center';
  [key: string]: any;
}

export interface AppLottieViewRef {
  play: () => void;
  pause: () => void;
  reset: () => void;
}

export const AppLottieView = forwardRef<AppLottieViewRef, AppLottieViewProps>(
  ({ style, resizeMode, source, autoPlay, loop, ...rest }, ref) => {
    useImperativeHandle(ref, () => ({
      play: () => {},
      pause: () => {},
      reset: () => {},
    }));

    return <View style={[styles.placeholder, style]} {...rest} />;
  }
);

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: 'transparent',
  },
});

export default AppLottieView;
