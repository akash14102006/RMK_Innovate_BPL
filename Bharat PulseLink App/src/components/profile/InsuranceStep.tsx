import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { InsuranceData } from '../../types/profile';
import { colors, spacing, radii, typography } from '../../theme/tokens';
import DatePickerModal from '../common/DatePickerModal';

export interface InsuranceStepProps {
  data: InsuranceData;
  onChange: (updated: Partial<InsuranceData>) => void;
  errors?: Record<string, string>;
}

export const InsuranceStep: React.FC<InsuranceStepProps> = ({ data, onChange, errors = {} }) => {
  const [hasInsurance, setHasInsurance] = useState<'yes' | 'no' | 'dont_know'>(data.hasInsurance ? 'yes' : 'no');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>Do you currently hold an active health insurance policy?</Text>

      {/* Segmented Status Selector */}
      <View style={styles.segmentedRow}>
        <TouchableOpacity
          style={[styles.segmentBtn, hasInsurance === 'no' && styles.segmentBtnActive]}
          onPress={() => {
            setHasInsurance('no');
            onChange({ hasInsurance: false });
          }}
          accessibilityRole="button"
          accessibilityLabel="No insurance"
        >
          <Text style={[styles.segmentText, hasInsurance === 'no' && styles.segmentTextActive]}>
            No insurance
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, hasInsurance === 'yes' && styles.segmentBtnActive]}
          onPress={() => {
            setHasInsurance('yes');
            onChange({ hasInsurance: true });
          }}
          accessibilityRole="button"
          accessibilityLabel="Yes, I have insurance"
        >
          <Text style={[styles.segmentText, hasInsurance === 'yes' && styles.segmentTextActive]}>
            Yes, I have insurance
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, hasInsurance === 'dont_know' && styles.segmentBtnActive]}
          onPress={() => {
            setHasInsurance('dont_know');
            onChange({ hasInsurance: false });
          }}
          accessibilityRole="button"
          accessibilityLabel="Don't know"
        >
          <Text style={[styles.segmentText, hasInsurance === 'dont_know' && styles.segmentTextActive]}>
            Don't know
          </Text>
        </TouchableOpacity>
      </View>

      {hasInsurance === 'yes' && (
        <View style={styles.formContainer}>
          {/* Provider */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Insurance Provider</Text>
            <TextInput
              style={[styles.input, errors.providerName ? styles.inputError : null]}
              value={data.providerName}
              onChangeText={(text) => onChange({ providerName: text })}
              placeholder="e.g. Star Health, HDFC ERGO, PMJAY / Ayushman"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Insurance Provider Name"
            />
          </View>

          {/* Policy Number */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Policy Number</Text>
            <TextInput
              style={[styles.input, errors.policyNumberMasked ? styles.inputError : null]}
              value={data.policyNumberMasked}
              onChangeText={(text) => onChange({ policyNumberMasked: text.toUpperCase() })}
              placeholder="Enter insurance policy number"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              accessibilityLabel="Policy Number"
            />
          </View>

          {/* Member ID / Card No */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Member ID / TPA Number (Optional)</Text>
            <TextInput
              style={styles.input}
              value={data.memberIdMasked}
              onChangeText={(text) => onChange({ memberIdMasked: text.toUpperCase() })}
              placeholder="Enter Member ID"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              accessibilityLabel="Member ID"
            />
          </View>

          {/* Valid Until (Expiry Date Picker) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Policy Expiry Date (Optional)</Text>
            <TouchableOpacity
              style={styles.pickerTrigger}
              onPress={() => setIsDatePickerOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Select Policy Expiry Date"
            >
              <Text style={data.validTillDate ? styles.pickerTriggerText : styles.pickerTriggerPlaceholder}>
                {data.validTillDate ? data.validTillDate : 'Select policy expiry date'}
              </Text>
              <Text style={styles.pickerIcon}>📅</Text>
            </TouchableOpacity>
          </View>

          {/* Nominee */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Nominee Name (Optional)</Text>
            <TextInput
              style={styles.input}
              value={data.nomineeName}
              onChangeText={(text) => onChange({ nomineeName: text })}
              placeholder="Enter nominee name"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              accessibilityLabel="Nominee Name"
            />
          </View>
        </View>
      )}

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        initialDateISO={data.validTillDate}
        onSelectDate={(iso) => onChange({ validTillDate: iso })}
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
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
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
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  formContainer: {
    gap: spacing.sm,
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
  pickerTrigger: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  pickerTriggerText: {
    fontSize: typography.bodyLarge.fontSize,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  pickerTriggerPlaceholder: {
    fontSize: typography.bodyLarge.fontSize,
    color: colors.textMuted,
  },
  pickerIcon: {
    fontSize: 18,
    color: colors.textSecondary,
  },
});

export default InsuranceStep;
