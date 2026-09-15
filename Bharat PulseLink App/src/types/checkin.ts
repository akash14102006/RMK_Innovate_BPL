/**
 * Bharat PulseLink — Hospital Check-In & Live Queue Types (Prompts 61–62)
 *
 * Domain types for:
 * 1. Server-authoritative hospital check-in records (Prompt 61)
 * 2. Real-time live queue progression state machine (Prompt 62)
 * 3. Event gateway with deduplication & sequence ordering
 * 4. Terminal state boundaries and facility guidance.
 */

export type CheckInStatus =
  | 'CHECK_IN_PENDING'
  | 'CHECKED_IN'
  | 'WAITING'
  | 'CALLED'
  | 'IN_CONSULTATION'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REJECTED'
  | 'UNKNOWN';

export type QueueTimelineStage =
  | 'CHECKED_IN'
  | 'WAITING'
  | 'CALLED'
  | 'IN_CONSULTATION'
  | 'COMPLETED';

export interface CheckInRecord {
  checkInId: string;
  hospitalId: string;
  hospitalName: string;
  departmentName: string;
  serviceName?: string;
  counterDesk?: string;
  roomNumber?: string;
  tokenNumber: string;
  queuePosition?: number;
  estimatedWaitMinutes?: number;
  status: CheckInStatus;
  checkedInAtISO: string;
  updatedAtISO: string;
  isLive: boolean;
  appointmentId?: string;
  appointmentDisplayDate?: string;
  appointmentDisplayTime?: string;
  doctorName?: string;
  notes?: string;
}

export interface CheckInEvent {
  eventId: string;
  checkInId: string;
  sequenceNumber: number;
  status: CheckInStatus;
  queuePosition?: number;
  estimatedWaitMinutes?: number;
  roomNumber?: string;
  serverTimestampISO: string;
}
