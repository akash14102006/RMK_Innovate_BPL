import React, { useMemo } from 'react';
import { View } from 'react-native';
import tokens, { getScaledTypography, getAccessibleColors } from './tokens';
import { useAccessibility } from '../accessibility/AccessibilityContext';

type Props = { children: React.ReactNode };

export const ThemeContext = React.createContext(tokens);

export const ThemeProvider: React.FC<Props> = ({ children }) => {
  let accessibility: any = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    accessibility = useAccessibility();
  } catch {
    // Fail-safe if ThemeProvider mounted outside AccessibilityProvider in isolated unit tests
  }

  const fontScale = accessibility?.fontScale || 1.0;
  const isHighContrast = accessibility?.isHighContrast || false;
  const boldText = accessibility?.preferences?.boldText || false;

  const currentTokens = useMemo(() => {
    return {
      ...tokens,
      colors: getAccessibleColors(isHighContrast),
      typography: getScaledTypography(fontScale, boldText),
    };
  }, [fontScale, isHighContrast, boldText]);

  return (
    <ThemeContext.Provider value={currentTokens}>
      <View style={{ flex: 1 }}>{children}</View>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => React.useContext(ThemeContext);

export default ThemeProvider;
