import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing, radii, typography } from '../theme/tokens';
import { useAppointments } from '../hooks/useAppointments';
import { AppointmentItem } from '../types/appointments';
import AppointmentTabs from '../components/appointments/AppointmentTabs';
import AppointmentCard from '../components/appointments/AppointmentCard';
import AppointmentEmptyState from '../components/appointments/AppointmentEmptyState';
import AppointmentDetailsModal from '../components/appointments/AppointmentDetailsModal';

export const AppointmentsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const {
    activeTab,
    setActiveTab,
    upcoming,
    completed,
    currentList,
    isLoading,
    isRefetching,
    refetch,
    cancelAppointment,
  } = useAppointments('user_patient_primary');

  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentItem | null>(null);

  const handleBookNew = () => {
    Alert.alert(
      'Book Appointment',
      'Select a specialty and hospital from the verified network directory.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Search Hospitals', onPress: () => {} },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go Back"
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M19 12H5M12 19l-7-7 7-7" stroke={colors.textPrimary} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>My Appointments</Text>

          <View style={styles.placeholder} />
        </View>

        {/* Neumorphic Segmented Tabs */}
        <AppointmentTabs
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          upcomingCount={upcoming.length}
          completedCount={completed.length}
        />

        {/* Virtualized Appointments List */}
        {isLoading && currentList.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0F766E" />
            <Text style={styles.loadingText}>Fetching Appointments...</Text>
          </View>
        ) : (
          <FlatList
            data={currentList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <AppointmentCard appointment={item} onPress={setSelectedAppointment} />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor="#0F766E"
                colors={['#0F766E']}
              />
            }
            ListEmptyComponent={
              <AppointmentEmptyState activeTab={activeTab} onPressBook={handleBookNew} />
            }
          />
        )}

        {/* Sticky Primary Booking CTA */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.bookingCTA}
            onPress={handleBookNew}
            accessibilityRole="button"
            accessibilityLabel="Book New Appointment"
            activeOpacity={0.88}
          >
            <Text style={styles.bookingCTAText}>Book New Appointment →</Text>
          </TouchableOpacity>
        </View>

        {/* Appointment Details Modal */}
        <AppointmentDetailsModal
          visible={Boolean(selectedAppointment)}
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onCancelAppointment={cancelAppointment}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  placeholder: {
    width: 40,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 90,
  },
  loadingContainer: {
    paddingTop: 80,
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.8)',
  },
  bookingCTA: {
    height: 48,
    borderRadius: radii.lg,
    backgroundColor: '#0F766E', // Premium brand teal
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  bookingCTAText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
});

export default AppointmentsScreen;
