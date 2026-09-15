/**
 * HTTP Server Lifecycle
 *
 * Owns:
 * - Dependency initialization (in strict startup order)
 * - HTTP server startup
 * - Graceful shutdown on SIGTERM / SIGINT
 *
 * Startup order:
 * 1. Load + validate environment
 * 2. Initialize logger
 * 3. Initialize database (connect + ping)
 * 4. Initialize repositories
 * 5. Initialize Descope auth client
 * 6. Initialize Redis (if configured)
 * 7. Initialize job queues (if Redis available)
 * 8. Create Fastify app
 * 9. Start HTTP listener
 *
 * Owned by: Platform Foundation (Prompt 87, 88)
 */

import { type FastifyInstance } from 'fastify';
import { env, getSafeStartupInfo } from './config/env.js';
import { createLogger } from './infrastructure/logger/logger.js';
import { DatabaseClient } from './infrastructure/database/database.js';
import { RedisCacheClient, NullCacheClient, type CacheClient } from './infrastructure/redis/redis.js';
import { NullStorageClient } from './infrastructure/storage/storage.js';
import { JobQueueRegistry } from './infrastructure/jobs/queue.js';
import { systemClock } from './core/utils/clock.js';
import { DescopeClient } from './infrastructure/auth/DescopeClient.js';
import { UserRepository } from './infrastructure/database/repositories/UserRepository.js';
import { IdentityRepository } from './infrastructure/database/repositories/IdentityRepository.js';
import { IdentityResolver } from './modules/identity/IdentityResolver.js';
import { PatientRepository } from './infrastructure/database/repositories/PatientRepository.js';
import { SessionRepository } from './infrastructure/database/repositories/SessionRepository.js';
import { HospitalRepository } from './infrastructure/database/repositories/HospitalRepository.js';
import { ConsentRepository } from './infrastructure/database/repositories/ConsentRepository.js';
import { AppointmentRepository } from './infrastructure/database/repositories/AppointmentRepository.js';
import { HealthRecordsRepository } from './infrastructure/database/repositories/HealthRecordsRepository.js';
import { AuditRepository } from './infrastructure/database/repositories/AuditRepository.js';
import { DomainEventEmitter } from './infrastructure/events/DomainEventEmitter.js';
import { PatientProfileService } from './modules/patient/PatientProfileService.js';
import { ConsentAuthorizer } from './modules/consent/ConsentAuthorizer.js';
import { ConsentService } from './modules/consent/ConsentService.js';
import { SessionService } from './modules/session/SessionService.js';
import { SyncRepository } from './infrastructure/database/repositories/SyncRepository.js';
import { KeyManagementService } from './core/security/crypto/KeyManagementService.js';
import { EncryptionService } from './core/security/crypto/EncryptionService.js';
import { EncryptedSyncService } from './modules/sync/EncryptedSyncService.js';
import { QRSessionRepository } from './infrastructure/database/repositories/QRSessionRepository.js';
import { QRSessionService } from './modules/qr/QRSessionService.js';
import { IngestionRepository } from './infrastructure/database/repositories/IngestionRepository.js';
import { GovernmentHospitalIngestionService } from './modules/hospitals/GovernmentHospitalIngestionService.js';
import { RouteService } from './modules/routes/RouteService.js';
import { type AppDependencies } from './app/container.js';
import { createApp } from './app/app.js';

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------

async function start(): Promise<void> {
  // ── Step 1: Logger (first — all subsequent errors logged) ─────────────────
  const logger = createLogger({
    level: env.LOG_LEVEL,
    service: 'bharat-pulselink-api',
    environment: env.NODE_ENV,
    pretty: env.NODE_ENV === 'development',
  });

  logger.info('Bharat PulseLink API — starting', getSafeStartupInfo());

  // ── Step 2: Database ──────────────────────────────────────────────────────
  const db = new DatabaseClient(
    {
      url: env.DATABASE_URL,
      poolMin: env.DATABASE_POOL_MIN,
      poolMax: env.DATABASE_POOL_MAX,
      poolIdleTimeoutMs: env.DATABASE_POOL_IDLE_TIMEOUT_MS,
      acquireTimeoutMs: env.DATABASE_ACQUIRE_TIMEOUT_MS,
      statementTimeoutMs: env.DATABASE_STATEMENT_TIMEOUT_MS,
    },
    logger,
  );

  const dbOk = await db.ping();
  if (!dbOk) {
    logger.fatal('Database connection failed — cannot start');
    process.exit(1);
  }
  logger.info('Database connection established');

  // ── Step 3: Repositories & Auth Client ───────────────────────────────────
  const userRepo = new UserRepository(db.query);
  const identityRepo = new IdentityRepository(db.query);
  const patientRepo = new PatientRepository(db.query);
  const sessionRepo = new SessionRepository(db.query);
  const hospitalRepo = new HospitalRepository(db.query);
  const consentRepo = new ConsentRepository(db.query);
  const appointmentRepo = new AppointmentRepository(db.query);
  const recordsRepo = new HealthRecordsRepository(db.query);
  const auditRepo = new AuditRepository(db.query);

  const descopeClient = new DescopeClient(env.DESCOPE_PROJECT_ID, env.DESCOPE_MANAGEMENT_KEY, logger);
  const identityResolver = new IdentityResolver(db, userRepo, identityRepo, logger);

  // ── Step 4: Redis ─────────────────────────────────────────────────────────
  let cache: CacheClient;
  let jobRegistry: JobQueueRegistry | null = null;

  if (env.REDIS_URL) {
    const redisClient = new RedisCacheClient(env.REDIS_URL, logger);
    await redisClient.connect();
    const redisOk = await redisClient.ping();

    if (!redisOk && env.REDIS_REQUIRED) {
      logger.fatal('Redis connection failed and REDIS_REQUIRED=true — cannot start');
      process.exit(1);
    }

    if (redisOk) {
      cache = redisClient;
      jobRegistry = new JobQueueRegistry(redisClient.rawClient, logger);
      logger.info('Redis connected and job registry initialized');
    } else {
      logger.warn('Redis unavailable — using in-memory fallback (NOT suitable for production)');
      cache = new NullCacheClient();
    }
  } else {
    logger.warn('REDIS_URL not configured — using in-memory cache (development only)');
    cache = new NullCacheClient();
  }

  // ── Step 5: Storage & Events ──────────────────────────────────────────────
  const storage = new NullStorageClient();
  logger.warn('Storage using NullStorageClient — configure STORAGE_PROVIDER for production');

  const eventEmitter = new DomainEventEmitter(logger, cache);
  const patientService = new PatientProfileService({
    db: db.query,
    patientRepo,
    userRepo,
    logger,
    cache,
    eventEmitter,
  });

  const consentAuthorizer = new ConsentAuthorizer({
    consentRepo,
    logger,
    cache,
  });

  const consentService = new ConsentService({
    db: db.query,
    consentRepo,
    patientRepo,
    authorizer: consentAuthorizer,
    logger,
    eventEmitter,
  });

  const sessionService = new SessionService({
    db: db.query,
    sessionRepo,
    userRepo,
    auditRepo,
    descopeClient,
    logger,
    cache,
    eventEmitter,
  });

  const syncRepo = new SyncRepository(db.query);
  const kmsService = new KeyManagementService();
  const encryptionService = new EncryptionService(kmsService);
  const encryptedSyncService = new EncryptedSyncService(
    syncRepo,
    patientRepo,
    sessionRepo,
    consentAuthorizer,
    encryptionService,
    eventEmitter,
    db.query,
  );

  const qrRepo = new QRSessionRepository(db.query);
  const qrSessionService = new QRSessionService(
    qrRepo,
    patientRepo,
    sessionRepo,
    consentAuthorizer,
    encryptionService,
    cache,
    eventEmitter,
    db.query,
  );

  const ingestionRepo = new IngestionRepository(db.query);
  const governmentHospitalIngestionService = new GovernmentHospitalIngestionService(
    db.query,
    ingestionRepo,
    hospitalRepo,
    logger,
  );

  const routeService = new RouteService({
    logger,
  });

  // ── Step 6: Compose dependencies ─────────────────────────────────────────
  const deps: AppDependencies = {
    logger,
    db,
    cache,
    storage,
    jobs: jobRegistry,
    clock: systemClock,
    descopeClient,
    identityResolver,
    patientService,
    consentAuthorizer,
    consentService,
    sessionService,
    kmsService,
    encryptionService,
    encryptedSyncService,
    qrSessionService,
    governmentHospitalIngestionService,
    routeService,
    eventEmitter,

    userRepo,
    identityRepo,
    patientRepo,
    sessionRepo,
    syncRepo,
    qrRepo,
    hospitalRepo,
    ingestionRepo,
    consentRepo,
    appointmentRepo,
    recordsRepo,
    auditRepo,
  };

  // ── Step 7: Create Fastify app ────────────────────────────────────────────
  let app: FastifyInstance;
  try {
    app = await createApp(env, deps);
  } catch (err) {
    logger.fatal('Failed to create application', {
      error: err instanceof Error ? err.message : 'unknown',
    });
    process.exit(1);
  }

  // ── Step 8: Register graceful shutdown ────────────────────────────────────
  let isShuttingDown = false;

  const shutdown = async (signal: string): Promise<void> => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info('Graceful shutdown initiated', { signal });

    const shutdownTimer = setTimeout(() => {
      logger.fatal('Shutdown timeout exceeded — forcing exit');
      process.exit(1);
    }, env.SHUTDOWN_TIMEOUT_MS);

    try {
      await app.close();
      logger.info('HTTP server closed');

      if (jobRegistry) {
        await jobRegistry.shutdown();
      }

      if (cache instanceof RedisCacheClient) {
        await cache.quit();
      }

      await db.destroy();

      clearTimeout(shutdownTimer);
      logger.info('Shutdown complete');
      process.exit(0);
    } catch (err) {
      clearTimeout(shutdownTimer);
      logger.error('Error during shutdown', {
        error: err instanceof Error ? err.message : 'unknown',
      });
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  process.on('uncaughtException', (err) => {
    logger.fatal('Uncaught exception', { error: err.message, stack: err.stack });
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    logger.fatal('Unhandled promise rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
    });
    process.exit(1);
  });

  // ── Step 9: Start HTTP listener ───────────────────────────────────────────
  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    logger.info('HTTP server listening', {
      port: env.PORT,
      host: env.HOST,
      environment: env.NODE_ENV,
    });
  } catch (err) {
    logger.fatal('Failed to start HTTP server', {
      error: err instanceof Error ? err.message : 'unknown',
    });
    process.exit(1);
  }
}

void start();
