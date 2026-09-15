/**
 * Bharat PulseLink — Secure QR Code Card Component (Prompt 107)
 *
 * Implements:
 * 1. High-contrast SVG QR rendering using `react-native-qrcode-svg`
 * 2. Visual countdown indicator (90s lifetime)
 * 3. Security status badge & patient-safe confidentiality notice
 * 4. One-tap instant refresh / rotation trigger
 *
 * Owned by: QR & Mobile UX Domain (Prompt 107)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, spacing, radii, typography } from '../../theme/tokens';

export interface SecureQRCodeCardProps {
  qrPayload: string;
  secondsRemaining: number;
  totalSeconds?: number;
  status: 'ACTIVE' | 'EXPIRED' | 'CONSUMED' | 'REVOKED' | 'LOADING';
  onRefresh: () => void;
  onRevoke?: () => void;
  purposeLabel?: string;
  recipientLabel?: string;
}

export const SecureQRCodeCard: React.FC<SecureQRCodeCardProps> = ({
  qrPayload,
  secondsRemaining,
  totalSeconds = 90,
  status,
  onRefresh,
  onRevoke,
  purposeLabel = 'Hospital Check-in',
  recipientLabel,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / totalSeconds) * 100));
  const isExpiringSoon = secondsRemaining <= 20;

  return (
    <View style={styles.cardContainer} testID="secure-qr-card">
      {/* Header Pill */}
      <View style={styles.headerRow}>
        <View style={styles.securityBadge}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
              stroke={colors.primary[600]}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={styles.securityBadgeText}>One-Time Secure Session</Text>
        </View>

        {status === 'ACTIVE' && (
          <View
            style={[
              styles.timerPill,
              isExpiringSoon && { backgroundColor: '#FEE2E2', borderColor: '#EF4444' },
            ]}
          >
            <Text
              style={[
                styles.timerText,
                isExpiringSoon && { color: '#B91C1C', fontWeight: '700' },
              ]}
            >
              Expires in {formatTime(secondsRemaining)}
            </Text>
          </View>
        )}
      </View>

      {/* QR Canvas Frame */}
      <View style={styles.qrFrame}>
        {status === 'LOADING' ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[600]} />
            <Text style={styles.loadingText}>Generating secure session...</Text>
          </View>
        ) : status === 'EXPIRED' ? (
          <View style={styles.overlayContainer}>
            <Text style={styles.overlayTitle}>QR Code Expired</Text>
            <Text style={styles.overlaySub}>For your security, QR codes expire after 90 seconds.</Text>
            <TouchableOpacity style={styles.actionBtn} onPress={onRefresh}>
              <Text style={styles.actionBtnText}>Generate New QR</Text>
            </TouchableOpacity>
          </View>
        ) : status === 'CONSUMED' ? (
          <View style={styles.overlayContainer}>
            <Text style={[styles.overlayTitle, { color: '#059669' }]}>QR Scanned & Verified</Text>
            <Text style={styles.overlaySub}>Hospital verification successfully completed.</Text>
          </View>
        ) : status === 'REVOKED' ? (
          <View style={styles.overlayContainer}>
            <Text style={[styles.overlayTitle, { color: '#DC2626' }]}>Session Cancelled</Text>
            <Text style={styles.overlaySub}>This QR session was cancelled.</Text>
            <TouchableOpacity style={styles.actionBtn} onPress={onRefresh}>
              <Text style={styles.actionBtnText}>Generate New QR</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.qrInner}>
            <QRCode
              value={qrPayload || 'bplqr://v1/empty'}
              size={210}
              color="#0F172A"
              backgroundColor="#FFFFFF"
              quietZone={10}
              enableLinearGradient={false}
            />
          </View>
        )}
      </View>

      {/* Context Details */}
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Purpose:</Text>
        <Text style={styles.metaValue}>{purposeLabel}</Text>
      </View>
      {recipientLabel ? (
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Facility:</Text>
          <Text style={styles.metaValue}>{recipientLabel}</Text>
        </View>
      ) : null}

      {/* Patient Privacy Notice */}
      <View style={styles.noticeBox}>
        <Text style={styles.noticeText}>
          🔒 This QR contains zero medical records or personal ID numbers. Your medical records are released only after explicit consent verification.
        </Text>
      </View>

      {/* Control Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} accessibilityLabel="Refresh QR code">
          <Text style={styles.refreshBtnText}>🔄 Refresh QR</Text>
        </TouchableOpacity>
        {onRevoke && status === 'ACTIVE' && (
          <TouchableOpacity style={styles.cancelBtn} onPress={onRevoke} accessibilityLabel="Cancel QR session">
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl || 20,
    padding: spacing.lg || 20,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: spacing.md || 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.md || 16,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full || 999,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  securityBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[700] || '#0F766E',
    marginLeft: 6,
  },
  timerPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full || 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  qrFrame: {
    width: 240,
    height: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg || 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    marginVertical: spacing.sm || 8,
  },
  qrInner: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md || 8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  overlayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  overlayTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  overlaySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 16,
  },
  actionBtn: {
    backgroundColor: colors.primary[600] || '#0D9488',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.md || 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
    justifyContent: 'center',
  },
  metaLabel: {
    fontSize: 13,
    color: '#64748B',
    marginRight: 6,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  noticeBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: radii.md || 10,
    padding: 10,
    marginTop: 14,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noticeText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 12,
  },
  refreshBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radii.lg || 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  refreshBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  cancelBtn: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radii.lg || 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
});

export default SecureQRCodeCard;
