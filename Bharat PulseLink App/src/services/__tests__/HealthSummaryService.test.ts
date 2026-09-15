import { describe, it, expect, vi, beforeEach } from 'vitest';
import HealthSummaryService from '../HealthSummaryService';
import ProfileDraftService from '../ProfileDraftService';
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

describe('Prompt 41 — HealthSummaryService & Provenance Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('BMI Calculation Safety', () => {
    it('calculates BMI correctly with standard height and weight', () => {
      // 70 kg, 175 cm => 70 / (1.75 * 1.75) = 22.857 => 22.9
      const bmi = HealthSummaryService.calculateBMI(70, 175);
      expect(bmi).toBe(22.9);
    });

    it('returns null safely when height or weight is missing or zero', () => {
      expect(HealthSummaryService.calculateBMI(undefined, 175)).toBeNull();
      expect(HealthSummaryService.calculateBMI(70, undefined)).toBeNull();
      expect(HealthSummaryService.calculateBMI(0, 175)).toBeNull();
      expect(HealthSummaryService.calculateBMI(70, 0)).toBeNull();
      expect(HealthSummaryService.calculateBMI(-5, 175)).toBeNull();
    });
  });

  describe('Health Summary Aggregation & Provenance', () => {
    it('aggregates patient-provided data from draft correctly', async () => {
      vi.spyOn(ProfileDraftService, 'loadDraft').mockResolvedValueOnce({
        version: 1,
        userId: 'user_test_summary',
        completedStepIds: ['basic', 'contact', 'medicalBasics'],
        isComplete: false,
        basic: { fullName: 'Test Patient', dateOfBirth: '1995-01-01', gender: 'MALE', maritalStatus: 'SINGLE', nationality: 'Indian' },
        contact: { primaryPhone: '+919876543210', addressLine1: 'Test St', city: 'Chennai', state: 'Tamil Nadu', pincode: '600001', country: 'India' },
        identification: {
          bloodGroup: 'B+',
        },
        medicalBasics: {
          heightCm: 180,
          weightKg: 75,
        },
        allergies: {
          hasPollen: false,
          hasDust: true,
          hasPeanuts: true,
          hasMedications: false,
          hasSeafood: false,
          otherAllergyEnabled: false,
        },
        conditions: {
          hasDiabetes: false,
          hasHypertension: false,
          hasAsthma: true,
          hasThyroid: false,
          hasHeartDisease: false,
          otherConditionEnabled: false,
        },
        medications: [],
        surgicalHistory: [],
        lifestyle: { dietType: 'VEGETARIAN', exerciseFrequency: 'REGULARLY', smokingStatus: 'NO', alcoholStatus: 'NONE' },
        emergencyContact: { contactName: 'Contact', relationship: 'PARENT', primaryPhone: '+919876543210' },
        insurance: { hasInsurance: false },
        documents: [],
        vitalRecords: [],
        securityConsent: { storeHealthDataConsent: true },
        updatedAtISO: '2026-08-19T01:00:00.000Z',
      });

      vi.spyOn(AppointmentService, 'getAppointments').mockResolvedValueOnce({
        upcoming: [],
        completed: [
          {
            id: 'appt_past',
            hospitalName: 'Apollo Hospital',
            department: 'Pulmonology',
            scheduledAtISO: '2026-05-12T10:00:00.000Z',
            displayDate: '12 May 2026',
            displayTime: '10:00 AM',
            status: 'COMPLETED',
          },
        ],
      });

      const summary = await HealthSummaryService.getHealthSummary('user_test_summary');

      expect(summary.bloodGroup.value).toBe('B+');
      expect(summary.bloodGroup.provenance).toBe('PATIENT_PROVIDED');
      expect(summary.heightCm.value).toBe(180);
      expect(summary.weightKg.value).toBe(75);
      expect(summary.bmi.value).toBe(23.1); // 75 / (1.8 * 1.8) = 23.148 => 23.1
      expect(summary.bmi.provenance).toBe('SYSTEM_DERIVED');
      expect(summary.allergies.value).toEqual(['Dust', 'Peanuts']);
      expect(summary.chronicConditions.value).toEqual(['Asthma']);
      expect(summary.lastCheckup.value).toContain('12 May 2026');
      expect(summary.lastCheckup.provenance).toBe('HOSPITAL_IMPORTED');
    });

    it('assigns CLINICALLY_VERIFIED provenance when profile is fully complete', async () => {
      vi.spyOn(ProfileDraftService, 'loadDraft').mockResolvedValueOnce({
        version: 1,
        userId: 'user_verified_patient',
        completedStepIds: ['basic', 'contact', 'identification', 'medicalBasics', 'conditions', 'allergies', 'medications', 'surgicalHistory', 'lifestyle', 'emergencyContact', 'insurance', 'documents', 'vitalRecords', 'review', 'securityConsent', 'complete'],
        isComplete: true,
        basic: { fullName: 'Verified Patient', dateOfBirth: '1990-01-01', gender: 'FEMALE', maritalStatus: 'MARRIED', nationality: 'Indian' },
        contact: { primaryPhone: '+919876543210', addressLine1: 'Test Ave', city: 'Chennai', state: 'Tamil Nadu', pincode: '600001', country: 'India' },
        identification: {
          bloodGroup: 'O+',
        },
        medicalBasics: {
          heightCm: 170,
          weightKg: 65,
        },
        allergies: { hasPollen: false, hasDust: false, hasPeanuts: false, hasMedications: false, hasSeafood: false, otherAllergyEnabled: false },
        conditions: { hasDiabetes: false, hasHypertension: false, hasAsthma: false, hasThyroid: false, hasHeartDisease: false, otherConditionEnabled: false },
        medications: [],
        surgicalHistory: [],
        lifestyle: { dietType: 'VEGETARIAN', exerciseFrequency: 'REGULARLY', smokingStatus: 'NO', alcoholStatus: 'NONE' },
        emergencyContact: { contactName: 'Contact', relationship: 'SPOUSE', primaryPhone: '+919876543210' },
        insurance: { hasInsurance: false },
        documents: [],
        vitalRecords: [],
        securityConsent: { storeHealthDataConsent: true },
        updatedAtISO: '2026-08-19T01:00:00.000Z',
      });

      vi.spyOn(AppointmentService, 'getAppointments').mockResolvedValueOnce({
        upcoming: [],
        completed: [],
      });

      const summary = await HealthSummaryService.getHealthSummary('user_verified_patient');

      expect(summary.bloodGroup.provenance).toBe('CLINICALLY_VERIFIED');
      expect(summary.bloodGroup.sourceLabel).toBe('Clinically Verified');
      expect(summary.heightCm.provenance).toBe('CLINICALLY_VERIFIED');
      expect(summary.lastCheckup.value).toBeNull();
      expect(summary.lastCheckup.sourceLabel).toBe('No checkup recorded yet');
    });
  });
});
