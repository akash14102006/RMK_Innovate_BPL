/**
 * Patient Profile Service
 *
 * Implements canonical business logic for patient profile management,
 * optimistic concurrency control, section updates, deterministic completion,
 * audit logging, real-time invalidation, and IDOR protection.
 *
 * Owned by: Patient Domain (Prompt 90)
 */

import type { Knex } from 'knex';
import { AppError, ErrorCode } from '../../core/errors/AppError.js';
import type { Logger } from '../../infrastructure/logger/logger.js';
import type { CacheClient } from '../../infrastructure/redis/redis.js';
import type { DomainEventEmitter } from '../../infrastructure/events/DomainEventEmitter.js';
import type { PatientRepository } from '../../infrastructure/database/repositories/PatientRepository.js';
import type { UserRepository } from '../../infrastructure/database/repositories/UserRepository.js';
import { PatientCompletionEngine } from './PatientCompletionEngine.js';
import {
  toPatientProfileDTO,
  toProfileSummaryDTO,
  type PatientProfileResponseDTO,
  type ProfileSummaryDTO,
  type ProfileCompletionDTO,
} from './patient.schemas.js';
import type {
  PatientProfileRow,
  GenderType,
  BloodGroupType,
  SmokingStatusType,
  AlcoholStatusType,
  ActivityLevelType,
  AllergySeverityType,
} from '../../core/types/database.types.js';

export interface PatientProfileServiceDeps {
  db: Knex;
  patientRepo: PatientRepository;
  userRepo: UserRepository;
  logger: Logger;
  cache?: CacheClient | null;
  eventEmitter?: DomainEventEmitter | null;
}

export class PatientProfileService {
  private readonly _db: Knex;
  private readonly _patientRepo: PatientRepository;
  private readonly _userRepo: UserRepository;
  private readonly _logger: Logger;
  private readonly _eventEmitter?: DomainEventEmitter | null;

  constructor(deps: PatientProfileServiceDeps) {
    this._db = deps.db;
    this._patientRepo = deps.patientRepo;
    this._userRepo = deps.userRepo;
    this._logger = deps.logger.child({ module: 'patient-profile-service' });
    this._eventEmitter = deps.eventEmitter;
  }

  /**
   * Retrieves canonical patient profile for the authenticated user.
   */
  async getProfileByUserId(userId: string): Promise<PatientProfileResponseDTO> {
    const profile = await this._patientRepo.findByUserId(userId);
    if (!profile) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: 'Patient profile not found for this account',
      });
    }

    return this._buildFullProfileDTO(profile);
  }

  /**
   * Atomically gets or creates the initial profile for an authenticated user.
   */
  async getOrCreateProfile(
    userId: string,
    initialData?: {
      fullName?: string;
      gender?: GenderType;
      dateOfBirth?: string;
      primaryPhone?: string | null;
      primaryEmail?: string | null;
    },
  ): Promise<PatientProfileResponseDTO> {
    const existing = await this._patientRepo.findByUserId(userId);
    if (existing) {
      return this._buildFullProfileDTO(existing);
    }

    // Verify canonical user exists
    const user = await this._userRepo.findById(userId);
    if (!user) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: 'User account not found',
      });
    }

    try {
      const created = await this._db.transaction(async (trx) => {
        return this._patientRepo.createProfile(
          {
            user_id: userId,
            full_name: initialData?.fullName ?? 'Patient',
            gender: initialData?.gender ?? 'UNDISCLOSED',
            date_of_birth: initialData?.dateOfBirth ?? '1990-01-01',
            primary_phone: initialData?.primaryPhone ?? null,
            primary_email: initialData?.primaryEmail ?? null,
            status: 'INCOMPLETE',
            version: 1,
          },
          trx,
        );
      });

      this._logger.info('patient_profile_created', { patientId: created.id, userId });
      this._emitProfileEvent('patient.profile.updated', created.id, userId, created.version);

      return this._buildFullProfileDTO(created);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error?.code === '23505' || error?.message?.includes('duplicate key')) {
        const recheck = await this._patientRepo.findByUserId(userId);
        if (recheck) {
          return this._buildFullProfileDTO(recheck);
        }
      }
      throw err;
    }
  }

  /**
   * Updates patient profile fields with optimistic concurrency control.
   */
  async updateProfile(
    userId: string,
    data: {
      fullName?: string;
      preferredName?: string | null;
      gender?: GenderType;
      dateOfBirth?: string;
      bloodGroup?: BloodGroupType | null;
      maritalStatus?: string | null;
      occupation?: string | null;
      primaryPhone?: string | null;
      primaryEmail?: string | null;
      addressLine1?: string | null;
      addressLine2?: string | null;
      locality?: string | null;
      cityId?: string | null;
      districtId?: string | null;
      stateId?: string | null;
      pincode?: string | null;
      abhaId?: string | null;
      heightCm?: number | null;
      weightKg?: number | null;
      smokingStatus?: SmokingStatusType | null;
      alcoholStatus?: AlcoholStatusType | null;
      activityLevel?: ActivityLevelType | null;
      sleepPattern?: string | null;
      expectedVersion?: number;
    },
  ): Promise<PatientProfileResponseDTO> {
    const profile = await this._patientRepo.findByUserId(userId);
    if (!profile) {
      throw new AppError({
        code: ErrorCode.NOT_FOUND,
        message: 'Patient profile not found',
      });
    }

    if (data.expectedVersion !== undefined && profile.version !== data.expectedVersion) {
      throw new AppError({
        code: ErrorCode.CONFLICT,
        message: `Profile has been modified concurrently (client version: ${data.expectedVersion}, current version: ${profile.version})`,
      });
    }

    const updated = await this._patientRepo.updateProfile(profile.id, {
      full_name: data.fullName,
      preferred_name: data.preferredName,
      gender: data.gender,
      date_of_birth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      blood_group: data.bloodGroup,
      marital_status: data.maritalStatus,
      occupation: data.occupation,
      primary_phone: data.primaryPhone,
      primary_email: data.primaryEmail,
      address_line_1: data.addressLine1,
      address_line_2: data.addressLine2,
      locality: data.locality,
      city_id: data.cityId,
      district_id: data.districtId,
      state_id: data.stateId,
      pincode: data.pincode,
      abha_id: data.abhaId,
      height_cm: data.heightCm,
      weight_kg: data.weightKg,
      smoking_status: data.smokingStatus,
      alcohol_status: data.alcoholStatus,
      activity_level: data.activityLevel,
      sleep_pattern: data.sleepPattern,
      expectedVersion: data.expectedVersion,
    });

    if (!updated) {
      throw new AppError({
        code: ErrorCode.CONFLICT,
        message: 'Conflict during profile update; please reload and try again.',
      });
    }

    this._logger.info('patient_profile_updated', {
      patientId: updated.id,
      userId,
      version: updated.version,
    });
    this._emitProfileEvent('patient.profile.updated', updated.id, userId, updated.version);

    return this._buildFullProfileDTO(updated);
  }

  /**
   * Updates patient-reported conditions in a transaction.
   */
  async updateConditions(
    userId: string,
    conditions: Array<{
      conditionName: string;
      diagnosedYear?: number | null;
      status?: 'ACTIVE' | 'MANAGED' | 'RESOLVED';
      notes?: string | null;
    }>,
    expectedVersion?: number,
  ): Promise<PatientProfileResponseDTO> {
    const profile = await this._patientRepo.findByUserId(userId);
    if (!profile) {
      throw new AppError({ code: ErrorCode.NOT_FOUND, message: 'Profile not found' });
    }

    if (expectedVersion !== undefined && profile.version !== expectedVersion) {
      throw new AppError({
        code: ErrorCode.CONFLICT,
        message: `Profile has been modified concurrently (expected version: ${expectedVersion}, actual: ${profile.version})`,
      });
    }

    await this._db.transaction(async (trx) => {
      await this._patientRepo.replaceConditions(
        profile.id,
        conditions.map((c) => ({
          condition_name: c.conditionName,
          diagnosed_year: c.diagnosedYear,
          status: c.status,
          notes: c.notes,
        })),
        trx,
      );
      await this._patientRepo.updateProfile(profile.id, { expectedVersion }, trx);
    });

    const updatedProfile = (await this._patientRepo.findById(profile.id))!;
    this._emitProfileEvent('patient.profile.updated', profile.id, userId, updatedProfile.version);
    return this._buildFullProfileDTO(updatedProfile);
  }

  /**
   * Updates patient-reported allergies in a transaction.
   */
  async updateAllergies(
    userId: string,
    allergies: Array<{
      substance: string;
      reaction?: string | null;
      severity?: AllergySeverityType;
      status?: 'ACTIVE' | 'RESOLVED' | 'INACTIVE';
    }>,
    expectedVersion?: number,
  ): Promise<PatientProfileResponseDTO> {
    const profile = await this._patientRepo.findByUserId(userId);
    if (!profile) {
      throw new AppError({ code: ErrorCode.NOT_FOUND, message: 'Profile not found' });
    }

    if (expectedVersion !== undefined && profile.version !== expectedVersion) {
      throw new AppError({
        code: ErrorCode.CONFLICT,
        message: `Profile has been modified concurrently (expected version: ${expectedVersion}, actual: ${profile.version})`,
      });
    }

    await this._db.transaction(async (trx) => {
      await this._patientRepo.replaceAllergies(
        profile.id,
        allergies.map((a) => ({
          substance: a.substance,
          reaction: a.reaction,
          severity: a.severity,
          status: a.status,
        })),
        trx,
      );
      await this._patientRepo.updateProfile(profile.id, { expectedVersion }, trx);
    });

    const updatedProfile = (await this._patientRepo.findById(profile.id))!;
    this._emitProfileEvent('patient.profile.updated', profile.id, userId, updatedProfile.version);
    return this._buildFullProfileDTO(updatedProfile);
  }

  /**
   * Updates patient-reported surgical history in a transaction.
   */
  async updateSurgeries(
    userId: string,
    surgeries: Array<{
      procedureName: string;
      approximateYear?: number | null;
      hospitalName?: string | null;
      notes?: string | null;
    }>,
    expectedVersion?: number,
  ): Promise<PatientProfileResponseDTO> {
    const profile = await this._patientRepo.findByUserId(userId);
    if (!profile) {
      throw new AppError({ code: ErrorCode.NOT_FOUND, message: 'Profile not found' });
    }

    if (expectedVersion !== undefined && profile.version !== expectedVersion) {
      throw new AppError({
        code: ErrorCode.CONFLICT,
        message: `Profile has been modified concurrently (expected version: ${expectedVersion}, actual: ${profile.version})`,
      });
    }

    await this._db.transaction(async (trx) => {
      await this._patientRepo.replaceSurgeries(
        profile.id,
        surgeries.map((s) => ({
          procedure_name: s.procedureName,
          approximate_year: s.approximateYear,
          hospital_name: s.hospitalName,
          notes: s.notes,
        })),
        trx,
      );
      await this._patientRepo.updateProfile(profile.id, { expectedVersion }, trx);
    });

    const updatedProfile = (await this._patientRepo.findById(profile.id))!;
    this._emitProfileEvent('patient.profile.updated', profile.id, userId, updatedProfile.version);
    return this._buildFullProfileDTO(updatedProfile);
  }

  /**
   * Evaluates and marks profile as completed (server-authoritative).
   */
  async completeProfile(userId: string, expectedVersion?: number): Promise<PatientProfileResponseDTO> {
    const profile = await this._patientRepo.findByUserId(userId);
    if (!profile) {
      throw new AppError({ code: ErrorCode.NOT_FOUND, message: 'Profile not found' });
    }

    if (expectedVersion !== undefined && profile.version !== expectedVersion) {
      throw new AppError({
        code: ErrorCode.CONFLICT,
        message: `Profile has been modified concurrently (expected: ${expectedVersion}, actual: ${profile.version})`,
      });
    }

    // Load related items for validation
    const [emergencyContacts, insurance] = await Promise.all([
      this._patientRepo.getEmergencyContacts(profile.id),
      this._patientRepo.getInsuranceProfiles(profile.id),
    ]);

    const completion = PatientCompletionEngine.evaluate(profile, emergencyContacts, insurance);

    if (!completion.isComplete) {
      throw new AppError({
        code: ErrorCode.PROFILE_INCOMPLETE,
        message: `Profile completion failed: ${completion.missingRequirements.join('; ')}`,
        issues: completion.missingRequirements.map((req) => ({
          code: 'PROFILE_INCOMPLETE',
          field: 'profile',
          message: req,
        })),
      });
    }

    if (profile.status === 'COMPLETE') {
      // Idempotent return
      return this._buildFullProfileDTO(profile);
    }

    const updated = await this._patientRepo.updateStatus(profile.id, 'COMPLETE', new Date());
    if (!updated) {
      throw new AppError({
        code: ErrorCode.CONFLICT,
        message: 'Could not complete profile due to a concurrent update',
      });
    }

    this._logger.info('patient_profile_completed', {
      patientId: updated.id,
      userId,
      version: updated.version,
    });
    this._emitProfileEvent('patient.profile.completed', updated.id, userId, updated.version);

    return this._buildFullProfileDTO(updated);
  }

  /**
   * Calculates completion evaluation without changing state.
   */
  async getCompletionStatus(userId: string): Promise<ProfileCompletionDTO> {
    const profile = await this._patientRepo.findByUserId(userId);
    if (!profile) {
      throw new AppError({ code: ErrorCode.NOT_FOUND, message: 'Profile not found' });
    }

    const [emergencyContacts, insurance] = await Promise.all([
      this._patientRepo.getEmergencyContacts(profile.id),
      this._patientRepo.getInsuranceProfiles(profile.id),
    ]);

    return PatientCompletionEngine.evaluate(profile, emergencyContacts, insurance);
  }

  /**
   * Lightweight profile summary for home dashboard and navigation.
   */
  async getProfileSummary(userId: string): Promise<ProfileSummaryDTO> {
    const profile = await this._patientRepo.findByUserId(userId);
    if (!profile) {
      throw new AppError({ code: ErrorCode.NOT_FOUND, message: 'Profile not found' });
    }

    const [emergencyContacts, insurance] = await Promise.all([
      this._patientRepo.getEmergencyContacts(profile.id),
      this._patientRepo.getInsuranceProfiles(profile.id),
    ]);

    const completion = PatientCompletionEngine.evaluate(profile, emergencyContacts, insurance);
    return toProfileSummaryDTO(profile, completion);
  }

  // ── Helper DTO Builder ───────────────────────────────────────────────────

  private async _buildFullProfileDTO(profile: PatientProfileRow): Promise<PatientProfileResponseDTO> {
    const [conditions, allergies, surgeries, emergencyContacts, insurance] = await Promise.all([
      this._patientRepo.getConditions(profile.id),
      this._patientRepo.getAllergies(profile.id),
      this._patientRepo.getSurgeries(profile.id),
      this._patientRepo.getEmergencyContacts(profile.id),
      this._patientRepo.getInsuranceProfiles(profile.id),
    ]);

    const completion = PatientCompletionEngine.evaluate(profile, emergencyContacts, insurance);

    return toPatientProfileDTO(
      profile,
      conditions,
      allergies,
      surgeries,
      emergencyContacts,
      insurance,
      completion,
    );
  }

  private _emitProfileEvent(
    event: 'patient.profile.updated' | 'patient.profile.completed',
    patientId: string,
    userId: string,
    version: number,
  ): void {
    if (!this._eventEmitter) return;
    this._eventEmitter.emitDomainEvent({
      event,
      patientId,
      userId,
      version,
      timestamp: new Date().toISOString(),
    });
  }
}
