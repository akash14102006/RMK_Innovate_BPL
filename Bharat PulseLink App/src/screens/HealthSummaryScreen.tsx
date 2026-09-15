import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { colors, spacing, radii, typography } from '../theme/tokens';
import { useHealthSummary } from '../hooks/useHealthSummary';
import HealthSummaryRow from '../components/healthSummary/HealthSummaryRow';
import HealthSummaryChipsRow from '../components/healthSummary/HealthSummaryChipsRow';

export const HealthSummaryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { summary, isLoading, isRefetching, refetch } = useHealthSummary('user_patient_primary');

  const navigateToEdit = (stepId?: string) => {
    navigation.navigate('ProfileSetup', stepId ? { stepId } : undefined);
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

          <Text style={styles.headerTitle}>Health Summary</Text>

          <View style={styles.placeholder} />
        </View>

        {/* Freshness / Offline Status Banner */}
        {summary?.isOffline ? (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineBannerText}>
              Offline • Showing latest saved health snapshot
            </Text>
          </View>
        ) : (
          <View style={styles.freshnessBanner}>
            <View style={styles.freshnessDot} />
            <Text style={styles.freshnessText}>
              {summary?.isProfileComplete
                ? 'Authoritative health memory • Clinically synced'
                : 'Patient-declared health information'}
            </Text>
          </View>
        )}

        {/* Content Body */}
        {isLoading && !summary ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0F766E" />
            <Text style={styles.loadingText}>Loading Health Summary...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor="#0F766E"
                colors={['#0F766E']}
              />
            }
          >
            {summary && (
              <>
                {/* 1. Blood Group */}
                <HealthSummaryRow
                  label="Blood Group"
                  item={summary.bloodGroup}
                  icon={
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" stroke="#DC2626" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  }
                  onPressEdit={() => navigateToEdit('basics')}
                />

                {/* 2. Height */}
                <HealthSummaryRow
                  label="Height"
                  item={summary.heightCm}
                  unit="cm"
                  icon={
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path d="M12 2v20M8 5l4-3 4 3M8 19l4 3 4-3" stroke="#0F766E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  }
                  onPressEdit={() => navigateToEdit('medicalBasics')}
                />

                {/* 3. Weight */}
                <HealthSummaryRow
                  label="Weight"
                  item={summary.weightKg}
                  unit="kg"
                  icon={
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Circle cx="12" cy="12" r="9" stroke="#0F766E" strokeWidth={2} />
                      <Path d="M12 7v5l3 3" stroke="#0F766E" strokeWidth={2} strokeLinecap="round" />
                    </Svg>
                  }
                  onPressEdit={() => navigateToEdit('medicalBasics')}
                />

                {/* 4. BMI */}
                <HealthSummaryRow
                  label="BMI"
                  item={summary.bmi}
                  icon={
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Rect x="3" y="3" width="18" height="18" rx="4" stroke="#0F766E" strokeWidth={2} />
                      <Path d="M7 16l3-6 4 4 3-6" stroke="#0F766E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  }
                  onPressEdit={() => navigateToEdit('medicalBasics')}
                />

                {/* 5. Allergies */}
                <HealthSummaryChipsRow
                  label="Allergies"
                  item={summary.allergies}
                  emptyLabel="No allergies reported"
                  icon={
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#D97706" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  }
                  onPressEdit={() => navigateToEdit('allergies')}
                />

                {/* 6. Chronic Conditions */}
                <HealthSummaryChipsRow
                  label="Chronic Conditions"
                  item={summary.chronicConditions}
                  emptyLabel="No chronic conditions reported"
                  icon={
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="#0284C7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  }
                  onPressEdit={() => navigateToEdit('conditions')}
                />

                {/* 7. Last Checkup */}
                <HealthSummaryRow
                  label="Last Checkup"
                  item={summary.lastCheckup}
                  icon={
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Rect x="3" y="4" width="18" height="18" rx="2" stroke="#0F766E" strokeWidth={2} />
                      <Path d="M16 2v4M8 2v4M3 10h18" stroke="#0F766E" strokeWidth={2} strokeLinecap="round" />
                    </Svg>
                  }
                  onPressEdit={() => navigation.navigate('Appointments')}
                />
              </>
            )}
          </ScrollView>
        )}

        {/* Sticky Bottom Edit CTA */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.editCTA}
            onPress={() => navigateToEdit()}
            accessibilityRole="button"
            accessibilityLabel="Edit Health Summary"
            activeOpacity={0.88}
          >
            <Text style={styles.editCTAText}>Edit Summary →</Text>
          </TouchableOpacity>
        </View>
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
  freshnessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: 'rgba(15, 118, 110, 0.06)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15, 118, 110, 0.12)',
  },
  freshnessDot: {
    width: 6,
    height: 6,
    borderRadius: radii.full,
    backgroundColor: '#059669',
  },
  freshnessText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
  },
  offlineBanner: {
    paddingVertical: 8,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  offlineBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
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
  editCTA: {
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
  editCTAText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
});

export default HealthSummaryScreen;
