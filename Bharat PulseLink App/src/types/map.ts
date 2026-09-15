/**
 * Bharat PulseLink — Hospital Map & Geospatial Types (Prompt 44)
 *
 * Single canonical data structure for Map View, Marker Clustering,
 * Bounding Regions, and Map/List Synchronization.
 */

import type {
  HospitalSummaryItem,
  HospitalOwnership,
  HospitalCategory,
  GeoLocationState,
} from './hospitals';

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapCoordinates {
  latitude: number;
  longitude: number;
}

export interface HospitalMapMarkerData {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  ownership: HospitalOwnership;
  category: HospitalCategory;
  is24x7: boolean;
  rating?: number;
  totalBeds?: number;
  totalDoctors?: number;
  services: string[];
  address: string;
  city: string;
  state: string;
  pincode: string;
  rawHospital: HospitalSummaryItem;
}

export interface HospitalMapCluster {
  id: string;
  latitude: number;
  longitude: number;
  count: number;
  hospitalIds: string[];
  hospitals: HospitalMapMarkerData[];
}

export type MapItem =
  | { type: 'MARKER'; data: HospitalMapMarkerData }
  | { type: 'CLUSTER'; data: HospitalMapCluster };

export interface MapViewportState {
  region: MapRegion;
  isUserInteracting: boolean;
  hasMovedAwayFromOrigin: boolean;
  panDistanceKmFromOrigin: number;
}

export type HospitalViewMode = 'LIST' | 'MAP';
