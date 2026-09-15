import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  BackHandler,
  Dimensions,
} from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { colors, spacing, radii, typography } from '../../theme/tokens';
import { motionTokens } from '../../theme/motion';
import useReducedMotion from '../../theme/useReducedMotion';
import { DRAWER_NAV_ITEMS, DrawerItemId } from '../../navigation/drawerRegistry';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(320, SCREEN_WIDTH * 0.84);

export interface HomeSideMenuModalProps {
  visible: boolean;
  onClose: () => void;
  activeItem?: DrawerItemId;
  unreadAlertsCount?: number;
  onNavigateItem: (itemId: DrawerItemId) => void;
}

export const HomeSideMenuModal: React.FC<HomeSideMenuModalProps> = ({
  visible,
  onClose,
  activeItem = 'home',
  unreadAlertsCount = 0,
  onNavigateItem,
}) => {
  const reduceMotion = useReducedMotion();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Handle Android Hardware Back Button
  useEffect(() => {
    if (!visible) return;

    const onBackPress = () => {
      onClose();
      return true; // prevent bubbling
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [visible, onClose]);

  // Drawer Animation Lifecycle
  useEffect(() => {
    if (visible) {
      if (reduceMotion) {
        slideAnim.setValue(0);
        fadeAnim.setValue(1);
      } else {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: motionTokens.duration.fast || 200,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } else {
      slideAnim.setValue(-DRAWER_WIDTH);
      fadeAnim.setValue(0);
    }
  }, [visible, reduceMotion]);

  if (!visible) return null;

  const renderIcon = (id: DrawerItemId, isActive: boolean) => {
    const iconColor = isActive ? '#0F766E' : '#475569';
    const strokeWidth = isActive ? 2.2 : 1.8;

    switch (id) {
      case 'home':
        return (
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
              stroke={iconColor}
              strokeWidth={strokeWidth}
              fill={isActive ? 'rgba(15, 118, 110, 0.12)' : 'none'}
            />
            <Path d="M9 22V12h6v10" stroke={iconColor} strokeWidth={strokeWidth} />
          </Svg>
        );
      case 'hospitals':
        return (
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2zM9 10h6M12 7v6"
              stroke={iconColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          </Svg>
        );
      case 'scan':
        return (
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M7 3H5a2 2 0 0 0-2 2v2M17 3h2a2 2 0 0 1 2 2v2M7 21H5a2 2 0 0 1-2-2v-2M17 21h2a2 2 0 0 0 2-2v-2" stroke={iconColor} strokeWidth={strokeWidth} strokeLinecap="round" />
            <Rect x={7} y={7} width={10} height={10} rx={2} stroke={iconColor} strokeWidth={strokeWidth} />
          </Svg>
        );
      case 'records':
        return (
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={iconColor} strokeWidth={strokeWidth} />
            <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={iconColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          </Svg>
        );
      case 'medications':
        return (
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M10.5 13.5L13.5 10.5M7.5 16.5l9-9a4.24 4.24 0 0 0-6-6l-9 9a4.24 4.24 0 0 0 6 6z"
              stroke={iconColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        );
      case 'appointments':
        return (
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Rect x={3} y={4} width={18} height={18} rx={2} stroke={iconColor} strokeWidth={strokeWidth} />
            <Path d="M16 2v4M8 2v4M3 10h18" stroke={iconColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          </Svg>
        );
      case 'alerts':
        return (
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
              stroke={iconColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        );
      case 'profile':
        return (
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={iconColor} strokeWidth={strokeWidth} />
            <Circle cx={12} cy={7} r={4} stroke={iconColor} strokeWidth={strokeWidth} />
          </Svg>
        );
      case 'support':
        return (
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={10} stroke={iconColor} strokeWidth={strokeWidth} />
            <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke={iconColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          </Svg>
        );
      case 'logout':
        return (
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke={colors.danger} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        );
    }
  };

  const navList = DRAWER_NAV_ITEMS.filter((item) => item.id !== 'logout');
  const logoutItem = DRAWER_NAV_ITEMS.find((item) => item.id === 'logout');

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Animated Dimmed Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.dismissArea}
            activeOpacity={1}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close Navigation Drawer"
          />
        </Animated.View>

        {/* Sliding Drawer Container */}
        <Animated.View style={[styles.drawerPanel, { transform: [{ translateX: slideAnim }] }]}>
          {/* Top Header Pill & Close Button */}
          <View style={styles.header}>
            <View style={styles.titlePill}>
              <Text style={styles.titlePillText}>Dashboard Navigation</Text>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close Drawer"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path d="M18 6L6 18M6 6l12 12" stroke="#64748B" strokeWidth={2.2} strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Navigation Items List */}
          <ScrollView
            style={styles.scrollList}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {navList.map((item) => {
              const isActive = activeItem === item.id;
              const isAlerts = item.id === 'alerts';
              const showBadge = isAlerts && unreadAlertsCount > 0;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.navItem, isActive && styles.navItemActive]}
                  onPress={() => {
                    onClose();
                    onNavigateItem(item.id);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`${item.title}, ${item.subtitle}`}
                  activeOpacity={0.78}
                >
                  <View style={[styles.iconBox, isActive && styles.iconBoxActive]}>
                    {renderIcon(item.id, isActive)}
                  </View>

                  <View style={styles.textGroup}>
                    <Text style={[styles.itemTitle, isActive && styles.itemTitleActive]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.itemSubtitle, isActive && styles.itemSubtitleActive]} numberOfLines={1}>
                      {item.subtitle}
                    </Text>
                  </View>

                  {showBadge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Dedicated Logout Footer */}
          {logoutItem && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.logoutRow}
                onPress={() => {
                  onClose();
                  onNavigateItem('logout');
                }}
                accessibilityRole="button"
                accessibilityLabel="Logout, Sign Out"
                activeOpacity={0.8}
              >
                <View style={styles.logoutIconBox}>
                  {renderIcon('logout', false)}
                </View>
                <View style={styles.textGroup}>
                  <Text style={styles.logoutTitle}>{logoutItem.title}</Text>
                  <Text style={styles.logoutSubtitle}>{logoutItem.subtitle}</Text>
                </View>
              </TouchableOpacity>

              <Text style={styles.versionText}>Bharat PulseLink v1.0.0 • Production</Text>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  dismissArea: {
    flex: 1,
  },
  drawerPanel: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: 54,
    paddingBottom: 24,
    paddingHorizontal: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 16,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: 2,
  },
  titlePill: {
    backgroundColor: 'rgba(15, 118, 110, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.15)',
  },
  titlePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F766E',
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    gap: 4,
    paddingVertical: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: radii.lg,
    gap: 12,
  },
  navItemActive: {
    backgroundColor: 'rgba(15, 118, 110, 0.08)',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  textGroup: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  itemTitleActive: {
    color: '#0F766E',
    fontWeight: '800',
  },
  itemSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  itemSubtitleActive: {
    color: '#0D9488',
  },
  badge: {
    backgroundColor: colors.danger,
    minWidth: 18,
    height: 18,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.8)',
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radii.lg,
    gap: 12,
  },
  logoutIconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.danger,
    letterSpacing: -0.2,
  },
  logoutSubtitle: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 1,
  },
  versionText: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },
});

export default HomeSideMenuModal;
