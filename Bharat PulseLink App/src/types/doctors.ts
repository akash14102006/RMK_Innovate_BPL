/**
 * Bharat PulseLink — Doctor Availability & Scheduling Types (Prompt 49)
 *
 * Types for doctor profiles, availability statuses, time slots,
 * and date-based scheduling feeds.
 */

export type DoctorAvailabilityStatus =
  | 'AVAILABLE'
  | 'LIMITED'
  | 'FULLY_BOOKED'
  | 'NOT_AVAILABLE'
  | 'ON_LEAVE'
  | 'UNKNOWN';

export interface TimeSlot {
  id: string;
  time: string;
  period: 'MORNING' | 'AFTERNOON' | 'EVENING';
  isAvailable: boolean;
  consultationFeeRupees?: number;
}

export interface DoctorProfile {
  id: string;
  hospitalId: string;
  name: string;
  specialty: string;
  department: string;
  qualificationSummary: string;
  experienceYears: number;
  rating?: number;
  photoUrl?: string;
  languages?: string[];
  nextAvailableText?: string;
}

export interface DoctorDailySchedule {
  doctorId: string;
  date: string;
  status: DoctorAvailabilityStatus;
  slots: TimeSlot[];
  updatedAt: string;
}
