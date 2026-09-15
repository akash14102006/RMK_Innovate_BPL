import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { AllergiesData } from '../../types/profile';
import { colors, spacing, radii, typography } from '../../theme/tokens';

export interface AllergiesStepProps {
  data: AllergiesData;
  onChange: (updated: Partial<AllergiesData>) => void;
}

export const AllergiesStep: React.FC<AllergiesStepProps> = ({ data, onChange }) => {
  const allergyItems = [
    { key: 'hasPollen', label: 'Pollen / Grass', desc: 'Seasonal respiratory or nasal allergies' },
    { key: 'hasDust', label: 'Dust & Mites', desc: 'Environmental dust or animal dander sensitivity' },
    { key: 'hasPeanuts', label: 'Peanuts & Tree Nuts', desc: 'Anaphylaxis or oral allergic syndrome' },
    { key: 'hasMedications', label: 'Medications', desc: 'Penicillin, Sulfa drugs, NSAIDs, etc.' },
    { key: 'hasSeafood', label: 'Fish & Shellfish', desc: 'Marine food sensitivity or rash' },
    { key: 'otherAllergyEnabled', label: 'Other Allergy', desc: 'Any other food, contact, or environmental allergy' },
  ] as const;

  const renderSegmentedChoice = (key: keyof AllergiesData) => {
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
        Do you experience any known allergic reactions to:
      </Text>

      {allergyItems.map((item) => (
        <View key={item.key} style={styles.allergyCard}>
          <View style={styles.allergyHeader}>
            <Text style={styles.allergyTitle}>{item.label}</Text>
            <Text style={styles.allergyDesc}>{item.desc}</Text>
          </View>
          {renderSegmentedChoice(item.key)}
        </View>
      ))}

      {data.otherAllergyEnabled === true && (
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Please specify allergen or reaction:</Text>
          <TextInput
            style={styles.input}
            value={data.otherAllergyDetails || ''}
            onChangeText={(text) => onChange({ otherAllergyDetails: text })}
            placeholder="Enter allergen name (e.g. Latex, Soy, Dye)"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Other allergy details"
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
  allergyCard: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 6,
  },
  allergyHeader: {
    gap: 1,
  },
  allergyTitle: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  allergyDesc: {
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

export default AllergiesStep;
