import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, TextInput, FlatList } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, spacing, radii, typography } from '../../theme/tokens';

export interface SearchableOption {
  id: string;
  label: string;
  subtitle?: string;
}

export interface SearchableSelectModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  placeholder?: string;
  options: SearchableOption[];
  selectedId?: string;
  onSelect: (option: SearchableOption) => void;
  emptyText?: string;
  allowCustomEntry?: boolean;
}

export const SearchableSelectModal: React.FC<SearchableSelectModalProps> = ({
  visible,
  onClose,
  title,
  placeholder = 'Search...',
  options,
  selectedId,
  onSelect,
  emptyText = 'No matching results found',
  allowCustomEntry = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const trimmed = searchQuery.trim().toLowerCase();
  const filteredOptions = trimmed
    ? options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(trimmed) ||
          (opt.subtitle && opt.subtitle.toLowerCase().includes(trimmed))
      )
    : options;

  const hasExactMatch = options.some((opt) => opt.label.toLowerCase() === trimmed);
  const showCustomOption = allowCustomEntry && trimmed.length > 1 && !hasExactMatch;

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M18 6L6 18M6 6l12 12" stroke={colors.textSecondary} strokeWidth={2.2} strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Search Input Box */}
          <View style={styles.searchBox}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={styles.searchIcon}>
              <Circle cx={11} cy={11} r={8} stroke={colors.textMuted} strokeWidth={2} />
              <Path d="M21 21l-4.35-4.35" stroke={colors.textMuted} strokeWidth={2} strokeLinecap="round" />
            </Svg>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={placeholder}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path d="M18 6L6 18M6 6l12 12" stroke={colors.textMuted} strokeWidth={2} strokeLinecap="round" />
                </Svg>
              </TouchableOpacity>
            )}
          </View>

          {/* Custom entry chip if searching for unlisted town/city */}
          {showCustomOption && (
            <TouchableOpacity
              style={styles.customOptionCard}
              onPress={() => {
                onSelect({ id: `custom_${Date.now()}`, label: searchQuery.trim(), subtitle: 'Custom Entry' });
                handleClose();
              }}
            >
              <Text style={styles.customOptionText}>
                Use <Text style={styles.customOptionHighlight}>"{searchQuery.trim()}"</Text>
              </Text>
              <Text style={styles.customOptionSub}>Tap to select</Text>
            </TouchableOpacity>
          )}

          {/* Results List */}
          <FlatList
            data={filteredOptions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{emptyText}</Text>
                {showCustomOption && (
                  <Text style={styles.emptySubText}>
                    You can select the custom entry above to use "{searchQuery.trim()}".
                  </Text>
                )}
              </View>
            )}
            renderItem={({ item }) => {
              const isSelected = selectedId === item.id || selectedId === item.label;
              return (
                <TouchableOpacity
                  style={[styles.optionCard, isSelected && styles.optionCardActive]}
                  onPress={() => {
                    onSelect(item);
                    handleClose();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                >
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionLabel, isSelected && styles.optionLabelActive]}>
                      {item.label}
                    </Text>
                    {item.subtitle && <Text style={styles.optionSubtitle}>{item.subtitle}</Text>}
                  </View>
                  {isSelected && (
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                      <Path d="M20 6L9 17l-5-5" stroke={colors.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    height: '82%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: typography.titleMedium.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    height: 48,
    marginBottom: spacing.xs,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  customOptionCard: {
    backgroundColor: 'rgba(15, 118, 110, 0.08)',
    borderColor: 'rgba(15, 118, 110, 0.25)',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  customOptionText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  customOptionHighlight: {
    color: colors.primary,
    fontWeight: '700',
  },
  customOptionSub: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.primary,
    fontWeight: '700',
  },
  listContainer: {
    paddingVertical: spacing.xs,
    gap: 4,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionCardActive: {
    backgroundColor: 'rgba(15, 118, 110, 0.08)',
    borderColor: 'rgba(15, 118, 110, 0.2)',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: typography.bodyLarge.fontSize,
    color: colors.textPrimary,
    fontWeight: '500',
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
  emptyContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: typography.bodyMedium.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});

export default SearchableSelectModal;
