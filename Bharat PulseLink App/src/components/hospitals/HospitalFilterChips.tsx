/**
 * Bharat PulseLink — Hospital Filter Chips (Prompt 46)
 *
 * Quick filter chips with Advanced Filter sheet trigger and active badge.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { radii, spacing, typography } from '../../theme/tokens';
import type { HospitalDiscoveryFilter } from '../../types/hospitals';

export interface HospitalFilterChipsProps {
  activeFilter: HospitalDiscoveryFilter;
  onSelectFilter: (filter: HospitalDiscoveryFilter) => void;
  activeFilterCount?: number;
  onOpenAdvancedFilters?: () => void;
}

interface FilterOption {
  id: HospitalDiscoveryFilter;
  label: string;
}

const FILTERS: FilterOption[] = [
  { id: 'ALL', label: 'All' },
  { id: 'GOVERNMENT', label: 'Government' },
  { id: 'PRIVATE', label: 'Private' },
  { id: '24X7', label: '24x7' },
];

export const HospitalFilterChips: React.FC<HospitalFilterChipsProps> = ({
  activeFilter,
  onSelectFilter,
  activeFilterCount = 0,
  onOpenAdvancedFilters,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Advanced Filters Button */}
        {onOpenAdvancedFilters && (
          <TouchableOpacity
            style={[
              styles.advancedFilterBtn,
              activeFilterCount > 0 && styles.advancedFilterBtnActive,
            ]}
            onPress={onOpenAdvancedFilters}
            accessibilityRole="button"
            accessibilityLabel={`Open advanced filters. ${activeFilterCount} active.`}
            activeOpacity={0.82}
          >
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path
                d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"
                stroke={activeFilterCount > 0 ? '#FFFFFF' : '#0F766E'}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text
              style={[
                styles.advancedFilterBtnText,
                activeFilterCount > 0 && styles.advancedFilterBtnTextActive,
              ]}
            >
              Filter
            </Text>
            {activeFilterCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Quick Filter Chips */}
        {FILTERS.map((item) => {
          const isSelected = activeFilter === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => onSelectFilter(item.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`Filter: ${item.label}`}
              activeOpacity={0.82}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  advancedFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.full,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    gap: 6,
  },
  advancedFilterBtnActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  advancedFilterBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F766E',
  },
  advancedFilterBtnTextActive: {
    color: '#FFFFFF',
  },
  badge: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: radii.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  chipSelected: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  chipText: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '700',
    color: '#64748B',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});

export default HospitalFilterChips;
