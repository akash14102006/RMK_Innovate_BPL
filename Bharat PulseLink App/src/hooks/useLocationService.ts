/**
 * Bharat PulseLink — useLocationService Hook
 *
 * Reactive state machine for Location Permission, GPS discovery,
 * manual Indian location fallback, and stale-request protection.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import LocationService from '../services/LocationService';
import {
  LocationPermissionStatus,
  LocationAvailabilityStatus,
  LocationFlowState,
  DeviceLocation,
  ManualLocationItem,
} from '../types/location';
import { GeoLocationState } from '../types/hospitals';
import HospitalDiscoveryService from '../services/HospitalDiscoveryService';

export interface UseLocationServiceReturn {
  permissionStatus: LocationPermissionStatus;
  availabilityStatus: LocationAvailabilityStatus;
  flowState: LocationFlowState;
  deviceLocation: DeviceLocation | null;
  selectedLocation: GeoLocationState | null;
  manualSearchQuery: string;
  manualResults: ManualLocationItem[];
  isLocating: boolean;
  errorMessage: string | null;
  requestCurrentLocation: () => Promise<GeoLocationState | null>;
  openManualSearch: () => void;
  closeManualSearch: () => void;
  setSearchQuery: (query: string) => void;
  selectManualLocation: (item: ManualLocationItem) => Promise<GeoLocationState>;
  selectCustomLocation: (location: GeoLocationState) => Promise<void>;
  openSettings: () => Promise<boolean>;
  cancelLocating: () => void;
  retryGps: () => Promise<GeoLocationState | null>;
}

export function useLocationService(
  onLocationSelected?: (location: GeoLocationState) => void
): UseLocationServiceReturn {
  const [permissionStatus, setPermissionStatus] = useState<LocationPermissionStatus>('NOT_REQUESTED');
  const [availabilityStatus, setAvailabilityStatus] = useState<LocationAvailabilityStatus>('IDLE');
  const [flowState, setFlowState] = useState<LocationFlowState>('NOT_REQUESTED');
  const [deviceLocation, setDeviceLocation] = useState<DeviceLocation | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<GeoLocationState | null>(null);
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [manualResults, setManualResults] = useState<ManualLocationItem[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isCancelledRef = useRef(false);

  // Initial check on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      const perm = await LocationService.getPermissionStatus();
      if (mounted) {
        setPermissionStatus(perm);
        if (perm === 'GRANTED') {
          setFlowState('GRANTED');
        } else if (perm === 'DENIED') {
          setFlowState('DENIED');
        } else if (perm === 'SETTINGS_REQUIRED') {
          setFlowState('SETTINGS_REQUIRED');
        }
      }

      const saved = await LocationService.getSelectedLocation();
      if (mounted && saved) {
        setSelectedLocation(saved);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Update manual results on search query change
  useEffect(() => {
    const results = LocationService.searchManualLocations(manualSearchQuery, 15);
    setManualResults(results);
  }, [manualSearchQuery]);

  /**
   * Request GPS permission and fetch current device location.
   */
  const requestCurrentLocation = useCallback(async (): Promise<GeoLocationState | null> => {
    isCancelledRef.current = false;
    setIsLocating(true);
    setErrorMessage(null);
    setFlowState('REQUESTING');
    setAvailabilityStatus('LOCATING');

    try {
      // 1. Check & request permission
      let perm = await LocationService.getPermissionStatus();
      if (perm !== 'GRANTED') {
        perm = await LocationService.requestPermission();
        setPermissionStatus(perm);

        if (perm === 'DENIED') {
          setFlowState('DENIED');
          setAvailabilityStatus('UNAVAILABLE');
          setErrorMessage('Location permission was denied. You can choose your city manually.');
          setIsLocating(false);
          return null;
        }

        if (perm === 'SETTINGS_REQUIRED') {
          setFlowState('SETTINGS_REQUIRED');
          setAvailabilityStatus('UNAVAILABLE');
          setErrorMessage('Location access is turned off in device settings.');
          setIsLocating(false);
          return null;
        }
      }

      setPermissionStatus('GRANTED');
      setFlowState('GRANTED');

      // 2. Check location services (hardware)
      const servicesOn = await LocationService.isLocationServicesEnabled();
      if (!servicesOn) {
        setFlowState('SERVICES_DISABLED');
        setAvailabilityStatus('SERVICES_DISABLED');
        setErrorMessage('Location services are turned off on your device.');
        setIsLocating(false);
        return null;
      }

      // 3. One-shot position fetch
      const { location: coords, version } = await LocationService.getCurrentDevicePosition({
        timeoutMs: 8000,
        highAccuracy: true,
      });

      if (isCancelledRef.current || LocationService.isResponseStale(version)) {
        console.log('[USE_LOCATION] Stale GPS response discarded');
        return null;
      }

      setDeviceLocation(coords);
      setAvailabilityStatus('AVAILABLE');

      // 4. Reverse geocode to get city, district, state
      const geoMeta = await LocationService.reverseGeocode(coords);

      const finalLocation: GeoLocationState = {
        label: geoMeta.label || 'Current Location',
        isGps: true,
        latitude: coords.latitude,
        longitude: coords.longitude,
        city: geoMeta.city || 'Current Area',
        district: geoMeta.district,
        state: geoMeta.state,
        pincode: geoMeta.pincode,
      };

      setSelectedLocation(finalLocation);
      setFlowState('SELECTED');
      await LocationService.saveSelectedLocation(finalLocation);
      await HospitalDiscoveryService.saveSelectedLocation(finalLocation);

      if (onLocationSelected) {
        onLocationSelected(finalLocation);
      }

      setIsLocating(false);
      return finalLocation;
    } catch (err: any) {
      if (isCancelledRef.current) {
        setFlowState('CANCELLED');
        setAvailabilityStatus('CANCELLED');
      } else if (err?.message === 'TIMEOUT') {
        setFlowState('TIMEOUT');
        setAvailabilityStatus('TIMEOUT');
        setErrorMessage('GPS detection timed out. Please try again or choose your city manually.');
      } else if (err?.message === 'SERVICES_DISABLED') {
        setFlowState('SERVICES_DISABLED');
        setAvailabilityStatus('SERVICES_DISABLED');
        setErrorMessage('Location services are turned off on your device.');
      } else {
        setFlowState('ERROR');
        setAvailabilityStatus('ERROR');
        setErrorMessage('Unable to determine location. Please select your city manually.');
      }
      setIsLocating(false);
      return null;
    }
  }, [onLocationSelected]);

  /**
   * Enter manual search mode
   */
  const openManualSearch = useCallback(() => {
    LocationService.invalidatePendingGps();
    isCancelledRef.current = true;
    setIsLocating(false);
    setFlowState('MANUAL_SEARCH');
  }, []);

  const closeManualSearch = useCallback(() => {
    setFlowState(selectedLocation ? 'SELECTED' : 'NOT_REQUESTED');
  }, [selectedLocation]);

  /**
   * Select a manual location item
   */
  const selectManualLocation = useCallback(
    async (item: ManualLocationItem): Promise<GeoLocationState> => {
      // Invalidate any pending GPS fetch
      LocationService.invalidatePendingGps();
      isCancelledRef.current = true;

      const locState: GeoLocationState = {
        label: item.displayName,
        isGps: false,
        city: item.city,
        state: item.state,
        pincode: item.pincode,
        latitude: item.latitude,
        longitude: item.longitude,
      };

      setSelectedLocation(locState);
      setFlowState('SELECTED');
      await LocationService.saveSelectedLocation(locState);
      await HospitalDiscoveryService.saveSelectedLocation(locState);

      if (onLocationSelected) {
        onLocationSelected(locState);
      }

      return locState;
    },
    [onLocationSelected]
  );

  const selectCustomLocation = useCallback(
    async (loc: GeoLocationState): Promise<void> => {
      LocationService.invalidatePendingGps();
      isCancelledRef.current = true;
      setSelectedLocation(loc);
      setFlowState('SELECTED');
      await LocationService.saveSelectedLocation(loc);
      await HospitalDiscoveryService.saveSelectedLocation(loc);

      if (onLocationSelected) {
        onLocationSelected(loc);
      }
    },
    [onLocationSelected]
  );

  const openSettings = useCallback(async (): Promise<boolean> => {
    return await LocationService.openAppSettings();
  }, []);

  const cancelLocating = useCallback(() => {
    LocationService.invalidatePendingGps();
    isCancelledRef.current = true;
    setIsLocating(false);
    setFlowState('CANCELLED');
    setAvailabilityStatus('CANCELLED');
  }, []);

  const retryGps = useCallback(async () => {
    return await requestCurrentLocation();
  }, [requestCurrentLocation]);

  return {
    permissionStatus,
    availabilityStatus,
    flowState,
    deviceLocation,
    selectedLocation,
    manualSearchQuery,
    manualResults,
    isLocating,
    errorMessage,
    requestCurrentLocation,
    openManualSearch,
    closeManualSearch,
    setSearchQuery: setManualSearchQuery,
    selectManualLocation,
    selectCustomLocation,
    openSettings,
    cancelLocating,
    retryGps,
  };
}

export default useLocationService;
