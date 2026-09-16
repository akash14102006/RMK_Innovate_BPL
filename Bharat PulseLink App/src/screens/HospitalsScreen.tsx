/**
 * Bharat PulseLink — Production Nearby Hospital List Screen (Prompt 45)
 *
 * Geospatial hospital discovery list:
 * 1. Fixed Header with Back & Map View toggle
 * 2. Location selector with real Indian city/locality context
 * 3. Debounced Search bar & Filter chips (All, Govt, Private, 24x7)
 * 4. Virtualized FlatList with distance-aware ranking
 * 5. Top 1% Neumorphic Hospital Cards with verified capacity and service tags
 * 6. Skeleton loading states & specialized empty states
 * 7. Bottom navigation bar with persistent Hospitals tab
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing, radii, typography } from '../theme/tokens';
import { useHospitalDiscovery } from '../hooks/useHospitalDiscovery';
import { useI18n } from '../i18n/I18nContext';
import { HospitalSummaryItem } from '../types/hospitals';
import HospitalSearchBar from '../components/hospitals/HospitalSearchBar';
import HospitalFilterChips from '../components/hospitals/HospitalFilterChips';
import AdvancedFilterModal from '../components/hospitals/AdvancedFilterModal';
import LocationSelector from '../components/hospitals/LocationSelector';
import HospitalCard from '../components/hospitals/HospitalCard';
import HospitalSkeletonCard from '../components/hospitals/HospitalSkeletonCard';
import HospitalEmptyState from '../components/hospitals/HospitalEmptyState';
import LocationPickerModal from '../components/hospitals/LocationPickerModal';
import LocationService from '../services/LocationService';
import HospitalDetailsModal from '../components/hospitals/HospitalDetailsModal';
import BottomTabBar, { TabId, getBottomNavHeight } from '../components/home/BottomTabBar';

export const HospitalsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  const {
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    advancedFilters,
    setAdvancedFilters,
    resetFilters,
    activeFilterCount,
    location,
    setLocation,
    hospitals,
    totalCount,
    isOffline,
    isLoading,
    isRefetching,
    refetch,
    selectedHospital,
    setSelectedHospital,
  } = useHospitalDiscovery();

  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);

  const handleTabSelect = (tab: TabId) => {
    if (tab === 'Home') {
      navigation.navigate('Home');
    } else if (tab === 'Profile') {
      navigation.navigate('HealthSummary');
    } else if (tab === 'Records') {
      navigation.navigate('HealthRecordsHome');
    } else if (tab === 'Scan') {
      navigation.navigate('ScanEntry');
    }
  };

  const handleViewHospitalDetails = (hospital: HospitalSummaryItem) => {
    setSelectedHospital(null);
    navigation.navigate('HospitalDetails', { hospitalId: hospital.id });
  };

  const handleGetDirections = (hospital: HospitalSummaryItem) => {
    setSelectedHospital(null);
    navigation.navigate('HospitalRoute', {
      hospital,
      originLocation: location.isGps ? { latitude: location.latitude, longitude: location.longitude } : undefined,
    });
  };

  const handleBookAppointment = (hospital: HospitalSummaryItem) => {
    setSelectedHospital(null);
    navigation.navigate('AppointmentSelection', {
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      department: (hospital.services && hospital.services[0]) || 'General OPD',
      locationAddress: `${hospital.address || ''}, ${hospital.city || ''}`,
    });
  };

  const renderItem = useCallback(
    ({ item }: { item: HospitalSummaryItem }) => (
      <HospitalCard
        hospital={item}
        onPress={setSelectedHospital}
        onPressMenu={setSelectedHospital}
      />
    ),
    [setSelectedHospital]
  );

  const getEmptyStateType = () => {
    if (searchQuery.trim().length > 0) return 'SEARCH';
    if (activeFilter !== 'ALL') return 'FILTER';
    return 'LOCATION';
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
            accessibilityLabel={t('common.back')}
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

          <Text style={styles.headerTitle}>{t('hospitals.headerTitle')}</Text>

          {/* Switch to Map View Header Button */}
          <TouchableOpacity
            style={styles.mapToggleHeaderBtn}
            onPress={() => navigation.navigate('HospitalMap')}
            accessibilityRole="button"
            accessibilityLabel={t('hospitals.mapTitle')}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M9 18l6-3 6 3V3l-6 3-6-3-6 3v15l6-3z"
                stroke="#0F766E"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.mapToggleHeaderText}>{t('hospitals.mapToggle')}</Text>
          </TouchableOpacity>
        </View>

        {/* Discovery Control Stack */}
        <View style={styles.controlsStack}>
          <LocationSelector
            location={location}
            onPress={() => setIsLocationPickerOpen(true)}
          />

          <HospitalSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <HospitalFilterChips
            activeFilter={activeFilter}
            onSelectFilter={setActiveFilter}
            activeFilterCount={activeFilterCount}
            onOpenAdvancedFilters={() => setIsAdvancedFiltersOpen(true)}
          />
        </View>

        {/* Hospital Results List */}
        {isLoading && hospitals.length === 0 ? (
          <View style={styles.loadingContainer}>
            <HospitalSkeletonCard />
            <HospitalSkeletonCard />
            <HospitalSkeletonCard />
          </View>
        ) : (
          <FlatList
            data={hospitals}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            initialNumToRender={6}
            maxToRenderPerBatch={6}
            windowSize={5}
            removeClippedSubviews={true}
            ListHeaderComponent={
              <View>
                {isOffline && (
                  <View style={styles.offlineNoticeBanner}>
                    <Text style={styles.offlineNoticeText}>
                      ⚠️ Live PostGIS server unreachable. Showing offline directory.
                    </Text>
                    <TouchableOpacity onPress={refetch} style={styles.offlineRetryBtn}>
                      <Text style={styles.offlineRetryText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {hospitals.length > 0 && (
                  <View style={styles.resultsHeader}>
                    <Text style={styles.resultsCountText}>
                      Nearby Hospitals ({totalCount})
                    </Text>
                    <Text style={styles.rankingBadge}>Nearest First</Text>
                  </View>
                )}
              </View>
            }
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor="#0F766E"
                colors={['#0F766E']}
              />
            }
            ListEmptyComponent={
              <HospitalEmptyState
                type={getEmptyStateType()}
                searchQuery={searchQuery}
                activeRadiusKm={advancedFilters.maxDistanceKm || 10}
                onResetFilters={() => setActiveFilter('ALL')}
                onClearSearch={() => setSearchQuery('')}
                onChangeLocation={() => setIsLocationPickerOpen(true)}
                onExpandRadius={(radiusKm) =>
                  setAdvancedFilters({
                    ...advancedFilters,
                    maxDistanceKm: radiusKm,
                  })
                }
                onRetry={refetch}
              />
            }
          />
        )}

        {/* Floating Map View Pill CTA */}
        {hospitals.length > 0 && (
          <TouchableOpacity
            style={[styles.floatingMapBtn, { bottom: getBottomNavHeight(insets.bottom) + 12 }]}
            onPress={() => navigation.navigate('HospitalMap')}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="View hospitals on map"
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M9 18l6-3 6 3V3l-6 3-6-3-6 3v15l6-3z"
                stroke="#FFFFFF"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.floatingMapBtnText}>Map View</Text>
          </TouchableOpacity>
        )}

        {/* Shared Bottom Navigation Bar */}
        <BottomTabBar activeTab="Hospitals" onSelectTab={handleTabSelect} />

        {/* Location Picker Modal */}
        <LocationPickerModal
          visible={isLocationPickerOpen}
          selectedLocation={location}
          onClose={() => setIsLocationPickerOpen(false)}
          onSelectLocation={setLocation}
          onOpenPermissionScreen={async () => {
            setIsLocationPickerOpen(false);
            const perm = await LocationService.getPermissionStatus();
            if (perm === 'GRANTED') {
              setLocation({
                label: 'Current location',
                isGps: true,
                city: 'Current location',
                state: '',
                latitude: undefined,
                longitude: undefined,
              });
              await refetch();
            } else {
              navigation.navigate('LocationPermission');
            }
          }}
        />

        {/* Advanced Filter Modal */}
        <AdvancedFilterModal
          visible={isAdvancedFiltersOpen}
          filters={advancedFilters}
          onClose={() => setIsAdvancedFiltersOpen(false)}
          onApply={setAdvancedFilters}
          onReset={resetFilters}
        />

        {/* Hospital Details Modal */}
        <HospitalDetailsModal
          visible={Boolean(selectedHospital)}
          hospital={selectedHospital}
          onClose={() => setSelectedHospital(null)}
          onViewDetails={handleViewHospitalDetails}
          onBookAppointment={handleBookAppointment}
          onGetDirections={handleGetDirections}
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
  mapToggleHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.full,
    gap: 6,
  },
  mapToggleHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  controlsStack: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.8)',
    gap: 8,
    paddingBottom: 8,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.sm,
    paddingTop: spacing.xs,
  },
  resultsCountText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    letterSpacing: -0.2,
  },
  rankingBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  loadingContainer: {
    padding: spacing.md,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 90,
  },
  floatingMapBtn: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F766E',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: radii.full,
    gap: 8,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 20,
  },
  floatingMapBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  offlineNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: spacing.sm,
  },
  offlineNoticeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    marginRight: 8,
  },
  offlineRetryBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  offlineRetryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default HospitalsScreen;
