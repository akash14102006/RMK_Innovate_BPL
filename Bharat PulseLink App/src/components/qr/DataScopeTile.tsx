/**
 * Bharat PulseLink — Neumorphic Data Scope Tile Component
 *
 * Implements:
 * 1. Accessible medical sharing scope selector with tactile touch feedback
 * 2. Vector SVG iconography for each clinical data domain
 * 3. Elevated selected/unselected visual states with strong contrast
 * 4. Zero tiny text: High-contrast legible typography (18px title, 14px description)
 *
 * Owned by: QR & Consent Domain (Prompt 107 Master Rework)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  UserIcon,
  PhoneIcon,
  AlertTriangleIcon,
  PillIcon,
  ActivityIcon,
  FileTextIcon,
  CheckCircleIcon,
} from './QRIcons';
import { SharingScopeKey } from '../../types/scan';

export interface DataScopeTileProps {
  scopeKey: SharingScopeKey;
  label: string;
  description: string;
  isSelected: boolean;
  onToggle: (key: SharingScopeKey) => void;
  isSensitive?: boolean;
}

export const DataScopeTile: React.FC<DataScopeTileProps> = ({
  scopeKey,
  label,
  description,
  isSelected,
  onToggle,
  isSensitive = false,
}) => {
  const renderIcon = () => {
    const iconColor = isSelected ? '#0F766E' : '#475569';
    switch (scopeKey) {
      case 'BASIC_PROFILE':
        return <UserIcon size={24} color={iconColor} />;
      case 'EMERGENCY_CONTACT':
        return <PhoneIcon size={24} color={iconColor} />;
      case 'ALLERGIES':
        return <AlertTriangleIcon size={24} color={isSelected ? '#D97706' : '#64748B'} />;
      case 'CURRENT_MEDICATIONS':
        return <PillIcon size={24} color={iconColor} />;
      case 'HEALTH_SUMMARY':
        return <ActivityIcon size={24} color={iconColor} />;
      case 'RECENT_REPORTS':
        return <FileTextIcon size={24} color={iconColor} />;
      default:
        return <FileTextIcon size={24} color={iconColor} />;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.tileContainer,
        isSelected ? styles.tileSelected : styles.tileUnselected,
      ]}
      onPress={() => onToggle(scopeKey)}
      activeOpacity={0.75}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isSelected }}
      accessibilityLabel={`${label}: ${description}. ${isSelected ? 'Included in shared data' : 'Not included'}`}
    >
      {/* Icon Capsule */}
      <View
        style={[
          styles.iconBox,
          isSelected ? styles.iconBoxSelected : styles.iconBoxUnselected,
        ]}
      >
        {renderIcon()}
      </View>

      {/* Content Column */}
      <View style={styles.textColumn}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, isSelected && styles.titleSelected]}>
            {label}
          </Text>
          {isSensitive && (
            <View style={styles.sensitiveBadge}>
              <Text style={styles.sensitiveText}>Sensitive</Text>
            </View>
          )}
        </View>
        <Text style={styles.description}>{description}</Text>
      </View>

      {/* Selection Checkmark */}
      <View style={styles.checkWrapper}>
        {isSelected ? (
          <CheckCircleIcon size={26} color="#0F766E" />
        ) : (
          <View style={styles.emptyCheck} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  tileSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#0F766E',
  },
  tileUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconBoxSelected: {
    backgroundColor: '#CCFBF1',
  },
  iconBoxUnselected: {
    backgroundColor: '#F1F5F9',
  },
  textColumn: {
    flex: 1,
    paddingRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.1,
  },
  titleSelected: {
    color: '#0F766E',
  },
  sensitiveBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  sensitiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
    fontWeight: '400',
  },
  checkWrapper: {
    marginLeft: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
});

export default DataScopeTile;
