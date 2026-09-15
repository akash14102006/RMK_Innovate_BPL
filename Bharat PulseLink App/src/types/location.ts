/**
 * Bharat PulseLink — Location Domain & Permission Types
 *
 * Enterprise-grade location state machine, permission status,
 * device coordinates, and manual Indian location search models.
 */

import { GeoLocationState } from './hospitals';

export type LocationPermissionStatus =
  | 'NOT_REQUESTED'
  | 'REQUESTING'
  | 'GRANTED'
  | 'DENIED'
  | 'SETTINGS_REQUIRED';

export type LocationAvailabilityStatus =
  | 'IDLE'
  | 'LOCATING'
  | 'AVAILABLE'
  | 'SERVICES_DISABLED'
  | 'LOW_ACCURACY'
  | 'TIMEOUT'
  | 'UNAVAILABLE'
  | 'ERROR'
  | 'CANCELLED';

export type LocationFlowState =
  | 'NOT_REQUESTED'
  | 'REQUESTING'
  | 'GRANTED'
  | 'AVAILABLE'
  | 'DENIED'
  | 'SETTINGS_REQUIRED'
  | 'SERVICES_DISABLED'
  | 'LOW_ACCURACY'
  | 'TIMEOUT'
  | 'UNAVAILABLE'
  | 'ERROR'
  | 'CANCELLED'
  | 'MANUAL_SEARCH'
  | 'SELECTED';

export type LocationAccuracyTier = 'HIGH' | 'BALANCED' | 'LOW' | 'APPROXIMATE' | 'PRECISE';

export interface DeviceLocation {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
  isApproximate: boolean;
}

export interface ManualLocationItem {
  id: string;
  name: string;
  locality?: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  displayName: string;
}

export interface LocationStateDetails {
  permissionStatus: LocationPermissionStatus;
  availabilityStatus: LocationAvailabilityStatus;
  flowState: LocationFlowState;
  deviceLocation: DeviceLocation | null;
  selectedLocation: GeoLocationState | null;
  errorMessage?: string;
  isServicesEnabled: boolean;
  canAskAgain: boolean;
}

export interface LocationRequestOptions {
  timeoutMs?: number;
  maxAgeMs?: number;
  highAccuracy?: boolean;
}
