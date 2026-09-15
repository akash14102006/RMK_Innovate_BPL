/**
 * Consent Domain Schemas, Taxonomies, and DTO Mappers
 *
 * Owned by: Consent Domain (Prompt 91, 101 §28, §82)
 */

import { z } from 'zod';
import type {
  ConsentRow,
  ConsentEventRow,
  ConsentPurpose,
  ConsentRecipientType,
  ConsentScope,
  ConsentStatus,
} from '../../core/types/database.types.js';

// ── 1. Taxonomies ────────────────────────────────────────────────────────────

export const ConsentPurposes = [
  'APPOINTMENT_BOOKING',
  'HOSPITAL_CHECKIN',
  'HEALTH_RECORD_SHARING',
  'REPORT_ACCESS',
  'EMERGENCY_ACCESS',
  'CARE_COORDINATION',
  'IDENTITY_VERIFICATION',
  'PROFILE_DATA_SHARING',
  'SPECIFIC_HOSPITAL_ACCESS',
] as const;

export const ConsentRecipientTypes = [
  'HOSPITAL',
  'DOCTOR',
  'CARE_PROVIDER',
  'SYSTEM',
  'EMERGENCY_SERVICE',
  'SPECIFIC_PROVIDER',
] as const;

export const ConsentScopes = [
  'PROFILE_BASIC',
  'CONTACT',
  'IDENTIFICATION_REFERENCE',
  'MEDICAL_BASICS',
  'ALLERGIES',
  'MEDICATIONS',
  'REPORTS',
  'PRESCRIPTIONS',
  'VISIT_HISTORY',
  'DOCUMENTS',
  'INSURANCE',
  'EMERGENCY_INFORMATION',
] as const;

export const ConsentStatuses = [
  'PENDING',
  'GRANTED',
  'REVOKED',
  'EXPIRED',
  'DENIED',
  'SUPERSEDED',
] as const;

// ── 2. Scope Metadata / Human-readable Descriptions ─────────────────────────

export const SCOPE_METADATA: Record<ConsentScope, { name: string; description: string; sensitive: boolean }> = {
  PROFILE_BASIC: {
    name: 'Basic Demographics',
    description: 'Full name, gender, and date of birth',
    sensitive: false,
  },
  CONTACT: {
    name: 'Contact & Address',
    description: 'Primary phone number, email address, and postal address',
    sensitive: false,
  },
  IDENTIFICATION_REFERENCE: {
    name: 'Identification References',
    description: 'ABHA address and registered health identifiers',
    sensitive: true,
  },
  MEDICAL_BASICS: {
    name: 'Medical Basics',
    description: 'Blood group, height, and weight',
    sensitive: false,
  },
  ALLERGIES: {
    name: 'Allergies & Adverse Reactions',
    description: 'Known food, drug, and environmental allergies',
    sensitive: true,
  },
  MEDICATIONS: {
    name: 'Active Medications',
    description: 'Current prescribed drugs and dosages',
    sensitive: true,
  },
  REPORTS: {
    name: 'Diagnostic & Lab Reports',
    description: 'Blood tests, pathology, and diagnostic imaging summaries',
    sensitive: true,
  },
  PRESCRIPTIONS: {
    name: 'Prescription History',
    description: 'Historical and active doctor prescriptions',
    sensitive: true,
  },
  VISIT_HISTORY: {
    name: 'Visit & Consultation History',
    description: 'Previous hospital admissions, OPD consultations, and discharge notes',
    sensitive: true,
  },
  DOCUMENTS: {
    name: 'Uploaded Medical Documents',
    description: 'Original PDF/image health records and diagnostic scans',
    sensitive: true,
  },
  INSURANCE: {
    name: 'Health Insurance Details',
    description: 'Insurance provider name and policy coverage metadata',
    sensitive: false,
  },
  EMERGENCY_INFORMATION: {
    name: 'Emergency Contacts & Critical Care Info',
    description: 'Designated emergency contacts and critical medical notes',
    sensitive: false,
  },
};

// ── 3. Zod Request Schemas ───────────────────────────────────────────────────

export const GrantConsentSchema = z.object({
  purpose: z.enum(ConsentPurposes, {
    errorMap: () => ({ message: 'Invalid or unsupported consent purpose' }),
  }),
  recipientType: z.enum(ConsentRecipientTypes).default('HOSPITAL'),
  recipientId: z.string().min(1, 'Recipient ID is required'),
  scopes: z
    .array(z.enum(ConsentScopes))
    .min(1, 'At least one data category scope must be selected'),
  validFrom: z.string().datetime().optional(),
  validTo: z.string().datetime().optional(),
  durationSeconds: z.number().int().positive().max(31536000).optional().default(86400 * 30), // Default 30 days, max 1 year
  policyVersion: z.string().min(1).optional().default('1.0'),
  policyHash: z.string().optional(),
});

export type GrantConsentInput = z.input<typeof GrantConsentSchema>;

export const RevokeConsentSchema = z.object({
  reason: z.string().min(3, 'Revocation reason must be at least 3 characters long'),
  expectedVersion: z.number().int().positive().optional(),
});

export type RevokeConsentInput = z.infer<typeof RevokeConsentSchema>;

export const ConsentPreviewSchema = z.object({
  purpose: z.enum(ConsentPurposes),
  recipientType: z.enum(ConsentRecipientTypes).default('HOSPITAL'),
  recipientId: z.string().min(1, 'Recipient ID is required'),
  scopes: z.array(z.enum(ConsentScopes)).min(1, 'At least one scope is required'),
  durationSeconds: z.number().int().positive().optional().default(86400 * 30),
  policyVersion: z.string().optional().default('1.0'),
});

export type ConsentPreviewInput = z.input<typeof ConsentPreviewSchema>;

export const CheckConsentSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID format'),
  purpose: z.enum(ConsentPurposes),
  recipient: z.object({
    type: z.enum(ConsentRecipientTypes),
    id: z.string().min(1, 'Recipient ID is required'),
  }),
  requiredScopes: z.array(z.enum(ConsentScopes)).min(1, 'At least one required scope must be specified'),
  at: z.string().datetime().optional(),
});

export type CheckConsentInput = z.infer<typeof CheckConsentSchema>;

// ── 4. DTO Interfaces ────────────────────────────────────────────────────────

export interface ConsentDTO {
  id: string;
  patientId: string;
  purpose: ConsentPurpose | string;
  recipient: {
    type: ConsentRecipientType | string;
    id: string;
  };
  scopes: ConsentScope[] | string[];
  policyVersion: string;
  status: ConsentStatus;
  version: number;
  validFrom: string;
  validTo: string;
  grantedAt: string;
  revokedAt: string | null;
  revocationReason: string | null;
  isEffective: boolean;
}

export interface ConsentEventDTO {
  id: string;
  consentId: string;
  eventType: string;
  actorId: string;
  actorType: string;
  reason: string | null;
  timestamp: string;
  metadata: Record<string, unknown> | null;
}

export interface ConsentPreviewDTO {
  purpose: string;
  recipient: {
    type: string;
    id: string;
  };
  requestedScopes: Array<{
    code: ConsentScope;
    name: string;
    description: string;
    sensitive: boolean;
  }>;
  durationSeconds: number;
  validFrom: string;
  validTo: string;
  policyVersion: string;
  notice: string;
}

export type ConsentEvaluationReason =
  | 'AUTHORIZED'
  | 'NO_CONSENT'
  | 'REVOKED'
  | 'EXPIRED'
  | 'DENIED'
  | 'SCOPE_NOT_GRANTED'
  | 'WRONG_RECIPIENT'
  | 'WRONG_PURPOSE'
  | 'PATIENT_NOT_FOUND'
  | 'SERVICE_UNAVAILABLE';

export interface ConsentEvaluationResult {
  allowed: boolean;
  reason: ConsentEvaluationReason;
  message?: string;
  consentId?: string;
  allowedScopes: ConsentScope[] | string[];
  deniedScopes: ConsentScope[] | string[];
  evaluatedAt: string;
  expiresAt?: string;
}

// ── 5. DTO Transformers ──────────────────────────────────────────────────────

export function toConsentDTO(row: ConsentRow, currentTime: Date = new Date()): ConsentDTO {
  const isTimeValid =
    new Date(row.valid_from).getTime() <= currentTime.getTime() &&
    new Date(row.valid_to).getTime() >= currentTime.getTime();

  const isEffective = row.status === 'GRANTED' && !row.revoked_at && isTimeValid;

  return {
    id: row.id,
    patientId: row.patient_id,
    purpose: row.purpose,
    recipient: {
      type: row.recipient_type,
      id: row.recipient_id,
    },
    scopes: row.scopes,
    policyVersion: row.policy_version,
    status: row.status,
    version: row.version,
    validFrom: new Date(row.valid_from).toISOString(),
    validTo: new Date(row.valid_to).toISOString(),
    grantedAt: new Date(row.granted_at).toISOString(),
    revokedAt: row.revoked_at ? new Date(row.revoked_at).toISOString() : null,
    revocationReason: row.revocation_reason ?? null,
    isEffective,
  };
}

export function toConsentEventDTO(row: ConsentEventRow): ConsentEventDTO {
  return {
    id: row.id,
    consentId: row.consent_id,
    eventType: row.event_type,
    actorId: row.actor_id,
    actorType: row.actor_type,
    reason: row.reason ?? null,
    timestamp: new Date(row.timestamp).toISOString(),
    metadata: row.metadata ?? null,
  };
}

export function toConsentPreviewDTO(input: ConsentPreviewInput): ConsentPreviewDTO {
  const now = new Date();
  const duration = input.durationSeconds ?? (86400 * 30);
  const validTo = new Date(now.getTime() + duration * 1000);

  const requestedScopes = input.scopes.map((scopeCode) => {
    const meta = SCOPE_METADATA[scopeCode as ConsentScope] ?? {
      name: scopeCode,
      description: 'Medical health data category',
      sensitive: true,
    };
    return {
      code: scopeCode as ConsentScope,
      name: meta.name,
      description: meta.description,
      sensitive: meta.sensitive,
    };
  });

  return {
    purpose: input.purpose,
    recipient: {
      type: input.recipientType ?? 'HOSPITAL',
      id: input.recipientId,
    },
    requestedScopes,
    durationSeconds: duration,
    validFrom: now.toISOString(),
    validTo: validTo.toISOString(),
    policyVersion: input.policyVersion ?? '1.0',
    notice:
      'By granting consent, you authorize Bharat PulseLink to release the specified data categories to the verified recipient for the stated purpose and duration only. You may withdraw or revoke this consent at any time from your profile.',
  };
}
