/**
 * Hospital & Ingestion Fastify Routes
 *
 * Exposes:
 * - Public Healthcare Discovery Endpoints:
 *   - GET /api/v1/hospitals/nearby (PostGIS dynamic spatial search)
 *   - GET /api/v1/hospitals/:id (Sanitized facility details)
 *   - GET /api/v1/hospitals (Catalog search)
 * - Administrative Data Ingestion Endpoints:
 *   - POST /api/v1/admin/ingestion/government-hospitals (Trigger ingestion/dry-run)
 *   - GET /api/v1/admin/ingestion/batches/:id (Get batch status & validation issues)
 *   - GET /api/v1/admin/ingestion/batches (List recent ingestion runs)
 *
 * Owned by: Hospital Domain (Prompt 95, 103, 104)
 */

import { type FastifyInstance, type FastifyRequest, type FastifyReply } from 'fastify';
import type { AppDependencies } from '../../app/container.js';
import {
  nearbyHospitalsQuerySchema,
  listHospitalsQuerySchema,
  triggerIngestionBodySchema,
} from './hospital.schemas.js';

function normalizeHealthcareAttribute(val: string | null | undefined): string | null {
  if (val === undefined || val === null) return null;
  const trimmed = String(val).trim();
  if (
    trimmed === '' ||
    trimmed === '0' ||
    trimmed === 'NA' ||
    trimmed === 'N/A' ||
    trimmed === '-' ||
    trimmed === '--' ||
    trimmed.toLowerCase() === 'unknown' ||
    trimmed.toLowerCase() === 'null'
  ) {
    return null;
  }
  return trimmed;
}

export async function registerHospitalRoutes(
  app: FastifyInstance,
  deps: AppDependencies,
): Promise<void> {
  const hospitalRepo = deps.hospitalRepo;
  const ingestionRepo = (deps as any).ingestionRepo;
  const ingestionService = (deps as any).governmentHospitalIngestionService;

  // ── Public Discovery APIs ──────────────────────────────────────────────────

  /**
   * GET /api/v1/hospitals/nearby
   * Real PostGIS spatial distance query on indexed public.hospitals (location column).
   */
  app.get(
    '/nearby',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = nearbyHospitalsQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'BAD_REQUEST',
          message: 'Invalid coordinate or query parameters for nearby hospitals search',
          details: parsed.error.format(),
        });
      }

      const results = await hospitalRepo.findNearbyHospitals({
        lat: parsed.data.lat!,
        lng: parsed.data.lng!,
        radius: parsed.data.radius,
        limit: parsed.data.limit,
      });

      const items = results.map((h: any) => ({
        id: h.id,
        name: h.hospital_name || h.hospitalName || h.name,
        hospitalName: h.hospital_name || h.hospitalName || h.name,
        state: h.state,
        district: h.district,
        pincode: h.pincode,
        hospitalCategory: normalizeHealthcareAttribute(h.hospital_category || h.hospitalCategory),
        hospitalCareType: normalizeHealthcareAttribute(h.hospital_care_type || h.hospitalCareType),
        specialties: normalizeHealthcareAttribute(h.specialties),
        facilities: normalizeHealthcareAttribute(h.facilities),
        emergencyServices: normalizeHealthcareAttribute(h.emergency_services || h.emergencyServices),
        website: normalizeHealthcareAttribute(h.website),
        latitude: Number(h.latitude),
        longitude: Number(h.longitude),
        distanceMeters: Number(h.distance_meters ?? h.distanceMeters ?? 0),
        distanceKm: Number(((Number(h.distance_meters ?? h.distanceMeters ?? 0)) / 1000).toFixed(1)),
      }));

      return reply.send({
        data: items,
        meta: {
          latitude: parsed.data.lat,
          longitude: parsed.data.lng,
          radiusMeters: parsed.data.radius,
          limit: parsed.data.limit,
          count: items.length,
        },
      });
    },
  );

  /**
   * GET /api/v1/hospitals/:id
   * Sanitized facility details with contacts, services, departments, operating hours.
   */
  app.get(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      const details = await hospitalRepo.getFacilityDetails(id);

      if (!details) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'NOT_FOUND',
          message: `Facility with ID ${id} was not found or is unpublished`,
        });
      }

      const { facility, contacts, services, departments, operatingHours } = details;

      // Patient-safe sanitized DTO: strictly excluding private nodal contact info
      return reply.send({
        id: facility.id,
        name: facility.name,
        displayName: facility.display_name,
        facilityType: facility.facility_type,
        ownershipType: facility.ownership_type,
        status: facility.status,
        address: {
          line1: facility.address_line_1,
          line2: facility.address_line_2,
          landmark: facility.landmark,
          locality: facility.locality,
          pincode: facility.pincode,
        },
        coordinates: {
          latitude: facility.latitude,
          longitude: facility.longitude,
          source: facility.coordinate_source,
        },
        emergencyAvailable: facility.emergency_available,
        contacts: contacts.map((c) => ({
          type: c.contact_type,
          phone: c.phone,
          email: c.email,
          isTollFree: c.is_toll_free,
          isPrimary: c.is_primary,
          note: c.operating_hours_note,
        })),
        services: services.map((s) => ({
          code: s.code,
          name: s.name,
          category: s.category,
          description: s.description,
        })),
        departments: departments.map((d) => ({
          code: d.code,
          name: d.name,
          description: d.description,
        })),
        operatingHours: operatingHours.map((h) => ({
          dayOfWeek: h.day_of_week,
          openTime: h.open_time,
          closeTime: h.close_time,
          is24x7: h.is_24x7,
          isClosed: h.is_closed,
        })),
      });
    },
  );

  /**
   * GET /api/v1/hospitals
   * Catalog search by state, district, or hospital name.
   */
  app.get(
    '/',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = listHospitalsQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'BAD_REQUEST',
          message: 'Invalid query parameters for hospitals list',
          details: parsed.error.format(),
        });
      }

      const { query, state, district, facilityType, emergencyOnly, limit, offset } = parsed.data;

      const rows = await hospitalRepo.searchFacilities({
        query,
        state,
        district,
        facilityType,
        emergencyOnly,
        limit,
        offset,
      });

      return reply.send({
        data: rows.map((r: any) => ({
          id: r.id,
          name: r.name,
          displayName: r.display_name,
          facilityType: r.facility_type,
          ownershipType: r.ownership_type,
          address: r.address_line_1,
          locality: r.locality,
          pincode: r.pincode,
          latitude: r.latitude,
          longitude: r.longitude,
          emergencyAvailable: r.emergency_available,
        })),
        meta: {
          limit,
          offset,
          count: rows.length,
        },
      });
    },
  );

  // ── Administrative Ingestion APIs ──────────────────────────────────────────

  /**
   * POST /api/v1/admin/ingestion/government-hospitals
   * Triggers government hospital CSV ingestion or dry run.
   */
  app.post(
    '/admin/ingestion/government-hospitals',
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!ingestionService) {
        return reply.status(503).send({
          statusCode: 503,
          error: 'SERVICE_UNAVAILABLE',
          message: 'Government Hospital Ingestion Service is not configured',
        });
      }

      const parsed = triggerIngestionBodySchema.safeParse(request.body ?? {});
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'BAD_REQUEST',
          message: 'Invalid ingestion parameters',
          details: parsed.error.format(),
        });
      }

      const defaultFilePath = 'c:/Users/akash/Downloads/hospital_directory.csv';
      const targetPath = parsed.data.filePath ?? defaultFilePath;

      const report = await ingestionService.ingest(targetPath, {
        dryRun: parsed.data.dryRun,
        maxRows: parsed.data.maxRows,
      });

      return reply.send({
        data: report,
      });
    },
  );

  /**
   * GET /api/v1/admin/ingestion/batches/:id
   * Returns batch status and validation issues.
   */
  app.get(
    '/admin/ingestion/batches/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      if (!ingestionRepo) {
        return reply.status(503).send({
          statusCode: 503,
          error: 'SERVICE_UNAVAILABLE',
          message: 'Ingestion Repository is not configured',
        });
      }

      const { id } = request.params;
      const batch = await ingestionRepo.getBatchById(id);

      if (!batch) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'NOT_FOUND',
          message: `Ingestion batch ${id} not found`,
        });
      }

      const issues = await ingestionRepo.getValidationIssuesByBatch(id, 100);

      return reply.send({
        batch,
        validationIssues: issues,
      });
    },
  );

  /**
   * GET /api/v1/admin/ingestion/batches
   * Lists recent ingestion batches.
   */
  app.get(
    '/admin/ingestion/batches',
    async (_request: FastifyRequest, reply: FastifyReply) => {
      if (!ingestionRepo) {
        return reply.status(503).send({
          statusCode: 503,
          error: 'SERVICE_UNAVAILABLE',
          message: 'Ingestion Repository is not configured',
        });
      }

      const batches = await ingestionRepo.listBatches(20);
      return reply.send({ data: batches });
    },
  );
}
