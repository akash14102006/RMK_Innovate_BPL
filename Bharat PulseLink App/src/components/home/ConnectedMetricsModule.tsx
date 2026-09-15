import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { MetricCounts } from '../../types/profile';
import { colors, spacing, radii, typography } from '../../theme/tokens';

export interface ConnectedMetricsModuleProps {
  metrics: MetricCounts;
  onPressAppointments: () => void;
  onPressMedications: () => void;
  onPressReports: () => void;
}

export const ConnectedMetricsModule: React.FC<ConnectedMetricsModuleProps> = ({
  metrics,
  onPressAppointments,
  onPressMedications,
  onPressReports,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.moduleCard}>
        {/* 1. Appointments Section */}
        <TouchableOpacity
          style={styles.metricColumn}
          onPress={onPressAppointments}
          accessibilityRole="button"
          accessibilityLabel={`Appointments: ${metrics.appointmentsCount}`}
          activeOpacity={0.75}
        >
          <View style={[styles.iconHalo, { backgroundColor: 'rgba(79, 70, 229, 0.08)' }]}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Rect x={3} y={4} width={18} height={18} rx={2} stroke="#4F46E5" strokeWidth={2} />
              <Path d="M16 2v4M8 2v4M3 10h18" stroke="#4F46E5" strokeWidth={2} strokeLinecap="round" />
            </Svg>
          </View>
          <Text style={styles.metricNumber}>{metrics.appointmentsCount}</Text>
          <Text style={styles.metricLabel} numberOfLines={1}>Appointments</Text>
        </TouchableOpacity>

        {/* Divider 1 */}
        <View style={styles.divider} />

        {/* 2. Medications Section */}
        <TouchableOpacity
          style={styles.metricColumn}
          onPress={onPressMedications}
          accessibilityRole="button"
          accessibilityLabel={`Medications: ${metrics.medicationsCount}`}
          activeOpacity={0.75}
        >
          <View style={[styles.iconHalo, { backgroundColor: 'rgba(15, 118, 110, 0.08)' }]}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M10.5 13.5L13.5 10.5M7.5 16.5l9-9a4.24 4.24 0 0 0-6-6l-9 9a4.24 4.24 0 0 0 6 6z"
                stroke="#0F766E"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <Text style={styles.metricNumber}>{metrics.medicationsCount}</Text>
          <Text style={styles.metricLabel} numberOfLines={1}>Medications</Text>
        </TouchableOpacity>

        {/* Divider 2 */}
        <View style={styles.divider} />

        {/* 3. Reports Section */}
        <TouchableOpacity
          style={styles.metricColumn}
          onPress={onPressReports}
          accessibilityRole="button"
          accessibilityLabel={`Reports: ${metrics.reportsCount}`}
          activeOpacity={0.75}
        >
          <View style={[styles.iconHalo, { backgroundColor: 'rgba(2, 132, 199, 0.08)' }]}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#0284C7" strokeWidth={2} />
              <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#0284C7" strokeWidth={2} strokeLinecap="round" />
            </Svg>
          </View>
          <Text style={styles.metricNumber}>{metrics.reportsCount}</Text>
          <Text style={styles.metricLabel} numberOfLines={1}>Reports</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  metricColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconHalo: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  metricNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  metricLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(226, 232, 240, 0.9)',
  },
});

export default ConnectedMetricsModule;
