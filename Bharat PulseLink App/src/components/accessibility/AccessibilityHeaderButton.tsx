/**
 * Bharat PulseLink — Global Accessibility Header Button
 *
 * Professional Universal Accessibility SVG Icon
 * Touch Target: ≥ 44x44px
 * Placed immediately before Notifications in standard screen headers.
 * Opens the Neumorphic Accessibility Quick Panel.
 */

import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, radii } from '../../theme/tokens';
import { useAccessibility } from '../../accessibility/AccessibilityContext';
import { useI18n } from '../../i18n/I18nContext';

export interface AccessibilityHeaderButtonProps {
  size?: number;
  color?: string;
  style?: any;
}

export const AccessibilityHeaderButton: React.FC<AccessibilityHeaderButtonProps> = ({
  size = 20,
  color = colors.textPrimary,
  style,
}) => {
  const { openQuickPanel, isQuickPanelOpen, isLargeControls, activeProfile } = useAccessibility();
  const { t } = useI18n();

  const buttonSize = isLargeControls ? 48 : 44;
  const isCustomOrActive = activeProfile !== 'STANDARD';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { width: buttonSize, height: buttonSize },
        isCustomOrActive && styles.activeContainer,
        style,
      ]}
      onPress={openQuickPanel}
      accessibilityRole="button"
      accessibilityLabel={t('accessibility.openControls') || 'Open accessibility controls'}
      accessibilityHint={
        t('accessibility.openControlsHint') ||
        'Opens quick accessibility settings for text size, contrast, and voice'
      }
      accessibilityState={{ expanded: isQuickPanelOpen }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      activeOpacity={0.7}
    >
      {/* Universal Accessibility Symbol: Human figure with outstretched arms in circle */}
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Outer Circle */}
        <Circle
          cx={12}
          cy={12}
          r={10}
          stroke={isCustomOrActive ? '#0F766E' : color}
          strokeWidth={2}
        />
        {/* Head */}
        <Circle
          cx={12}
          cy={7.5}
          r={1.75}
          fill={isCustomOrActive ? '#0F766E' : color}
        />
        {/* Outstretched Arms */}
        <Path
          d="M5.5 10.5C8 9.8 16 9.8 18.5 10.5"
          stroke={isCustomOrActive ? '#0F766E' : color}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
        {/* Torso & Legs */}
        <Path
          d="M12 9.5V14.5M9.5 18.5L12 14.5L14.5 18.5"
          stroke={isCustomOrActive ? '#0F766E' : color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>

      {/* Active profile indicator dot */}
      {isCustomOrActive && <View style={styles.activeDot} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  activeContainer: {
    borderColor: '#0F766E',
    backgroundColor: 'rgba(15, 118, 110, 0.06)',
  },
  activeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0F766E',
  },
});

export default AccessibilityHeaderButton;
