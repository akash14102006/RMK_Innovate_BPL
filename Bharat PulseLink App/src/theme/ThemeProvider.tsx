import React from 'react';
import { View } from 'react-native';
import tokens from './tokens';

type Props = { children: React.ReactNode };

export const ThemeContext = React.createContext(tokens);

export const ThemeProvider: React.FC<Props> = ({ children }) => {
  return (
    <ThemeContext.Provider value={tokens}>
      <View style={{ flex: 1 }}>{children}</View>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
