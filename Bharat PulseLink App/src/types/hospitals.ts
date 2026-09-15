export type HospitalOwnership =
  | 'GOVERNMENT'
  | 'PRIVATE'
  | 'TRUST'
  | 'PUBLIC_SECTOR'
  | 'UNKNOWN';

export type HospitalCategory =
  | 'GENERAL'
  | 'MULTI_SPECIALTY'
  | 'SUPER_SPECIALTY'
  | 'PRIMARY_HEALTH_CENTER'
  | 'DISTRICT_HOSPITAL'
  | 'TEACHING_HOSPITAL'
  | 'CLINIC';

export type HospitalDiscoveryFilter = 'ALL' | 'GOVERNMENT' | 'PRIVATE' | '24X7';

export interface GeoLocationState {
  label: string;
  isGps: boolean;
  latitude?: number;
  longitude?: number;
  city?: string;
  district?: string;
  locality?: string;
  state?: string;
  pincode?: string;
}

export interface HospitalSummaryItem {
  id: string;
  name: string;
  distanceKm: number;
  distanceMeters?: number;
  ownership: HospitalOwnership;
  category: HospitalCategory;
  is24x7: boolean;
  operatingHoursText: string;
  address: string;
  city: string;
  district?: string | null;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  hospitalCategory?: string | null;
  hospitalCareType?: string | null;
  specialties?: string | null;
  facilities?: string | null;
  emergencyServices?: string | null;
  website?: string | null;
  services: string[];
  verified: boolean;
  sourceLabel: string;
  contactPhone?: string;
  emergencyPhone?: string;
  totalBeds?: number;
  availableBeds?: number;
  totalDoctors?: number;
  rating?: number;
  averageWaitTimeMinutes?: number;
}

export interface FacilityFilterOptions {
  twentyFourSeven?: boolean;
  emergency?: boolean;
  icu?: boolean;
  pharmacy?: boolean;
  diagnostics?: boolean;
}

export interface HospitalFilterState {
  ownership?: 'ALL' | 'GOVERNMENT' | 'PRIVATE';
  hospitalTypes?: HospitalCategory[];
  facilities?: FacilityFilterOptions;
  maxDistanceKm?: number;
  specialties?: string[];
}

export interface HospitalSearchQuery {
  query: string;
  filter: HospitalDiscoveryFilter;
  advancedFilters?: HospitalFilterState;
  location: GeoLocationState;
  limit?: number;
  offset?: number;
}

export interface HospitalListResponse {
  hospitals: HospitalSummaryItem[];
  totalCount: number;
  isOffline: boolean;
  searchedLocation: GeoLocationState;
}
