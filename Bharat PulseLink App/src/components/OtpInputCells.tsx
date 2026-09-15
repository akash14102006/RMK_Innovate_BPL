import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { colors, radii, spacing, typography } from '../theme/tokens';

export interface OtpInputCellsProps {
  value: string;
  onChangeText: (text: string) => void;
  length?: number;
  disabled?: boolean;
  hasError?: boolean;
  accessibilityLabel?: string;
}

export const OtpInputCells: React.FC<OtpInputCellsProps> = ({
  value,
  onChangeText,
  length = 6,
  disabled = false,
  hasError = false,
  accessibilityLabel,
}) => {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleCellPress = () => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  };

  const handleChangeText = (text: string) => {
    // Only permit numerical digits up to specified length
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, length);
    onChangeText(cleaned);
  };

  // Build digit cell array
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  return (
    <Pressable
      onPress={handleCellPress}
      style={styles.container}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel || `OTP Input, ${value.length} of ${length} digits entered`}
    >
      {/* Hidden single logical input field */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChangeText}
        maxLength={length}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        editable={!disabled}
        style={styles.hiddenInput}
        aria-hidden={true}
      />

      {/* Visual OTP cell grid */}
      <View style={styles.cellsRow}>
        {digits.map((digit, index) => {
          const isCurrentFocus = isFocused && index === Math.min(value.length, length - 1);
          const isFilled = digit.length > 0;

          return (
            <View
              key={index}
              style={[
                styles.cell,
                isFilled && styles.cellFilled,
                isCurrentFocus && styles.cellFocused,
                hasError && styles.cellError,
                disabled && styles.cellDisabled,
              ]}
            >
              <Text
                style={[
                  styles.cellText,
                  isFilled && styles.cellTextFilled,
                  hasError && styles.cellTextError,
                ]}
              >
                {digit}
              </Text>
            </View>
          );
        })}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  cellsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 340,
  },
  cell: {
    width: 46,
    height: 56,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: '#CBD5E1', // Slate border
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cellFilled: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(15, 118, 110, 0.04)',
  },
  cellFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  cellError: {
    borderColor: colors.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.04)',
  },
  cellDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  cellText: {
    fontSize: typography.titleLarge.fontSize,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  cellTextFilled: {
    color: colors.textPrimary,
  },
  cellTextError: {
    color: colors.danger,
  },
});

export default OtpInputCells;
