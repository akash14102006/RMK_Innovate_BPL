/**
 * Application Dependencies Container
 *
 * Explicit dependency composition root.
 * All domain modules receive dependencies through this container —
 * no hidden global singletons for business dependencies.
 *
 * Owned by: Platform Foundation (Prompt 87) & Phase 3 Architecture
 */

import { type Logger } from '../infrastructure/logger/logger.js';
import { type DatabaseClient } from '../infrastructure/database/database.js';
import { type CacheClient } from '../infrastructure/redis/redis.js';
import { type StorageClient } from '../infrastructure/storage/storage.js';
import { type JobQueueRegistry } from '../infrastructure/jobs/queue.js';
import { type Clock } from '../core/utils/clock.js';
import { type IDescopeClient } from '../infrastructure/auth/DescopeClient.js';
import { type IdentityResolver } from '../modules/identity/IdentityResolver.js';
import { type PatientProfileService } from '../modules/patient/PatientProfileService.js';
import { type ConsentAuthorizer } from '../modules/consent/ConsentAuthorizer.js';
import { type ConsentService } from '../modules/consent/ConsentService.js';
import { type SessionService } from '../modules/session/SessionService.js';
import { type DomainEventEmitter } from '../infrastructure/events/DomainEventEmitter.js';
import { type UserRepository } from '../infrastructure/database/repositories/UserRepository.js';
import { type IdentityRepository } from '../infrastructure/database/repositories/IdentityRepository.js';
import { type PatientRepository } from '../infrastructure/database/repositories/PatientRepository.js';
import { type SessionRepository } from '../infrastructure/database/repositories/SessionRepository.js';
import { type HospitalRepository } from '../infrastructure/database/repositories/HospitalRepository.js';
import { type ConsentRepository } from '../infrastructure/database/repositories/ConsentRepository.js';
import { type AppointmentRepository } from '../infrastructure/database/repositories/AppointmentRepository.js';
import { type HealthRecordsRepository } from '../infrastructure/database/repositories/HealthRecordsRepository.js';
import { type AuditRepository } from '../infrastructure/database/repositories/AuditRepository.js';

// ---------------------------------------------------------------------------
// Application dependencies interface
// ---------------------------------------------------------------------------

export interface AppDependencies {
  logger: Logger;
  db: DatabaseClient;
  cache: CacheClient;
  storage: StorageClient;
  jobs: JobQueueRegistry | null;
  clock: Clock;

  // Identity & Auth
  descopeClient: IDescopeClient;
  identityResolver: IdentityResolver;
  patientService: PatientProfileService;
  consentAuthorizer: ConsentAuthorizer;
  consentService: ConsentService;
  sessionService: SessionService;
  kmsService?: any;
  encryptionService?: any;
  encryptedSyncService?: any;
  qrSessionService?: any;
  routeService?: any;
  eventEmitter?: DomainEventEmitter;

  // Repositories
  userRepo: UserRepository;
  identityRepo: IdentityRepository;
  patientRepo: PatientRepository;
  sessionRepo: SessionRepository;
  syncRepo?: any;
  qrRepo?: any;
  hospitalRepo: HospitalRepository;
  ingestionRepo?: any;
  governmentHospitalIngestionService?: any;
  consentRepo: ConsentRepository;
  appointmentRepo: AppointmentRepository;
  recordsRepo: HealthRecordsRepository;
  auditRepo: AuditRepository;
}

// ---------------------------------------------------------------------------
// Request context
// Carries per-request correlation + auth context populated by middleware
// ---------------------------------------------------------------------------

export interface RequestContext {
  requestId: string;
  // Fields populated by auth middleware (Prompt 88, 92):
  userId?: string;
  descopeUserId?: string;
  sessionId?: string;
  deviceId?: string;
  roles?: string[];
  scopes?: string[];
  // Observability:
  traceId?: string;
}
