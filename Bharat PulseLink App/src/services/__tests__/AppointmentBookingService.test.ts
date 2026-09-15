import { describe, it, expect, vi, beforeEach } from 'vitest';
import AppointmentBookingService from '../AppointmentBookingService';
import AppointmentService from '../AppointmentService';

vi.mock('../secureStore', () => ({
  default: {
    set: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    remove: vi.fn().mockResolvedValue(undefined),
  },
  set: vi.fn().mockResolvedValue(undefined),
  get: vi.fn().mockResolvedValue(null),
  remove: vi.fn().mockResolvedValue(undefined),
}));

describe('Prompts 51–53 — AppointmentBookingService & Transaction Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retrieves authoritative booking slots grouped into Morning, Afternoon, and Evening (Prompt 51)', async () => {
    const slots = await AppointmentBookingService.getAvailableSlots('hosp_chennai_01', '2026-08-20');
    expect(slots.length).toBeGreaterThan(0);

    const morning = slots.filter((s) => s.period === 'MORNING');
    const afternoon = slots.filter((s) => s.period === 'AFTERNOON');
    const evening = slots.filter((s) => s.period === 'EVENING');

    expect(morning.length).toBeGreaterThan(0);
    expect(afternoon.length).toBeGreaterThan(0);
    expect(evening.length).toBeGreaterThan(0);
  });

  it('generates unique, collision-resistant idempotency keys per transaction (Prompt 52)', () => {
    const key1 = AppointmentBookingService.generateIdempotencyKey();
    const key2 = AppointmentBookingService.generateIdempotencyKey();

    expect(key1).toContain('idem_');
    expect(key2).toContain('idem_');
    expect(key1).not.toBe(key2);
  });

  it('successfully submits and confirms valid booking request (Prompt 52 & 53)', async () => {
    const payload = {
      hospitalId: 'hosp_chennai_01',
      hospitalName: 'Rajiv Gandhi Government General Hospital',
      department: 'Cardiology',
      doctorName: 'Dr. S. Ranganathan',
      scheduledDate: '2026-08-20',
      displayDate: 'Thu, 20 Aug 2026',
      displayTime: '10:30 AM',
      slotId: 'slot_hosp_chennai_01_2026-08-20_1030',
      locationAddress: 'EVR Periyar Salai, Park Town, Chennai',
      idempotencyKey: AppointmentBookingService.generateIdempotencyKey(),
      patientName: 'Akash Kumar',
    };

    const res = await AppointmentBookingService.submitBooking('user_patient_primary', payload);

    expect(res.status).toBe('CONFIRMED');
    expect(res.appointmentId).toBeDefined();
    expect(res.bookingReference).toContain('BPL-');
    expect(res.confirmedDate).toBe('Thu, 20 Aug 2026');
    expect(res.confirmedTime).toBe('10:30 AM');
    expect(res.hospitalName).toBe('Rajiv Gandhi Government General Hospital');
  });

  it('rejects stale or already-booked slots during server-side revalidation (Prompt 52)', async () => {
    const payload = {
      hospitalId: 'hosp_chennai_01',
      hospitalName: 'Rajiv Gandhi Government General Hospital',
      department: 'Cardiology',
      scheduledDate: '2026-08-20',
      displayDate: 'Thu, 20 Aug 2026',
      displayTime: '10:00 AM',
      slotId: 'slot_hosp_chennai_01_2026-08-20_1000', // Stale/closed slot
      locationAddress: 'EVR Periyar Salai, Park Town, Chennai',
      idempotencyKey: AppointmentBookingService.generateIdempotencyKey(),
    };

    const res = await AppointmentBookingService.submitBooking('user_patient_primary', payload);

    expect(res.status).toBe('REJECTED');
    expect(res.rejectionReason).toContain('no longer available');
  });
});
