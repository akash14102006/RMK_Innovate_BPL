import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing, radii } from '../../theme/tokens';

import AccessibilityHeaderButton from '../accessibility/AccessibilityHeaderButton';
import AccessibilityQuickPanel from '../accessibility/AccessibilityQuickPanel';

export interface HomeHeaderProps {
  unreadCount?: number;
  onPressMenu: () => void;
  onPressNotifications: () => void;
  onPressProfileAvatar?: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  unreadCount = 0,
  onPressMenu,
  onPressNotifications,
}) => {
  return (
    <>
      <View style={styles.container}>
        {/* Left: Navigation Menu Button */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onPressMenu}
          accessibilityRole="button"
          accessibilityLabel="Open Navigation Drawer Menu"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M4 7h16M4 12h16M4 17h16" stroke={colors.textPrimary} strokeWidth={2.2} strokeLinecap="round" />
          </Svg>
        </TouchableOpacity>

        {/* Center: Brand Identity */}
        <View style={styles.brandContainer}>
          <Text style={styles.brandTitle}>Bharat PulseLink</Text>
          <Text style={styles.brandSubtitle}>Your health, connected.</Text>
        </View>

        {/* Right Actions: Accessibility button immediately preceding Notifications */}
        <View style={styles.rightActionsRow}>
          <AccessibilityHeaderButton size={20} />

          <TouchableOpacity
            style={styles.iconButton}
            onPress={onPressNotifications}
            accessibilityRole="button"
            accessibilityLabel={`Notifications, ${unreadCount} unread`}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
                stroke={colors.textPrimary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Embedded Neumorphic Quick Panel */}
      <AccessibilityQuickPanel />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: 2,
    marginBottom: spacing.xs,
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  brandContainer: {
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.2,
    marginTop: 1,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: radii.full,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default HomeHeader;
