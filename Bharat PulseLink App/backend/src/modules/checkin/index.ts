/**
 * Check-in Module (Prompt 109 Extension Point)
 *
 * Domain Boundary:
 * - Live hospital arrival & counter check-in
 * - Real-time queue position & ETA updates
 * - Counter routing & fast-track escalation
 */

export interface LiveCheckIn {
  checkInId: string;
  patientId: string;
  facilityId: string;
  tokenNumber: string;
  counterNumber: string;
  queuePosition: number;
  estimatedWaitMinutes: number;
  status: 'QUEUED' | 'CALLED' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}
