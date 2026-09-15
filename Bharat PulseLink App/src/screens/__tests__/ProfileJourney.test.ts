import { describe, it, expect } from 'vitest';
import { PROFILE_STEPS, createDefaultProfileDraft } from '../../types/profile';
import ProfileValidationService from '../../services/ProfileValidationService';
import ProfileService from '../../services/ProfileService';

describe('Patient Profile Onboarding Journey (Prompts 21–36)', () => {
  it('registers exactly 16 steps in the patient profile journey', () => {
    expect(PROFILE_STEPS.length).toBe(16);
    expect(PROFILE_STEPS[0].stepId).toBe('basic');
    expect(PROFILE_STEPS[15].stepId).toBe('complete');
  });

  it('maintains a single shared ProfileDraft model across all 16 steps', () => {
    const draft = createDefaultProfileDraft('user_patient_99', '+91 98765 43210');
    expect(draft.basic).toBeDefined();
    expect(draft.contact).toBeDefined();
    expect(draft.identification).toBeDefined();
    expect(draft.medicalBasics).toBeDefined();
    expect(draft.conditions).toBeDefined();
    expect(draft.allergies).toBeDefined();
    expect(draft.medications).toBeDefined();
    expect(draft.surgicalHistory).toBeDefined();
    expect(draft.lifestyle).toBeDefined();
    expect(draft.emergencyContact).toBeDefined();
    expect(draft.insurance).toBeDefined();
    expect(draft.documents).toBeDefined();
    expect(draft.vitalRecords).toBeDefined();
    expect(draft.securityConsent).toBeDefined();
  });

  it('validates required vs optional step contracts accurately', () => {
    const draft = createDefaultProfileDraft('user_patient_99', '+91 98765 43210');
    
    // Step 1: Basic
    expect(ProfileValidationService.validateBasicInfo(draft.basic).isValid).toBe(false);

    // Fill Basic
    draft.basic.fullName = 'Priya Patel';
    draft.basic.dateOfBirth = '1998-12-05';
    draft.basic.gender = 'FEMALE';
    expect(ProfileValidationService.validateBasicInfo(draft.basic).isValid).toBe(true);

    // Step 11: Insurance is optional when hasInsurance = false
    draft.insurance.hasInsurance = false;
    expect(ProfileValidationService.validateInsurance(draft.insurance).isValid).toBe(true);

    // When hasInsurance = true, required fields must be present
    draft.insurance.hasInsurance = true;
    expect(ProfileValidationService.validateInsurance(draft.insurance).isValid).toBe(false);
    draft.insurance.providerName = 'Star Health';
    draft.insurance.policyNumberMasked = 'POL123456';
    expect(ProfileValidationService.validateInsurance(draft.insurance).isValid).toBe(true);
  });

  it('enforces backend completion gate before confirming profile setup', async () => {
    const draft = createDefaultProfileDraft('test_patient_123', '+91 98765 43210');
    
    // Incomplete draft should fail completion gate
    await expect(ProfileService.submitFinalProfile(draft)).rejects.toThrow();

    // Populate required fields
    draft.basic = {
      fullName: 'Aarav Sharma',
      dateOfBirth: '1995-08-15',
      gender: 'MALE',
      maritalStatus: 'SINGLE',
      nationality: 'Indian',
    };
    draft.contact = {
      primaryPhone: '+91 98765 43210',
      addressLine1: '45 Koramangala',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560034',
      country: 'India',
    };
    draft.emergencyContact = {
      contactName: 'Vikram Sharma',
      relationship: 'PARENT',
      primaryPhone: '+91 98765 11111',
    };
    draft.securityConsent = {
      storeHealthDataConsent: true,
      consentTimestampISO: new Date().toISOString(),
    };

    const response = await ProfileService.submitFinalProfile(draft);
    expect(response.success).toBe(true);
    expect(response.isComplete).toBe(true);
  });
});
