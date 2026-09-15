import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { spacing } from '../../theme/tokens';
import { useI18n } from '../../i18n/I18nContext';

export type TabId = 'Home' | 'Hospitals' | 'Scan' | 'Records' | 'Profile';

export interface BottomTabBarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
}

export const BOTTOM_NAV_HEIGHT = 64;
export const getBottomNavHeight = (bottomInset: number = 0) =>
  BOTTOM_NAV_HEIGHT + Math.max(bottomInset, 10);

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, onSelectTab }) => {
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 10);

  const tabs: Array<{
    id: TabId;
    label: string;
    accessibilityLabel: string;
    icon: (active: boolean) => React.ReactNode;
  }> = [
    {
      id: 'Home',
      label: t('navigation.home') || 'Home',
      accessibilityLabel: t('navigation.tabHome') || `${t('navigation.home') || 'Home'} Tab`,
      icon: (active: boolean) => (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
            stroke={active ? '#0F766E' : '#64748B'}
            strokeWidth={active ? 2.2 : 1.8}
            fill={active ? 'rgba(15, 118, 110, 0.14)' : 'none'}
          />
          <Path
            d="M9 22V12h6v10"
            stroke={active ? '#0F766E' : '#64748B'}
            strokeWidth={active ? 2.2 : 1.8}
          />
        </Svg>
      ),
    },
    {
      id: 'Hospitals',
      label: t('navigation.hospitals') || 'Hospitals',
      accessibilityLabel: t('navigation.tabHospitals') || `${t('navigation.hospitals') || 'Hospitals'} Tab`,
      icon: (active: boolean) => (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2zM9 10h6M12 7v6"
            stroke={active ? '#0F766E' : '#64748B'}
            strokeWidth={active ? 2.2 : 1.8}
            fill={active ? 'rgba(15, 118, 110, 0.14)' : 'none'}
          />
        </Svg>
      ),
    },
    {
      id: 'Scan',
      label: t('navigation.scan') || 'Scan',
      accessibilityLabel: t('navigation.tabScan') || `${t('navigation.scan') || 'Scan'} Tab`,
      icon: (active: boolean) => (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M7 3H5a2 2 0 0 0-2 2v2M17 3h2a2 2 0 0 1 2 2v2M7 21H5a2 2 0 0 1-2-2v-2M17 21h2a2 2 0 0 0 2-2v-2"
            stroke={active ? '#0F766E' : '#64748B'}
            strokeWidth={2.2}
            strokeLinecap="round"
          />
          <Rect
            x={7}
            y={7}
            width={10}
            height={10}
            rx={2}
            stroke={active ? '#0F766E' : '#64748B'}
            strokeWidth={1.8}
            fill={active ? 'rgba(15, 118, 110, 0.14)' : 'none'}
          />
        </Svg>
      ),
    },
    {
      id: 'Records',
      label: t('navigation.records') || 'Records',
      accessibilityLabel: t('navigation.tabRecords') || `${t('navigation.records') || 'Records'} Tab`,
      icon: (active: boolean) => (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
            stroke={active ? '#0F766E' : '#64748B'}
            strokeWidth={active ? 2.2 : 1.8}
            fill={active ? 'rgba(15, 118, 110, 0.14)' : 'none'}
          />
          <Path
            d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
            stroke={active ? '#0F766E' : '#64748B'}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
      ),
    },
    {
      id: 'Profile',
      label: t('navigation.profile') || 'Profile',
      accessibilityLabel: t('navigation.tabProfile') || `${t('navigation.profile') || 'Profile'} Tab`,
      icon: (active: boolean) => (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
            stroke={active ? '#0F766E' : '#64748B'}
            strokeWidth={active ? 2.2 : 1.8}
          />
          <Circle
            cx={12}
            cy={7}
            r={4}
            stroke={active ? '#0F766E' : '#64748B'}
            strokeWidth={2.2}
            fill={active ? 'rgba(15, 118, 110, 0.14)' : 'none'}
          />
        </Svg>
      ),
    },
  ];

  return (
    <View
      style={[styles.container, { paddingBottom: bottomPadding }]}
      pointerEvents="box-none"
      accessibilityRole="tablist"
    >
      <View style={[styles.bar, isRTL && styles.barRTL]}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabItem}
              onPress={() => onSelectTab(tab.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.accessibilityLabel}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 2, right: 2 }}
            >
              <View
                style={[
                  styles.iconCapsule,
                  isActive && styles.iconCapsuleActive,
                ]}
              >
                {tab.icon(isActive)}
              </View>
              <View style={styles.labelWrapper}>
                <Text
                  style={[styles.tabLabel, isActive && styles.tabLabelActive]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  maxFontSizeMultiplier={1.15}
                >
                  {tab.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: spacing.sm,
    backgroundColor: '#F8FAFC',
    zIndex: 100,
    elevation: 16,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.95)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
  },
  barRTL: {
    flexDirection: 'row-reverse',
  },
  tabItem: {
    flex: 1,
    maxWidth: '20%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
    paddingHorizontal: 1,
    minHeight: 48,
  },
  iconCapsule: {
    width: 44,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCapsuleActive: {
    backgroundColor: 'rgba(15, 118, 110, 0.12)',
  },
  labelWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 1,
    marginTop: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    maxWidth: '100%',
  },
  tabLabelActive: {
    color: '#0F766E',
    fontWeight: '800',
  },
});

export default BottomTabBar;
