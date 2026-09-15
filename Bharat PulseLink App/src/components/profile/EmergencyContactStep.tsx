import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { EmergencyContactData } from '../../types/profile';
import { colors, spacing, radii, typography } from '../../theme/tokens';

export interface EmergencyContactStepProps {
  data: EmergencyContactData;
  onChange: (updated: Partial<EmergencyContactData>) => void;
  errors?: Record<string, string>;
}

export const EmergencyContactStep: React.FC<EmergencyContactStepProps> = ({ data, onChange, errors = {} }) => {
  const relationshipOptions: { label: string; value: EmergencyContactData['relationship'] }[] = [
    { label: 'Parent', value: 'PARENT' },
    { label: 'Spouse', value: 'SPOUSE' },
    { label: 'Sibling', value: 'SIBLING' },
    { label: 'Child', value: 'CHILD' },
    { label: 'Friend', value: 'FRIEND' },
    { label: 'Guardian', value: 'GUARDIAN' },
    { label: 'Other', value: 'OTHER' },
  ];

  return (
    <View style={styles.container}>
      {/* Contact Name */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>
          Contact Full Name <Text style={styles.requiredStar}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, errors.contactName ? styles.inputError : null]}
          value={data.contactName}
          onChangeText={(text) => onChange({ contactName: text })}
          placeholder="Enter emergency contact's full name"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="words"
          accessibilityLabel="Emergency Contact Full Name"
        />
        {errors.contactName && <Text style={styles.errorText}>{errors.contactName}</Text>}
      </View>

      {/* Relationship */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>
          Relationship <Text style={styles.requiredStar}>*</Text>
        </Text>
        <View style={styles.chipRow}>
          {relationshipOptions.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, data.relationship === opt.value && styles.chipActive]}
              onPress={() => onChange({ relationship: opt.value })}
              accessibilityRole="button"
              accessibilityLabel={opt.label}
            >
              <Text style={[styles.chipText, data.relationship === opt.value && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.relationship && <Text style={styles.errorText}>{errors.relationship}</Text>}
      </View>

      {/* Primary Phone */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>
          Primary Phone <Text style={styles.requiredStar}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, errors.primaryPhone ? styles.inputError : null]}
          value={data.primaryPhone}
          onChangeText={(text) => onChange({ primaryPhone: text.replace(/\D/g, '') })}
          placeholder="Enter 10-digit mobile number"
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
          maxLength={10}
          accessibilityLabel="Emergency Contact Phone"
        />
        {errors.primaryPhone && <Text style={styles.errorText}>{errors.primaryPhone}</Text>}
      </View>

      {/* Alternate Phone */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Alternate Phone (Optional)</Text>
        <TextInput
          style={styles.input}
          value={data.alternatePhone}
          onChangeText={(text) => onChange({ alternatePhone: text.replace(/\D/g, '') })}
          placeholder="Enter alternate phone number"
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
          maxLength={10}
          accessibilityLabel="Alternate Emergency Phone"
        />
      </View>

      {/* Address */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Contact Address (Optional)</Text>
        <TextInput
          style={styles.input}
          value={data.address}
          onChangeText={(text) => onChange({ address: text })}
          placeholder="Enter contact address if different from yours"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Contact Address"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  requiredStar: {
    color: colors.danger,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.bodyLarge.fontSize,
    color: colors.textPrimary,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: colors.danger,
    borderWidth: 1.5,
  },
  errorText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.danger,
    marginTop: 2,
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
});

export default EmergencyContactStep;
