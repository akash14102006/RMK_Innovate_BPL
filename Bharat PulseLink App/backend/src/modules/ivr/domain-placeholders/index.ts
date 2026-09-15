/**
 * Bharat PulseLink — IVR Domain Placeholder Services
 *
 * Establishes clean interfaces and dependency boundaries for future steps.
 * Does NOT perform real queries or transactions in Step 5.
 */

import { type IVRSession } from '../ivr.types.js';

export interface IFindHospitalService {
  executePlaceholder(session: IVRSession): Promise<{ status: string; message: string }>;
}

export interface IAppointmentService {
  executePlaceholder(session: IVRSession): Promise<{ status: string; message: string }>;
}

export interface IExistingAppointmentService {
  executePlaceholder(session: IVRSession): Promise<{ status: string; message: string }>;
}

export interface IEmergencyService {
  executePlaceholder(session: IVRSession): Promise<{ status: string; message: string }>;
}

export class FindHospitalPlaceholderService implements IFindHospitalService {
  public async executePlaceholder(session: IVRSession): Promise<{ status: string; message: string }> {
    return {
      status: 'PLACEHOLDER_WIRED',
      message: `Hospital discovery placeholder for session ${session.sessionId} (Step 6/7 integration boundary)`,
    };
  }
}

export class AppointmentPlaceholderService implements IAppointmentService {
  public async executePlaceholder(session: IVRSession): Promise<{ status: string; message: string }> {
    return {
      status: 'PLACEHOLDER_WIRED',
      message: `Appointment booking placeholder for session ${session.sessionId} (Step 9/10 integration boundary)`,
    };
  }
}

export class ExistingAppointmentPlaceholderService implements IExistingAppointmentService {
  public async executePlaceholder(session: IVRSession): Promise<{ status: string; message: string }> {
    return {
      status: 'PLACEHOLDER_WIRED',
      message: `Existing appointment placeholder for session ${session.sessionId}`,
    };
  }
}

export class EmergencyPlaceholderService implements IEmergencyService {
  public async executePlaceholder(session: IVRSession): Promise<{ status: string; message: string }> {
    return {
      status: 'PLACEHOLDER_WIRED',
      message: `Emergency guidance placeholder for session ${session.sessionId} (Non-dispatch advisory)`,
    };
  }
}
