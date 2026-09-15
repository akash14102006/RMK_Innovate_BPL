import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { logoIconSvgXml } from '../assets/logoSvgStrings';

interface BrandLogoIconProps {
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export const BrandLogoIcon: React.FC<BrandLogoIconProps> = ({
  width = 120,
  height = 120,
  style,
}) => {
  return (
    <View style={style} accessible accessibilityLabel="Bharat PulseLink Logo Icon">
      <SvgXml xml={logoIconSvgXml} width={width} height={height} />
    </View>
  );
};

export default BrandLogoIcon;
