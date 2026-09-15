import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { MedicalBasicsData } from '../../types/profile';
import { colors, spacing, radii, typography } from '../../theme/tokens';

export interface MedicalBasicsStepProps {
  data: MedicalBasicsData;
  onChange: (updated: Partial<MedicalBasicsData>) => void;
  errors?: Record<string, string>;
}

export const MedicalBasicsStep: React.FC<MedicalBasicsStepProps> = ({ data, onChange, errors = {} }) => {
  return (
    <View style={styles.container}>
      {/* Row 1: Height & Weight */}
      <View style={styles.row}>
        {/* Height */}
        <View style={[styles.fieldGroup, styles.flexOne]}>
          <Text style={styles.label}>Height</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, errors.heightCm ? styles.inputError : null]}
              value={data.heightCm !== undefined ? String(data.heightCm) : ''}
              onChangeText={(text) => {
                const num = parseInt(text.replace(/\D/g, ''), 10);
                onChange({ heightCm: isNaN(num) ? undefined : num });
              }}
              placeholder="170"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              accessibilityLabel="Height in cm"
            />
            <Text style={styles.unitSuffix}>cm</Text>
          </View>
          {errors.heightCm && <Text style={styles.errorText}>Invalid height</Text>}
        </View>

        {/* Weight */}
        <View style={[styles.fieldGroup, styles.flexOne]}>
          <Text style={styles.label}>Weight</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, errors.weightKg ? styles.inputError : null]}
              value={data.weightKg !== undefined ? String(data.weightKg) : ''}
              onChangeText={(text) => {
                const num = parseInt(text.replace(/\D/g, ''), 10);
                onChange({ weightKg: isNaN(num) ? undefined : num });
              }}
              placeholder="70"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              accessibilityLabel="Weight in kg"
            />
            <Text style={styles.unitSuffix}>kg</Text>
          </View>
          {errors.weightKg && <Text style={styles.errorText}>Invalid weight</Text>}
        </View>
      </View>

      {/* Row 2: Blood Pressure (Systolic / Diastolic) */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Blood Pressure</Text>
        <View style={styles.bpRow}>
          <View style={[styles.inputWrapper, styles.flexOne]}>
            <TextInput
              style={[styles.input, errors.bpSystolic ? styles.inputError : null]}
              value={data.bpSystolic !== undefined ? String(data.bpSystolic) : ''}
              onChangeText={(text) => {
                const num = parseInt(text.replace(/\D/g, ''), 10);
                onChange({ bpSystolic: isNaN(num) ? undefined : num });
              }}
              placeholder="120"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              accessibilityLabel="Systolic BP"
            />
            <Text style={styles.unitSuffix}>Sys</Text>
          </View>

          <Text style={styles.bpDivider}>/</Text>

          <View style={[styles.inputWrapper, styles.flexOne]}>
            <TextInput
              style={[styles.input, errors.bpDiastolic ? styles.inputError : null]}
              value={data.bpDiastolic !== undefined ? String(data.bpDiastolic) : ''}
              onChangeText={(text) => {
                const num = parseInt(text.replace(/\D/g, ''), 10);
                onChange({ bpDiastolic: isNaN(num) ? undefined : num });
              }}
              placeholder="80"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              accessibilityLabel="Diastolic BP"
            />
            <Text style={styles.unitSuffix}>Dia</Text>
          </View>
        </View>
      </View>

      {/* Row 3: Blood Sugar */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Fasting / Random Blood Sugar</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, errors.bloodSugarMgDl ? styles.inputError : null]}
            value={data.bloodSugarMgDl !== undefined ? String(data.bloodSugarMgDl) : ''}
            onChangeText={(text) => {
              const num = parseInt(text.replace(/\D/g, ''), 10);
              onChange({ bloodSugarMgDl: isNaN(num) ? undefined : num });
            }}
            placeholder="95"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            accessibilityLabel="Blood Sugar in mg/dL"
          />
          <Text style={styles.unitSuffix}>mg/dL</Text>
        </View>
        {errors.bloodSugarMgDl && <Text style={styles.errorText}>Invalid sugar level</Text>}
      </View>
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
  bpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  flexOne: {
    flex: 1,
  },
  bpDivider: {
    fontSize: 20,
    color: colors.textSecondary,
    fontWeight: '400',
    paddingHorizontal: 2,
  },
  fieldGroup: {
    gap: 4,
  },
  label: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.sm,
  },
  input: {
    flex: 1,
    height: 46,
    fontSize: typography.bodyLarge.fontSize,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  inputError: {
    color: colors.danger,
  },
  unitSuffix: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 4,
  },
  errorText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.danger,
    marginTop: 2,
  },
});

export default MedicalBasicsStep;
