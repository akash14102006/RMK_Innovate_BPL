import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { MetricCounts } from '../../types/profile';
import { colors, spacing, radii, typography } from '../../theme/tokens';

export interface SummaryMetricsRowProps {
  metrics: MetricCounts;
  onPressAppointments: () => void;
  onPressMedications: () => void;
  onPressReports: () => void;
}

export const SummaryMetricsRow: React.FC<SummaryMetricsRowProps> = ({
  metrics,
  onPressAppointments,
  onPressMedications,
  onPressReports,
}) => {
  return (
    <View style={styles.container}>
      {/* 1. Appointments Metric */}
      <TouchableOpacity
        style={styles.metricCard}
        onPress={onPressAppointments}
        accessibilityRole="button"
        accessibilityLabel={`Appointments: ${metrics.appointmentsCount}. Tap to view.`}
        activeOpacity={0.85}
      >
        <View style={[styles.iconCircle, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Rect x={3} y={4} width={18} height={18} rx={2} stroke="#4F46E5" strokeWidth={2} />
            <Path d="M16 2v4M8 2v4M3 10h18" stroke="#4F46E5" strokeWidth={2} strokeLinecap="round" />
          </Svg>
        </View>
        <Text style={styles.metricLabel} numberOfLines={1}>Appointments</Text>
        <Text style={styles.metricValue}>{metrics.appointmentsCount}</Text>
      </TouchableOpacity>

      {/* 2. Medications Metric */}
      <TouchableOpacity
        style={styles.metricCard}
        onPress={onPressMedications}
        accessibilityRole="button"
        accessibilityLabel={`Medications: ${metrics.medicationsCount}. Tap to view.`}
        activeOpacity={0.85}
      >
        <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M10.5 13.5L13.5 10.5M7.5 16.5l9-9a4.24 4.24 0 0 0-6-6l-9 9a4.24 4.24 0 0 0 6 6z"
              stroke="#059669"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
        <Text style={styles.metricLabel} numberOfLines={1}>Medications</Text>
        <Text style={styles.metricValue}>{metrics.medicationsCount}</Text>
      </TouchableOpacity>

      {/* 3. Reports Metric */}
      <TouchableOpacity
        style={styles.metricCard}
        onPress={onPressReports}
        accessibilityRole="button"
        accessibilityLabel={`Reports: ${metrics.reportsCount}. Tap to view.`}
        activeOpacity={0.85}
      >
        <View style={[styles.iconCircle, { backgroundColor: 'rgba(14, 165, 233, 0.1)' }]}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#0284C7" strokeWidth={2} />
            <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#0284C7" strokeWidth={2} strokeLinecap="round" />
          </Svg>
        </View>
        <Text style={styles.metricLabel} numberOfLines={1}>Reports</Text>
        <Text style={styles.metricValue}>{metrics.reportsCount}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  metricCard: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 4,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
});

export default SummaryMetricsRow;
