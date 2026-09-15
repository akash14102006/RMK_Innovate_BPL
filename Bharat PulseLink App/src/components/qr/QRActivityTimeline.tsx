/**
 * Bharat PulseLink — QR Activity & Live Security Timeline Component
 *
 * Implements:
 * 1. Real-time visual lifecycle timeline of point-of-care exchanges
 * 2. Status-aware timeline step nodes with vector iconography
 * 3. Hospital verification and Consent Authorizer state representation
 * 4. Zero emojis: Clean vector UI with crisp medical contrast
 *
 * Owned by: QR & Security Lifecycle Domain (Prompt 107 Master Rework)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  QrCodeIcon,
  HospitalIcon,
  ShieldCheckIcon,
  LockIcon,
  CheckCircleIcon,
  ClockIcon,
} from './QRIcons';

export type TimelineLifecycleState =
  | 'WAITING_FOR_SCAN'
  | 'SCANNED'
  | 'AUTHORIZING'
  | 'APPROVED'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'REVOKED';

export interface QRActivityTimelineProps {
  currentState: TimelineLifecycleState;
  createdAtTime?: string;
  scannedAtTime?: string;
  facilityName?: string;
  isOffline?: boolean;
}

export const QRActivityTimeline: React.FC<QRActivityTimelineProps> = ({
  currentState,
  createdAtTime = 'Just now',
  scannedAtTime,
  facilityName = 'Awaiting Hospital',
  isOffline = false,
}) => {
  const steps = [
    {
      id: 'created',
      title: isOffline ? 'Offline Capability Active' : 'Secure QR Created',
      subtitle: isOffline ? 'Pre-issued offline capability' : `Generated at ${createdAtTime}`,
      icon: <QrCodeIcon size={18} color="#0F766E" />,
      isDone: true,
      isActive: currentState === 'WAITING_FOR_SCAN',
    },
    {
      id: 'scanned',
      title: 'Hospital Scan Detected',
      subtitle: currentState === 'WAITING_FOR_SCAN' ? 'Waiting for reception / doctor scan' : `Scanned by ${facilityName}`,
      icon: <HospitalIcon size={18} color={currentState !== 'WAITING_FOR_SCAN' ? '#0284C7' : '#94A3B8'} />,
      isDone: ['SCANNED', 'AUTHORIZING', 'APPROVED', 'COMPLETED'].includes(currentState),
      isActive: currentState === 'SCANNED',
    },
    {
      id: 'consent',
      title: 'Consent & Scope Verified',
      subtitle: ['APPROVED', 'COMPLETED'].includes(currentState)
        ? 'Prompt 91 Policy: Demographics & Clinical'
        : 'Awaiting policy validation',
      icon: <ShieldCheckIcon size={18} color={['APPROVED', 'COMPLETED'].includes(currentState) ? '#059669' : '#94A3B8'} />,
      isDone: ['APPROVED', 'COMPLETED'].includes(currentState),
      isActive: currentState === 'AUTHORIZING',
    },
    {
      id: 'exchange',
      title: 'Encrypted Exchange Complete',
      subtitle: currentState === 'COMPLETED' ? 'AES-256-GCM envelope delivered' : 'One-time token single-use consumption',
      icon: <CheckCircleIcon size={18} color={currentState === 'COMPLETED' ? '#059669' : '#94A3B8'} />,
      isDone: currentState === 'COMPLETED',
      isActive: currentState === 'COMPLETED',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Live Exchange Activity</Text>
        <View style={[styles.liveBadge, currentState === 'COMPLETED' && { backgroundColor: '#DCFCE7' }]}>
          <Text style={[styles.liveBadgeText, currentState === 'COMPLETED' && { color: '#15803D' }]}>
            {currentState === 'COMPLETED' ? 'EXCHANGE COMPLETED' : isOffline ? 'OFFLINE READY' : 'LIVE MONITOR'}
          </Text>
        </View>
      </View>

      <View style={styles.timelineList}>
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          return (
            <View key={step.id} style={styles.stepRow}>
              {/* Left Column: Icon & Connecting Line */}
              <View style={styles.leftCol}>
                <View
                  style={[
                    styles.iconCircle,
                    step.isDone ? styles.iconCircleDone : styles.iconCirclePending,
                    step.isActive && styles.iconCircleActive,
                  ]}
                >
                  {step.icon}
                </View>
                {!isLast && (
                  <View
                    style={[
                      styles.connectingLine,
                      step.isDone ? styles.connectingLineDone : styles.connectingLinePending,
                    ]}
                  />
                )}
              </View>

              {/* Right Column: Title & Subtitle */}
              <View style={styles.rightCol}>
                <Text style={[styles.stepTitle, step.isDone && styles.stepTitleDone]}>
                  {step.title}
                </Text>
                <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginVertical: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  liveBadge: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
    letterSpacing: 0.5,
  },
  timelineList: {
    paddingLeft: 4,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 56,
  },
  leftCol: {
    alignItems: 'center',
    width: 32,
    marginRight: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  iconCircleDone: {
    backgroundColor: '#F0FDF4',
    borderColor: '#059669',
  },
  iconCirclePending: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  iconCircleActive: {
    borderColor: '#0F766E',
    backgroundColor: '#CCFBF1',
  },
  connectingLine: {
    width: 2,
    flex: 1,
    marginVertical: 2,
  },
  connectingLineDone: {
    backgroundColor: '#059669',
  },
  connectingLinePending: {
    backgroundColor: '#E2E8F0',
  },
  rightCol: {
    flex: 1,
    paddingTop: 4,
    paddingBottom: 14,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  stepTitleDone: {
    color: '#0F172A',
    fontWeight: '700',
  },
  stepSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
});

export default QRActivityTimeline;
