import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { colors } from '../theme/tokens';

export interface BiometricHeroVisualProps {
  size?: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export const BiometricHeroVisual: React.FC<BiometricHeroVisualProps> = ({
  size = 140,
  accessibilityLabel = 'Biometric security illustration',
  style,
}) => {
  return (
    <View
      style={[styles.container, { width: size, height: size }, style]}
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      <Svg width={size} height={size} viewBox="0 0 140 140" fill="none">
        {/* Outer Translucent Depth Ring */}
        <Circle cx="70" cy="70" r="66" fill="rgba(15, 118, 110, 0.06)" stroke="rgba(15, 118, 110, 0.15)" strokeWidth="2" />
        {/* Inner Glass Glow Ring */}
        <Circle cx="70" cy="70" r="50" fill="rgba(15, 118, 110, 0.12)" stroke="rgba(15, 118, 110, 0.25)" strokeWidth="2" />
        
        {/* Biometric Fingerprint & Security Shield Arcs */}
        <G stroke="#0F766E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          {/* Outer Arch */}
          <Path d="M46 70C46 56.7452 56.7452 46 70 46C83.2548 46 94 56.7452 94 70" opacity="0.9" />
          {/* Middle Arch 1 */}
          <Path d="M52 76C52 66.0589 60.0589 58 70 58C79.9411 58 88 66.0589 88 76" opacity="0.95" />
          {/* Middle Arch 2 */}
          <Path d="M58 82C58 75.3726 63.3726 70 70 70C76.6274 70 82 75.3726 82 82" strokeWidth="4" />
          {/* Core Ridge Loop */}
          <Path d="M64 88C64 84.6863 66.6863 82 70 82C73.3137 82 76 84.6863 76 88" strokeWidth="4" />
          {/* Center Touch Node */}
          <Circle cx="70" cy="94" r="2" fill="#0F766E" stroke="none" />
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});

export default BiometricHeroVisual;
