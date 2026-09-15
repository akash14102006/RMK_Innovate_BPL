import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { VitalRecordItem } from '../../types/profile';
import { colors, spacing, radii, typography } from '../../theme/tokens';
import DatePickerModal from '../common/DatePickerModal';

export interface VitalRecordsStepProps {
  records: VitalRecordItem[];
  onChange: (updated: VitalRecordItem[]) => void;
}

export const VitalRecordsStep: React.FC<VitalRecordsStepProps> = ({ records, onChange }) => {
  const [selectedType, setSelectedType] = useState<VitalRecordItem['recordType']>('ECG');
  const [date, setDate] = useState<string>('');
  const [facility, setFacility] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const recordTypes: { label: string; value: VitalRecordItem['recordType'] }[] = [
    { label: 'ECG', value: 'ECG' },
    { label: 'X-Ray', value: 'X_RAY' },
    { label: 'Blood Test', value: 'BLOOD_TEST' },
    { label: 'MRI Scan', value: 'MRI' },
    { label: 'Ultrasound', value: 'ULTRASOUND' },
    { label: 'Other Diagnostic Test', value: 'OTHER' },
  ];

  const handleAddRecord = () => {
    const newRecord: VitalRecordItem = {
      id: `rec_${Date.now()}`,
      recordType: selectedType,
      recordDate: date.trim() || new Date().toISOString().slice(0, 10),
      facilityName: facility.trim() || 'Diagnostic Centre',
    };
    onChange([...records, newRecord]);
    setFacility('');
    setDate('');
  };

  const handleRemove = (id: string) => {
    onChange(records.filter((rec) => rec.id !== id));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>
        Log diagnostic tests, imaging scans, and clinical reports (Optional):
      </Text>

      {/* Select Record Type */}
      <View style={styles.chipRow}>
        {recordTypes.map((t) => (
          <TouchableOpacity
            key={t.value}
            style={[styles.chip, selectedType === t.value && styles.chipActive]}
            onPress={() => setSelectedType(t.value)}
            accessibilityRole="button"
            accessibilityLabel={t.label}
          >
            <Text style={[styles.chipText, selectedType === t.value && styles.chipTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Add Record Form Card */}
      <View style={styles.addCard}>
        <Text style={styles.addTitle}>Add Diagnostic Record</Text>

        <View style={styles.row}>
          {/* Test Date (Calendar Picker) */}
          <View style={[styles.fieldGroup, styles.flexOne]}>
            <Text style={styles.label}>Test Date</Text>
            <TouchableOpacity
              style={styles.pickerTrigger}
              onPress={() => setIsDatePickerOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Select Test Date"
            >
              <Text style={date ? styles.pickerTriggerText : styles.pickerTriggerPlaceholder}>
                {date ? date : 'Select Date'}
              </Text>
              <Text style={styles.pickerIcon}>📅</Text>
            </TouchableOpacity>
          </View>

          {/* Facility */}
          <View style={[styles.fieldGroup, styles.flexTwo]}>
            <Text style={styles.label}>Diagnostic Facility</Text>
            <TextInput
              style={styles.input}
              value={facility}
              onChangeText={setFacility}
              placeholder="Lab / Hospital Name"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Diagnostic Facility Name"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAddRecord} accessibilityRole="button">
          <Text style={styles.addButtonText}>+ Add Test Record</Text>
        </TouchableOpacity>
      </View>

      {/* Added Records List */}
      {records.length > 0 && (
        <View style={styles.listContainer}>
          <Text style={styles.subHeader}>Logged Tests ({records.length}):</Text>
          {records.map((rec) => (
            <View key={rec.id} style={styles.recCard}>
              <View style={styles.recContent}>
                <Text style={styles.recType}>{rec.recordType.replace('_', ' ')}</Text>
                <Text style={styles.recMeta}>
                  Date: {rec.recordDate} {rec.facilityName ? `• ${rec.facilityName}` : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemove(rec.id)}
                accessibilityRole="button"
                accessibilityLabel="Remove Record"
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M18 6L6 18M6 6l12 12" stroke={colors.danger} strokeWidth={2.2} strokeLinecap="round" />
                </Svg>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        initialDateISO={date}
        onSelectDate={(iso) => setDate(iso)}
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
  addCard: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: 'rgba(15, 118, 110, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.15)',
  },
  addTitle: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.primary,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flexOne: {
    flex: 1,
  },
  flexTwo: {
    flex: 1.5,
  },
  fieldGroup: {
    gap: spacing.xs,
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
  pickerTrigger: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
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
    fontSize: typography.bodySmall.fontSize,
    color: colors.textMuted,
  },
  pickerIcon: {
    fontSize: 16,
  },
  addButton: {
    height: 44,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  addButtonText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContainer: {
    gap: spacing.xs,
  },
  subHeader: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  recCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recContent: {
    flex: 1,
  },
  recType: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  recMeta: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
  },
  removeBtn: {
    padding: spacing.xs,
  },
});

export default VitalRecordsStep;
