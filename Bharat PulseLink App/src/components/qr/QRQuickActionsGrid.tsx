/**
 * Bharat PulseLink — QR Quick Actions Grid Component
 *
 * Implements:
 * 1. Perfectly aligned 2x2 grid of primary QR control actions
 * 2. Uniform card dimensions, padding, and vector iconography
 * 3. Neumorphic soft elevated cards with subtle shadow depth
 * 4. High-contrast labels and secondary descriptions
 *
 * Owned by: QR & Mobile UX Domain (Prompt 107 Master Rework)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  RefreshIcon,
  QrCodeIcon,
  HistoryIcon,
  ShieldCheckIcon,
} from './QRIcons';

export interface QRQuickActionsGridProps {
  onGenerateNew: () => void;
  onViewDetails: () => void;
  onViewActivity: () => void;
  onSecurityControls: () => void;
  isLoading?: boolean;
}

export const QRQuickActionsGrid: React.FC<QRQuickActionsGridProps> = ({
  onGenerateNew,
  onViewDetails,
  onViewActivity,
  onSecurityControls,
  isLoading = false,
}) => {
  const actions = [
    {
      id: 'rotate',
      title: 'Generate New QR',
      description: 'Rotate capability',
      icon: <RefreshIcon size={24} color="#0F766E" />,
      onPress: onGenerateNew,
      disabled: isLoading,
    },
    {
      id: 'details',
      title: 'View QR Details',
      description: 'Session metadata',
      icon: <QrCodeIcon size={24} color="#0284C7" />,
      onPress: onViewDetails,
      disabled: false,
    },
    {
      id: 'activity',
      title: 'QR Activity',
      description: 'Exchange history',
      icon: <HistoryIcon size={24} color="#6366F1" />,
      onPress: onViewActivity,
      disabled: false,
    },
    {
      id: 'security',
      title: 'Security Controls',
      description: 'Revoke & policies',
      icon: <ShieldCheckIcon size={24} color="#059669" />,
      onPress: onSecurityControls,
      disabled: false,
    },
  ];

  return (
    <View style={styles.gridContainer}>
      {actions.map((act) => (
        <TouchableOpacity
          key={act.id}
          style={styles.card}
          onPress={act.onPress}
          disabled={act.disabled}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={`${act.title}, ${act.description}`}
        >
          <View style={styles.iconContainer}>{act.icon}</View>
          <Text style={styles.cardTitle}>{act.title}</Text>
          <Text style={styles.cardDescription}>{act.description}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginVertical: 10,
  },
  card: {
    width: '48%',
    minHeight: 110,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 20,
  },
  cardDescription: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
});

export default QRQuickActionsGrid;
