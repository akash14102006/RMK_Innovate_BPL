import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { colors, spacing, radii } from '../../theme/tokens';

export type TabId = 'Home' | 'Hospitals' | 'Scan' | 'Records' | 'Profile';

export interface BottomTabBarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, onSelectTab }) => {
  const tabs = [
    {
      id: 'Home' as TabId,
      label: 'Home',
      icon: (active: boolean) => (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
            stroke={active ? '#0F766E' : '#64748B'}
            strokeWidth={active ? 2.2 : 1.8}
            fill={active ? 'rgba(15, 118, 110, 0.12)' : 'none'}
          />
          <Path d="M9 22V12h6v10" stroke={active ? '#0F766E' : '#64748B'} strokeWidth={active ? 2.2 : 1.8} />
        </Svg>
      ),
    },
    {
      id: 'Hospitals' as TabId,
      label: 'Hospitals',
      icon: (active: boolean) => (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2zM9 10h6M12 7v6"
            stroke={active ? '#0F766E' : '#64748B'}
            strokeWidth={active ? 2.2 : 1.8}
          />
        </Svg>
      ),
    },
    {
      id: 'Scan' as TabId,
      label: 'Scan',
      icon: (active: boolean) => (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path d="M7 3H5a2 2 0 0 0-2 2v2M17 3h2a2 2 0 0 1 2 2v2M7 21H5a2 2 0 0 1-2-2v-2M17 21h2a2 2 0 0 0 2-2v-2" stroke={active ? '#0F766E' : '#64748B'} strokeWidth={2.2} strokeLinecap="round" />
          <Rect x={7} y={7} width={10} height={10} rx={2} stroke={active ? '#0F766E' : '#64748B'} strokeWidth={1.8} />
        </Svg>
      ),
    },
    {
      id: 'Records' as TabId,
      label: 'Records',
      icon: (active: boolean) => (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
            stroke={active ? '#0F766E' : '#64748B'}
            strokeWidth={active ? 2.2 : 1.8}
          />
          <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={active ? '#0F766E' : '#64748B'} strokeWidth={2.2} strokeLinecap="round" />
        </Svg>
      ),
    },
    {
      id: 'Profile' as TabId,
      label: 'Profile',
      icon: (active: boolean) => (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
            stroke={active ? '#0F766E' : '#64748B'}
            strokeWidth={active ? 2.2 : 1.8}
          />
          <Circle cx={12} cy={7} r={4} stroke={active ? '#0F766E' : '#64748B'} strokeWidth={active ? 2.2 : 1.8} />
        </Svg>
      ),
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => onSelectTab(tab.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${tab.label} Tab`}
              activeOpacity={0.8}
            >
              {tab.icon(isActive)}
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
    backgroundColor: '#F8FAFC',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: radii.lg,
    minWidth: 60,
  },
  tabItemActive: {
    backgroundColor: 'rgba(15, 118, 110, 0.08)',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#0F766E',
    fontWeight: '800',
  },
});

export default BottomTabBar;
