/**
 * Bharat PulseLink — Account, Security, Consent, Emergency & Support Types (Prompts 74–86)
 *
 * Domain types for:
 * 1. Emergency Contact & Mode (Prompts 74–75)
 * 2. Insurance Management (Prompt 76)
 * 3. Profile & Edit Profile (Prompts 77–78)
 * 4. Settings & Security Center (Prompts 79–80)
 * 5. Consent & Access Transparency (Prompts 81–82)
 * 6. Notifications & Language (Prompts 83–84)
 * 7. Help & Support (Prompt 85)
 * 8. Session Termination & Logout (Prompt 86)
 */

export interface EmergencyContact {
  contactId: string;
  fullName: string;
  relationship: 'Spouse' | 'Parent' | 'Sibling' | 'Child' | 'Friend' | 'Guardian' | 'Other';
  primaryPhone: string;
  alternativePhone?: string;
  isPrimary: boolean;
  isVerified: boolean;
  notes?: string;
}

export interface InsurancePolicy {
  policyId: string;
  providerName: string;
  policyNumber: string;
  tpaName?: string;
  planName: string;
  sumInsuredINR: number;
  validTillISO: string;
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING_RENEWAL';
  coverageType: 'Individual' | 'Family Floater' | 'Senior Citizen' | 'Critical Illness';
  beneficiariesCount: number;
  linkedDocumentId?: string;
  provenance: 'VERIFIED_TPA' | 'PATIENT_ENTERED';
}

export interface UserAccountProfile {
  userId: string;
  fullName: string;
  abhaId: string; // e.g. "91-2048-9182-4410"
  abhaAddress: string; // e.g. "akash.kumar@abdm"
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup: string;
  primaryPhone: string;
  email: string;
  aadhaarMasked: string; // e.g. "XXXX-XXXX-8921"
  isAadhaarVerified: boolean;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
  profileCompletionPercentage: number;
}

export interface ActiveSessionRecord {
  sessionId: string;
  deviceName: string;
  platform: 'Android' | 'iOS' | 'Web' | 'Desktop';
  locationCity: string;
  ipAddressMasked: string;
  lastActiveISO: string;
  isCurrentDevice: boolean;
}

export interface SecurityEventRecord {
  eventId: string;
  eventType: 'LOGIN_SUCCESS' | 'PIN_CHANGED' | 'BIOMETRIC_ENABLED' | 'SESSION_REVOKED' | 'STEP_UP_AUTH';
  description: string;
  deviceSummary: string;
  timestampISO: string;
  status: 'SUCCESS' | 'BLOCKED' | 'WARNING';
}

export interface ActiveConsentRecord {
  consentId: string;
  recipientName: string; // e.g. "Rajiv Gandhi Government General Hospital"
  purpose: string; // e.g. "Emergency OPD Consultation & Diagnostics"
  grantedScopes: string[]; // e.g. ["Identity", "Allergies", "Prescriptions"]
  grantedAtISO: string;
  expiresAtISO: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  consentVersion: string;
}

export interface AccessAuditLogItem {
  auditId: string;
  accessorName: string; // e.g. "Dr. R. Sundaram (Cardiology OPD)"
  organizationName: string;
  purpose: string;
  dataAccessedSummary: string;
  timestampISO: string;
  outcome: 'GRANTED' | 'DENIED' | 'REVOKED';
}

export interface PatientNotificationItem {
  notificationId: string;
  category: 'APPOINTMENT' | 'HOSPITAL' | 'HEALTH_RECORD' | 'SECURITY' | 'INSURANCE' | 'SYSTEM';
  title: string;
  message: string;
  timestampISO: string;
  isRead: boolean;
  deepLinkRoute?: string;
  deepLinkParams?: Record<string, any>;
}

export interface SupportTicketItem {
  ticketId: string;
  category: 'ACCOUNT' | 'APPOINTMENTS' | 'HOSPITALS' | 'RECORDS' | 'SECURITY' | 'INSURANCE' | 'OTHER';
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAtISO: string;
  updatedAtISO: string;
  attachmentCount: number;
}
