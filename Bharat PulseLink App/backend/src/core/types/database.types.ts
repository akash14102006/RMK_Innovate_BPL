/**
 * Database Entity Types
 *
 * Direct mappings to relational PostgreSQL schema tables.
 * Used by repositories, application services, and domain models.
 *
 * Owned by: Platform & Data Architecture (Prompt 101)
 */

// ── Identity & Security ──────────────────────────────────────────────────────

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DISABLED' | 'DEACTIVATED';

export interface UserRow {
  id: string;
  status: UserStatus;
  last_authenticated_at: Date | null;
  last_seen_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export type AuthProvider = 'DESCOPE' | 'GOOGLE' | 'WHATSAPP';

export interface UserAuthIdentityRow {
  id: string;
  user_id: string;
  provider: AuthProvider;
  provider_subject: string;
  email: string | null;
  email_verified_at: Date | null;
  phone: string | null;
  phone_verified_at: Date | null;
  provider_created_at: Date | null;
  last_authenticated_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export type DevicePlatform = 'ios' | 'android' | 'web';
export type DeviceStatus = 'ACTIVE' | 'REVOKED' | 'BLOCKED';

export interface DeviceRow {
  id: string;
  user_id: string;
  device_fingerprint_hash: string;
  platform: DevicePlatform;
  app_version: string;
  push_token_hash: string | null;
  status: DeviceStatus;
  registered_at: Date;
  last_seen_at: Date;
}

export type SessionStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'FORCED_OUT' | 'SUSPENDED';
export type SessionRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface SessionRow {
  id: string;
  user_id: string;
  device_id: string | null;
  session_token_hash: string;
  descope_session_reference: string | null;
  status: SessionStatus;
  security_version: number;
  risk_level: SessionRiskLevel;
  platform: DevicePlatform;
  app_version: string;
  ip_hash: string | null;
  user_agent_summary: string | null;
  created_at: Date;
  last_seen_at: Date;
  expires_at: Date;
  absolute_expires_at: Date;
  revoked_at: Date | null;
  revoke_reason: string | null;
  updated_at: Date;
}

// ── Geography ────────────────────────────────────────────────────────────────

export interface GeoCountryRow {
  id: string;
  iso_code: string;
  name: string;
  dial_code: string;
  created_at: Date;
}

export interface GeoStateRow {
  id: string;
  country_id: string;
  code: string;
  name: string;
  created_at: Date;
}

export interface GeoDistrictRow {
  id: string;
  state_id: string;
  name: string;
  created_at: Date;
}

export interface GeoCityRow {
  id: string;
  district_id: string;
  name: string;
  pincode_prefix: string | null;
  created_at: Date;
}

// ── Patient ──────────────────────────────────────────────────────────────────

export type PatientProfileStatus =
  | 'NOT_STARTED'
  | 'DRAFT'
  | 'INCOMPLETE'
  | 'ACTIVE'
  | 'COMPLETE'
  | 'SUSPENDED'
  | 'LOCKED'
  | 'ARCHIVED';

export type GenderType = 'MALE' | 'FEMALE' | 'OTHER' | 'UNDISCLOSED';
export type BloodGroupType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'UNKNOWN';
export type ProvenanceSourceType = 'PATIENT' | 'IDENTITY_PROVIDER' | 'HOSPITAL' | 'GOVERNMENT' | 'IMPORTED' | 'SYSTEM';
export type SmokingStatusType = 'NEVER' | 'FORMER' | 'CURRENT' | 'OCCASIONAL';
export type AlcoholStatusType = 'NEVER' | 'FORMER' | 'OCCASIONAL' | 'REGULAR';
export type ActivityLevelType = 'SEDENTARY' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE';
export type AllergySeverityType = 'MILD' | 'MODERATE' | 'SEVERE' | 'UNKNOWN';

export interface PatientProfileRow {
  id: string;
  user_id: string;
  version: number;
  status: PatientProfileStatus;
  full_name: string;
  preferred_name: string | null;
  gender: GenderType;
  date_of_birth: Date;
  blood_group: BloodGroupType | null;
  marital_status: string | null;
  occupation: string | null;
  primary_phone: string | null;
  primary_email: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  locality: string | null;
  city_id: string | null;
  district_id: string | null;
  state_id: string | null;
  pincode: string | null;
  abha_id: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  smoking_status: SmokingStatusType | null;
  alcohol_status: AlcoholStatusType | null;
  activity_level: ActivityLevelType | null;
  sleep_pattern: string | null;
  completed_at: Date | null;
  last_synced_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface PatientConditionRow {
  id: string;
  patient_id: string;
  condition_name: string;
  diagnosed_year: number | null;
  status: 'ACTIVE' | 'MANAGED' | 'RESOLVED';
  source_type: ProvenanceSourceType;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PatientAllergyRow {
  id: string;
  patient_id: string;
  substance: string;
  reaction: string | null;
  severity: AllergySeverityType;
  status: 'ACTIVE' | 'RESOLVED' | 'INACTIVE';
  source_type: ProvenanceSourceType;
  created_at: Date;
  updated_at: Date;
}

export interface PatientSurgeryRow {
  id: string;
  patient_id: string;
  procedure_name: string;
  approximate_year: number | null;
  hospital_name: string | null;
  notes: string | null;
  source_type: ProvenanceSourceType;
  created_at: Date;
  updated_at: Date;
}

export interface EmergencyContactRow {
  id: string;
  patient_id: string;
  name: string;
  relationship: string;
  phone_hash: string;
  is_primary: boolean;
  priority_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface PatientInsuranceRow {
  id: string;
  patient_id: string;
  provider_name: string;
  policy_number_hash: string;
  policy_type: string;
  valid_from: Date | null;
  valid_to: Date | null;
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING_VERIFICATION';
  created_at: Date;
  updated_at: Date;
}

// ── Consent ──────────────────────────────────────────────────────────────────

export type ConsentStatus = 'PENDING' | 'GRANTED' | 'REVOKED' | 'EXPIRED' | 'DENIED' | 'SUPERSEDED';

export type ConsentPurpose =
  | 'APPOINTMENT_BOOKING'
  | 'HOSPITAL_CHECKIN'
  | 'HEALTH_RECORD_SHARING'
  | 'REPORT_ACCESS'
  | 'EMERGENCY_ACCESS'
  | 'CARE_COORDINATION'
  | 'IDENTITY_VERIFICATION'
  | 'PROFILE_DATA_SHARING'
  | 'SPECIFIC_HOSPITAL_ACCESS';

export type ConsentRecipientType =
  | 'HOSPITAL'
  | 'DOCTOR'
  | 'CARE_PROVIDER'
  | 'SYSTEM'
  | 'EMERGENCY_SERVICE'
  | 'SPECIFIC_PROVIDER';

export type ConsentScope =
  | 'PROFILE_BASIC'
  | 'CONTACT'
  | 'IDENTIFICATION_REFERENCE'
  | 'MEDICAL_BASICS'
  | 'ALLERGIES'
  | 'MEDICATIONS'
  | 'REPORTS'
  | 'PRESCRIPTIONS'
  | 'VISIT_HISTORY'
  | 'DOCUMENTS'
  | 'INSURANCE'
  | 'EMERGENCY_INFORMATION';

export type ConsentEventType =
  | 'CONSENT_REQUESTED'
  | 'CONSENT_VIEWED'
  | 'CONSENT_GRANTED'
  | 'CONSENT_DENIED'
  | 'CONSENT_REVOKED'
  | 'CONSENT_EXPIRED'
  | 'CONSENT_SUPERSEDED'
  | 'CONSENT_SCOPE_CHANGED';

export type ConsentActorType =
  | 'PATIENT'
  | 'AUTHORIZED_CAREGIVER'
  | 'SYSTEM'
  | 'HOSPITAL'
  | 'ADMIN'
  | 'EMERGENCY_PROCESS';

export interface ConsentPolicyVersionRow {
  id: string;
  policy_type: string;
  version: string;
  content_hash: string;
  title: string;
  effective_from: Date;
  effective_until: Date | null;
  created_at: Date;
}

export interface ConsentRow {
  id: string;
  patient_id: string;
  purpose: ConsentPurpose | string;
  recipient_type: ConsentRecipientType | string;
  recipient_id: string;
  granted_to_facility_id: string | null;
  scopes: ConsentScope[] | string[];
  policy_version: string;
  policy_hash: string | null;
  status: ConsentStatus;
  version: number;
  valid_from: Date;
  valid_to: Date;
  granted_at: Date;
  revoked_at: Date | null;
  revocation_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ConsentEventRow {
  id: string;
  consent_id: string;
  event_type: ConsentEventType | string;
  actor_id: string;
  actor_type: ConsentActorType | string;
  reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  timestamp: Date;
}

// ── Hospital ─────────────────────────────────────────────────────────────────

export interface FacilityRow {
  id: string;
  organization_id: string | null;
  name: string;
  display_name: string;
  facility_type: string;
  ownership_type: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MERGED' | 'UNDER_MAINTENANCE';
  publication_status: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED';
  verification_status: 'PENDING' | 'VERIFIED' | 'FLAGGED';
  address_line_1: string;
  address_line_2: string | null;
  landmark: string | null;
  locality: string | null;
  city_id: string | null;
  district_id: string | null;
  state_id: string | null;
  pincode: string;
  latitude: number;
  longitude: number;
  coordinate_source: string;
  emergency_available: boolean;
  superseded_by_facility_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface FacilityContactRow {
  id: string;
  facility_id: string;
  contact_type: string;
  phone: string;
  email: string | null;
  is_toll_free: boolean;
  is_primary: boolean;
  operating_hours_note: string | null;
  created_at: Date;
}

export interface ServiceRow {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string | null;
  created_at: Date;
}

export interface FacilityServiceRow {
  id: string;
  facility_id: string;
  service_id: string;
  status: 'AVAILABLE' | 'TEMPORARILY_UNAVAILABLE' | 'DISCONTINUED';
  price_inr: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface DepartmentRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  created_at: Date;
}

export interface FacilityDepartmentRow {
  id: string;
  facility_id: string;
  department_id: string;
  floor_location: string | null;
  status: string;
  created_at: Date;
}

export interface FacilityOperatingHoursRow {
  id: string;
  facility_id: string;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_24x7: boolean;
  is_closed: boolean;
}

// ── Appointments & Exchange ──────────────────────────────────────────────────

export interface AppointmentSlotRow {
  id: string;
  facility_id: string;
  department_id: string;
  doctor_id: string | null;
  slot_date: Date;
  start_time: string;
  end_time: string;
  max_capacity: number;
  booked_count: number;
  status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED' | 'CANCELLED';
  created_at: Date;
  updated_at: Date;
}

export interface AppointmentRow {
  id: string;
  patient_id: string;
  facility_id: string;
  department_id: string;
  slot_id: string;
  appointment_date: Date;
  start_time: string;
  status: 'CONFIRMED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  token_number: string;
  idempotency_key: string | null;
  facility_name_snapshot: string;
  service_name_snapshot: string | null;
  created_at: Date;
  updated_at: Date;
}

export type QRSessionStatus = 'CREATED' | 'ACTIVE' | 'SCANNED' | 'AUTHORIZING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'REVOKED' | 'CONSUMED';
export type QRSessionPurpose = 'HOSPITAL_CHECKIN' | 'APPOINTMENT' | 'HEALTH_RECORD_SHARE' | 'IDENTITY_VERIFICATION';
export type QRRecipientType = 'FACILITY' | 'PROVIDER' | 'OPEN';

export interface QRSessionRow {
  id: string;
  patient_id: string;
  facility_id: string | null;
  token_hash: string;
  status: QRSessionStatus;
  purpose: QRSessionPurpose;
  recipient_type: QRRecipientType;
  recipient_id: string | null;
  expires_at: Date;
  used_at: Date | null;
  consumed_at: Date | null;
  revoked_at: Date | null;
  created_by_session_id: string | null;
  version: number;
  created_at: Date;
}

export interface ExchangeSessionRow {
  id: string;
  patient_id: string;
  requester_facility_id: string;
  consent_id: string;
  scope: string[];
  status: 'PENDING' | 'AUTHENTICATED' | 'TRANSFERRING' | 'COMPLETED' | 'FAILED' | 'TIMED_OUT';
  expires_at: Date;
  completed_at: Date | null;
  created_at: Date;
}

export interface LiveCheckInRow {
  id: string;
  patient_id: string;
  facility_id: string;
  appointment_id: string | null;
  exchange_session_id: string | null;
  token_number: string;
  counter_number: string;
  queue_position: number;
  estimated_wait_minutes: number;
  status: 'QUEUED' | 'CALLED' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED';
  checked_in_at: Date;
  completed_at: Date | null;
  cancelled_at: Date | null;
}

// ── Health Records ───────────────────────────────────────────────────────────

export interface VisitRow {
  id: string;
  patient_id: string;
  facility_id: string;
  visit_date: Date;
  visit_type: string;
  department_id: string | null;
  doctor_name: string | null;
  chief_complaint: string | null;
  diagnosis: string | null;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'DISCHARGED';
  created_at: Date;
  updated_at: Date;
}

export interface ReportRow {
  id: string;
  patient_id: string;
  facility_id: string;
  visit_id: string | null;
  report_type: 'BLOOD_TEST' | 'IMAGING' | 'PATHOLOGY' | 'ECG' | 'GENERAL_REPORT';
  title: string;
  report_date: Date;
  storage_key: string;
  mime_type: string;
  file_size_bytes: number;
  integrity_hash: string;
  blockchain_tx_id: string | null;
  status: 'PENDING' | 'VERIFIED' | 'AMENDED';
  created_at: Date;
  updated_at: Date;
}

export interface DocumentRow {
  id: string;
  patient_id: string;
  document_type: string;
  title: string;
  storage_key: string;
  mime_type: string;
  file_size_bytes: number;
  sha256: string;
  uploaded_by_user_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface PrescriptionRow {
  id: string;
  patient_id: string;
  facility_id: string;
  visit_id: string | null;
  doctor_name: string;
  issued_date: Date;
  storage_key: string | null;
  status: 'ACTIVE' | 'COMPLETED' | 'DISCONTINUED';
  created_at: Date;
  updated_at: Date;
}

export interface PatientMedicationRow {
  id: string;
  patient_id: string;
  prescription_id: string | null;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration_days: number | null;
  start_date: Date;
  end_date: Date | null;
  instructions: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface IngestionBatchRow {
  id: string;
  source_system: string;
  source_type: string;
  file_hash: string | null;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PARTIALLY_ACCEPTED';
  started_at: Date;
  completed_at: Date | null;
  total_records: number;
  accepted_records: number;
  rejected_records: number;
  warning_records: number;
}

export interface IngestionRawRecordRow {
  id: string;
  batch_id: string;
  source_row_number: number;
  source_record_id: string | null;
  raw_payload: Record<string, unknown>;
  row_hash: string;
  created_at: Date;
}

export interface FacilityIdentityMappingRow {
  id: string;
  source_system: string;
  source_record_id: string;
  facility_id: string;
  mapping_status: 'CANONICAL' | 'MERGED' | 'DISPUTED';
  confidence_score: number;
  mapped_at: Date;
}

export interface DataValidationIssueRow {
  id: string;
  batch_id: string;
  raw_record_id: string | null;
  field_name: string | null;
  issue_code: string;
  severity: 'WARNING' | 'FATAL_ROW' | 'FATAL_BATCH';
  message: string;
  created_at: Date;
}

export interface FacilityMergeHistoryRow {
  id: string;
  source_facility_id: string;
  surviving_facility_id: string;
  reason: string;
  decision_source: string;
  actor_id: string;
  merged_at: Date;
}

// ── Audit & Security ─────────────────────────────────────────────────────────

export interface AuditEventRow {
  id: string;
  actor_id: string;
  actor_type: 'PATIENT' | 'PROVIDER' | 'SYSTEM' | 'ADMIN';
  action: 'READ' | 'WRITE' | 'CONSENT_SHARE' | 'EXPORT' | 'REVOKE' | 'DELETE';
  resource_type: string;
  resource_id: string;
  facility_id: string | null;
  consent_id: string | null;
  ip_address: string;
  request_id: string;
  metadata: Record<string, unknown> | null;
  timestamp: Date;
}

export interface SecurityEventRow {
  id: string;
  user_id: string | null;
  device_id: string | null;
  event_type: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
  ip_address: string | null;
  request_id: string | null;
  details: Record<string, unknown> | null;
  timestamp: Date;
}



