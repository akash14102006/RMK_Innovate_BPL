import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LifestyleData } from '../../types/profile';
import { colors, spacing, radii, typography } from '../../theme/tokens';
import SelectDropdownModal, { OptionItem } from '../common/SelectDropdownModal';

export interface LifestyleStepProps {
  data: LifestyleData;
  onChange: (updated: Partial<LifestyleData>) => void;
}

export const LifestyleStep: React.FC<LifestyleStepProps> = ({ data, onChange }) => {
  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);

  const smokingOptions: { label: string; value: LifestyleData['smokingStatus'] }[] = [
    { label: 'Non-Smoker', value: 'NO' },
    { label: 'Former', value: 'FORMER' },
    { label: 'Occasionally', value: 'OCCASIONALLY' },
    { label: 'Regularly', value: 'REGULARLY' },
  ];

  const alcoholOptions: { label: string; value: LifestyleData['alcoholStatus'] }[] = [
    { label: 'None', value: 'NONE' },
    { label: 'Occasional', value: 'OCCASIONAL' },
    { label: 'Regular', value: 'REGULAR' },
  ];

  const exerciseOptions: { label: string; value: LifestyleData['exerciseFrequency'] }[] = [
    { label: 'Rarely', value: 'RARELY' },
    { label: 'Occasionally', value: 'OCCASIONALLY' },
    { label: 'Regularly', value: 'REGULARLY' },
    { label: 'Very Active', value: 'VERY_ACTIVE' },
  ];

  const dietOptions: { label: string; value: LifestyleData['dietType'] }[] = [
    { label: 'Vegetarian', value: 'VEGETARIAN' },
    { label: 'Non-Vegetarian', value: 'NON_VEGETARIAN' },
    { label: 'Vegan', value: 'VEGAN' },
    { label: 'Other', value: 'OTHER' },
  ];

  const sleepOptions: OptionItem<string>[] = [
    { label: '5–6 hours', value: '6' },
    { label: '6–7 hours', value: '7' },
    { label: '7–8 hours', value: '8' },
    { label: '8–9 hours', value: '9' },
    { label: '9+ hours', value: '10' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>
        Optional lifestyle habits to assist doctors in personalized care recommendations:
      </Text>

      {/* 1. Smoking Habits */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Smoking Habits</Text>
        <View style={styles.chipRow}>
          {smokingOptions.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, data.smokingStatus === opt.value && styles.chipActive]}
              onPress={() => onChange({ smokingStatus: opt.value })}
              accessibilityRole="button"
              accessibilityLabel={opt.label}
            >
              <Text style={[styles.chipText, data.smokingStatus === opt.value && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 2. Alcohol Consumption */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Alcohol Consumption</Text>
        <View style={styles.chipRow}>
          {alcoholOptions.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, data.alcoholStatus === opt.value && styles.chipActive]}
              onPress={() => onChange({ alcoholStatus: opt.value })}
              accessibilityRole="button"
              accessibilityLabel={opt.label}
            >
              <Text style={[styles.chipText, data.alcoholStatus === opt.value && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 3. Physical Activity */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Physical Activity / Exercise</Text>
        <View style={styles.chipRow}>
          {exerciseOptions.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, data.exerciseFrequency === opt.value && styles.chipActive]}
              onPress={() => onChange({ exerciseFrequency: opt.value })}
              accessibilityRole="button"
              accessibilityLabel={opt.label}
            >
              <Text style={[styles.chipText, data.exerciseFrequency === opt.value && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 4. Dietary Preference */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dietary Preference</Text>
        <View style={styles.chipRow}>
          {dietOptions.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, data.dietType === opt.value && styles.chipActive]}
              onPress={() => onChange({ dietType: opt.value })}
              accessibilityRole="button"
              accessibilityLabel={opt.label}
            >
              <Text style={[styles.chipText, data.dietType === opt.value && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 5. Sleep Duration (Listbox Modal) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Average Daily Sleep</Text>
        <TouchableOpacity
          style={styles.pickerTrigger}
          onPress={() => setIsSleepModalOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Select Sleep Duration"
        >
          <Text style={data.sleepHoursAverage ? styles.pickerTriggerText : styles.pickerTriggerPlaceholder}>
            {data.sleepHoursAverage ? `${data.sleepHoursAverage} hours / day` : 'Select average sleep duration'}
          </Text>
          <Text style={styles.pickerIcon}>▾</Text>
        </TouchableOpacity>
      </View>

      {/* Sleep Listbox Modal */}
      <SelectDropdownModal
        visible={isSleepModalOpen}
        onClose={() => setIsSleepModalOpen(false)}
        title="Select Average Sleep Duration"
        options={sleepOptions}
        selectedValue={data.sleepHoursAverage ? String(data.sleepHoursAverage) : undefined}
        onSelect={(val) => {
          const hours = parseInt(val, 10);
          onChange({ sleepHoursAverage: isNaN(hours) ? 7 : hours });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  sectionHeader: {
    fontSize: typography.bodyMedium.fontSize,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  card: {
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardTitle: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: 'rgba(15, 118, 110, 0.12)',
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  pickerTrigger: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },
  pickerTriggerText: {
    fontSize: typography.bodyMedium.fontSize,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  pickerTriggerPlaceholder: {
    fontSize: typography.bodyMedium.fontSize,
    color: colors.textMuted,
  },
  pickerIcon: {
    fontSize: 18,
    color: colors.textSecondary,
  },
});

export default LifestyleStep;
