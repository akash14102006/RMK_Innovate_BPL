import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SurgeryItem } from '../../types/profile';
import { colors, spacing, radii, typography } from '../../theme/tokens';

export interface SurgicalHistoryStepProps {
  items: SurgeryItem[];
  onChange: (updated: SurgeryItem[]) => void;
}

export const SurgicalHistoryStep: React.FC<SurgicalHistoryStepProps> = ({ items, onChange }) => {
  const [hasSurgery, setHasSurgery] = useState<'yes' | 'no' | 'dont_know'>(items.length > 0 ? 'yes' : 'no');
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [hospital, setHospital] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    const newItem: SurgeryItem = {
      id: `surg_${Date.now()}`,
      procedureName: name.trim(),
      yearOrDate: year.trim() || new Date().getFullYear().toString(),
      hospitalName: hospital.trim() || undefined,
    };
    onChange([...items, newItem]);
    setName('');
    setYear('');
    setHospital('');
  };

  const handleRemove = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>Have you undergone any past major surgeries or medical procedures?</Text>

      {/* Segmented Status Selector */}
      <View style={styles.segmentedRow}>
        <TouchableOpacity
          style={[styles.segmentBtn, hasSurgery === 'no' && styles.segmentBtnActive]}
          onPress={() => {
            setHasSurgery('no');
            onChange([]);
          }}
          accessibilityRole="button"
          accessibilityLabel="No past surgeries"
        >
          <Text style={[styles.segmentText, hasSurgery === 'no' && styles.segmentTextActive]}>
            No surgeries
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, hasSurgery === 'yes' && styles.segmentBtnActive]}
          onPress={() => setHasSurgery('yes')}
          accessibilityRole="button"
          accessibilityLabel="Yes, undergone surgery"
        >
          <Text style={[styles.segmentText, hasSurgery === 'yes' && styles.segmentTextActive]}>
            Yes, past surgery
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, hasSurgery === 'dont_know' && styles.segmentBtnActive]}
          onPress={() => {
            setHasSurgery('dont_know');
            onChange([]);
          }}
          accessibilityRole="button"
          accessibilityLabel="Don't know"
        >
          <Text style={[styles.segmentText, hasSurgery === 'dont_know' && styles.segmentTextActive]}>
            Don't know
          </Text>
        </TouchableOpacity>
      </View>

      {hasSurgery === 'yes' && (
        <>
          {/* Active Surgery List */}
          {items.length > 0 && (
            <View style={styles.listContainer}>
              <Text style={styles.subHeader}>Logged Procedures ({items.length}):</Text>
              {items.map((item) => (
                <View key={item.id} style={styles.surgCard}>
                  <View style={styles.cardContent}>
                    <Text style={styles.surgName}>{item.procedureName}</Text>
                    <Text style={styles.surgDetails}>
                      Year: {item.yearOrDate} {item.hospitalName ? `• ${item.hospitalName}` : ''}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemove(item.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${item.procedureName}`}
                  >
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                      <Path d="M18 6L6 18M6 6l12 12" stroke={colors.danger} strokeWidth={2.2} strokeLinecap="round" />
                    </Svg>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Add New Surgery Card */}
          <View style={styles.addCard}>
            <Text style={styles.addTitle}>Add Procedure</Text>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Procedure Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter procedure or surgery name"
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Procedure Name"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.fieldGroup, styles.flexOne]}>
                <Text style={styles.label}>Year</Text>
                <TextInput
                  style={styles.input}
                  value={year}
                  onChangeText={(text) => setYear(text.replace(/\D/g, ''))}
                  placeholder="YYYY"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={4}
                  accessibilityLabel="Year"
                />
              </View>
              <View style={[styles.fieldGroup, styles.flexTwo]}>
                <Text style={styles.label}>Hospital (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={hospital}
                  onChangeText={setHospital}
                  placeholder="Hospital name"
                  placeholderTextColor={colors.textMuted}
                  accessibilityLabel="Hospital Name"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.addButton, !name.trim() && styles.addButtonDisabled]}
              onPress={handleAdd}
              disabled={!name.trim()}
              accessibilityRole="button"
              accessibilityLabel="Add to surgery list"
            >
              <Text style={styles.addButtonText}>+ Add Procedure</Text>
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
  surgCard: {
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
  surgName: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  surgDetails: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
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
  flexTwo: {
    flex: 2,
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

export default SurgicalHistoryStep;
