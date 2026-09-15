import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors, spacing, radii, typography } from '../../theme/tokens';
import { AppointmentTab } from '../../types/appointments';

export interface AppointmentEmptyStateProps {
  activeTab: AppointmentTab;
  onPressBook: () => void;
}

export const AppointmentEmptyState: React.FC<AppointmentEmptyStateProps> = ({
  activeTab,
  onPressBook,
}) => {
  const isUpcoming = activeTab === 'UPCOMING';

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
          <Rect x={3} y={4} width={18} height={18} rx={3} stroke="#0F766E" strokeWidth={1.8} />
          <Path d="M16 2v4M8 2v4M3 10h18" stroke="#0F766E" strokeWidth={1.8} strokeLinecap="round" />
          <Path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" stroke="#0F766E" strokeWidth={2.5} strokeLinecap="round" />
        </Svg>
      </View>

      <Text style={styles.title}>
        {isUpcoming ? 'No upcoming appointments' : 'No completed appointments yet'}
      </Text>

      <Text style={styles.description}>
        {isUpcoming
          ? 'Book a hospital visit when you need care. Your appointments will sync across network hospitals.'
          : 'Your completed consultations and discharge summaries will be securely archived here.'}
      </Text>

      {isUpcoming && (
        <TouchableOpacity
          style={styles.bookButton}
          onPress={onPressBook}
          accessibilityRole="button"
          accessibilityLabel="Book New Appointment"
          activeOpacity={0.85}
        >
          <Text style={styles.bookButtonText}>Book New Appointment →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 60,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    backgroundColor: 'rgba(15, 118, 110, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.titleSmall.fontSize,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  description: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  bookButton: {
    marginTop: spacing.sm,
    backgroundColor: '#0F766E',
    paddingHorizontal: spacing.lg,
    paddingVertical: 11,
    borderRadius: radii.lg,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  bookButtonText: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default AppointmentEmptyState;
