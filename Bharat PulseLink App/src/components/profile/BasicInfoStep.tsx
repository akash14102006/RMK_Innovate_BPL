import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { BasicInfoData } from '../../types/profile';
import { colors, spacing, radii, typography } from '../../theme/tokens';
import DatePickerModal from '../common/DatePickerModal';
import SelectDropdownModal, { OptionItem } from '../common/SelectDropdownModal';
import SearchableSelectModal, { SearchableOption } from '../common/SearchableSelectModal';
import { WORLD_COUNTRIES } from '../../data/countriesData';

export interface BasicInfoStepProps {
  data: BasicInfoData;
  onChange: (updated: Partial<BasicInfoData>) => void;
  errors?: Record<string, string>;
}

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ data, onChange, errors = {} }) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isGenderPickerOpen, setIsGenderPickerOpen] = useState(false);
  const [isMaritalPickerOpen, setIsMaritalPickerOpen] = useState(false);
  const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);

  const genderOptions: OptionItem<BasicInfoData['gender']>[] = [
    { label: 'Male', value: 'MALE' },
    { label: 'Female', value: 'FEMALE' },
    { label: 'Non-binary / Other', value: 'NON_BINARY' },
    { label: 'Prefer not to say', value: 'PREFER_NOT_TO_SAY' },
  ];

  const maritalOptions: OptionItem<BasicInfoData['maritalStatus']>[] = [
    { label: 'Single', value: 'SINGLE' },
    { label: 'Married', value: 'MARRIED' },
    { label: 'Divorced', value: 'DIVORCED' },
    { label: 'Widowed', value: 'WIDOWED' },
    { label: 'Prefer not to say', value: 'PREFER_NOT_TO_SAY' },
  ];

  const countryOptions: SearchableOption[] = WORLD_COUNTRIES.map((c) => ({
    id: c.code,
    label: c.name,
    subtitle: `${c.code} • ${c.dialCode}`,
  }));

  const getGenderDisplayLabel = () => {
    const found = genderOptions.find((o) => o.value === data.gender);
    return found ? found.label : 'Select your gender';
  };

  const getMaritalDisplayLabel = () => {
    const found = maritalOptions.find((o) => o.value === data.maritalStatus);
    return found ? found.label : 'Select marital status';
  };

  return (
    <View style={styles.container}>
      {/* 1. Full Name */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>
          Full Name <Text style={styles.requiredStar}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, errors.fullName ? styles.inputError : null]}
          value={data.fullName}
          onChangeText={(text) => onChange({ fullName: text })}
          placeholder="Enter your full name"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="words"
          accessibilityLabel="Full Name"
        />
        {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
      </View>

      {/* 2. Date of Birth (Real Calendar Modal) */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>
          Date of Birth <Text style={styles.requiredStar}>*</Text>
        </Text>
        <TouchableOpacity
          style={[styles.pickerTrigger, errors.dateOfBirth ? styles.inputError : null]}
          onPress={() => setIsDatePickerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Select Date of Birth"
        >
          <Text style={data.dateOfBirth ? styles.pickerTriggerText : styles.pickerTriggerPlaceholder}>
            {data.dateOfBirth ? data.dateOfBirth : 'Select your date of birth'}
          </Text>
          <Text style={styles.pickerIcon}>📅</Text>
        </TouchableOpacity>
        {errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth}</Text>}
      </View>

      {/* 3. Gender Dropdown */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>
          Gender <Text style={styles.requiredStar}>*</Text>
        </Text>
        <TouchableOpacity
          style={[styles.pickerTrigger, errors.gender ? styles.inputError : null]}
          onPress={() => setIsGenderPickerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Select Gender"
        >
          <Text style={data.gender ? styles.pickerTriggerText : styles.pickerTriggerPlaceholder}>
            {getGenderDisplayLabel()}
          </Text>
          <Text style={styles.pickerIcon}>▾</Text>
        </TouchableOpacity>
        {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
      </View>

      {/* 4. Marital Status Dropdown */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Marital Status</Text>
        <TouchableOpacity
          style={styles.pickerTrigger}
          onPress={() => setIsMaritalPickerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Select Marital Status"
        >
          <Text style={data.maritalStatus ? styles.pickerTriggerText : styles.pickerTriggerPlaceholder}>
            {getMaritalDisplayLabel()}
          </Text>
          <Text style={styles.pickerIcon}>▾</Text>
        </TouchableOpacity>
      </View>

      {/* 5. Nationality Search Modal */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Nationality</Text>
        <TouchableOpacity
          style={styles.pickerTrigger}
          onPress={() => setIsCountryPickerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Select Nationality"
        >
          <Text style={data.nationality ? styles.pickerTriggerText : styles.pickerTriggerPlaceholder}>
            {data.nationality ? data.nationality : 'Select country of nationality'}
          </Text>
          <Text style={styles.pickerIcon}>🌐</Text>
        </TouchableOpacity>
      </View>

      {/* Calendar Modal */}
      <DatePickerModal
        visible={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        initialDateISO={data.dateOfBirth}
        onSelectDate={(formattedISO) => onChange({ dateOfBirth: formattedISO })}
      />

      {/* Gender Dropdown Modal */}
      <SelectDropdownModal
        visible={isGenderPickerOpen}
        onClose={() => setIsGenderPickerOpen(false)}
        title="Select Gender"
        options={genderOptions}
        selectedValue={data.gender}
        onSelect={(val) => onChange({ gender: val })}
      />

      {/* Marital Status Dropdown Modal */}
      <SelectDropdownModal
        visible={isMaritalPickerOpen}
        onClose={() => setIsMaritalPickerOpen(false)}
        title="Select Marital Status"
        options={maritalOptions}
        selectedValue={data.maritalStatus}
        onSelect={(val) => onChange({ maritalStatus: val })}
      />

      {/* Nationality Country Search Modal */}
      <SearchableSelectModal
        visible={isCountryPickerOpen}
        onClose={() => setIsCountryPickerOpen(false)}
        title="Select Country / Nationality"
        placeholder="Search countries..."
        options={countryOptions}
        selectedId={data.nationality}
        onSelect={(opt) => onChange({ nationality: opt.label })}
      />
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

export default BasicInfoStep;
