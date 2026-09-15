import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { logoFullSvgXml } from '../assets/logoSvgStrings';

interface BrandLogoProps {
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  width = 240,
  height = 120,
  style,
}) => {
  return (
    <View style={style} accessible accessibilityLabel="Bharat PulseLink Full Logo">
      <SvgXml xml={logoFullSvgXml} width={width} height={height} />
    </View>
  );
};

export default BrandLogo;
