/**
 * V1 API Route Registration
 *
 * Central registration point for all /api/v1/* routes.
 * Each domain module registers its own router here.
 *
 * Owned by: Platform Foundation & Domain Modules (Prompt 87, 88+)
 */

import { type FastifyInstance } from 'fastify';
import { type AppDependencies } from '../../container.js';
import { type Env } from '../../../config/env.js';
import { registerAuthRoutes } from '../../../modules/auth/index.js';
import { registerPatientRoutes } from '../../../modules/patient/index.js';
import { registerConsentRoutes } from '../../../modules/consent/index.js';
import { registerSessionRoutes } from '../../../modules/session/index.js';
import { syncRoutes } from '../../../modules/sync/index.js';
import { registerQrRoutes } from '../../../modules/qr/index.js';
import { registerHospitalRoutes } from '../../../modules/hospitals/index.js';
import { registerRouteRoutes } from '../../../modules/routes/index.js';
import { registerIvrRoutes } from '../../../modules/ivr/index.js';

export async function registerV1Routes(
  app: FastifyInstance,
  _env: Env,
  deps: AppDependencies,
): Promise<void> {
  // Register all domain routes under /api/v1 prefix
  await app.register(
    async (v1: FastifyInstance) => {
      // ── Auth Module (Prompt 88) ───────────────────────────────────────────
      await v1.register(
        async (authRouter: FastifyInstance) => {
          await registerAuthRoutes(authRouter, deps);
        },
        { prefix: '/auth' },
      );

      // ── Patient Module (Prompt 90) ────────────────────────────────────────
      await v1.register(
        async (patientRouter: FastifyInstance) => {
          await registerPatientRoutes(patientRouter, deps);
        },
      );

      // ── Consent Module (Prompt 91) ────────────────────────────────────────
      await v1.register(
        async (consentRouter: FastifyInstance) => {
          await registerConsentRoutes(consentRouter, deps);
        },
      );

      // ── Session & Security Module (Prompt 92) ─────────────────────────────
      await v1.register(
        async (sessionRouter: FastifyInstance) => {
          await registerSessionRoutes(sessionRouter, deps);
        },
      );

      // ── Sync & Encryption Module (Prompt 93) ──────────────────────────────
      if ((deps as any).encryptedSyncService) {
        await v1.register(
          async (syncRouter: FastifyInstance) => {
            await syncRoutes(syncRouter, deps);
          },
          { prefix: '/me/sync' },
        );
      }

      // ── QR Sessions Module (Prompt 107) ───────────────────────────────────
      if ((deps as any).qrSessionService) {
        await v1.register(
          async (qrRouter: FastifyInstance) => {
            await registerQrRoutes(qrRouter, deps);
          },
        );
      }

      // ── Hospital & Ingestion Module (Prompt 94, 95) ───────────────────────
      await v1.register(
        async (hospitalRouter: FastifyInstance) => {
          await registerHospitalRoutes(hospitalRouter, deps);
        },
        { prefix: '/hospitals' },
      );

      // ── Routes & Directions Module (Traffic-Aware Routing) ────────────────
      await v1.register(
        async (routesRouter: FastifyInstance) => {
          await registerRouteRoutes(routesRouter, deps);
        },
        { prefix: '/routes' },
      );

      // ── IVR Internal Telephony Module ─────────────────────────────────────
      await v1.register(
        async (ivrRouter: FastifyInstance) => {
          await registerIvrRoutes(ivrRouter, deps);
        },
        { prefix: '/internal/ivr' },
      );

      // Defensive compatibility alias for clients with redundant /api/v1 base URL prefix
      await v1.register(
        async (routesRouter: FastifyInstance) => {
          await registerRouteRoutes(routesRouter, deps);
        },
        { prefix: '/api/v1/routes' },
      );

      // TODO(Prompt 106): await registerAppointmentRoutes(appointmentRouter, deps);
      // TODO(Prompt 108): await registerExchangeRoutes(exchangeRouter, deps);
      // TODO(Prompt 109): await registerCheckinRoutes(checkinRouter, deps);
      // TODO(Prompt 110): await registerRecordsRoutes(recordsRouter, deps);
      // TODO(Prompt 114): await registerNotificationRoutes(notificationRouter, deps);

      deps.logger.info('V1 API routes registered', { prefix: '/api/v1' });
    },
    { prefix: '/api/v1' },
  );
}
