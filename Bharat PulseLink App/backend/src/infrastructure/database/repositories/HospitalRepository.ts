/**
 * Hospital Repository (with PostGIS Geospatial Queries)
 *
 * Implements:
 * - Hospital facility queries with relations (departments, services, contacts, operating hours)
 * - PostGIS spatial nearby query (ST_DWithin, ST_Distance in meters)
 * - Filtering by emergency care, services, and district
 *
 * Owned by: Hospital Infrastructure Domain (Prompt 94, 101, 102)
 */

import type { Knex } from 'knex';
import type {
  FacilityRow,
  FacilityContactRow,
  ServiceRow,
  DepartmentRow,
  FacilityOperatingHoursRow,
} from '../../../core/types/database.types.js';

export interface NearbyFacilitiesParams {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  emergencyOnly?: boolean;
  serviceCode?: string;
  limit?: number;
  offset?: number;
}

export interface FacilityWithDistance extends FacilityRow {
  distance_meters: number;
}

export class HospitalRepository {
  constructor(private readonly _knex: Knex) {}

  async findById(id: string, trx?: Knex.Transaction): Promise<FacilityRow | null> {
    const db = trx ?? this._knex;
    const fac = await db<FacilityRow>('facilities')
      .where({ id, status: 'ACTIVE', publication_status: 'PUBLISHED' })
      .first();
    if (fac) return fac;

    const hosp = await db('hospitals').where({ id }).first();
    if (hosp) {
      return {
        id: hosp.id,
        organization_id: null,
        name: hosp.hospital_name,
        display_name: hosp.hospital_name,
        facility_type: hosp.hospital_category || 'GENERAL_HOSPITAL',
        ownership_type: hosp.hospital_care_type || 'GOVERNMENT',
        status: 'ACTIVE',
        publication_status: 'PUBLISHED',
        verification_status: 'VERIFIED',
        address_line_1: hosp.address || hosp.district || hosp.state || 'India',
        address_line_2: null,
        landmark: null,
        locality: hosp.district,
        city_id: null,
        district_id: null,
        state_id: null,
        pincode: hosp.pincode || '000000',
        latitude: hosp.latitude,
        longitude: hosp.longitude,
        coordinate_source: 'GOVT_REGISTRY',
        emergency_available: Boolean(hosp.emergency_services && hosp.emergency_services !== '0'),
        superseded_by_facility_id: null,
        created_at: hosp.created_at || new Date(),
        updated_at: hosp.updated_at || new Date(),
      };
    }

    return null;
  }

  async getFacilityDetails(facilityId: string, trx?: Knex.Transaction): Promise<{
    facility: FacilityRow;
    contacts: FacilityContactRow[];
    services: ServiceRow[];
    departments: DepartmentRow[];
    operatingHours: FacilityOperatingHoursRow[];
  } | null> {
    const db = trx ?? this._knex;
    const facility = await this.findById(facilityId, trx);
    if (!facility) return null;

    const [contacts, services, departments, operatingHours] = await Promise.all([
      db<FacilityContactRow>('facility_contacts').where({ facility_id: facilityId }),
      db<ServiceRow>('services')
        .join('facility_services', 'services.id', 'facility_services.service_id')
        .where('facility_services.facility_id', facilityId)
        .andWhere('facility_services.status', 'AVAILABLE')
        .select('services.*'),
      db<DepartmentRow>('departments')
        .join('facility_departments', 'departments.id', 'facility_departments.department_id')
        .where('facility_departments.facility_id', facilityId)
        .andWhere('facility_departments.status', 'ACTIVE')
        .select('departments.*'),
      db<FacilityOperatingHoursRow>('facility_operating_hours')
        .where({ facility_id: facilityId })
        .orderBy('day_of_week', 'asc'),
    ]);

    return {
      facility,
      contacts,
      services,
      departments,
      operatingHours,
    };
  }

  /**
   * PostGIS Nearby Query:
   * Uses ST_DWithin on indexed geography(Point, 4326) column for sub-second spatial search,
   * ordered by calculated ST_Distance in meters.
   */
  async findNearby(params: NearbyFacilitiesParams, trx?: Knex.Transaction): Promise<FacilityWithDistance[]> {
    const db = trx ?? this._knex;
    const { latitude, longitude, radiusMeters, emergencyOnly, serviceCode, limit = 20, offset = 0 } = params;

    const userPoint = `ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography`;

    let query = db('facilities')
      .select('facilities.*')
      .select(db.raw(`ROUND(ST_Distance(facilities.location, ${userPoint})) AS distance_meters`))
      .where('facilities.status', 'ACTIVE')
      .andWhere('facilities.publication_status', 'PUBLISHED')
      .andWhere(db.raw(`ST_DWithin(facilities.location, ${userPoint}, ?)`, [radiusMeters]))
      .orderBy('distance_meters', 'asc')
      .limit(limit)
      .offset(offset);

    if (emergencyOnly) {
      query = query.andWhere('facilities.emergency_available', true);
    }

    if (serviceCode) {
      query = query.whereExists(function () {
        this.select('*')
          .from('facility_services')
          .join('services', 'services.id', 'facility_services.service_id')
          .whereRaw('facility_services.facility_id = facilities.id')
          .andWhere('services.code', serviceCode)
          .andWhere('facility_services.status', 'AVAILABLE');
      });
    }

    return query;
  }

  /**
   * PostGIS Nearby Query on public.hospitals (Ingested MoHFW National Directory)
   * or public.facilities (Canonical Schema).
   * Parameterized ST_DWithin and ST_Distance using GiST spatial index.
   */
  async findNearbyHospitals(params: {
    lat: number;
    lng: number;
    radius?: number;
    limit?: number;
  }, trx?: Knex.Transaction): Promise<Array<{
    id: string;
    hospital_name: string;
    state: string | null;
    district: string | null;
    pincode: string | null;
    hospital_category: string | null;
    hospital_care_type: string | null;
    specialties: string | null;
    facilities: string | null;
    emergency_services: string | null;
    website: string | null;
    latitude: number;
    longitude: number;
    distance_meters: number;
  }>> {
    const db = trx ?? this._knex;
    const { lat, lng, radius = 10000, limit = 20 } = params;

    // Validate coordinates
    if (
      lat === undefined ||
      lng === undefined ||
      isNaN(lat) ||
      isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return [];
    }

    try {
      // 1. Try querying public.hospitals if table exists
      const hasHospitalsTable = await db.schema.hasTable('hospitals').catch(() => false);
      if (hasHospitalsTable) {
        const countRow = await db('hospitals').count('* as total').first().catch(() => null);
        const count = Number((countRow as any)?.total || 0);

        if (count > 0) {
          const hasQualityCol = await db.schema.hasColumn('hospitals', 'coordinate_quality_status').catch(() => false);

          let query = db('hospitals')
            .select(
              'id',
              'hospital_name',
              'state',
              'district',
              'pincode',
              'hospital_category',
              'hospital_care_type',
              'specialties',
              'facilities',
              'emergency_services',
              'website',
              'latitude',
              'longitude',
              db.raw(
                'ROUND(ST_Distance(location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography)) AS distance_meters',
                [lng, lat]
              )
            )
            .whereNotNull('location')
            .whereNotNull('latitude')
            .whereNotNull('longitude')
            .andWhereRaw(
              'ST_DWithin(location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)',
              [lng, lat, radius]
            );

          if (hasQualityCol) {
            query = query.andWhere(function () {
              this.where('coordinate_quality_status', 'VALID_COORDINATE').orWhereNull('coordinate_quality_status');
            });
          }

          const rows = await query.orderBy('distance_meters', 'asc').limit(limit);
          if (rows && rows.length > 0) {
            return rows.map((r: any) => ({
              id: String(r.id),
              hospital_name: r.hospital_name || 'Hospital',
              state: r.state || null,
              district: r.district || null,
              pincode: r.pincode || null,
              hospital_category: r.hospital_category || null,
              hospital_care_type: r.hospital_care_type || null,
              specialties: r.specialties || null,
              facilities: r.facilities || null,
              emergency_services: r.emergency_services || null,
              website: r.website || null,
              latitude: Number(r.latitude),
              longitude: Number(r.longitude),
              distance_meters: Number(r.distance_meters || 0),
            }));
          }
        }
      }

      // 2. Query canonical public.facilities table if hospitals is absent or has 0 results
      const hasFacilitiesTable = await db.schema.hasTable('facilities').catch(() => false);
      if (hasFacilitiesTable) {
        const facRows = await db('facilities')
          .select(
            'id',
            'name as hospital_name',
            'locality as district',
            'pincode',
            'facility_type as hospital_category',
            'ownership_type as hospital_care_type',
            'latitude',
            'longitude',
            'emergency_available',
            db.raw(
              'ROUND(ST_Distance(location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography)) AS distance_meters',
              [lng, lat]
            )
          )
          .where('status', 'ACTIVE')
          .whereNotNull('location')
          .whereNotNull('latitude')
          .whereNotNull('longitude')
          .andWhereRaw(
            'ST_DWithin(location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)',
            [lng, lat, radius]
          )
          .orderBy('distance_meters', 'asc')
          .limit(limit);

        return (facRows || []).map((f: any) => ({
          id: String(f.id),
          hospital_name: f.hospital_name || 'Hospital',
          state: null,
          district: f.district || null,
          pincode: f.pincode || null,
          hospital_category: f.hospital_category || null,
          hospital_care_type: f.hospital_care_type || null,
          specialties: null,
          facilities: null,
          emergency_services: f.emergency_available ? '24x7 Emergency Services' : null,
          website: null,
          latitude: Number(f.latitude),
          longitude: Number(f.longitude),
          distance_meters: Number(f.distance_meters || 0),
        }));
      }

      return [];
    } catch (err) {
      return [];
    }
  }

  /**
   * Search / List Facilities
   */
  async searchFacilities(
    params: {
      query?: string;
      state?: string;
      district?: string;
      facilityType?: string;
      emergencyOnly?: boolean;
      limit?: number;
      offset?: number;
    },
    trx?: Knex.Transaction,
  ): Promise<FacilityRow[]> {
    const db = trx ?? this._knex;
    const { query, state, district, facilityType, emergencyOnly, limit = 20, offset = 0 } = params;

    let dbQuery = db<FacilityRow>('facilities')
      .where({ status: 'ACTIVE', publication_status: 'PUBLISHED' })
      .limit(limit)
      .offset(offset)
      .orderBy('name', 'asc');

    if (query) {
      dbQuery = dbQuery.andWhereILike('name', `%${query}%`);
    }
    if (state) {
      dbQuery = dbQuery.andWhere('state', state);
    }
    if (district) {
      dbQuery = dbQuery.andWhere('district', district);
    }
    if (emergencyOnly) {
      dbQuery = dbQuery.andWhere({ emergency_available: true });
    }
    if (facilityType) {
      dbQuery = dbQuery.andWhere({ facility_type: facilityType });
    }

    return dbQuery;
  }
}
