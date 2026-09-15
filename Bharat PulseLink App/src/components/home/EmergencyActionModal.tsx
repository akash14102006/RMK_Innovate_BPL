import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Linking } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing, radii, typography } from '../../theme/tokens';

export interface EmergencyActionModalProps {
  visible: boolean;
  onClose: () => void;
  emergencyContactPhone?: string;
  emergencyContactName?: string;
  onOpenQR: () => void;
}

export const EmergencyActionModal: React.FC<EmergencyActionModalProps> = ({
  visible,
  onClose,
  emergencyContactPhone,
  emergencyContactName,
  onOpenQR,
}) => {
  const handleDial = (number: string) => {
    Linking.openURL(`tel:${number}`).catch((err) => {
      console.warn('[EMERGENCY] Could not open dialer', err);
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.emergencyIconCircle}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#DC2626" />
                </Svg>
              </View>
              <Text style={styles.title}>Emergency Medical Assistance</Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close Emergency dialog">
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.disclaimer}>
            If you or someone around you is facing a life-threatening medical emergency, call ambulance immediately.
          </Text>

          {/* Action 1: Call 108 Ambulance */}
          <TouchableOpacity
            style={styles.actionBtnRed}
            onPress={() => handleDial('108')}
            accessibilityRole="button"
            accessibilityLabel="Call 108 Medical Ambulance"
          >
            <View style={styles.btnRow}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="#FFFFFF" strokeWidth={2.2} />
              </Svg>
              <View style={styles.btnTextCol}>
                <Text style={styles.btnTitleWhite}>Call 108 — Medical Ambulance</Text>
                <Text style={styles.btnSubtitleWhite}>National toll-free 24/7 medical emergency dispatch</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Action 2: Call Primary Emergency Contact (if exists) */}
          {emergencyContactPhone ? (
            <TouchableOpacity
              style={styles.actionBtnSecondary}
              onPress={() => handleDial(emergencyContactPhone)}
              accessibilityRole="button"
              accessibilityLabel={`Call Emergency Contact: ${emergencyContactName || 'Family'}`}
            >
              <View style={styles.btnRow}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                  <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke={colors.primary} strokeWidth={2} />
                </Svg>
                <View style={styles.btnTextCol}>
                  <Text style={styles.btnTitleDark}>Call Contact: {emergencyContactName || 'Emergency Contact'}</Text>
                  <Text style={styles.btnSubtitleDark}>{emergencyContactPhone}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : null}

          {/* Action 3: Show Emergency QR */}
          <TouchableOpacity
            style={styles.actionBtnSecondary}
            onPress={() => {
              onClose();
              onOpenQR();
            }}
            accessibilityRole="button"
            accessibilityLabel="Show Emergency Care QR"
          >
            <View style={styles.btnRow}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h3v3h-3zM18 18h3v3h-3zM15 18h3M18 15h3" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" />
              </Svg>
              <View style={styles.btnTextCol}>
                <Text style={styles.btnTitleDark}>Open Emergency Patient QR</Text>
                <Text style={styles.btnSubtitleDark}>For emergency responder triage and blood group lookup</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  emergencyIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.titleMedium.fontSize,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  closeBtnText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  disclaimer: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  actionBtnRed: {
    backgroundColor: '#DC2626',
    borderRadius: radii.lg,
    padding: spacing.md,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  actionBtnSecondary: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  btnTextCol: {
    flex: 1,
  },
  btnTitleWhite: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnSubtitleWhite: {
    fontSize: typography.caption.fontSize,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  btnTitleDark: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  btnSubtitleDark: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default EmergencyActionModal;
