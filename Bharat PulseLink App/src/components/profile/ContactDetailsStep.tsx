import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { ContactDetailsData } from '../../types/profile';
import { colors, spacing, radii, typography } from '../../theme/tokens';
import SearchableSelectModal, { SearchableOption } from '../common/SearchableSelectModal';
import { WORLD_COUNTRIES } from '../../data/countriesData';
import { getIndiaStates, getDistrictsByState, getCitiesByDistrict } from '../../data/indiaLocationsData';

export interface ContactDetailsStepProps {
  data: ContactDetailsData;
  onChange: (updated: Partial<ContactDetailsData>) => void;
  errors?: Record<string, string>;
}

export const ContactDetailsStep: React.FC<ContactDetailsStepProps> = ({ data, onChange, errors = {} }) => {
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [isStateModalOpen, setIsStateModalOpen] = useState(false);
  const [isDistrictModalOpen, setIsDistrictModalOpen] = useState(false);
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);

  // Country Options
  const countryOptions: SearchableOption[] = WORLD_COUNTRIES.map((c) => ({
    id: c.code,
    label: c.name,
    subtitle: `${c.code} • ${c.dialCode}`,
  }));

  // India State Options
  const indiaStates = getIndiaStates();
  const stateOptions: SearchableOption[] = indiaStates.map((s) => ({
    id: s.id,
    label: s.name,
    subtitle: `${s.districts.length} Districts`,
  }));

  // India District Options (Filtered by selected State)
  const currentState = data.state || 'Tamil Nadu';
  const availableDistricts = getDistrictsByState(currentState);
  const districtOptions: SearchableOption[] = availableDistricts.map((d) => ({
    id: d.id,
    label: d.name,
    subtitle: `${d.cities.length} Cities / Towns`,
  }));

  // India City Options (Filtered by selected District)
  const currentDistrict = data.district || (availableDistricts[0] ? availableDistricts[0].name : 'Chennai');
  const availableCities = getCitiesByDistrict(currentState, currentDistrict);
  const cityOptions: SearchableOption[] = availableCities.map((c) => ({
    id: c,
    label: c,
  }));

  const handleSelectState = (opt: SearchableOption) => {
    const districtsForNewState = getDistrictsByState(opt.label);
    const firstDistrict = districtsForNewState[0]?.name || '';
    const citiesForFirstDistrict = getCitiesByDistrict(opt.label, firstDistrict);
    const firstCity = citiesForFirstDistrict[0] || '';

    onChange({
      state: opt.label,
      district: firstDistrict,
      city: firstCity,
    });
  };

  const handleSelectDistrict = (opt: SearchableOption) => {
    const citiesForDistrict = getCitiesByDistrict(currentState, opt.label);
    const firstCity = citiesForDistrict[0] || '';

    onChange({
      district: opt.label,
      city: firstCity,
    });
  };

  return (
    <View style={styles.container}>
      {/* 1. Primary Mobile (Read-Only) */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Primary Mobile (Verified)</Text>
        <TextInput
          style={[styles.input, styles.inputDisabled]}
          value={data.primaryPhone}
          editable={false}
          accessibilityLabel="Primary Mobile"
        />
        <Text style={styles.helperText}>Account mobile number is bound to identity and verified via OTP.</Text>
      </View>

      {/* 2. Alternate Phone (Optional) */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Alternate Phone (Optional)</Text>
        <TextInput
          style={styles.input}
          value={data.alternatePhone}
          onChangeText={(text) => onChange({ alternatePhone: text })}
          placeholder="Enter alternate contact number"
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
          accessibilityLabel="Alternate Phone"
        />
      </View>

      {/* 3. Email (Optional) */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Email Address (Optional)</Text>
        <TextInput
          style={[styles.input, errors.email ? styles.inputError : null]}
          value={data.email}
          onChangeText={(text) => onChange({ email: text })}
          placeholder="Enter email address"
          placeholderTextColor={colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          accessibilityLabel="Email Address"
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      {/* 4. Country Selection */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>
          Country <Text style={styles.requiredStar}>*</Text>
        </Text>
        <TouchableOpacity
          style={styles.pickerTrigger}
          onPress={() => setIsCountryModalOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Select Country"
        >
          <Text style={data.country ? styles.pickerTriggerText : styles.pickerTriggerPlaceholder}>
            {data.country ? data.country : 'Select country'}
          </Text>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={10} stroke={colors.primary} strokeWidth={2} />
            <Path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke={colors.primary} strokeWidth={2} />
          </Svg>
        </TouchableOpacity>
      </View>

      {/* 5. Address Line 1 */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>
          Address Line 1 <Text style={styles.requiredStar}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, errors.addressLine1 ? styles.inputError : null]}
          value={data.addressLine1}
          onChangeText={(text) => onChange({ addressLine1: text })}
          placeholder="Enter house / building / street"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Address Line 1"
        />
        {errors.addressLine1 && <Text style={styles.errorText}>{errors.addressLine1}</Text>}
      </View>

      {/* 6. Address Line 2 */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Address Line 2 (Optional)</Text>
        <TextInput
          style={styles.input}
          value={data.addressLine2}
          onChangeText={(text) => onChange({ addressLine2: text })}
          placeholder="Enter area / locality / landmark"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Address Line 2"
        />
      </View>

      {/* 7. Cascading Location: State / District / City */}
      <View style={styles.row}>
        {/* State */}
        <View style={[styles.fieldGroup, styles.flexOne]}>
          <Text style={styles.label}>
            State <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TouchableOpacity
            style={[styles.pickerTrigger, errors.state ? styles.inputError : null]}
            onPress={() => setIsStateModalOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Select State"
          >
            <Text
              style={data.state ? styles.pickerTriggerText : styles.pickerTriggerPlaceholder}
              numberOfLines={1}
            >
              {data.state ? data.state : 'Select State'}
            </Text>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path d="M6 9l6 6 6-6" stroke={colors.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
        </View>

        {/* District */}
        <View style={[styles.fieldGroup, styles.flexOne]}>
          <Text style={styles.label}>District</Text>
          <TouchableOpacity
            style={styles.pickerTrigger}
            onPress={() => setIsDistrictModalOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Select District"
          >
            <Text
              style={data.district ? styles.pickerTriggerText : styles.pickerTriggerPlaceholder}
              numberOfLines={1}
            >
              {data.district ? data.district : 'Select District'}
            </Text>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path d="M6 9l6 6 6-6" stroke={colors.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>

      {/* City / Town Selection */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>
          City / Town <Text style={styles.requiredStar}>*</Text>
        </Text>
        <TouchableOpacity
          style={[styles.pickerTrigger, errors.city ? styles.inputError : null]}
          onPress={() => setIsCityModalOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Select City"
        >
          <Text style={data.city ? styles.pickerTriggerText : styles.pickerTriggerPlaceholder}>
            {data.city ? data.city : 'Select City / Town'}
          </Text>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d="M6 9l6 6 6-6" stroke={colors.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
      </View>

      {/* 8. Pincode */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>
          Pincode <Text style={styles.requiredStar}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, errors.pincode ? styles.inputError : null]}
          value={data.pincode}
          onChangeText={(text) => onChange({ pincode: text.replace(/\D/g, '') })}
          placeholder="Enter 6-digit pincode"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          maxLength={6}
          accessibilityLabel="Pincode"
        />
        {errors.pincode && <Text style={styles.errorText}>{errors.pincode}</Text>}
      </View>

      {/* Country Modal */}
      <SearchableSelectModal
        visible={isCountryModalOpen}
        onClose={() => setIsCountryModalOpen(false)}
        title="Select Country"
        options={countryOptions}
        selectedId={data.country}
        onSelect={(opt) => onChange({ country: opt.label })}
      />

      {/* State Modal */}
      <SearchableSelectModal
        visible={isStateModalOpen}
        onClose={() => setIsStateModalOpen(false)}
        title="Select Indian State / UT"
        options={stateOptions}
        selectedId={data.state}
        onSelect={handleSelectState}
      />

      {/* District Modal */}
      <SearchableSelectModal
        visible={isDistrictModalOpen}
        onClose={() => setIsDistrictModalOpen(false)}
        title={`Select District (${currentState})`}
        options={districtOptions}
        selectedId={data.district}
        onSelect={handleSelectDistrict}
      />

      {/* City Modal */}
      <SearchableSelectModal
        visible={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
        title={`Select City / Town (${data.district || currentState})`}
        options={cityOptions}
        selectedId={data.city}
        onSelect={(opt) => onChange({ city: opt.label })}
        allowCustomEntry={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flexOne: {
    flex: 1,
  },
  fieldGroup: {
    gap: 4,
  },
  label: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  requiredStar: {
    color: colors.danger,
    fontWeight: '700',
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
  inputDisabled: {
    backgroundColor: '#F1F5F9',
    color: colors.textSecondary,
  },
  inputError: {
    borderColor: colors.danger,
    borderWidth: 1.5,
  },
  helperText: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
  },
  errorText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.danger,
    marginTop: 2,
  },
  pickerTrigger: {
    height: 48,
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
    fontSize: typography.bodyMedium.fontSize,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  pickerTriggerPlaceholder: {
    fontSize: typography.bodyMedium.fontSize,
    color: colors.textMuted,
  },
});

export default ContactDetailsStep;
