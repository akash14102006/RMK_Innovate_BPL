/**
 * Bharat PulseLink — Production Scan Failure & Expired QR Screen (Prompt 60)
 *
 * Implements normalized failure handling:
 * 1. Specific, calm diagnostic explanations for all exchange failure modes
 * 2. Clear 3-part answers (What happened, Was data shared, What to do next)
 * 3. Safe retry boundaries with zero blind duplicate requests
 * 4. Respectful non-shaming consent-denied presentation
 * 5. Direct pathways back to Scanner or Home.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors, spacing, radii } from '../theme/tokens';
import { ExchangeFailureCode } from '../types/scan';

interface FailureConfig {
  title: string;
  sub: string;
  dataSharedNotice: string;
  nextStepNotice: string;
  primaryActionLabel: string;
  primaryActionRoute: string;
  isWarningOnly?: boolean;
}

export const ScanFailureScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const {
    failureCode = 'QR_EXPIRED' as ExchangeFailureCode,
    hospitalName = 'Hospital Desk',
    message,
    canRetry = true,
  } = route.params || {};

  const getFailureConfig = (code: ExchangeFailureCode): FailureConfig => {
    switch (code) {
      case 'QR_EXPIRED':
        return {
          title: 'QR Code Expired',
          sub: 'This QR session is no longer valid. QR codes expire after 5 minutes for your security.',
          dataSharedNotice: 'No medical information was shared through this expired code.',
          nextStepNotice: 'Ask the hospital desk to refresh their screen and scan the new QR code.',
          primaryActionLabel: 'Scan Again',
          primaryActionRoute: 'QRScanner',
        };
      case 'QR_INVALID':
        return {
          title: 'Invalid QR Code',
          sub: "This QR code isn't a recognized Bharat PulseLink hospital session.",
          dataSharedNotice: 'No information was transmitted.',
          nextStepNotice: 'Please ensure you are scanning an official Bharat PulseLink hospital QR code.',
          primaryActionLabel: 'Scan Again',
          primaryActionRoute: 'QRScanner',
        };
      case 'QR_USED':
        return {
          title: 'QR Code Already Used',
          sub: 'This session has already been completed or checked in.',
          dataSharedNotice: 'No duplicate data transfer was allowed.',
          nextStepNotice: 'If you need a new check-in, please ask the desk for a fresh QR code.',
          primaryActionLabel: 'Scan Again',
          primaryActionRoute: 'QRScanner',
        };
      case 'HOSPITAL_UNVERIFIED':
        return {
          title: 'Unverified Facility',
          sub: 'For your security, sharing was blocked because this facility could not be verified against the National Health Registry.',
          dataSharedNotice: 'Zero patient data was shared.',
          nextStepNotice: 'Please contact hospital administration or use the verified hospital list.',
          primaryActionLabel: 'View Verified Hospitals',
          primaryActionRoute: 'Hospitals',
        };
      case 'CONSENT_DENIED':
        return {
          title: 'Sharing Cancelled',
          sub: 'You chose not to share information with this facility.',
          dataSharedNotice: 'No health records or personal details were transferred.',
          nextStepNotice: 'You can register manually with paper forms or try scanning again later.',
          primaryActionLabel: 'Back to Home',
          primaryActionRoute: 'Home',
          isWarningOnly: true,
        };
      case 'UNKNOWN_OUTCOME':
        return {
          title: 'Status Pending Confirmation',
          sub: "We couldn't confirm whether the hospital desk received the records yet due to network delay.",
          dataSharedNotice: 'Do not scan again immediately to prevent duplicate check-in.',
          nextStepNotice: 'Check your active session status in the Scan Hub in a few moments.',
          primaryActionLabel: 'Go to Scan Hub',
          primaryActionRoute: 'ScanEntry',
          isWarningOnly: true,
        };
      case 'SESSION_CANCELLED':
        return {
          title: 'Session Cancelled',
          sub: 'The secure session was closed before completion.',
          dataSharedNotice: 'No data was shared.',
          nextStepNotice: 'You can start a new scan session whenever you are ready.',
          primaryActionLabel: 'Back to Scan Hub',
          primaryActionRoute: 'ScanEntry',
          isWarningOnly: true,
        };
      default:
        return {
          title: 'Connection Error',
          sub: "We couldn't complete the secure connection to the hospital desk.",
          dataSharedNotice: 'No health data was shared.',
          nextStepNotice: 'Check your internet connection and try scanning again.',
          primaryActionLabel: 'Try Again',
          primaryActionRoute: 'QRScanner',
        };
    }
  };

  const config = getFailureConfig(failureCode);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.navigate('Home')}
            accessibilityRole="button"
            accessibilityLabel="Return to home"
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M19 12H5M12 19l-7-7 7-7"
                stroke={colors.textPrimary}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Scan Result</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Diagnostic Icon */}
          <View style={styles.iconEmblemBox}>
            <View style={[styles.outerCircle, config.isWarningOnly && styles.outerCircleWarning]}>
              <View style={[styles.innerCircle, config.isWarningOnly && styles.innerCircleWarning]}>
                {config.isWarningOnly ? (
                  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                    <Circle cx={12} cy={12} r={10} stroke="#FFFFFF" strokeWidth={2.5} />
                    <Path d="M12 8v4M12 16h.01" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" />
                  </Svg>
                ) : (
                  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                    <Path d="M18 6L6 18M6 6l12 12" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" />
                  </Svg>
                )}
              </View>
            </View>

            <Text style={styles.headingText}>{config.title}</Text>
            <Text style={styles.subHeadingText}>{message || config.sub}</Text>
          </View>

          {/* 3-Part Answers Card */}
          <View style={styles.answersCard}>
            <View style={styles.answerBlock}>
              <Text style={styles.answerLabel}>WHAT HAPPENED?</Text>
              <Text style={styles.answerValue}>{message || config.sub}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.answerBlock}>
              <Text style={styles.answerLabel}>WAS ANY INFORMATION SHARED?</Text>
              <View style={styles.securityNoticeRow}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#0F766E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
                <Text style={styles.securityNoticeText}>{config.dataSharedNotice}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.answerBlock}>
              <Text style={styles.answerLabel}>WHAT SHOULD I DO NEXT?</Text>
              <Text style={styles.answerValue}>{config.nextStepNotice}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom CTAs */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate(config.primaryActionRoute)}
            accessibilityRole="button"
            accessibilityLabel={config.primaryActionLabel}
          >
            <Text style={styles.primaryBtnText}>{config.primaryActionLabel}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Home')}
            accessibilityRole="button"
            accessibilityLabel="Return to Home"
          >
            <Text style={styles.secondaryBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: 20,
    paddingBottom: 120,
    alignItems: 'center',
  },
  iconEmblemBox: {
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  outerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerCircleWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FEF3C7',
  },
  innerCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircleWarning: {
    backgroundColor: '#D97706',
  },
  headingText: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subHeadingText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.md,
  },
  answersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xxl,
    padding: spacing.lg,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  answerBlock: {
    gap: 4,
  },
  answerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  answerValue: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    fontWeight: '500',
  },
  securityNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDFA',
    padding: 10,
    borderRadius: radii.lg,
    marginTop: 2,
  },
  securityNoticeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 6,
  },
  primaryBtn: {
    backgroundColor: '#0F766E',
    paddingVertical: 14,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
});

export default ScanFailureScreen;
