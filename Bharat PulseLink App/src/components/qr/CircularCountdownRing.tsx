/**
 * Bharat PulseLink — Circular Countdown Ring Component
 *
 * Implements:
 * 1. High-contrast SVG progress ring displaying remaining session lifetime
 * 2. Formatted countdown time (e.g. 01:27)
 * 3. State-aware status badge (LIVE, EXPIRING, EXPIRED, OFFLINE)
 * 4. Neumorphic layered surface geometry
 *
 * Owned by: QR & Mobile UX Domain (Prompt 107 Master Rework)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { ClockIcon, WifiOffIcon, AlertTriangleIcon } from './QRIcons';

export interface CircularCountdownRingProps {
  secondsRemaining: number;
  totalSeconds?: number;
  isOffline?: boolean;
  isExpired?: boolean;
}

export const CircularCountdownRing: React.FC<CircularCountdownRingProps> = ({
  secondsRemaining,
  totalSeconds = 90,
  isOffline = false,
  isExpired = false,
}) => {
  const size = 110;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = isExpired
    ? 0
    : Math.max(0, Math.min(1, secondsRemaining / totalSeconds));
  const strokeDashoffset = circumference * (1 - progress);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isExpiringSoon = !isExpired && secondsRemaining <= 20;

  const ringColor = isExpired
    ? '#DC2626'
    : isExpiringSoon
    ? '#D97706'
    : isOffline
    ? '#0284C7'
    : '#0F766E';

  const trackColor = isExpired
    ? '#FEE2E2'
    : isExpiringSoon
    ? '#FEF3C7'
    : isOffline
    ? '#E0F2FE'
    : '#CCFBF1';

  return (
    <View style={styles.container}>
      <View style={styles.ringWrapper}>
        <Svg width={size} height={size} style={styles.svg}>
          {/* Background Track */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Active Animated Arc */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>

        {/* Center Content */}
        <View style={styles.centerContent}>
          <Text style={[styles.timeText, { color: isExpired ? '#DC2626' : '#0F172A' }]}>
            {isExpired ? '00:00' : formatTime(secondsRemaining)}
          </Text>
          <Text style={styles.subText}>
            {isExpired ? 'Expired' : isOffline ? 'Offline' : 'Remaining'}
          </Text>
        </View>
      </View>

      {/* State Caption */}
      <View style={styles.captionRow}>
        <View
          style={[
            styles.stateDot,
            { backgroundColor: ringColor },
          ]}
        />
        <Text style={[styles.captionText, { color: isExpired ? '#DC2626' : '#475569' }]}>
          {isExpired
            ? 'Session Expired • Tap Refresh'
            : isOffline
            ? 'Pre-issued capability valid for offline visit'
            : 'Expires automatically • One-time capability'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 14,
  },
  ringWrapper: {
    width: 110,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
  subText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 1,
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  stateDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  captionText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default CircularCountdownRing;
