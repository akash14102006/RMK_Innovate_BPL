import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { MedicationItem } from '../../types/profile';
import { colors, spacing, radii, typography } from '../../theme/tokens';

export interface MedicationsStepProps {
  items: MedicationItem[];
  onChange: (updated: MedicationItem[]) => void;
}

export const MedicationsStep: React.FC<MedicationsStepProps> = ({ items, onChange }) => {
  const [hasMeds, setHasMeds] = useState<'yes' | 'no' | 'dont_know'>(items.length > 0 ? 'yes' : 'no');
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [notes, setNotes] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    const newItem: MedicationItem = {
      id: `med_${Date.now()}`,
      name: name.trim(),
      dosage: dosage.trim() || 'As prescribed',
      frequency: frequency.trim() || 'Daily',
      notes: notes.trim() || undefined,
    };
    onChange([...items, newItem]);
    setName('');
    setDosage('');
    setFrequency('');
    setNotes('');
  };

  const handleRemove = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>Are you currently taking any prescription medications?</Text>

      {/* Segmented Status Selector */}
      <View style={styles.segmentedRow}>
        <TouchableOpacity
          style={[styles.segmentBtn, hasMeds === 'no' && styles.segmentBtnActive]}
          onPress={() => {
            setHasMeds('no');
            onChange([]);
          }}
          accessibilityRole="button"
          accessibilityLabel="No medications"
        >
          <Text style={[styles.segmentText, hasMeds === 'no' && styles.segmentTextActive]}>
            No medications
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, hasMeds === 'yes' && styles.segmentBtnActive]}
          onPress={() => setHasMeds('yes')}
          accessibilityRole="button"
          accessibilityLabel="Yes, taking medications"
        >
          <Text style={[styles.segmentText, hasMeds === 'yes' && styles.segmentTextActive]}>
            Yes, I take meds
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, hasMeds === 'dont_know' && styles.segmentBtnActive]}
          onPress={() => {
            setHasMeds('dont_know');
            onChange([]);
          }}
          accessibilityRole="button"
          accessibilityLabel="Don't know"
        >
          <Text style={[styles.segmentText, hasMeds === 'dont_know' && styles.segmentTextActive]}>
            Don't know
          </Text>
        </TouchableOpacity>
      </View>

      {hasMeds === 'yes' && (
        <>
          {/* Active Medication List */}
          {items.length > 0 && (
            <View style={styles.listContainer}>
              <Text style={styles.subHeader}>Logged Medications ({items.length}):</Text>
              {items.map((item) => (
                <View key={item.id} style={styles.medCard}>
                  <View style={styles.cardContent}>
                    <Text style={styles.medName}>{item.name}</Text>
                    <Text style={styles.medDetails}>
                      {item.dosage} • {item.frequency}
                    </Text>
                    {item.notes && <Text style={styles.medNotes}>{item.notes}</Text>}
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemove(item.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${item.name}`}
                  >
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                      <Path d="M18 6L6 18M6 6l12 12" stroke={colors.danger} strokeWidth={2.2} strokeLinecap="round" />
                    </Svg>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Add New Medication Card */}
          <View style={styles.addCard}>
            <Text style={styles.addTitle}>Add Medication</Text>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Medication Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter medication name"
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Medication Name"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.fieldGroup, styles.flexOne]}>
                <Text style={styles.label}>Dosage</Text>
                <TextInput
                  style={styles.input}
                  value={dosage}
                  onChangeText={setDosage}
                  placeholder="e.g. 500mg, 1 tablet"
                  placeholderTextColor={colors.textMuted}
                  accessibilityLabel="Dosage"
                />
              </View>
              <View style={[styles.fieldGroup, styles.flexOne]}>
                <Text style={styles.label}>Frequency</Text>
                <TextInput
                  style={styles.input}
                  value={frequency}
                  onChangeText={setFrequency}
                  placeholder="e.g. Once daily, After meals"
                  placeholderTextColor={colors.textMuted}
                  accessibilityLabel="Frequency"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={styles.input}
                value={notes}
                onChangeText={setNotes}
                placeholder="Doctor instructions or start date"
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Medication notes"
              />
            </View>

            <TouchableOpacity
              style={[styles.addButton, !name.trim() && styles.addButtonDisabled]}
              onPress={handleAdd}
              disabled={!name.trim()}
              accessibilityRole="button"
              accessibilityLabel="Add to medication list"
            >
              <Text style={styles.addButtonText}>+ Add Medication</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
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
  listContainer: {
    gap: spacing.xs,
  },
  subHeader: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  medCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardContent: {
    flex: 1,
  },
  medName: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  medDetails: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
  },
  medNotes: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textMuted,
    marginTop: 2,
    fontStyle: 'italic',
  },
  removeButton: {
    padding: spacing.xs,
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
  fieldGroup: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flexOne: {
    flex: 1,
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
  addButton: {
    height: 44,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  addButtonDisabled: {
    backgroundColor: colors.border,
  },
  addButtonText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default MedicationsStep;
