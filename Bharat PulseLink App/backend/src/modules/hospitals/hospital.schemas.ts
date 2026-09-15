/**
 * Hospital & Ingestion Route Schemas
 *
 * Validates request query/body parameters for:
 * - GET /hospitals/nearby (PostGIS location, radius, emergency filters)
 * - GET /hospitals (directory catalog search)
 * - GET /hospitals/:id (facility details)
 * - POST /admin/ingestion/government-hospitals (ingestion / dry-run execution)
 *
 * Owned by: Hospital Domain (Prompt 95, 103, 104)
 */

import { z } from 'zod';

export const nearbyHospitalsQuerySchema = z
  .object({
    lat: z.coerce.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90').optional(),
    lng: z.coerce.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180').optional(),
    latitude: z.coerce.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90').optional(),
    longitude: z.coerce.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180').optional(),
    radius: z.coerce.number().positive('Radius must be a positive number').max(100000, 'Radius cannot exceed 100,000 meters').optional(),
    radiusMeters: z.coerce.number().positive('Radius must be a positive number').max(100000, 'Radius cannot exceed 100,000 meters').optional(),
    emergencyOnly: z.coerce.boolean().optional().default(false),
    serviceCode: z.string().optional(),
    limit: z.coerce.number().int('Limit must be an integer').min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
    offset: z.coerce.number().int('Offset must be an integer').min(0).default(0),
  })
  .transform((data) => {
    const lat = data.lat ?? data.latitude;
    const lng = data.lng ?? data.longitude;
    const radius = data.radius ?? data.radiusMeters ?? 10000;

    return {
      lat,
      lng,
      latitude: lat,
      longitude: lng,
      radius,
      radiusMeters: radius,
      emergencyOnly: data.emergencyOnly,
      serviceCode: data.serviceCode,
      limit: data.limit,
      offset: data.offset,
    };
  })
  .refine((data) => data.lat !== undefined && !Number.isNaN(data.lat), {
    message: 'Valid latitude is required (lat or latitude between -90 and 90)',
    path: ['lat'],
  })
  .refine((data) => data.lng !== undefined && !Number.isNaN(data.lng), {
    message: 'Valid longitude is required (lng or longitude between -180 and 180)',
    path: ['lng'],
  });

export type NearbyHospitalsQuery = z.infer<typeof nearbyHospitalsQuerySchema>;

export const listHospitalsQuerySchema = z.object({
  query: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  facilityType: z.string().optional(),
  emergencyOnly: z.coerce.boolean().optional().default(false),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export type ListHospitalsQuery = z.infer<typeof listHospitalsQuerySchema>;

export const triggerIngestionBodySchema = z.object({
  filePath: z.string().optional(),
  dryRun: z.boolean().optional().default(false),
  maxRows: z.number().int().positive().optional(),
});

export type TriggerIngestionBody = z.infer<typeof triggerIngestionBodySchema>;
