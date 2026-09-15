import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { HealthConditionsData } from '../../types/profile';
import { colors, spacing, radii, typography } from '../../theme/tokens';

export interface HealthConditionsStepProps {
  data: HealthConditionsData;
  onChange: (updated: Partial<HealthConditionsData>) => void;
}

export const HealthConditionsStep: React.FC<HealthConditionsStepProps> = ({ data, onChange }) => {
  const conditions = [
    { key: 'hasDiabetes', label: 'Diabetes', desc: 'Type 1, Type 2, or pre-diabetes' },
    { key: 'hasHypertension', label: 'Hypertension', desc: 'High blood pressure' },
    { key: 'hasAsthma', label: 'Asthma / Respiratory', desc: 'Chronic breathing or asthma condition' },
    { key: 'hasThyroid', label: 'Thyroid Disorder', desc: 'Hypo or hyperthyroidism' },
    { key: 'hasHeartDisease', label: 'Heart Disease', desc: 'Cardiovascular history or condition' },
    { key: 'otherConditionEnabled', label: 'Other Health Condition', desc: 'Any diagnosed condition not listed above' },
  ] as const;

  const renderSegmentedChoice = (key: keyof HealthConditionsData) => {
    const val = data[key];
    const isYes = val === true;
    const isNo = val === false;
    const isDontKnow = val === undefined || val === null;

    return (
      <View style={styles.segmentedTrack}>
        {/* No Option */}
        <TouchableOpacity
          style={[styles.segmentBtn, isNo && styles.segmentBtnNoActive]}
          onPress={() => onChange({ [key]: false })}
          accessibilityRole="button"
          accessibilityLabel="No"
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, isNo && styles.segmentTextNoActive]}>No</Text>
        </TouchableOpacity>

        {/* Yes Option */}
        <TouchableOpacity
          style={[styles.segmentBtn, isYes && styles.segmentBtnYesActive]}
          onPress={() => onChange({ [key]: true })}
          accessibilityRole="button"
          accessibilityLabel="Yes"
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, isYes && styles.segmentTextYesActive]}>Yes</Text>
        </TouchableOpacity>

        {/* Don't know Option */}
        <TouchableOpacity
          style={[styles.segmentBtn, isDontKnow && styles.segmentBtnDontKnowActive]}
          onPress={() => onChange({ [key]: undefined })}
          accessibilityRole="button"
          accessibilityLabel="Don't know"
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, isDontKnow && styles.segmentTextDontKnowActive]}>
            Don't know
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>
        Do you currently have or have you ever been diagnosed with:
      </Text>

      {conditions.map((item) => (
        <View key={item.key} style={styles.conditionCard}>
          <View style={styles.conditionHeader}>
            <Text style={styles.conditionTitle}>{item.label}</Text>
            <Text style={styles.conditionDesc}>{item.desc}</Text>
          </View>
          {renderSegmentedChoice(item.key)}
        </View>
      ))}

      {data.otherConditionEnabled === true && (
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Please specify other condition:</Text>
          <TextInput
            style={styles.input}
            value={data.otherConditionDetails || ''}
            onChangeText={(text) => onChange({ otherConditionDetails: text })}
            placeholder="Enter condition name and details"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Other condition details"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  sectionHeader: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
  conditionCard: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 6,
  },
  conditionHeader: {
    gap: 1,
  },
  conditionTitle: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  conditionDesc: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  segmentedTrack: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: radii.md,
    padding: 3,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentBtnYesActive: {
    backgroundColor: 'rgba(15, 118, 110, 0.18)',
    borderColor: '#0F766E',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentTextYesActive: {
    color: '#0F766E',
    fontWeight: '800',
  },
  segmentBtnNoActive: {
    backgroundColor: 'rgba(100, 116, 139, 0.16)',
    borderColor: '#64748B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentTextNoActive: {
    color: '#1E293B',
    fontWeight: '800',
  },
  segmentBtnDontKnowActive: {
    backgroundColor: 'rgba(217, 119, 6, 0.18)',
    borderColor: '#D97706',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentTextDontKnowActive: {
    color: '#B45309',
    fontWeight: '800',
  },
  segmentText: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  fieldGroup: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  label: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.textPrimary,
    backgroundColor: '#FFFFFF',
  },
});

export default HealthConditionsStep;
