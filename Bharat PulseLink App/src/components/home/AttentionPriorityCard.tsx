import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AttentionItem } from '../../types/profile';
import { colors, spacing, radii, typography } from '../../theme/tokens';

export interface AttentionPriorityCardProps {
  item: AttentionItem | null;
  onPressAction: (targetStepId: string) => void;
}

export const AttentionPriorityCard: React.FC<AttentionPriorityCardProps> = ({ item, onPressAction }) => {
  if (!item) return null;

  const isHigh = item.priority === 'HIGH';
  const isMedium = item.priority === 'MEDIUM';

  const accentColor = isHigh ? '#DC2626' : isMedium ? '#D97706' : '#4F46E5';
  const bgLight = isHigh ? 'rgba(220, 38, 38, 0.06)' : isMedium ? 'rgba(217, 119, 6, 0.06)' : 'rgba(79, 70, 229, 0.06)';
  const borderColor = isHigh ? 'rgba(220, 38, 38, 0.2)' : isMedium ? 'rgba(217, 119, 6, 0.2)' : 'rgba(79, 70, 229, 0.2)';

  return (
    <View style={[styles.card, { backgroundColor: bgLight, borderColor }]}>
      <View style={styles.topRow}>
        <View style={styles.titleGroup}>
          <View style={[styles.priorityTag, { backgroundColor: accentColor }]}>
            <Text style={styles.priorityTagText}>ACTION REQUIRED</Text>
          </View>
          <Text style={styles.title}>{item.title}</Text>
        </View>
      </View>

      <Text style={styles.description}>{item.description}</Text>

      <TouchableOpacity
        style={[styles.actionBtn, { backgroundColor: accentColor }]}
        onPress={() => onPressAction(item.targetStepId)}
        accessibilityRole="button"
        accessibilityLabel={`${item.actionLabel}: ${item.title}`}
        activeOpacity={0.88}
      >
        <Text style={styles.actionBtnText}>{item.actionLabel} →</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1.2,
    marginBottom: spacing.sm,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleGroup: {
    gap: 4,
    flex: 1,
  },
  priorityTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  priorityTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  actionBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.md,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
  },
  actionBtnText: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default AttentionPriorityCard;
