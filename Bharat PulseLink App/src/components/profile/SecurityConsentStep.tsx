import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SecurityConsentData } from '../../types/profile';
import { colors, spacing, radii, typography } from '../../theme/tokens';

export interface SecurityConsentStepProps {
  data: SecurityConsentData;
  onChange: (updated: Partial<SecurityConsentData>) => void;
  errors?: Record<string, string>;
}

export const SecurityConsentStep: React.FC<SecurityConsentStepProps> = ({ data, onChange, errors = {} }) => {
  const securityGuarantees = [
    '256-bit client-side encryption for all medical records and document attachments.',
    'Granular consent control: data is shared with healthcare institutions only with your active authorization.',
    'Strict no-sale policy: your personal health data is never monetized, indexed, or shared with advertisers.',
  ];

  return (
    <View style={styles.container}>
      {/* Guarantees Box */}
      <View style={styles.guaranteeBox}>
        {securityGuarantees.map((item, index) => (
          <View key={index} style={styles.guaranteeRow}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M20 6L9 17l-5-5" stroke={colors.success} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={styles.guaranteeText}>{item}</Text>
          </View>
        ))}
      </View>

      {/* 1. Mandatory Storage Consent */}
      <View style={[styles.consentCard, errors.storeHealthDataConsent && styles.consentCardError]}>
        <View style={styles.consentTextCol}>
          <Text style={styles.consentTitle}>
            Health Profile Storage Authorization <Text style={styles.requiredStar}>*</Text>
          </Text>
          <Text style={styles.consentDesc}>
            I authorize Bharat PulseLink to securely store my health profile in an encrypted health vault.
          </Text>
        </View>
        <Switch
          value={data.storeHealthDataConsent}
          onValueChange={(val) =>
            onChange({
              storeHealthDataConsent: val,
              consentTimestampISO: val ? new Date().toISOString() : undefined,
            })
          }
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#FFFFFF"
          accessibilityLabel="Health Profile Storage Authorization"
        />
      </View>
      {errors.storeHealthDataConsent && (
        <Text style={styles.errorText}>Health storage authorization is required to continue.</Text>
      )}

      {/* 2. Mandatory Healthcare Continuity Terms */}
      <View style={styles.consentCard}>
        <View style={styles.consentTextCol}>
          <Text style={styles.consentTitle}>Care Continuity Privacy Protocol</Text>
          <Text style={styles.consentDesc}>
            I understand that authorized medical providers will only access records when I present my patient QR token.
          </Text>
        </View>
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={colors.primary} strokeWidth={2} strokeLinejoin="round" />
          <Path d="M9 12l2 2 4-4" stroke={colors.success} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  guaranteeBox: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: 'rgba(15, 118, 110, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.15)',
  },
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  guaranteeText: {
    flex: 1,
    fontSize: typography.bodySmall.fontSize,
    color: colors.textPrimary,
    lineHeight: 18,
    fontWeight: '500',
  },
  consentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  consentCardError: {
    borderColor: colors.danger,
    borderWidth: 1.5,
  },
  consentTextCol: {
    flex: 1,
    paddingRight: spacing.md,
  },
  consentTitle: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  requiredStar: {
    color: colors.danger,
  },
  consentDesc: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  errorText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.danger,
    marginTop: -4,
  },
});

export default SecurityConsentStep;
