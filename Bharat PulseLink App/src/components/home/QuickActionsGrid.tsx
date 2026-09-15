import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors, spacing, radii, typography } from '../../theme/tokens';

export interface QuickActionsGridProps {
  onPressScan: () => void;
  onPressFindHospital: () => void;
  onPressRecords: () => void;
  onPressEmergency: () => void;
}

export const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({
  onPressScan,
  onPressFindHospital,
  onPressRecords,
  onPressEmergency,
}) => {
  const row1 = [
    {
      id: 'scan',
      label: 'Scan at Hospital',
      subtitle: 'Instant QR triage',
      onPress: onPressScan,
      accentColor: '#4F46E5',
      bgTint: 'rgba(79, 70, 229, 0.08)',
      icon: (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path d="M7 3H5a2 2 0 0 0-2 2v2M17 3h2a2 2 0 0 1 2 2v2M7 21H5a2 2 0 0 1-2-2v-2M17 21h2a2 2 0 0 0 2-2v-2" stroke="#4F46E5" strokeWidth={2.2} strokeLinecap="round" />
          <Rect x={7} y={7} width={10} height={10} rx={2} stroke="#4F46E5" strokeWidth={1.8} />
        </Svg>
      ),
    },
    {
      id: 'hospitals',
      label: 'Find Hospital',
      subtitle: 'Nearest verified care',
      onPress: onPressFindHospital,
      accentColor: '#059669',
      bgTint: 'rgba(5, 150, 105, 0.08)',
      icon: (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#059669" strokeWidth={2.2} strokeLinejoin="round" />
          <Path d="M12 8v8M8 12h8" stroke="#059669" strokeWidth={2.2} strokeLinecap="round" />
        </Svg>
      ),
    },
  ];

  const row2 = [
    {
      id: 'records',
      label: 'Health Records',
      subtitle: 'Encrypted vault',
      onPress: onPressRecords,
      accentColor: '#0284C7',
      bgTint: 'rgba(2, 132, 199, 0.08)',
      icon: (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#0284C7" strokeWidth={2.2} />
          <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#0284C7" strokeWidth={2.2} strokeLinecap="round" />
        </Svg>
      ),
    },
    {
      id: 'emergency',
      label: 'Emergency SOS',
      subtitle: '108 & contact dialer',
      onPress: onPressEmergency,
      accentColor: '#DC2626',
      bgTint: 'rgba(220, 38, 38, 0.08)',
      icon: (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#DC2626" />
          <Path d="M12 7v6M9 10h6" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
        </Svg>
      ),
    },
  ];

  const renderCard = (action: typeof row1[0]) => (
    <TouchableOpacity
      key={action.id}
      style={styles.actionCard}
      onPress={action.onPress}
      accessibilityRole="button"
      accessibilityLabel={`${action.label}: ${action.subtitle}`}
      activeOpacity={0.85}
    >
      <View style={[styles.iconWrapper, { backgroundColor: action.bgTint }]}>
        {action.icon}
      </View>
      <View style={styles.textCol}>
        <Text style={styles.actionLabel} numberOfLines={1}>
          {action.label}
        </Text>
        <Text style={styles.actionSubtitle} numberOfLines={1}>
          {action.subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.gridContainer}>
        {/* Row 1 */}
        <View style={styles.row}>
          {row1.map(renderCard)}
        </View>
        {/* Row 2 */}
        <View style={styles.row}>
          {row2.map(renderCard)}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.titleSmall.fontSize,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  gridContainer: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionCard: {
    flex: 1,
    height: 90,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 10,
  },
  iconWrapper: {
    width: 46,
    height: 46,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  actionSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default QuickActionsGrid;
