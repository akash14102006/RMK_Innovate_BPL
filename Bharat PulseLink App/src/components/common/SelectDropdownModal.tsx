import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, spacing, radii, typography } from '../../theme/tokens';

export interface OptionItem<T extends string = string> {
  label: string;
  value: T;
  subtitle?: string;
}

export interface SelectDropdownModalProps<T extends string = string> {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: OptionItem<T>[];
  selectedValue?: T;
  onSelect: (value: T) => void;
}

export function SelectDropdownModal<T extends string = string>({
  visible,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
}: SelectDropdownModalProps<T>) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.sheetCard} activeOpacity={1}>
          <View style={styles.dragHandle} />
          <Text style={styles.sheetTitle}>{title}</Text>

          <ScrollView style={styles.optionsList} contentContainerStyle={styles.optionsContainer}>
            {options.map((opt) => {
              const isSelected = selectedValue === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.optionRow, isSelected && styles.optionRowActive]}
                  onPress={() => {
                    onSelect(opt.value);
                    onClose();
                  }}
                >
                  <View style={styles.optionTextCol}>
                    <Text style={[styles.optionLabel, isSelected && styles.optionLabelActive]}>
                      {opt.label}
                    </Text>
                    {opt.subtitle && <Text style={styles.optionSubtitle}>{opt.subtitle}</Text>}
                  </View>
                  {isSelected && <Text style={styles.checkMark}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    maxHeight: '65%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: typography.titleMedium.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  optionsList: {
    marginBottom: spacing.md,
  },
  optionsContainer: {
    gap: spacing.xs,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionRowActive: {
    backgroundColor: 'rgba(15, 118, 110, 0.08)',
    borderColor: colors.primary,
  },
  optionTextCol: {
    flex: 1,
  },
  optionLabel: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  optionLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  optionSubtitle: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
  },
  checkMark: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    marginLeft: spacing.sm,
  },
});

export default SelectDropdownModal;
