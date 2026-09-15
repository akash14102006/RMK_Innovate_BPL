/**
 * Bharat PulseLink — Profile Field Component
 *
 * Clean key-value information row with verified badges.
 *
 * Owned by: Patient Profile & UI Design Domain (Prompt 93/Master UI)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProfileFieldProps {
  label: string;
  value?: string | number | null;
  fallback?: string;
  isVerified?: boolean;
  isLast?: boolean;
  isDark?: boolean;
}

export const ProfileField: React.FC<ProfileFieldProps> = ({
  label,
  value,
  fallback = 'Not provided',
  isVerified = false,
  isLast = false,
  isDark = false,
}) => {
  const displayVal = value !== undefined && value !== null && String(value).trim().length > 0
    ? String(value)
    : fallback;

  const isPlaceholder = displayVal === fallback;
  const labelColor = isDark ? '#94A3B8' : '#64748B';
  const valColor = isPlaceholder
    ? (isDark ? '#64748B' : '#94A3B8')
    : (isDark ? '#F1F5F9' : '#0F172A');
  const borderColor = isDark ? '#334155' : '#F1F5F9';

  return (
    <View
      style={[
        styles.fieldRow,
        { borderBottomColor: borderColor },
        isLast && styles.noBorder,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${displayVal}`}
    >
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: valColor }]} numberOfLines={2}>
          {displayVal}
        </Text>
        {isVerified ? (
          <View style={styles.verifiedDot} accessibilityLabel="Verified field">
            <Text style={styles.verifiedDotText}>✓</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fieldRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noBorder: {
    borderBottomWidth: 0,
    paddingBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1.4,
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  verifiedDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  verifiedDotText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default ProfileField;
