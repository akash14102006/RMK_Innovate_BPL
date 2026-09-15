import { describe, it, expect } from 'vitest';
import DoctorAvailabilityService from '../DoctorAvailabilityService';

describe('Prompt 49 — DoctorAvailabilityService & Live Scheduling', () => {
  it('retrieves registered doctors for Rajiv Gandhi Govt General Hospital', async () => {
    const docs = await DoctorAvailabilityService.getDoctorsForHospital('hosp_chennai_01');
    expect(docs.length).toBeGreaterThan(0);
    expect(docs[0].hospitalId).toBe('hosp_chennai_01');
  });

  it('filters doctors by specific clinical specialty (e.g. Cardiology)', async () => {
    const docs = await DoctorAvailabilityService.getDoctorsForHospital('hosp_chennai_01', 'Cardiology');
    expect(docs.length).toBeGreaterThan(0);
    docs.forEach((d) => {
      expect(d.specialty.toLowerCase()).toBe('cardiology');
    });
  });

  it('returns fallback Duty Medical Officer for hospitals without registered doctor rows', async () => {
    const docs = await DoctorAvailabilityService.getDoctorsForHospital('hosp_random_999');
    expect(docs.length).toBe(1);
    expect(docs[0].name).toContain('Duty Medical Officer');
  });

  it('generates authoritative daily schedule with structured time slots and status', async () => {
    const schedule = await DoctorAvailabilityService.getDoctorSchedule('doc_chennai_01', '2026-08-20');
    expect(schedule.doctorId).toBe('doc_chennai_01');
    expect(schedule.date).toBe('2026-08-20');
    expect(schedule.slots.length).toBeGreaterThan(0);
    expect(['AVAILABLE', 'LIMITED', 'FULLY_BOOKED']).toContain(schedule.status);

    const morningSlots = schedule.slots.filter((s) => s.period === 'MORNING');
    expect(morningSlots.length).toBeGreaterThan(0);
  });
});
