import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { IdentificationData } from '../../types/profile';
import { colors, spacing, radii, typography } from '../../theme/tokens';

export interface IdentificationStepProps {
  data: IdentificationData;
  onChange: (updated: Partial<IdentificationData>) => void;
  errors?: Record<string, string>;
}

export const IdentificationStep: React.FC<IdentificationStepProps> = ({ data, onChange, errors = {} }) => {
  const bloodGroupOptions: { label: string; value: IdentificationData['bloodGroup'] }[] = [
    { label: 'A+', value: 'A+' },
    { label: 'A-', value: 'A-' },
    { label: 'B+', value: 'B+' },
    { label: 'B-', value: 'B-' },
    { label: 'O+', value: 'O+' },
    { label: 'O-', value: 'O-' },
    { label: 'AB+', value: 'AB+' },
    { label: 'AB-', value: 'AB-' },
  ];

  return (
    <View style={styles.container}>
      {/* Privacy Notice Badge */}
      <View style={styles.privacyBadge}>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
            stroke={colors.primary}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          <Path
            d="M9 12l2 2 4-4"
            stroke={colors.primary}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
        <Text style={styles.privacyText}>
          Government IDs are optional, encrypted at rest, and never shared without your explicit consent.
        </Text>
      </View>

      {/* Blood Group */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Blood Group</Text>
        <View style={styles.chipRow}>
          {bloodGroupOptions.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, data.bloodGroup === opt.value && styles.chipActive]}
              onPress={() => onChange({ bloodGroup: opt.value })}
              accessibilityRole="button"
              accessibilityLabel={`Blood group ${opt.label}`}
            >
              <Text style={[styles.chipText, data.bloodGroup === opt.value && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Aadhaar Number (Masked/Optional) */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Aadhaar Number (Optional)</Text>
        <TextInput
          style={[styles.input, errors.aadhaarNumberMasked ? styles.inputError : null]}
          value={data.aadhaarNumberMasked}
          onChangeText={(text) => onChange({ aadhaarNumberMasked: text })}
          placeholder="Enter 12-digit Aadhaar number"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          maxLength={14}
          accessibilityLabel="Aadhaar Number"
        />
        {errors.aadhaarNumberMasked && <Text style={styles.errorText}>Invalid Aadhaar format</Text>}
      </View>

      {/* PAN Number */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>PAN Number (Optional)</Text>
        <TextInput
          style={[styles.input, errors.panNumberMasked ? styles.inputError : null]}
          value={data.panNumberMasked}
          onChangeText={(text) => onChange({ panNumberMasked: text.toUpperCase() })}
          placeholder="Enter 10-character PAN"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          maxLength={10}
          accessibilityLabel="PAN Number"
        />
        {errors.panNumberMasked && <Text style={styles.errorText}>Invalid PAN format</Text>}
      </View>

      {/* Passport Number */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Passport Number (Optional)</Text>
        <TextInput
          style={styles.input}
          value={data.passportNumber}
          onChangeText={(text) => onChange({ passportNumber: text.toUpperCase() })}
          placeholder="Enter Passport number"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          accessibilityLabel="Passport Number"
        />
      </View>

      {/* Occupation */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Occupation (Optional)</Text>
        <TextInput
          style={styles.input}
          value={data.occupation}
          onChangeText={(text) => onChange({ occupation: text })}
          placeholder="Enter your occupation"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Occupation"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 118, 110, 0.08)',
    borderColor: 'rgba(15, 118, 110, 0.18)',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  privacyText: {
    flex: 1,
    fontSize: typography.bodySmall.fontSize,
    color: colors.primary,
    lineHeight: 18,
    fontWeight: '500',
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
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
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    minWidth: 44,
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: 'rgba(15, 118, 110, 0.12)',
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: typography.bodyMedium.fontSize,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});

export default IdentificationStep;
