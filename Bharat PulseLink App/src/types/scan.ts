/**
 * Bharat PulseLink — Secure Hospital Scan & QR Exchange Types (Prompts 54–56)
 *
 * Domain types for:
 * 1. Hospital QR protocol & payload validation (Prompt 55)
 * 2. Patient Secure QR generation & session state machine (Prompt 56)
 * 3. Granular sharing scopes & explicit consent
 * 4. Point-of-care verified hospital check-in
 */

export type SharingScopeKey =
  | 'BASIC_PROFILE'
  | 'EMERGENCY_CONTACT'
  | 'ALLERGIES'
  | 'CURRENT_MEDICATIONS'
  | 'HEALTH_SUMMARY'
  | 'RECENT_REPORTS';

export interface SharingScopeOption {
  key: SharingScopeKey;
  label: string;
  description: string;
  isSensitive: boolean;
  defaultGranted: boolean;
}

export type QRSessionStatus =
  | 'CREATING'
  | 'ACTIVE'
  | 'SCANNED'
  | 'AUTHENTICATING'
  | 'CONSENT_PENDING'
  | 'EXCHANGING'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'FAILED';

export interface HospitalQRPayload {
  protocol: 'bpl_hospital_v1';
  sessionId: string;
  hospitalId: string;
  hospitalName: string;
  departmentName?: string;
  counterDesk?: string;
  nonce: string;
  expiresAtISO: string;
  requestedScopes: SharingScopeKey[];
  purpose: string;
}

export interface PatientQRPayload {
  protocol: 'bpl_patient_v1';
  sessionId: string;
  patientPublicRef: string;
  nonce: string;
  expiresAtISO: string;
  allowedScopes: SharingScopeKey[];
  hospitalBindingId?: string;
}

export interface ActiveCheckInSession {
  sessionId: string;
  hospitalId: string;
  hospitalName: string;
  departmentName: string;
  counterDesk?: string;
  checkedInAtISO: string;
  grantedScopes: SharingScopeKey[];
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
  tokenNumber?: string;
}

export interface HospitalVerificationResult {
  isValid: boolean;
  hospitalId: string;
  hospitalName: string;
  departmentName?: string;
  counterDesk?: string;
  address?: string;
  verifiedRegistry: boolean;
  purpose: string;
  requestedScopes: SharingScopeKey[];
  expiresAtISO: string;
  errorMessage?: string;
}

export type ExchangeFailureCode =
  | 'QR_EXPIRED'
  | 'QR_INVALID'
  | 'QR_USED'
  | 'QR_UNSUPPORTED'
  | 'HOSPITAL_UNVERIFIED'
  | 'SESSION_CANCELLED'
  | 'CONSENT_DENIED'
  | 'AUTH_FAILED'
  | 'EXCHANGE_FAILED'
  | 'NETWORK_ERROR'
  | 'PROVIDER_TIMEOUT'
  | 'UNKNOWN_OUTCOME';

export type ExchangeProgressStage =
  | 'VERIFIED'
  | 'AUTHORIZED'
  | 'PREPARING'
  | 'EXCHANGING'
  | 'RECEIVING_ACK'
  | 'COMPLETING'
  | 'COMPLETED';

export interface SecureExchangeTransactionResult {
  exchangeId: string;
  sessionId: string;
  hospitalId: string;
  hospitalName: string;
  departmentName?: string;
  counterDesk?: string;
  purpose: string;
  sharedScopes: SharingScopeKey[];
  failedScopes?: SharingScopeKey[];
  status: 'COMPLETED' | 'FAILED' | 'UNKNOWN' | 'CANCELLED';
  completedAtISO: string;
  tokenNumber?: string;
  failureCode?: ExchangeFailureCode;
  errorMessage?: string;
}
