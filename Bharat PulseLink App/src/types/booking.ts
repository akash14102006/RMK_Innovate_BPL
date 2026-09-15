/**
 * Bharat PulseLink — Production Appointment Booking Domain Types (Prompts 51–53)
 *
 * Types for:
 * 1. Appointment Selection Context & Slot States (Prompt 51)
 * 2. Booking State Machine & Transaction Boundary (Prompt 52)
 * 3. Booking Confirmation & Resolution Lifecycle (Prompt 53)
 */

export type BookingMode = 'DOCTOR' | 'SERVICE' | 'DEPARTMENT';

export type SlotAvailabilityStatus =
  | 'AVAILABLE'
  | 'LIMITED'
  | 'HELD_BY_SELF'
  | 'NO_LONGER_AVAILABLE'
  | 'BOOKING_CLOSED'
  | 'UNKNOWN';

export interface BookingSlotItem {
  id: string;
  time: string;
  period: 'MORNING' | 'AFTERNOON' | 'EVENING';
  status: SlotAvailabilityStatus;
  isAvailable: boolean;
  consultationFeeRupees?: number;
}

export interface AppointmentSelectionContext {
  hospitalId: string;
  hospitalName?: string;
  departmentId?: string;
  departmentName?: string;
  serviceId?: string;
  serviceName?: string;
  doctorId?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  bookingMode: BookingMode;
  selectedDate?: string;
  selectedSlot?: BookingSlotItem;
}

export type BookingTransactionStatus =
  | 'DRAFT'
  | 'READY'
  | 'SUBMITTING'
  | 'PENDING_PROVIDER'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'UNKNOWN'
  | 'SESSION_REQUIRED'
  | 'OFFLINE'
  | 'ERROR';

export interface BookingSubmissionPayload {
  hospitalId: string;
  hospitalName: string;
  department: string;
  serviceId?: string;
  serviceName?: string;
  doctorId?: string;
  doctorName?: string;
  scheduledDate: string;
  displayDate: string;
  displayTime: string;
  slotId: string;
  locationAddress?: string;
  idempotencyKey: string;
  patientName?: string;
}

export interface BookingSubmissionResponse {
  appointmentId: string;
  status: 'CONFIRMED' | 'PENDING_CONFIRMATION' | 'REJECTED' | 'UNKNOWN';
  bookingReference?: string;
  confirmedDate: string;
  confirmedTime: string;
  hospitalName: string;
  department: string;
  doctorName?: string;
  serviceName?: string;
  locationAddress?: string;
  rejectionReason?: string;
  createdAtISO: string;
}
