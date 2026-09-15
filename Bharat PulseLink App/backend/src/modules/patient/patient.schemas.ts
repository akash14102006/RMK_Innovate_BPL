/**
 * Patient Profile Schemas & DTOs
 *
 * Validates patient profile requests and maps domain records to privacy-safe responses.
 *
 * Owned by: Patient Domain (Prompt 90)
 */

import { z } from 'zod';
import type {
  PatientProfileRow,
  PatientConditionRow,
  PatientAllergyRow,
  PatientSurgeryRow,
  EmergencyContactRow,
  PatientInsuranceRow,
} from '../../core/types/database.types.js';

// ── Enums ──────────────────────────────────────────────────────────────────

export const GenderEnum = z.enum(['MALE', 'FEMALE', 'OTHER', 'UNDISCLOSED']);
export const BloodGroupEnum = z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN']);
export const SmokingStatusEnum = z.enum(['NEVER', 'FORMER', 'CURRENT', 'OCCASIONAL']);
export const AlcoholStatusEnum = z.enum(['NEVER', 'FORMER', 'OCCASIONAL', 'REGULAR']);
export const ActivityLevelEnum = z.enum(['SEDENTARY', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE']);
export const AllergySeverityEnum = z.enum(['MILD', 'MODERATE', 'SEVERE', 'UNKNOWN']);
export const ConditionStatusEnum = z.enum(['ACTIVE', 'MANAGED', 'RESOLVED']);
export const AllergyStatusEnum = z.enum(['ACTIVE', 'RESOLVED', 'INACTIVE']);

// ── Request Schemas ────────────────────────────────────────────────────────

export const CreateProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(200),
  preferredName: z.string().max(100).optional().nullable(),
  gender: GenderEnum,
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format'),
  bloodGroup: BloodGroupEnum.optional().nullable(),
  maritalStatus: z.string().max(30).optional().nullable(),
  occupation: z.string().max(100).optional().nullable(),
  primaryPhone: z.string().max(50).optional().nullable(),
  primaryEmail: z.string().email().max(255).optional().nullable(),
  addressLine1: z.string().max(500).optional().nullable(),
  addressLine2: z.string().max(500).optional().nullable(),
  locality: z.string().max(150).optional().nullable(),
  cityId: z.string().uuid().optional().nullable(),
  districtId: z.string().uuid().optional().nullable(),
  stateId: z.string().uuid().optional().nullable(),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits').optional().nullable(),
  abhaId: z.string().max(50).optional().nullable(),
  heightCm: z.number().min(30).max(300).optional().nullable(),
  weightKg: z.number().min(1).max(500).optional().nullable(),
  smokingStatus: SmokingStatusEnum.optional().nullable(),
  alcoholStatus: AlcoholStatusEnum.optional().nullable(),
  activityLevel: ActivityLevelEnum.optional().nullable(),
  sleepPattern: z.string().max(50).optional().nullable(),
});

export const UpdateBasicInfoSchema = z.object({
  fullName: z.string().min(1).max(200).optional(),
  preferredName: z.string().max(100).optional().nullable(),
  gender: GenderEnum.optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  maritalStatus: z.string().max(30).optional().nullable(),
  occupation: z.string().max(100).optional().nullable(),
  expectedVersion: z.number().int().positive().optional(),
});

export const UpdateContactInfoSchema = z.object({
  primaryPhone: z.string().max(50).optional().nullable(),
  primaryEmail: z.string().email().max(255).optional().nullable(),
  addressLine1: z.string().max(500).optional().nullable(),
  addressLine2: z.string().max(500).optional().nullable(),
  locality: z.string().max(150).optional().nullable(),
  cityId: z.string().uuid().optional().nullable(),
  districtId: z.string().uuid().optional().nullable(),
  stateId: z.string().uuid().optional().nullable(),
  pincode: z.string().regex(/^\d{6}$/).optional().nullable(),
  expectedVersion: z.number().int().positive().optional(),
});

export const UpdateMedicalBasicsSchema = z.object({
  bloodGroup: BloodGroupEnum.optional().nullable(),
  heightCm: z.number().min(30).max(300).optional().nullable(),
  weightKg: z.number().min(1).max(500).optional().nullable(),
  abhaId: z.string().max(50).optional().nullable(),
  expectedVersion: z.number().int().positive().optional(),
});

export const UpdateLifestyleSchema = z.object({
  smokingStatus: SmokingStatusEnum.optional().nullable(),
  alcoholStatus: AlcoholStatusEnum.optional().nullable(),
  activityLevel: ActivityLevelEnum.optional().nullable(),
  sleepPattern: z.string().max(50).optional().nullable(),
  expectedVersion: z.number().int().positive().optional(),
});

export const ConditionItemSchema = z.object({
  conditionName: z.string().min(1).max(200),
  diagnosedYear: z.number().int().min(1900).max(new Date().getFullYear()).optional().nullable(),
  status: ConditionStatusEnum.optional().default('ACTIVE'),
  notes: z.string().max(1000).optional().nullable(),
});

export const UpdateConditionsSchema = z.object({
  conditions: z.array(ConditionItemSchema),
  expectedVersion: z.number().int().positive().optional(),
});

export const AllergyItemSchema = z.object({
  substance: z.string().min(1).max(200),
  reaction: z.string().max(200).optional().nullable(),
  severity: AllergySeverityEnum.optional().default('UNKNOWN'),
  status: AllergyStatusEnum.optional().default('ACTIVE'),
});

export const UpdateAllergiesSchema = z.object({
  allergies: z.array(AllergyItemSchema),
  expectedVersion: z.number().int().positive().optional(),
});

export const SurgeryItemSchema = z.object({
  procedureName: z.string().min(1).max(200),
  approximateYear: z.number().int().min(1900).max(new Date().getFullYear()).optional().nullable(),
  hospitalName: z.string().max(200).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const UpdateSurgeriesSchema = z.object({
  surgeries: z.array(SurgeryItemSchema),
  expectedVersion: z.number().int().positive().optional(),
});

export const UpdateProfileSchema = z.object({
  fullName: z.string().min(1).max(200).optional(),
  preferredName: z.string().max(100).optional().nullable(),
  gender: GenderEnum.optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  bloodGroup: BloodGroupEnum.optional().nullable(),
  maritalStatus: z.string().max(30).optional().nullable(),
  occupation: z.string().max(100).optional().nullable(),
  primaryPhone: z.string().max(50).optional().nullable(),
  primaryEmail: z.string().email().max(255).optional().nullable(),
  addressLine1: z.string().max(500).optional().nullable(),
  addressLine2: z.string().max(500).optional().nullable(),
  locality: z.string().max(150).optional().nullable(),
  cityId: z.string().uuid().optional().nullable(),
  districtId: z.string().uuid().optional().nullable(),
  stateId: z.string().uuid().optional().nullable(),
  pincode: z.string().regex(/^\d{6}$/).optional().nullable(),
  abhaId: z.string().max(50).optional().nullable(),
  heightCm: z.number().min(30).max(300).optional().nullable(),
  weightKg: z.number().min(1).max(500).optional().nullable(),
  smokingStatus: SmokingStatusEnum.optional().nullable(),
  alcoholStatus: AlcoholStatusEnum.optional().nullable(),
  activityLevel: ActivityLevelEnum.optional().nullable(),
  sleepPattern: z.string().max(50).optional().nullable(),
  expectedVersion: z.number().int().positive().optional(),
});

export const CompleteProfileSchema = z.object({
  expectedVersion: z.number().int().positive().optional(),
});

// ── Response DTO Types & Mappers ───────────────────────────────────────────

export interface PatientConditionDTO {
  id: string;
  conditionName: string;
  diagnosedYear: number | null;
  status: string;
  sourceType: string;
  notes: string | null;
}

export interface PatientAllergyDTO {
  id: string;
  substance: string;
  reaction: string | null;
  severity: string;
  status: string;
  sourceType: string;
}

export interface PatientSurgeryDTO {
  id: string;
  procedureName: string;
  approximateYear: number | null;
  hospitalName: string | null;
  notes: string | null;
  sourceType: string;
}

export interface EmergencyContactDTO {
  id: string;
  name: string;
  relationship: string;
  isPrimary: boolean;
  priorityOrder: number;
}

export interface PatientInsuranceDTO {
  id: string;
  providerName: string;
  policyType: string;
  validFrom: string | null;
  validTo: string | null;
  status: string;
}

export interface ProfileCompletionDTO {
  isComplete: boolean;
  completionPercentage: number;
  profileStatus: string;
  requiredSections: Array<{
    id: string;
    title: string;
    isComplete: boolean;
    missingFields: string[];
  }>;
  completedSections: string[];
  missingRequirements: string[];
}

export interface PatientProfileResponseDTO {
  id: string;
  userId: string;
  version: number;
  status: string;
  fullName: string;
  preferredName: string | null;
  gender: string;
  dateOfBirth: string;
  bloodGroup: string | null;
  maritalStatus: string | null;
  occupation: string | null;
  primaryPhone: string | null;
  primaryEmail: string | null;
  address: {
    line1: string | null;
    line2: string | null;
    locality: string | null;
    cityId: string | null;
    districtId: string | null;
    stateId: string | null;
    pincode: string | null;
  };
  abhaId: string | null;
  medicalBasics: {
    heightCm: number | null;
    weightKg: number | null;
    bloodGroup: string | null;
  };
  lifestyle: {
    smokingStatus: string | null;
    alcoholStatus: string | null;
    activityLevel: string | null;
    sleepPattern: string | null;
  };
  conditions: PatientConditionDTO[];
  allergies: PatientAllergyDTO[];
  surgeries: PatientSurgeryDTO[];
  emergencyContacts: EmergencyContactDTO[];
  insurance: PatientInsuranceDTO[];
  completion: ProfileCompletionDTO;
  completedAt: string | null;
  updatedAt: string;
}

export interface ProfileSummaryDTO {
  patientId: string;
  userId: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  bloodGroup: string | null;
  abhaId: string | null;
  status: string;
  version: number;
  completionPercentage: number;
  isComplete: boolean;
}

export function toPatientProfileDTO(
  profile: PatientProfileRow,
  conditions: PatientConditionRow[] = [],
  allergies: PatientAllergyRow[] = [],
  surgeries: PatientSurgeryRow[] = [],
  emergencyContacts: EmergencyContactRow[] = [],
  insurance: PatientInsuranceRow[] = [],
  completion: ProfileCompletionDTO,
): PatientProfileResponseDTO {
  const dob = profile.date_of_birth instanceof Date
    ? profile.date_of_birth.toISOString().split('T')[0]!
    : String(profile.date_of_birth).split('T')[0]!;

  return {
    id: profile.id,
    userId: profile.user_id,
    version: profile.version,
    status: profile.status,
    fullName: profile.full_name,
    preferredName: profile.preferred_name,
    gender: profile.gender,
    dateOfBirth: dob,
    bloodGroup: profile.blood_group,
    maritalStatus: profile.marital_status,
    occupation: profile.occupation,
    primaryPhone: profile.primary_phone,
    primaryEmail: profile.primary_email,
    address: {
      line1: profile.address_line_1,
      line2: profile.address_line_2,
      locality: profile.locality,
      cityId: profile.city_id,
      districtId: profile.district_id,
      stateId: profile.state_id,
      pincode: profile.pincode,
    },
    abhaId: profile.abha_id,
    medicalBasics: {
      heightCm: profile.height_cm ? Number(profile.height_cm) : null,
      weightKg: profile.weight_kg ? Number(profile.weight_kg) : null,
      bloodGroup: profile.blood_group,
    },
    lifestyle: {
      smokingStatus: profile.smoking_status,
      alcoholStatus: profile.alcohol_status,
      activityLevel: profile.activity_level,
      sleepPattern: profile.sleep_pattern,
    },
    conditions: conditions.map((c) => ({
      id: c.id,
      conditionName: c.condition_name,
      diagnosedYear: c.diagnosed_year,
      status: c.status,
      sourceType: c.source_type,
      notes: c.notes,
    })),
    allergies: allergies.map((a) => ({
      id: a.id,
      substance: a.substance,
      reaction: a.reaction,
      severity: a.severity,
      status: a.status,
      sourceType: a.source_type,
    })),
    surgeries: surgeries.map((s) => ({
      id: s.id,
      procedureName: s.procedure_name,
      approximateYear: s.approximate_year,
      hospitalName: s.hospital_name,
      notes: s.notes,
      sourceType: s.source_type,
    })),
    emergencyContacts: emergencyContacts.map((e) => ({
      id: e.id,
      name: e.name,
      relationship: e.relationship,
      isPrimary: e.is_primary,
      priorityOrder: e.priority_order,
    })),
    insurance: insurance.map((i) => ({
      id: i.id,
      providerName: i.provider_name,
      policyType: i.policy_type,
      validFrom: i.valid_from ? (i.valid_from instanceof Date ? i.valid_from.toISOString().split('T')[0]! : String(i.valid_from)) : null,
      validTo: i.valid_to ? (i.valid_to instanceof Date ? i.valid_to.toISOString().split('T')[0]! : String(i.valid_to)) : null,
      status: i.status,
    })),
    completion,
    completedAt: profile.completed_at ? profile.completed_at.toISOString() : null,
    updatedAt: profile.updated_at.toISOString(),
  };
}

export function toProfileSummaryDTO(
  profile: PatientProfileRow,
  completion: ProfileCompletionDTO,
): ProfileSummaryDTO {
  const dob = profile.date_of_birth instanceof Date
    ? profile.date_of_birth.toISOString().split('T')[0]!
    : String(profile.date_of_birth).split('T')[0]!;

  return {
    patientId: profile.id,
    userId: profile.user_id,
    fullName: profile.full_name,
    gender: profile.gender,
    dateOfBirth: dob,
    bloodGroup: profile.blood_group,
    abhaId: profile.abha_id,
    status: profile.status,
    version: profile.version,
    completionPercentage: completion.completionPercentage,
    isComplete: completion.isComplete,
  };
}
