import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import { useReducedMotion } from '../theme/useReducedMotion';
import { motionTokens } from '../theme/motion';

interface MotionContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  duration?: number;
  fadeIn?: boolean;
}

export const MotionContainer: React.FC<MotionContainerProps> = ({
  children,
  style,
  duration = motionTokens.duration.normal,
  fadeIn = true,
}) => {
  const reduceMotion = useReducedMotion();
  const opacityAnim = useRef(new Animated.Value(fadeIn && !reduceMotion ? 0 : 1)).current;

  useEffect(() => {
    if (reduceMotion || !fadeIn) {
      opacityAnim.setValue(1);
      return;
    }

    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: duration,
      useNativeDriver: true,
    }).start();
  }, [reduceMotion, fadeIn, duration, opacityAnim]);

  return (
    <Animated.View style={[style, { opacity: opacityAnim }]}>
      {children}
    </Animated.View>
  );
};

export default MotionContainer;
