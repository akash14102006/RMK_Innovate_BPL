import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing, radii, typography } from '../../theme/tokens';
import { HealthSummaryItem } from '../../types/healthSummary';

export interface HealthSummaryRowProps {
  label: string;
  item: HealthSummaryItem<any>;
  unit?: string;
  icon: React.ReactNode;
  onPressEdit?: () => void;
}

export const HealthSummaryRow: React.FC<HealthSummaryRowProps> = ({
  label,
  item,
  unit,
  icon,
  onPressEdit,
}) => {
  const hasValue = item.value !== null && item.value !== undefined && item.value !== '';
  const displayValue = hasValue ? `${item.value}${unit ? ` ${unit}` : ''}` : 'Not provided';

  const isVerified = item.provenance === 'CLINICALLY_VERIFIED';
  const isDerived = item.provenance === 'SYSTEM_DERIVED';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPressEdit}
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${displayValue}. Source: ${item.sourceLabel}`}
      activeOpacity={onPressEdit ? 0.82 : 1}
    >
      <View style={styles.leftRow}>
        <View style={styles.iconBox}>{icon}</View>

        <View style={styles.labelCol}>
          <Text style={styles.label}>{label}</Text>
          <View style={styles.provenanceRow}>
            <Text
              style={[
                styles.provenanceText,
                isVerified && styles.provenanceVerified,
                isDerived && styles.provenanceDerived,
              ]}
            >
              {item.sourceLabel}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.rightRow}>
        <Text style={[styles.valueText, !hasValue && styles.valueEmpty]}>{displayValue}</Text>

        {onPressEdit && (
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path d="M9 18l6-6-6-6" stroke="#94A3B8" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    marginBottom: spacing.xs,
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
  provenanceRow: {
    marginTop: 2,
  },
  provenanceText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  provenanceVerified: {
    color: '#059669',
    fontWeight: '700',
  },
  provenanceDerived: {
    color: '#0F766E',
    fontWeight: '700',
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  valueText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  valueEmpty: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
  },
});

export default HealthSummaryRow;
