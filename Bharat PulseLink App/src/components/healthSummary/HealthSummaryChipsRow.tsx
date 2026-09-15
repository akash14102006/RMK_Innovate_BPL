import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing, radii, typography } from '../../theme/tokens';
import { HealthSummaryItem } from '../../types/healthSummary';

export interface HealthSummaryChipsRowProps {
  label: string;
  item: HealthSummaryItem<string[]>;
  emptyLabel: string;
  icon: React.ReactNode;
  onPressEdit?: () => void;
}

export const HealthSummaryChipsRow: React.FC<HealthSummaryChipsRowProps> = ({
  label,
  item,
  emptyLabel,
  icon,
  onPressEdit,
}) => {
  const items = item.value || [];
  const hasItems = items.length > 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPressEdit}
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${hasItems ? items.join(', ') : emptyLabel}. Source: ${item.sourceLabel}`}
      activeOpacity={onPressEdit ? 0.82 : 1}
    >
      <View style={styles.topRow}>
        <View style={styles.leftRow}>
          <View style={styles.iconBox}>{icon}</View>
          <View style={styles.labelCol}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.provenanceText}>{item.sourceLabel}</Text>
          </View>
        </View>

        {onPressEdit && (
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path d="M9 18l6-6-6-6" stroke="#94A3B8" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        )}
      </View>

      <View style={styles.chipsContainer}>
        {hasItems ? (
          items.map((entry, index) => (
            <View key={`${entry}_${index}`} style={styles.chip}>
              <Text style={styles.chipText}>{entry}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>{emptyLabel}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    marginBottom: spacing.xs,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(15, 118, 110, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelCol: {
    flex: 1,
  },
  label: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  provenanceText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 4,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: 'rgba(203, 213, 225, 0.6)',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    fontStyle: 'italic',
  },
});

export default HealthSummaryChipsRow;
