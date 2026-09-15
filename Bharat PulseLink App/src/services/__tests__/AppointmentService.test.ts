import { describe, it, expect, vi, beforeEach } from 'vitest';
import AppointmentService from '../AppointmentService';

vi.mock('../secureStore', () => {
  const store = new Map<string, string>();
  return {
    set: vi.fn(async (k: string, v: string) => { store.set(k, v); }),
    get: vi.fn(async (k: string) => store.get(k) || null),
    remove: vi.fn(async (k: string) => { store.delete(k); }),
    default: {
      set: vi.fn(async (k: string, v: string) => { store.set(k, v); }),
      get: vi.fn(async (k: string) => store.get(k) || null),
      remove: vi.fn(async (k: string) => { store.delete(k); }),
    },
  };
});

describe('Prompt 40 — AppointmentService Domain & Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns honest empty lists when no appointments exist', async () => {
    const { upcoming, completed } = await AppointmentService.getAppointments('user_empty_patient');
    expect(upcoming).toEqual([]);
    expect(completed).toEqual([]);
  });

  it('books new appointment with confirmed status and booking reference', async () => {
    const newAppt = await AppointmentService.bookAppointment('user_patient_booking', {
      hospitalName: 'Apollo Specialty Hospital',
      department: 'Cardiology',
      specialty: 'Interventional Cardiology',
      doctorName: 'Sundar Raman',
      scheduledAtISO: '2026-09-15T10:00:00.000Z',
      displayDate: '15 Sep 2026',
      displayTime: '10:00 AM',
      locationAddress: 'Greams Road, Chennai',
    });

    expect(newAppt.id).toBeDefined();
    expect(newAppt.status).toBe('CONFIRMED');
    expect(newAppt.bookingReference).toContain('BPL-');

    const { upcoming, completed } = await AppointmentService.getAppointments('user_patient_booking');
    expect(upcoming.length).toBe(1);
    expect(upcoming[0].hospitalName).toBe('Apollo Specialty Hospital');
    expect(completed.length).toBe(0);
  });

  it('cancels appointment and updates category to completed history', async () => {
    const booked = await AppointmentService.bookAppointment('user_cancel_patient', {
      hospitalName: 'Government General Hospital',
      department: 'General Medicine',
      scheduledAtISO: '2026-10-01T09:30:00.000Z',
      displayDate: '01 Oct 2026',
      displayTime: '09:30 AM',
    });

    const { upcoming, completed } = await AppointmentService.cancelAppointment('user_cancel_patient', booked.id);
    expect(upcoming.length).toBe(0);
    expect(completed.length).toBe(1);
    expect(completed[0].status).toBe('CANCELLED');
  });

  it('isolates appointments strictly per authenticated user account', async () => {
    await AppointmentService.bookAppointment('user_alice', {
      hospitalName: 'Alice Clinic',
      department: 'Dermatology',
      scheduledAtISO: '2026-11-01T11:00:00.000Z',
      displayDate: '01 Nov 2026',
      displayTime: '11:00 AM',
    });

    const bobAppointments = await AppointmentService.getAppointments('user_bob');
    expect(bobAppointments.upcoming.length).toBe(0);
    expect(bobAppointments.completed.length).toBe(0);
  });
});
