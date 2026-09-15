/**
 * Bharat PulseLink — IVR Application Service Domain Types
 *
 * Strict TypeScript types for IVR call lifecycle, state machine,
 * session management, language, menus, PIN code collection, PostGIS hospital search,
 * hospital selection, appointment slot discovery, and booking confirmation with SMS (Step 11).
 *
 * Owned by: IVR Subsystem (Step 5, 6, 7, 8, 9, 10 & 11)
 */

import { type AppointmentSlotOption } from '../appointments/AppointmentAvailabilityService.js';

export type LanguageCode = 'ta' | 'en' | 'hi';

export type IVRState =
  | 'CALL_RECEIVED'
  | 'LANGUAGE_SELECTION'
  | 'MAIN_MENU'
  | 'FIND_HOSPITAL'
  | 'PIN_INPUT'
  | 'PIN_VALIDATED'
  | 'HOSPITAL_SEARCHING'
  | 'HOSPITAL_RESULTS_READY'
  | 'HOSPITAL_SELECTION'
  | 'HOSPITAL_CONFIRMATION'
  | 'HOSPITAL_CONFIRMED'
  | 'NO_HOSPITALS_FOUND'
  | 'HOSPITAL_SEARCH_FAILED'
  | 'APPOINTMENT_DATE_SELECTION'
  | 'APPOINTMENT_SLOT_SELECTION'
  | 'SLOT_CONFIRMATION'
  | 'SLOT_CONFIRMED_FOR_BOOKING'
  | 'BOOKING_CONFIRMED'
  | 'NO_APPOINTMENT_DATES'
  | 'NO_APPOINTMENT_SLOTS'
  | 'APPOINTMENT_PROVIDER_ERROR'
  | 'BOOK_APPOINTMENT'
  | 'EXISTING_APPOINTMENT'
  | 'EMERGENCY'
  | 'COMPLETED'
  | 'FAILED'
  | 'TERMINATED';

export type IVREventType =
  | 'CALL_STARTED'
  | 'DTMF_RECEIVED'
  | 'TIMEOUT'
  | 'PLAYBACK_FINISHED'
  | 'CALL_HANGUP'
  | 'SYSTEM_ERROR';

export type IVRIntent =
  | 'FIND_HOSPITAL'
  | 'BOOK_APPOINTMENT'
  | 'EXISTING_APPOINTMENT'
  | 'EMERGENCY'
  | 'SELECT_LANGUAGE'
  | 'NONE';

export type IVRAction =
  | 'PLAY_AND_WAIT'
  | 'PLAY_AND_HANGUP'
  | 'HANGUP'
  | 'CONTINUE';

export interface IVRAttemptCounters {
  language: number;
  menu: number;
  pincode: number;
  hospitalSelection: number;
  hospitalConfirmation: number;
  appointmentDate: number;
  appointmentSlot: number;
  slotConfirmation: number;
}

export interface IVRResolvedLocation {
  latitude: number;
  longitude: number;
  city?: string;
  district?: string;
  state?: string;
  source: string;
}

export interface IVRNearbyHospitalSummary {
  id: string;
  name: string;
  displayName: string;
  facilityType: string;
  distanceMeters: number;
  distanceKm: number;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string;
}

export interface IVRSession {
  sessionId: string;
  callId: string;
  channelId: string;
  callerNumber?: string;
  language: LanguageCode | null;
  state: IVRState;
  intent: IVRIntent;
  pincode?: string;
  resolvedLocation?: IVRResolvedLocation;
  nearbyHospitals?: IVRNearbyHospitalSummary[];
  selectedHospitalId?: string;
  selectedHospital?: IVRNearbyHospitalSummary;
  availableDates?: string[];
  selectedAppointmentDate?: string;
  availableSlots?: AppointmentSlotOption[];
  selectedSlotId?: string;
  selectedSlot?: AppointmentSlotOption;
  bookingId?: string;
  bookingReference?: string;
  notificationStatus?: string;
  availabilityRetrievedAt?: Date;
  searchRadiusMeters?: number;
  attemptCounters: IVRAttemptCounters;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

export interface IVREvent {
  type: IVREventType;
  callId: string;
  channelId?: string;
  digits?: string;
  correlationId?: string;
  payload?: Record<string, unknown>;
}

export interface TransitionResult {
  nextState: IVRState;
  promptKey: string | null;
  action: IVRAction;
  language?: LanguageCode;
  intent?: IVRIntent;
  pincode?: string;
  nearbyHospitals?: IVRNearbyHospitalSummary[];
  selectedHospitalId?: string;
  selectedHospital?: IVRNearbyHospitalSummary;
  availableDates?: string[];
  selectedAppointmentDate?: string;
  availableSlots?: AppointmentSlotOption[];
  selectedSlotId?: string;
  selectedSlot?: AppointmentSlotOption;
  bookingId?: string;
  bookingReference?: string;
  notificationStatus?: string;
  error?: string;
}

export interface IVRMenuItem {
  digit: string;
  intent: IVRIntent;
  targetState: IVRState;
  description: string;
}
