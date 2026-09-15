/**
 * Test Application Factory
 *
 * Creates a real Fastify app instance wired with test-safe dependencies and mock repositories.
 */

import type { FastifyInstance } from 'fastify';
import { createApp } from '../../src/app/app.js';
import { NoopLogger } from '../../src/infrastructure/logger/logger.js';
import { NullCacheClient } from '../../src/infrastructure/redis/redis.js';
import { NullStorageClient } from '../../src/infrastructure/storage/storage.js';
import { FixedClock } from '../../src/core/utils/clock.js';
import { type AppDependencies } from '../../src/app/container.js';
import { type Env } from '../../src/config/env.js';
import { DescopeClient } from '../../src/infrastructure/auth/DescopeClient.js';
import { IdentityResolver } from '../../src/modules/identity/IdentityResolver.js';
import { UserRepository } from '../../src/infrastructure/database/repositories/UserRepository.js';
import { IdentityRepository } from '../../src/infrastructure/database/repositories/IdentityRepository.js';
import { PatientRepository } from '../../src/infrastructure/database/repositories/PatientRepository.js';
import { PatientProfileService } from '../../src/modules/patient/PatientProfileService.js';
import { ConsentAuthorizer } from '../../src/modules/consent/ConsentAuthorizer.js';
import { ConsentService } from '../../src/modules/consent/ConsentService.js';
import { SessionRepository } from '../../src/infrastructure/database/repositories/SessionRepository.js';
import { SessionService } from '../../src/modules/session/SessionService.js';
import { HospitalRepository } from '../../src/infrastructure/database/repositories/HospitalRepository.js';
import { ConsentRepository } from '../../src/infrastructure/database/repositories/ConsentRepository.js';
import { AppointmentRepository } from '../../src/infrastructure/database/repositories/AppointmentRepository.js';
import { HealthRecordsRepository } from '../../src/infrastructure/database/repositories/HealthRecordsRepository.js';
import { AuditRepository } from '../../src/infrastructure/database/repositories/AuditRepository.js';
import { SyncRepository } from '../../src/infrastructure/database/repositories/SyncRepository.js';
import { KeyManagementService } from '../../src/core/security/crypto/KeyManagementService.js';
import { EncryptionService } from '../../src/core/security/crypto/EncryptionService.js';
import { EncryptedSyncService } from '../../src/modules/sync/EncryptedSyncService.js';
import { QRSessionRepository } from '../../src/infrastructure/database/repositories/QRSessionRepository.js';
import { QRSessionService } from '../../src/modules/qr/QRSessionService.js';

// ---------------------------------------------------------------------------
// Partial mock of DatabaseClient for unit tests
// ---------------------------------------------------------------------------

function createMockDb(pingResult = true): AppDependencies['db'] {
  return {
    ping: async () => pingResult,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transaction: async <T>(cb: (trx: any) => Promise<T>) => cb(null) as Promise<T>,
    query: null as unknown as AppDependencies['db']['query'],
    isConnected: pingResult,
    destroy: async () => {},
  } as unknown as AppDependencies['db'];
}

function createMockRepoKnex(): import('knex').Knex {
  const mock: any = (_table: string) => ({
    where: () => ({
      first: async () => null,
      update: async () => 1,
      del: async () => 1,
      orderBy: () => ({ first: async () => null }),
    }),
    insert: () => ({
      returning: async () => [{
        id: 'mock-uuid-v7',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
        expires_at: new Date(Date.now() + 86400000),
        absolute_expires_at: new Date(Date.now() + 86400000 * 30),
      }],
    }),
    select: () => ({
      select: () => ({
        where: () => ({
          andWhere: () => ({
            orderBy: () => ({ limit: () => ({ offset: async () => [] }) }),
          }),
        }),
      }),
    }),
    raw: (sql: string) => sql,
  });
  mock.transaction = async (cb: any) => cb(mock);
  mock.raw = (sql: string) => sql;
  return mock as import('knex').Knex;
}

// ---------------------------------------------------------------------------
// Test environment defaults
// ---------------------------------------------------------------------------

function createTestEnv(overrides: Partial<Env> = {}): Env {
  return {
    NODE_ENV: 'test',
    PORT: 0,
    HOST: '127.0.0.1',
    LOG_LEVEL: 'silent',
    API_PREFIX: '/api/v1',
    SHUTDOWN_TIMEOUT_MS: 1000,
    REQUEST_BODY_LIMIT_BYTES: 1024 * 1024,
    DATABASE_URL: 'postgresql://test:test@localhost:5433/test',
    DATABASE_POOL_MIN: 1,
    DATABASE_POOL_MAX: 3,
    DATABASE_POOL_IDLE_TIMEOUT_MS: 10000,
    DATABASE_ACQUIRE_TIMEOUT_MS: 5000,
    DATABASE_STATEMENT_TIMEOUT_MS: 10000,
    REDIS_REQUIRED: false,
    CORS_ORIGINS: ['http://localhost:8081'],
    STORAGE_PROVIDER: 'local',
    BLOCKCHAIN_PROVIDER: 'disabled',
    OTEL_SERVICE_NAME: 'bharat-pulselink-test',
    ...overrides,
  } as unknown as Env;
}

// ---------------------------------------------------------------------------
// App factory for unit tests
// ---------------------------------------------------------------------------

export async function createTestApp(options?: {
  dbPingResult?: boolean;
  envOverrides?: Partial<Env>;
  clockDate?: Date;
  depsOverrides?: Partial<AppDependencies>;
}): Promise<FastifyInstance> {
  const env = createTestEnv(options?.envOverrides);
  const logger = new NoopLogger();
  const mockKnex = createMockRepoKnex();
  const mockDb = createMockDb(options?.dbPingResult ?? true);
  const userRepo = options?.depsOverrides?.userRepo ?? new UserRepository(mockKnex);
  const identityRepo = options?.depsOverrides?.identityRepo ?? new IdentityRepository(mockKnex);
  const identityResolver = options?.depsOverrides?.identityResolver ?? new IdentityResolver(mockDb, userRepo, identityRepo, logger);
  const patientRepo = options?.depsOverrides?.patientRepo ?? new PatientRepository(mockKnex);
  const sessionRepo = options?.depsOverrides?.sessionRepo ?? new SessionRepository(mockKnex);
  const hospitalRepo = options?.depsOverrides?.hospitalRepo ?? new HospitalRepository(mockKnex);
  const consentRepo = options?.depsOverrides?.consentRepo ?? new ConsentRepository(mockKnex);
  const appointmentRepo = options?.depsOverrides?.appointmentRepo ?? new AppointmentRepository(mockKnex);
  const recordsRepo = options?.depsOverrides?.recordsRepo ?? new HealthRecordsRepository(mockKnex);
  const auditRepo = options?.depsOverrides?.auditRepo ?? new AuditRepository(mockKnex);

  const patientService = options?.depsOverrides?.patientService ?? new PatientProfileService({
    db: mockKnex,
    patientRepo,
    userRepo,
    logger,
  });

  const consentAuthorizer = options?.depsOverrides?.consentAuthorizer ?? new ConsentAuthorizer({
    consentRepo,
    logger,
  });

  const consentService = options?.depsOverrides?.consentService ?? new ConsentService({
    db: mockKnex,
    consentRepo,
    patientRepo,
    authorizer: consentAuthorizer,
    logger,
  });

  const sessionService = options?.depsOverrides?.sessionService ?? new SessionService({
    db: mockKnex,
    sessionRepo,
    userRepo,
    auditRepo,
    descopeClient: new DescopeClient(undefined, undefined, logger),
    logger,
  });

  const syncRepo = options?.depsOverrides?.syncRepo ?? new SyncRepository(mockKnex);
  const kmsService = options?.depsOverrides?.kmsService ?? new KeyManagementService();
  const encryptionService = options?.depsOverrides?.encryptionService ?? new EncryptionService(kmsService);
  const encryptedSyncService = options?.depsOverrides?.encryptedSyncService ?? new EncryptedSyncService(
    syncRepo,
    patientRepo,
    sessionRepo,
    consentAuthorizer,
    encryptionService,
    undefined as any,
    mockKnex,
  );

  const qrRepo = options?.depsOverrides?.qrRepo ?? new QRSessionRepository(mockKnex);
  const qrSessionService = options?.depsOverrides?.qrSessionService ?? new QRSessionService(
    qrRepo,
    patientRepo,
    sessionRepo,
    consentAuthorizer,
    encryptionService,
    undefined as any,
    undefined as any,
    mockKnex,
  );

  const defaultDeps: AppDependencies = {
    logger,
    db: mockDb,
    cache: new NullCacheClient(),
    storage: new NullStorageClient(),
    jobs: null,
    clock: new FixedClock(options?.clockDate ?? new Date('2025-01-01T00:00:00Z')),
    descopeClient: new DescopeClient(undefined, undefined, logger),
    identityResolver,
    patientService,
    consentAuthorizer,
    consentService,
    sessionService,
    kmsService,
    encryptionService,
    encryptedSyncService,
    qrSessionService,
    userRepo,
    identityRepo,
    patientRepo,
    sessionRepo,
    syncRepo,
    qrRepo,
    hospitalRepo,
    consentRepo,
    appointmentRepo,
    recordsRepo,
    auditRepo,
    ...options?.depsOverrides,
  };

  const app = await createApp(env, defaultDeps);
  return app;
}
