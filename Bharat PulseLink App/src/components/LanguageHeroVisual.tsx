import React from 'react';
import { Platform } from 'react-native';
import LanguageHeroVisualNative from './LanguageHeroVisual.native';
import LanguageHeroVisualWeb from './LanguageHeroVisual.web';

export interface LanguageHeroVisualProps {
  size?: number;
  accessibilityLabel?: string;
}

export const LanguageHeroVisual: React.FC<LanguageHeroVisualProps> = (props) => {
  if (Platform.OS === 'web') {
    return <LanguageHeroVisualWeb {...props} />;
  }
  return <LanguageHeroVisualNative {...props} />;
};

export default LanguageHeroVisual;
