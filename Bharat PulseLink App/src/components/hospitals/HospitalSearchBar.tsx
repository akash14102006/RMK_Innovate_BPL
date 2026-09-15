import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, spacing, radii, typography } from '../../theme/tokens';

export interface HospitalSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onPress?: () => void;
}

export const HospitalSearchBar: React.FC<HospitalSearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search hospitals, specialty, area...',
  onFocus,
  onPress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.9 : 1}
      onPress={onPress}
      style={styles.container}
    >
      <View style={styles.searchIcon}>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Circle cx={11} cy={11} r={8} stroke="#64748B" strokeWidth={2} />
          <Path d="M21 21l-4.35-4.35" stroke="#64748B" strokeWidth={2} strokeLinecap="round" />
        </Svg>
      </View>

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        onFocus={onFocus}
        accessibilityLabel="Search hospitals input"
      />

      {value.length > 0 && (
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={() => onChangeText('')}
          accessibilityRole="button"
          accessibilityLabel="Clear search text"
        >
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path d="M18 6L6 18M6 6l12 12" stroke="#64748B" strokeWidth={2.2} strokeLinecap="round" />
          </Svg>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    height: 46,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: typography.bodySmall.fontSize,
    color: colors.textPrimary,
    fontWeight: '600',
    height: '100%',
  },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: radii.full,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HospitalSearchBar;
