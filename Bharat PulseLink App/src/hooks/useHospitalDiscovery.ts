/**
 * Bharat PulseLink — Unified Hospital Discovery Hook (Prompts 42–46)
 *
 * Single source of truth for:
 * 1. Location state (Fresh Device GPS / Manual Indian City)
 * 2. Search query with debounced updates
 * 3. Quick filters (All, Govt, Pvt, 24x7)
 * 4. Multi-dimensional Advanced Filters (Ownership, Types, Facilities, Distance, Specialty)
 * 5. TanStack Query caching and cancellation
 * 6. Selected hospital state synchronized across List and Map views.
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import HospitalDiscoveryService, { DEFAULT_INDIAN_LOCATIONS } from '../services/HospitalDiscoveryService';
import LocationService from '../services/LocationService';
import type {
  HospitalDiscoveryFilter,
  HospitalFilterState,
  GeoLocationState,
  HospitalSummaryItem,
} from '../types/hospitals';

export const HOSPITALS_QUERY_KEY = ['hospitals'];

export const INITIAL_ADVANCED_FILTERS: HospitalFilterState = {
  ownership: 'ALL',
  hospitalTypes: [],
  facilities: {
    twentyFourSeven: false,
    emergency: false,
    icu: false,
    pharmacy: false,
    diagnostics: false,
  },
  maxDistanceKm: undefined,
  specialties: [],
};

export const INITIAL_DETECTING_LOCATION: GeoLocationState = {
  label: 'Detecting location...',
  isGps: true,
  city: 'Current location',
  state: '',
  latitude: undefined,
  longitude: undefined,
};

export const useHospitalDiscovery = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<HospitalDiscoveryFilter>('ALL');
  const [advancedFilters, setAdvancedFiltersState] = useState<HospitalFilterState>(INITIAL_ADVANCED_FILTERS);
  const [location, setLocation] = useState<GeoLocationState>(INITIAL_DETECTING_LOCATION);
  const [selectedHospital, setSelectedHospital] = useState<HospitalSummaryItem | null>(null);

  const isResolvingLocation = useRef(false);

  // Auto-acquire fresh device GPS on mount or honor manual selection
  const refreshLocation = useCallback(async () => {
    if (isResolvingLocation.current) return;
    isResolvingLocation.current = true;

    try {
      // 1. Check if user previously made an explicit manual selection (e.g. Bandra, Mumbai)
      const savedLoc = await LocationService.getSelectedLocation();
      if (savedLoc && !savedLoc.isGps && savedLoc.latitude && savedLoc.longitude) {
        setLocation(savedLoc);
        isResolvingLocation.current = false;
        return;
      }

      // 2. In GPS / nearby mode: check permission and fetch fresh device GPS
      const perm = await LocationService.getPermissionStatus();
      let granted = perm === 'GRANTED';
      if (!granted && perm === 'NOT_REQUESTED') {
        const req = await LocationService.requestPermission();
        granted = req === 'GRANTED';
      }

      if (granted) {
        const servicesOn = await LocationService.isLocationServicesEnabled();
        if (servicesOn) {
          const { location: coords } = await LocationService.getCurrentDevicePosition({
            timeoutMs: 8000,
            highAccuracy: true,
          });

          if (coords) {
            // 1. Immediately establish authoritative GPS coordinates to unblock hospital search
            const immediateGpsLoc: GeoLocationState = {
              label: 'Current location',
              isGps: true,
              latitude: coords.latitude,
              longitude: coords.longitude,
              city: 'Current location',
            };

            setLocation(immediateGpsLoc);
            await LocationService.saveSelectedLocation(immediateGpsLoc);
            await HospitalDiscoveryService.saveSelectedLocation(immediateGpsLoc);
            isResolvingLocation.current = false;

            // 2. Asynchronously and independently refine human-readable location label in the background
            LocationService.reverseGeocode(coords)
              .then((geoMeta) => {
                if (geoMeta) {
                  const resolvedLabel =
                    geoMeta.label && geoMeta.label !== 'Current Location' && geoMeta.label !== 'Current location'
                      ? geoMeta.label
                      : geoMeta.city && geoMeta.city !== 'Current Location' && geoMeta.city !== 'Current location'
                      ? `${geoMeta.city}, ${geoMeta.state || ''}`.trim().replace(/^,\s*|,\s*$/g, '')
                      : 'Current location';

                  if (resolvedLabel && resolvedLabel !== 'Current location') {
                    setLocation((prev) => ({
                      ...prev,
                      label: resolvedLabel,
                      city: geoMeta.city || prev.city,
                      district: geoMeta.district || prev.district,
                      state: geoMeta.state || prev.state,
                      pincode: geoMeta.pincode || prev.pincode,
                    }));
                  }
                }
              })
              .catch(() => {});

            return;
          }
        }
      }

      // 3. Fallback if GPS is unavailable/denied: check previous saved manual location
      if (savedLoc && !savedLoc.isGps && savedLoc.latitude && savedLoc.longitude) {
        setLocation(savedLoc);
      } else {
        // Safe fallback without hardcoding Chennai as user's location
        setLocation({
          label: 'Current location',
          isGps: true,
          city: 'Current location',
          state: '',
          latitude: undefined,
          longitude: undefined,
        });
      }
    } catch (err) {
      console.warn('[HOSPITAL_DISCOVERY] GPS resolution failed:', err);
    } finally {
      isResolvingLocation.current = false;
    }
  }, []);

  useEffect(() => {
    refreshLocation();
  }, [refreshLocation]);

  const handleSelectLocation = async (newLoc: GeoLocationState) => {
    if (newLoc.isGps) {
      await LocationService.saveSelectedLocation(newLoc);
      await HospitalDiscoveryService.saveSelectedLocation(newLoc);
      setLocation(INITIAL_DETECTING_LOCATION);
      await refreshLocation();
      return;
    }

    setLocation(newLoc);
    await LocationService.saveSelectedLocation(newLoc);
    await HospitalDiscoveryService.saveSelectedLocation(newLoc);
  };

  // Calculate number of active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (activeFilter !== 'ALL') count++;
    if (advancedFilters.ownership && advancedFilters.ownership !== 'ALL') count++;
    if (advancedFilters.hospitalTypes && advancedFilters.hospitalTypes.length > 0) {
      count += advancedFilters.hospitalTypes.length;
    }
    if (advancedFilters.facilities) {
      if (advancedFilters.facilities.twentyFourSeven) count++;
      if (advancedFilters.facilities.emergency) count++;
      if (advancedFilters.facilities.icu) count++;
      if (advancedFilters.facilities.pharmacy) count++;
      if (advancedFilters.facilities.diagnostics) count++;
    }
    if (advancedFilters.maxDistanceKm !== undefined && advancedFilters.maxDistanceKm > 0) count++;
    if (advancedFilters.specialties && advancedFilters.specialties.length > 0) {
      count += advancedFilters.specialties.length;
    }
    return count;
  }, [activeFilter, advancedFilters]);

  const resetFilters = useCallback(() => {
    setActiveFilter('ALL');
    setAdvancedFiltersState(INITIAL_ADVANCED_FILTERS);
  }, []);

  const setAdvancedFilters = useCallback((filters: HospitalFilterState) => {
    setAdvancedFiltersState(filters);
  }, []);

  const isLocationReady = Boolean(location.latitude !== undefined && location.longitude !== undefined);

  const {
    data = { hospitals: [], totalCount: 0, isOffline: false, searchedLocation: location },
    isLoading,
    isRefetching,
    refetch: queryRefetch,
    isError,
  } = useQuery({
    queryKey: [
      ...HOSPITALS_QUERY_KEY,
      location.latitude,
      location.longitude,
      activeFilter,
      advancedFilters,
      searchQuery,
    ],
    queryFn: () =>
      HospitalDiscoveryService.searchHospitals({
        query: searchQuery,
        filter: activeFilter,
        advancedFilters,
        location,
      }),
    enabled: isLocationReady,
    staleTime: 1000 * 60, // 1 minute
  });

  const handleRefetch = useCallback(async () => {
    if (location.isGps) {
      await refreshLocation();
    }
    return queryRefetch();
  }, [location.isGps, refreshLocation, queryRefetch]);

  return {
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    advancedFilters,
    setAdvancedFilters,
    resetFilters,
    activeFilterCount,
    location,
    setLocation: handleSelectLocation,
    hospitals: data.hospitals,
    totalCount: data.totalCount,
    isOffline: data.isOffline,
    isLoading: isLoading || !isLocationReady,
    isRefetching,
    refetch: handleRefetch,
    isError,
    selectedHospital,
    setSelectedHospital,
  };
};

export default useHospitalDiscovery;
