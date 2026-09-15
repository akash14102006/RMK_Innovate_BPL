import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors, spacing, radii, typography } from '../../theme/tokens';

export interface ProfileCompleteStepProps {
  onGoHome?: () => void;
}

export const ProfileCompleteStep: React.FC<ProfileCompleteStepProps> = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your profile is ready</Text>
      <Text style={styles.subtitle}>
        Your Bharat PulseLink profile has been securely prepared for your care journey.
      </Text>

      {/* Feature summary cards with SVG vectors */}
      <View style={styles.featureBox}>
        <View style={styles.featureRow}>
          <View style={styles.iconCircle}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Rect x={3} y={3} width={7} height={7} rx={1} stroke={colors.primary} strokeWidth={2} />
              <Rect x={14} y={3} width={7} height={7} rx={1} stroke={colors.primary} strokeWidth={2} />
              <Rect x={3} y={14} width={7} height={7} rx={1} stroke={colors.primary} strokeWidth={2} />
              <Path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 18h3M18 14h3" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" />
            </Svg>
          </View>
          <View style={styles.featureTextCol}>
            <Text style={styles.featureTitle}>Instant QR Care Access</Text>
            <Text style={styles.featureDesc}>Present your patient QR code at hospital desks for zero-wait registration.</Text>
          </View>
        </View>

        <View style={styles.featureRow}>
          <View style={styles.iconCircle}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={colors.primary} strokeWidth={2} strokeLinejoin="round" />
              <Path d="M9 12l2 2 4-4" stroke={colors.success} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
          <View style={styles.featureTextCol}>
            <Text style={styles.featureTitle}>Consent-Controlled Privacy</Text>
            <Text style={styles.featureDesc}>You decide when to grant temporary access to doctors and revoke anytime.</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  title: {
    fontSize: typography.titleLarge.fontSize,
    fontWeight: typography.titleLarge.fontWeight,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.bodyMedium.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.xs,
  },
  featureBox: {
    width: '100%',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: 'rgba(15, 118, 110, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.12)',
    marginTop: spacing.xs,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: 'rgba(15, 118, 110, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextCol: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  featureDesc: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
});

export default ProfileCompleteStep;
