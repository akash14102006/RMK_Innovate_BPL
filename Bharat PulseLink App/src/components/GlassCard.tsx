import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, radii, spacing } from '../theme/tokens';

export interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Translucency level (default: 0.88) */
  opacity?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, opacity = 0.88 }) => {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: `rgba(255, 255, 255, ${opacity})` },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.95)', // Subtle slate border
    padding: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
});

export default GlassCard;
