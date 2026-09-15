import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { LanguageDescriptor } from '../i18n/languages';
import { colors, spacing, radii } from '../theme/tokens';

interface LanguageOptionCardProps {
  descriptor: LanguageDescriptor;
  isSelected: boolean;
  onSelect: (code: string) => void;
  accessibilityLabel?: string;
}

export const LanguageOptionCard: React.FC<LanguageOptionCardProps> = ({
  descriptor,
  isSelected,
  onSelect,
  accessibilityLabel,
}) => {
  const isRTL = descriptor.direction === 'rtl';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.selectedCard,
      ]}
      onPress={() => onSelect(descriptor.code)}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={
        accessibilityLabel || `${descriptor.nativeName}, ${descriptor.name}`
      }
    >
      {/* Text Container — Supports RTL text alignment without moving the check circle */}
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.nativeName,
            isRTL && styles.rtlText,
            isSelected && styles.selectedNativeName,
          ]}
        >
          {descriptor.nativeName}
        </Text>
        {descriptor.code !== 'en' && descriptor.nativeName !== descriptor.name ? (
          <Text style={[styles.englishName, isRTL && styles.rtlText]}>
            {descriptor.name}
          </Text>
        ) : null}
      </View>

      {/* Selection Control Badge — ALWAYS ON RIGHT SIDE FOR ALL LANGUAGES */}
      <View style={[styles.checkCircle, isSelected && styles.selectedCheckCircle]}>
        {isSelected && <Text style={styles.checkMark}>✓</Text>}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    marginBottom: spacing.xs + 2,
    minHeight: 60, // Comfortable 60dp height giving scripts breathing room
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  selectedCard: {
    borderColor: colors.primary,
    backgroundColor: '#F0FDFA', // Soft pale-teal reference background tint
    shadowColor: colors.primary,
    shadowOpacity: 0.09,
    shadowRadius: 5,
    elevation: 2,
  },
  textContainer: {
    flex: 1,
    marginRight: spacing.md,
    justifyContent: 'center',
  },
  nativeName: {
    fontSize: 17, // Visually dominant 17sp native title
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 22,
  },
  selectedNativeName: {
    color: colors.primary,
  },
  englishName: {
    fontSize: 13, // Refined 13sp English subtitle
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 2,
  },
  rtlText: {
    textAlign: 'right',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginLeft: 'auto', // Guaranteed RIGHT position
  },
  selectedCheckCircle: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginTop: -1,
  },
});

export default LanguageOptionCard;
