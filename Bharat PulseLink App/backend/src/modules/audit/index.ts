/**
 * Audit Module (Prompt 117 Extension Point)
 *
 * Domain Boundary:
 * - Immutable, tamper-evident audit logging for all PHI/PII access
 * - ABDM-compliant data access tracing (who, when, what facility, consent ID)
 * - Security event logging & forensic trails
 */

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorType: 'PATIENT' | 'PROVIDER' | 'SYSTEM' | 'ADMIN';
  action: 'READ' | 'WRITE' | 'SHARE' | 'REVOKE' | 'EXPORT' | 'DELETE';
  resourceType: string;
  resourceId: string;
  facilityId?: string;
  consentId?: string;
  ipAddress: string;
  timestamp: string;
}
