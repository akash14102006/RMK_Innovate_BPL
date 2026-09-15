/**
 * Bharat PulseLink — Hospital Service Availability Types (Prompt 50)
 *
 * Distinct taxonomy:
 * - Department (e.g. Cardiovascular Medicine)
 * - Specialty (e.g. Cardiology)
 * - Service (e.g. Cardiology Consultation, Echocardiogram)
 */

export type ServiceOperationalStatus =
  | 'AVAILABLE'
  | 'LIMITED'
  | 'UNAVAILABLE'
  | 'TEMPORARILY_CLOSED'
  | 'APPOINTMENT_REQUIRED'
  | 'UNKNOWN';

export type ServiceCategory =
  | 'CONSULTATION'
  | 'DIAGNOSTIC'
  | 'EMERGENCY'
  | 'PHARMACY'
  | 'PROCEDURE'
  | 'SUPPORT';

export interface HospitalServiceItem {
  id: string;
  hospitalId: string;
  name: string;
  department: string;
  specialty: string;
  category: ServiceCategory;
  description: string;
  operationalStatus: ServiceOperationalStatus;
  appointmentSupported: boolean;
  hoursText: string;
  is24x7: boolean;
  nextAvailableText?: string;
  updatedAt: string;
}
