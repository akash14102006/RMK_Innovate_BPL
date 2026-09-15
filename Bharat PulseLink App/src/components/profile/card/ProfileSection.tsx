/**
 * Bharat PulseLink — Profile Section Component
 *
 * Reusable progressive disclosure card container for patient profile modules.
 *
 * Owned by: Patient Profile & UI Design Domain (Prompt 93/Master UI)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface ProfileSectionProps {
  title: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onActionPress?: () => void;
  children: React.ReactNode;
  isDark?: boolean;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  title,
  icon,
  actionLabel,
  onActionPress,
  children,
  isDark = false,
}) => {
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const cardBorder = isDark ? '#334155' : '#E2E8F0';
  const titleColor = isDark ? '#F8FAFC' : '#0F172A';
  const actionColor = isDark ? '#38BDF8' : '#0F766E';

  return (
    <View
      style={[
        styles.sectionCard,
        {
          backgroundColor: cardBg,
          borderColor: cardBorder,
        },
      ]}
      accessibilityRole="none"
      accessibilityLabel={`Section: ${title}`}
    >
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          {icon ? <View style={styles.iconBox}>{icon}</View> : null}
          <Text style={[styles.sectionTitle, { color: titleColor }]}>{title}</Text>
        </View>

        {actionLabel && onActionPress ? (
          <TouchableOpacity
            onPress={onActionPress}
            accessibilityRole="button"
            accessibilityLabel={`${actionLabel} in ${title}`}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionText, { color: actionColor }]}>
              {actionLabel}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Section Content */}
      <View style={styles.contentContainer}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    width: '100%',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.6)',
    marginBottom: 4,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  contentContainer: {
    width: '100%',
  },
});

export default ProfileSection;
