import { describe, it, expect } from 'vitest';
import {
  AppointmentAvailabilityService,
  MockAppointmentProvider,
  type IAppointmentAvailabilityProvider,
} from '../../../src/modules/appointments/AppointmentAvailabilityService.js';
import { AppError } from '../../../src/core/errors/AppError.js';

describe('AppointmentAvailabilityService — Availability Discovery & Provider Abstraction', () => {
  const service = new AppointmentAvailabilityService(new MockAppointmentProvider());

  it('rejects invalid or missing facility ID', async () => {
    await expect(service.getAvailableDates({ facilityId: '' })).rejects.toThrow(AppError);
  });

  it('retrieves upcoming dates sorted chronologically', async () => {
    const res = await service.getAvailableDates({ facilityId: 'fac-sample-01', windowDays: 7 });
    expect(res.status).toBe('SUCCESS');
    expect(res.facilityId).toBe('fac-sample-01');
    expect(res.dates.length).toBe(3);
    expect(res.dates[0] < res.dates[1]).toBe(true);
    expect(res.retrievedAt).toBeInstanceOf(Date);
  });

  it('handles facility with no available dates gracefully', async () => {
    const res = await service.getAvailableDates({ facilityId: 'fac-no-support' });
    expect(res.status).toBe('NO_DATES_AVAILABLE');
    expect(res.dates.length).toBe(0);
  });

  it('retrieves available time slots for a specific date sorted by start time', async () => {
    const date = '2026-09-02';
    const res = await service.getAvailableSlots({ facilityId: 'fac-sample-01', date });
    expect(res.status).toBe('SUCCESS');
    expect(res.facilityId).toBe('fac-sample-01');
    expect(res.slotDate).toBe(date);
    expect(res.slots.length).toBe(3);
    expect(res.slots[0].startTime).toBe('10:00');
    expect(res.slots[1].startTime).toBe('11:30');
    expect(res.slots[2].startTime).toBe('14:00');
    expect(res.slots[0].status).toBe('AVAILABLE');
  });

  it('handles date with no available slots gracefully', async () => {
    const res = await service.getAvailableSlots({ facilityId: 'fac-no-slots', date: '2026-09-02' });
    expect(res.status).toBe('NO_SLOTS_AVAILABLE');
    expect(res.slots.length).toBe(0);
  });

  it('filters out slots belonging to other facilities or dates (cross-tenant safety)', async () => {
    const rogueProvider: IAppointmentAvailabilityProvider = {
      async getAvailableDates() {
        return ['2026-09-02'];
      },
      async getAvailableSlots() {
        return [
          {
            id: 'slot-correct',
            facilityId: 'fac-sample-01',
            slotDate: '2026-09-02',
            startTime: '10:00',
            endTime: '10:30',
            displayTime: '10:00 AM',
            status: 'AVAILABLE',
            timezone: 'Asia/Kolkata',
          },
          {
            id: 'slot-wrong-fac',
            facilityId: 'fac-other-facility',
            slotDate: '2026-09-02',
            startTime: '11:00',
            endTime: '11:30',
            displayTime: '11:00 AM',
            status: 'AVAILABLE',
            timezone: 'Asia/Kolkata',
          },
          {
            id: 'slot-wrong-date',
            facilityId: 'fac-sample-01',
            slotDate: '2026-09-05',
            startTime: '12:00',
            endTime: '12:30',
            displayTime: '12:00 PM',
            status: 'AVAILABLE',
            timezone: 'Asia/Kolkata',
          },
        ];
      },
    };

    const safeService = new AppointmentAvailabilityService(rogueProvider);
    const res = await safeService.getAvailableSlots({ facilityId: 'fac-sample-01', date: '2026-09-02' });
    expect(res.slots.length).toBe(1);
    expect(res.slots[0].id).toBe('slot-correct');
  });

  it('handles provider runtime failures safely without crashing', async () => {
    const failingProvider: IAppointmentAvailabilityProvider = {
      async getAvailableDates() {
        throw new Error('Connection refused by hospital HIS API');
      },
      async getAvailableSlots() {
        throw new Error('HIS Gateway Timeout 504');
      },
    };

    const errorService = new AppointmentAvailabilityService(failingProvider);
    const dateRes = await errorService.getAvailableDates({ facilityId: 'fac-sample-01' });
    expect(dateRes.status).toBe('PROVIDER_UNAVAILABLE');
    expect(dateRes.dates.length).toBe(0);

    const slotRes = await errorService.getAvailableSlots({ facilityId: 'fac-sample-01', date: '2026-09-02' });
    expect(slotRes.status).toBe('PROVIDER_UNAVAILABLE');
    expect(slotRes.slots.length).toBe(0);
  });
});
