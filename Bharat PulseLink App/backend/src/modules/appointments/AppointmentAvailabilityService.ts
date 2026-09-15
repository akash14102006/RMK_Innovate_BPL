/**
 * Bharat PulseLink — Appointment Availability Service & Provider Abstraction
 *
 * Discovers available appointment dates and time slots for healthcare facilities.
 * Shared source of truth for Smartphone and IVR channels.
 *
 * Owned by: Appointments Domain (Step 9)
 */

import { AppError, ErrorCode } from '../../core/errors/AppError.js';

export interface AppointmentSlotOption {
  id: string;
  facilityId: string;
  departmentId?: string;
  doctorId?: string | null;
  slotDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm or HH:mm:ss
  endTime: string;
  displayTime: string; // "10:00 AM"
  status: 'AVAILABLE';
  timezone: string;
}

export interface AvailabilityDatesResult {
  facilityId: string;
  dates: string[]; // YYYY-MM-DD
  retrievedAt: Date;
  status: 'SUCCESS' | 'NO_DATES_AVAILABLE' | 'APPOINTMENT_NOT_SUPPORTED' | 'PROVIDER_UNAVAILABLE';
}

export interface AvailabilitySlotsResult {
  facilityId: string;
  slotDate: string;
  slots: AppointmentSlotOption[];
  retrievedAt: Date;
  status: 'SUCCESS' | 'NO_SLOTS_AVAILABLE' | 'PROVIDER_UNAVAILABLE';
}

export interface IAppointmentAvailabilityProvider {
  getAvailableDates(params: {
    facilityId: string;
    fromDate: Date;
    toDate: Date;
  }): Promise<string[]>;

  getAvailableSlots(params: {
    facilityId: string;
    date: string;
  }): Promise<AppointmentSlotOption[]>;
}

export class MockAppointmentProvider implements IAppointmentAvailabilityProvider {
  /**
   * Deterministic test provider for verified facility IDs.
   */
  public async getAvailableDates(params: {
    facilityId: string;
    fromDate: Date;
    toDate: Date;
  }): Promise<string[]> {
    if (params.facilityId === 'fac-no-support') {
      return [];
    }

    const base = new Date();
    const dates: string[] = [];

    // Return next 3 days starting tomorrow
    for (let i = 1; i <= 3; i++) {
      const d = new Date(base.getTime() + i * 24 * 60 * 60 * 1000);
      dates.push(d.toISOString().split('T')[0]);
    }

    return dates;
  }

  public async getAvailableSlots(params: {
    facilityId: string;
    date: string;
  }): Promise<AppointmentSlotOption[]> {
    if (params.facilityId === 'fac-no-slots') {
      return [];
    }

    return [
      {
        id: `slot-${params.date}-01`,
        facilityId: params.facilityId,
        departmentId: 'dept-gen-01',
        slotDate: params.date,
        startTime: '10:00',
        endTime: '10:30',
        displayTime: '10:00 AM',
        status: 'AVAILABLE',
        timezone: 'Asia/Kolkata',
      },
      {
        id: `slot-${params.date}-02`,
        facilityId: params.facilityId,
        departmentId: 'dept-gen-01',
        slotDate: params.date,
        startTime: '11:30',
        endTime: '12:00',
        displayTime: '11:30 AM',
        status: 'AVAILABLE',
        timezone: 'Asia/Kolkata',
      },
      {
        id: `slot-${params.date}-03`,
        facilityId: params.facilityId,
        departmentId: 'dept-gen-01',
        slotDate: params.date,
        startTime: '14:00',
        endTime: '14:30',
        displayTime: '02:00 PM',
        status: 'AVAILABLE',
        timezone: 'Asia/Kolkata',
      },
    ];
  }
}

export class AppointmentAvailabilityService {
  public static readonly DEFAULT_WINDOW_DAYS = 7;
  public static readonly MAX_WINDOW_DAYS = 14;
  public static readonly MAX_DATES_LIMIT = 5;
  public static readonly MAX_SLOTS_LIMIT = 5;

  constructor(private readonly provider: IAppointmentAvailabilityProvider = new MockAppointmentProvider()) {}

  /**
   * Retrieves available upcoming appointment dates for the target facility.
   */
  public async getAvailableDates(params: {
    facilityId: string;
    windowDays?: number;
  }): Promise<AvailabilityDatesResult> {
    if (!params.facilityId || typeof params.facilityId !== 'string') {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid or missing facilityId for appointment availability search',
      });
    }

    const windowDays = Math.min(
      Math.max(params.windowDays ?? AppointmentAvailabilityService.DEFAULT_WINDOW_DAYS, 1),
      AppointmentAvailabilityService.MAX_WINDOW_DAYS,
    );

    const fromDate = new Date();
    const toDate = new Date(fromDate.getTime() + windowDays * 24 * 60 * 60 * 1000);

    try {
      const rawDates = await this.provider.getAvailableDates({
        facilityId: params.facilityId,
        fromDate,
        toDate,
      });

      // Filter, sort chronologically, and bound top-N dates
      const sorted = [...rawDates]
        .filter((d) => Boolean(d) && /^\d{4}-\d{2}-\d{2}$/.test(d))
        .sort((a, b) => a.localeCompare(b))
        .slice(0, AppointmentAvailabilityService.MAX_DATES_LIMIT);

      return {
        facilityId: params.facilityId,
        dates: sorted,
        retrievedAt: new Date(),
        status: sorted.length > 0 ? 'SUCCESS' : 'NO_DATES_AVAILABLE',
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      return {
        facilityId: params.facilityId,
        dates: [],
        retrievedAt: new Date(),
        status: 'PROVIDER_UNAVAILABLE',
      };
    }
  }

  /**
   * Retrieves available time slots on a specific date for the target facility.
   */
  public async getAvailableSlots(params: {
    facilityId: string;
    date: string;
  }): Promise<AvailabilitySlotsResult> {
    if (!params.facilityId || !params.date) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Both facilityId and date are required for slot discovery',
      });
    }

    try {
      const rawSlots = await this.provider.getAvailableSlots({
        facilityId: params.facilityId,
        date: params.date,
      });

      // Validate ownership, filter AVAILABLE, sort by startTime, bound to top 5
      const validSlots = rawSlots
        .filter((s) => s.facilityId === params.facilityId && s.slotDate === params.date && s.status === 'AVAILABLE')
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .slice(0, AppointmentAvailabilityService.MAX_SLOTS_LIMIT);

      return {
        facilityId: params.facilityId,
        slotDate: params.date,
        slots: validSlots,
        retrievedAt: new Date(),
        status: validSlots.length > 0 ? 'SUCCESS' : 'NO_SLOTS_AVAILABLE',
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      return {
        facilityId: params.facilityId,
        slotDate: params.date,
        slots: [],
        retrievedAt: new Date(),
        status: 'PROVIDER_UNAVAILABLE',
      };
    }
  }
}
