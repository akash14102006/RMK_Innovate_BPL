/**
 * Appointments Module (Prompt 106 Extension Point)
 *
 * Domain Boundary:
 * - OPD & specialist appointment scheduling
 * - Slot locking & double-booking prevention with transaction isolation
 * - Rescheduling, cancellation, reminders
 */

export interface AppointmentSlot {
  id: string;
  facilityId: string;
  departmentId: string;
  doctorId?: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}
