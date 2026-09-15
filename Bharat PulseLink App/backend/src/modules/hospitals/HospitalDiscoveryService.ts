/**
 * Bharat PulseLink — Hospital Discovery Service
 *
 * Unified PostGIS Geospatial Hospital Search Engine.
 * Shared source of truth for Smartphone (GPS) and Feature Phone IVR (PIN centroid).
 *
 * Owned by: Hospital Infrastructure & Discovery Domain (Prompt 94, Step 7)
 */

import { type HospitalRepository, type FacilityWithDistance } from '../../infrastructure/database/repositories/HospitalRepository.js';
import { AppError, ErrorCode } from '../../core/errors/AppError.js';

export interface NearbySearchParams {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  limit?: number;
  emergencyOnly?: boolean;
  serviceCode?: string;
}

export interface DiscoveredHospitalDTO {
  id: string;
  name: string;
  displayName: string;
  facilityType: string;
  ownershipType: string;
  address: string;
  locality?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  pincode: string;
  latitude: number;
  longitude: number;
  emergencyAvailable: boolean;
  distanceMeters: number;
  distanceKm: number;
}

export interface NearbyHospitalSearchResult {
  searchPoint: {
    latitude: number;
    longitude: number;
  };
  radiusMeters: number;
  totalFound: number;
  hospitals: DiscoveredHospitalDTO[];
  status: 'SUCCESS' | 'NO_HOSPITALS_FOUND' | 'GEO_SEARCH_UNAVAILABLE';
}

export interface IHospitalDiscoveryService {
  findNearby(params: NearbySearchParams): Promise<NearbyHospitalSearchResult>;
}

export class HospitalDiscoveryService implements IHospitalDiscoveryService {
  public static readonly DEFAULT_RADIUS_METERS = 10000; // 10 km default
  public static readonly MAX_RADIUS_METERS = 50000;     // 50 km max
  public static readonly DEFAULT_LIMIT = 5;

  constructor(private readonly hospitalRepo: HospitalRepository) {}

  /**
   * Discovers nearest hospitals within configurable radius using PostGIS.
   */
  public async findNearby(params: NearbySearchParams): Promise<NearbyHospitalSearchResult> {
    const { latitude, longitude } = params;

    // 1. Coordinate Validation
    this.validateCoordinates(latitude, longitude);

    const radiusMeters = Math.min(
      Math.max(params.radiusMeters ?? HospitalDiscoveryService.DEFAULT_RADIUS_METERS, 500),
      HospitalDiscoveryService.MAX_RADIUS_METERS,
    );

    const limit = Math.min(Math.max(params.limit ?? HospitalDiscoveryService.DEFAULT_LIMIT, 1), 50);

    try {
      const rows: FacilityWithDistance[] = await this.hospitalRepo.findNearby({
        latitude,
        longitude,
        radiusMeters,
        emergencyOnly: params.emergencyOnly,
        serviceCode: params.serviceCode,
        limit,
      });

      const hospitals: DiscoveredHospitalDTO[] = rows.map((f) => ({
        id: f.id,
        name: f.name,
        displayName: f.display_name ?? f.name,
        facilityType: f.facility_type,
        ownershipType: f.ownership_type,
        address: f.address_line_1,
        locality: f.locality,
        city: (f as any).city_name ?? null,
        district: (f as any).district_name ?? null,
        state: (f as any).state_name ?? null,
        pincode: f.pincode,
        latitude: Number(f.latitude),
        longitude: Number(f.longitude),
        emergencyAvailable: Boolean(f.emergency_available),
        distanceMeters: Number(f.distance_meters),
        distanceKm: Number((f.distance_meters / 1000).toFixed(2)),
      }));

      return {
        searchPoint: { latitude, longitude },
        radiusMeters,
        totalFound: hospitals.length,
        hospitals,
        status: hospitals.length > 0 ? 'SUCCESS' : 'NO_HOSPITALS_FOUND',
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError({
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Failed to perform PostGIS geospatial hospital search',
        details: { latitude, longitude, radiusMeters },
      });
    }
  }

  private validateCoordinates(latitude: number, longitude: number): void {
    if (typeof latitude !== 'number' || isNaN(latitude) || latitude < -90 || latitude > 90) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: `Invalid latitude value: ${latitude}. Must be between -90 and 90.`,
      });
    }

    if (typeof longitude !== 'number' || isNaN(longitude) || longitude < -180 || longitude > 180) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: `Invalid longitude value: ${longitude}. Must be between -180 and 180.`,
      });
    }

    if (latitude === 0 && longitude === 0) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Null island coordinates (0, 0) are rejected.',
      });
    }
  }
}
