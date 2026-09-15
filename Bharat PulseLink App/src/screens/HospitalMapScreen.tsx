/**
 * Bharat PulseLink — Production Hospital Map Screen (Prompt 44)
 *
 * Geospatial hospital discovery map:
 * 1. Fixed safe-area header with List View toggle
 * 2. Floating Search & Filter controls
 * 3. Interactive Map Canvas with clustering and ownership color-coding
 * 4. User search origin pin
 * 5. Slide-up hospital preview sheet and details modal handoff
 * 6. Floating utilities (Recenter, Fit Bounds, List View quick action)
 * 7. Active Bottom Navigation bar
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing, radii } from '../theme/tokens';
import { useHospitalDiscovery } from '../hooks/useHospitalDiscovery';
import HospitalMapService from '../services/HospitalMapService';
import LocationService from '../services/LocationService';
import { HospitalMapMarkerData, MapRegion } from '../types/map';
import { HospitalSummaryItem, GeoLocationState } from '../types/hospitals';
import HospitalMapCanvas from '../components/map/HospitalMapCanvas';
import MapLocationPill from '../components/map/MapLocationPill';
import MapFloatingControls from '../components/map/MapFloatingControls';
import MapBottomPreviewCard from '../components/map/MapBottomPreviewCard';
import SearchThisAreaButton from '../components/map/SearchThisAreaButton';
import HospitalSearchBar from '../components/hospitals/HospitalSearchBar';
import HospitalFilterChips from '../components/hospitals/HospitalFilterChips';
import AdvancedFilterModal from '../components/hospitals/AdvancedFilterModal';
import LocationPickerModal from '../components/hospitals/LocationPickerModal';
import HospitalDetailsModal from '../components/hospitals/HospitalDetailsModal';
import BottomTabBar, { TabId } from '../components/home/BottomTabBar';

export const HospitalMapScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  // Use the SAME canonical discovery query hook as List View
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
    isLoading,
    selectedHospital,
    setSelectedHospital,
  } = useHospitalDiscovery();

  // Normalize hospitals to validated map markers
  const mapMarkers = useMemo(() => {
    return HospitalMapService.normalizeHospitalMarkers(hospitals);
  }, [hospitals]);

  // Compute initial bounding region
  const initialRegion = useMemo(() => {
    return HospitalMapService.calculateBoundingRegion(mapMarkers, location);
  }, [mapMarkers, location]);

  const [region, setRegion] = useState<MapRegion>(initialRegion);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [hasMovedFar, setHasMovedFar] = useState(false);

  // Auto-acquire real device GPS on screen mount
  useEffect(() => {
    let isMounted = true;
    const initGps = async () => {
      try {
        const perm = await LocationService.getPermissionStatus();
        let granted = perm === 'GRANTED';
        if (!granted && perm === 'NOT_REQUESTED') {
          const req = await LocationService.requestPermission();
          granted = req === 'GRANTED';
        }

        if (granted && isMounted) {
          const servicesOn = await LocationService.isLocationServicesEnabled();
          if (servicesOn) {
            const { location: coords } = await LocationService.getCurrentDevicePosition({
              timeoutMs: 8000,
              highAccuracy: true,
            });
            if (coords && isMounted) {
              const geoMeta = await LocationService.reverseGeocode(coords);
              const gpsLoc: GeoLocationState = {
                label: geoMeta.label || 'Current Location',
                isGps: true,
                latitude: coords.latitude,
                longitude: coords.longitude,
                city: geoMeta.city || 'Current Location',
                district: geoMeta.district,
                state: geoMeta.state,
                pincode: geoMeta.pincode,
              };
              setLocation(gpsLoc);
              setRegion({
                latitude: coords.latitude,
                longitude: coords.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              });
            }
          }
        }
      } catch (err) {
        console.warn('[HOSPITAL_MAP] GPS auto-acquisition fallback:', err);
      }
    };

    initGps();
    return () => {
      isMounted = false;
    };
  }, []);

  // Synchronize map camera region whenever location coordinates arrive or update
  useEffect(() => {
    if (location.latitude && location.longitude && !hasMovedFar) {
      const targetRegion = HospitalMapService.calculateBoundingRegion(mapMarkers, location);
      setRegion(targetRegion);
    }
  }, [location.latitude, location.longitude, mapMarkers, hasMovedFar]);

  // Selected marker in map format
  const selectedMapMarker = useMemo<HospitalMapMarkerData | null>(() => {
    if (!selectedHospital) return null;
    return mapMarkers.find((m) => m.id === selectedHospital.id) || null;
  }, [selectedHospital, mapMarkers]);

  const handleSelectHospitalMarker = useCallback(
    (marker: HospitalMapMarkerData) => {
      setSelectedHospital(marker.rawHospital);
    },
    [setSelectedHospital]
  );

  const handleToggleListView = () => {
    navigation.navigate('Hospitals');
  };

  const handleRecenter = async () => {
    try {
      const perm = await LocationService.getPermissionStatus();
      if (perm !== 'GRANTED') {
        const req = await LocationService.requestPermission();
        if (req !== 'GRANTED') {
          const fallback = HospitalMapService.calculateBoundingRegion(mapMarkers, location);
          setRegion(fallback);
          setHasMovedFar(false);
          return;
        }
      }

      const servicesOn = await LocationService.isLocationServicesEnabled();
      if (servicesOn) {
        const { location: coords } = await LocationService.getCurrentDevicePosition({
          timeoutMs: 6000,
          highAccuracy: true,
        });
        if (coords) {
          const geoMeta = await LocationService.reverseGeocode(coords);
          const gpsLoc: GeoLocationState = {
            label: geoMeta.label || 'Current Location',
            isGps: true,
            latitude: coords.latitude,
            longitude: coords.longitude,
            city: geoMeta.city || 'Current Location',
            district: geoMeta.district,
            state: geoMeta.state,
            pincode: geoMeta.pincode,
          };
          setLocation(gpsLoc);
          const userRegion: MapRegion = {
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          };
          setRegion(userRegion);
          setHasMovedFar(false);
          return;
        }
      }
    } catch {
      // Graceful fallback
    }

    const freshRegion = HospitalMapService.calculateBoundingRegion(mapMarkers, location);
    setRegion(freshRegion);
    setHasMovedFar(false);
  };

  const handleFitBounds = () => {
    const bounding = HospitalMapService.calculateBoundingRegion(mapMarkers, location, 1.45);
    setRegion(bounding);
  };

  const handleSearchThisArea = () => {
    setHasMovedFar(false);
  };

  const handleRegionChange = (newRegion: MapRegion) => {
    if (location.latitude && location.longitude) {
      const dist = HospitalMapService.calculateDistanceKm(
        location.latitude,
        location.longitude,
        newRegion.latitude,
        newRegion.longitude
      );
      if (dist > 4) {
        setHasMovedFar(true);
      }
    }
  };

  const handleTabSelect = (tab: TabId) => {
    if (tab === 'Home') {
      navigation.navigate('Home');
    } else if (tab === 'Hospitals') {
      navigation.navigate('Hospitals');
    } else if (tab === 'Profile') {
      navigation.navigate('HealthSummary');
    } else if (tab === 'Records') {
      navigation.navigate('HealthRecordsHome');
    } else if (tab === 'Scan') {
      navigation.navigate('ScanEntry');
    }
  };

  const handleViewHospitalDetails = (marker: HospitalMapMarkerData | HospitalSummaryItem) => {
    setSelectedHospital(null);
    navigation.navigate('HospitalDetails', { hospitalId: marker.id });
  };

  const handleGetDirections = (marker: HospitalMapMarkerData | HospitalSummaryItem) => {
    setSelectedHospital(null);
    const hospitalItem: HospitalSummaryItem = (marker as HospitalMapMarkerData).rawHospital || (marker as HospitalSummaryItem);
    navigation.navigate('HospitalRoute', {
      hospital: hospitalItem,
      originLocation: location.isGps ? { latitude: location.latitude, longitude: location.longitude } : undefined,
    });
  };

  const handleBookAppointment = (hospital: HospitalMapMarkerData | HospitalSummaryItem) => {
    setSelectedHospital(null);
    navigation.navigate('AppointmentSelection', {
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      department: (hospital.services && hospital.services[0]) || 'General OPD',
      locationAddress: `${hospital.address || ''}, ${hospital.city || ''}`,
    });
  };

  const handleCheckInAtHospital = (hospital: HospitalMapMarkerData | HospitalSummaryItem) => {
    setSelectedHospital(null);
    navigation.navigate('MySecureQR', {
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      purpose: 'HOSPITAL_CHECKIN',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Fixed Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go Back"
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

          <Text style={styles.headerTitle}>Hospitals Map</Text>

          {/* Switch to List View Header Button */}
          <TouchableOpacity
            style={styles.listToggleHeaderBtn}
            onPress={handleToggleListView}
            accessibilityRole="button"
            accessibilityLabel="Switch to Hospital List View"
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
                stroke="#0F766E"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.listToggleHeaderText}>List</Text>
          </TouchableOpacity>
        </View>

        {/* Full-Screen Interactive Map Canvas */}
        <View style={styles.mapSurfaceContainer}>
          <HospitalMapCanvas
            hospitals={mapMarkers}
            selectedHospital={selectedMapMarker}
            searchLocation={location}
            onSelectHospital={handleSelectHospitalMarker}
            onRegionChangeComplete={handleRegionChange}
            region={region}
            setRegion={setRegion}
          />

          {/* Floating Search Controls on Map */}
          <View style={styles.floatingTopControls}>
            <MapLocationPill
              location={location}
              hospitalsCount={totalCount}
              activeRadiusKm={advancedFilters.maxDistanceKm || 10}
              onExpandRadius={(r) => setAdvancedFilters({ ...advancedFilters, maxDistanceKm: r })}
              onPressChangeLocation={() => setIsLocationPickerOpen(true)}
            />

            <View style={styles.searchBarWrapper}>
              <HospitalSearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <View style={styles.filterChipsWrapper}>
              <HospitalFilterChips
                activeFilter={activeFilter}
                onSelectFilter={setActiveFilter}
                activeFilterCount={activeFilterCount}
                onOpenAdvancedFilters={() => setIsAdvancedFiltersOpen(true)}
              />
            </View>
          </View>

          {/* Search This Area Button */}
          <SearchThisAreaButton
            visible={hasMovedFar}
            onPress={handleSearchThisArea}
          />

          {/* Floating Map Action Buttons */}
          <MapFloatingControls
            onRecenter={handleRecenter}
            onFitBounds={handleFitBounds}
            onToggleListView={handleToggleListView}
          />

          {/* Bottom Selected Hospital Preview Card */}
          <MapBottomPreviewCard
            hospital={selectedMapMarker}
            onClose={() => setSelectedHospital(null)}
            onViewDetails={handleViewHospitalDetails}
            onGetDirections={handleGetDirections}
            onBookAppointment={handleBookAppointment}
            onCheckIn={handleCheckInAtHospital}
          />
        </View>

        {/* Shared Bottom Tab Bar */}
        <BottomTabBar activeTab="Hospitals" onSelectTab={handleTabSelect} />

        {/* Advanced Filter Modal */}
        <AdvancedFilterModal
          visible={isAdvancedFiltersOpen}
          filters={advancedFilters}
          onClose={() => setIsAdvancedFiltersOpen(false)}
          onApply={setAdvancedFilters}
          onReset={resetFilters}
        />

        {/* Location Picker Modal */}
        <LocationPickerModal
          visible={isLocationPickerOpen}
          selectedLocation={location}
          onClose={() => setIsLocationPickerOpen(false)}
          onSelectLocation={setLocation}
          onOpenPermissionScreen={() => {
            setIsLocationPickerOpen(false);
            navigation.navigate('LocationPermission');
          }}
        />

        {/* Hospital Details Full Modal */}
        <HospitalDetailsModal
          visible={Boolean(selectedHospital && !selectedMapMarker)}
          hospital={selectedHospital}
          onClose={() => setSelectedHospital(null)}
          onViewDetails={handleViewHospitalDetails}
          onGetDirections={handleGetDirections}
          onBookAppointment={handleBookAppointment}
          onCheckIn={handleCheckInAtHospital}
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
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    zIndex: 30,
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
  listToggleHeaderBtn: {
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
  listToggleHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  mapSurfaceContainer: {
    flex: 1,
    position: 'relative',
  },
  floatingTopControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  searchBarWrapper: {
    paddingHorizontal: spacing.md,
    marginTop: 6,
  },
  filterChipsWrapper: {
    paddingTop: 4,
  },
});

export default HospitalMapScreen;
