/**
 * Driving Route Fastify Routes
 *
 * Implements:
 * - POST /api/v1/routes/driving (Secure in-app traffic-aware routing)
 *
 * Owned by: In-App Navigation & Routing Domain
 */

import { z } from 'zod';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { AppDependencies } from '../../app/container.js';
import { RouteService } from './RouteService.js';

const drivingRouteBodySchema = z.object({
  origin: z.object({
    latitude: z.number({ required_error: 'origin.latitude is required' }).min(-90).max(90),
    longitude: z.number({ required_error: 'origin.longitude is required' }).min(-180).max(180),
  }),
  destination: z.object({
    latitude: z.number({ required_error: 'destination.latitude is required' }).min(-90).max(90),
    longitude: z.number({ required_error: 'destination.longitude is required' }).min(-180).max(180),
  }),
});

export async function registerRouteRoutes(
  app: FastifyInstance,
  deps: AppDependencies,
): Promise<void> {
  const routeService = (deps as any).routeService ?? new RouteService({ logger: deps.logger });

  /**
   * POST /api/v1/routes/driving
   * Computes a driving route with traffic conditions and polyline segments.
   */
  app.post(
    '/driving',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = drivingRouteBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'BAD_REQUEST',
          message: 'Invalid coordinate parameters for route computation',
          details: parsed.error.format(),
        });
      }

      const { origin, destination } = parsed.data;
      const result = await routeService.computeDrivingRoute({ origin, destination });

      return reply.send({
        success: true,
        data: {
          route: result,
        },
      });
    },
  );
}
