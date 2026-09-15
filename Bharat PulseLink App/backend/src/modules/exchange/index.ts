/**
 * Exchange Module (Prompt 108 Extension Point)
 *
 * Domain Boundary:
 * - FHIR / ABDM health record exchange pipeline
 * - Milestone tracking & handshake protocol
 * - Data payload encryption / decryption in transit
 */

export interface HealthDataExchangeSession {
  exchangeId: string;
  patientId: string;
  requesterFacilityId: string;
  consentId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}
