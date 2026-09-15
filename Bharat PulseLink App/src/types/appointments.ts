export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'RESCHEDULED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'EXPIRED'
  | 'REQUIRES_ACTION';

export interface AppointmentItem {
  id: string;
  hospitalName: string;
  department: string;
  specialty?: string;
  doctorName?: string;
  serviceName?: string;
  scheduledAtISO: string;
  displayDate: string;
  displayTime: string;
  status: AppointmentStatus;
  bookingReference?: string;
  locationAddress?: string;
  isVirtual?: boolean;
  instructions?: string;
}

export type AppointmentTab = 'UPCOMING' | 'COMPLETED';

export interface AppointmentListResponse {
  upcoming: AppointmentItem[];
  completed: AppointmentItem[];
}

export interface BookAppointmentPayload {
  hospitalName: string;
  department: string;
  specialty?: string;
  doctorName?: string;
  scheduledAtISO: string;
  displayDate: string;
  displayTime: string;
  locationAddress?: string;
}
