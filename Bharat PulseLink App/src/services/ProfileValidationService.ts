import type {
  ProfileDraft,
  BasicInfoData,
  ContactDetailsData,
  IdentificationData,
  MedicalBasicsData,
  EmergencyContactData,
  InsuranceData,
  SecurityConsentData,
} from '../types/profile';

export interface StepValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export class ProfileValidationService {
  /**
   * Step 1: Basic Information Validation
   */
  public static validateBasicInfo(data: BasicInfoData): StepValidationResult {
    const errors: Record<string, string> = {};

    const trimmedName = data.fullName ? data.fullName.trim() : '';
    if (!trimmedName) {
      errors.fullName = 'profile.validation.fullNameRequired';
    } else if (trimmedName.length < 2) {
      errors.fullName = 'profile.validation.fullNameMinLength';
    } else if (trimmedName.length > 100) {
      errors.fullName = 'profile.validation.fullNameMaxLength';
    }

    if (!data.dateOfBirth) {
      errors.dateOfBirth = 'profile.validation.dobRequired';
    } else {
      const dobDate = new Date(data.dateOfBirth);
      const today = new Date();
      if (isNaN(dobDate.getTime()) || dobDate > today) {
        errors.dateOfBirth = 'profile.validation.dobInvalid';
      }
    }

    if (!data.gender) {
      errors.gender = 'profile.validation.genderRequired';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Step 2: Contact Details Validation
   */
  public static validateContactDetails(data: ContactDetailsData): StepValidationResult {
    const errors: Record<string, string> = {};

    if (!data.addressLine1 || !data.addressLine1.trim()) {
      errors.addressLine1 = 'profile.validation.addressRequired';
    }

    if (!data.city || !data.city.trim()) {
      errors.city = 'profile.validation.cityRequired';
    }

    if (!data.state || !data.state.trim()) {
      errors.state = 'profile.validation.stateRequired';
    }

    if (!data.pincode || !data.pincode.trim()) {
      errors.pincode = 'profile.validation.pincodeRequired';
    } else if (!/^\d{6}$/.test(data.pincode.trim())) {
      errors.pincode = 'profile.validation.pincodeFormat';
    }

    if (data.email && data.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email.trim())) {
        errors.email = 'profile.validation.emailFormat';
      }
    }

    if (data.alternatePhone && data.alternatePhone.trim()) {
      const cleanPhone = data.alternatePhone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        errors.alternatePhone = 'profile.validation.phoneFormat';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Step 3: Identification Validation
   */
  public static validateIdentification(data: IdentificationData): StepValidationResult {
    const errors: Record<string, string> = {};

    if (data.aadhaarNumberMasked && data.aadhaarNumberMasked.trim()) {
      const digits = data.aadhaarNumberMasked.replace(/\D/g, '');
      if (digits.length > 0 && digits.length !== 12 && digits.length !== 4) {
        errors.aadhaarNumberMasked = 'profile.validation.aadhaarFormat';
      }
    }

    if (data.panNumberMasked && data.panNumberMasked.trim()) {
      const cleanPan = data.panNumberMasked.trim().toUpperCase();
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan) && cleanPan.length !== 4) {
        errors.panNumberMasked = 'profile.validation.panFormat';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Step 4: Medical Basics Validation
   */
  public static validateMedicalBasics(data: MedicalBasicsData): StepValidationResult {
    const errors: Record<string, string> = {};

    if (data.heightCm !== undefined && (data.heightCm < 30 || data.heightCm > 300)) {
      errors.heightCm = 'profile.validation.heightRange';
    }

    if (data.weightKg !== undefined && (data.weightKg < 2 || data.weightKg > 500)) {
      errors.weightKg = 'profile.validation.weightRange';
    }

    if (data.bpSystolic !== undefined && (data.bpSystolic < 50 || data.bpSystolic > 250)) {
      errors.bpSystolic = 'profile.validation.bpRange';
    }

    if (data.bpDiastolic !== undefined && (data.bpDiastolic < 30 || data.bpDiastolic > 180)) {
      errors.bpDiastolic = 'profile.validation.bpRange';
    }

    if (data.bloodSugarMgDl !== undefined && (data.bloodSugarMgDl < 20 || data.bloodSugarMgDl > 1000)) {
      errors.bloodSugarMgDl = 'profile.validation.sugarRange';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Step 10: Emergency Contact Validation
   */
  public static validateEmergencyContact(data: EmergencyContactData): StepValidationResult {
    const errors: Record<string, string> = {};

    if (!data.contactName || !data.contactName.trim()) {
      errors.contactName = 'profile.validation.contactNameRequired';
    }

    if (!data.relationship) {
      errors.relationship = 'profile.validation.relationshipRequired';
    }

    if (!data.primaryPhone || !data.primaryPhone.trim()) {
      errors.primaryPhone = 'profile.validation.phoneRequired';
    } else {
      const cleanPhone = data.primaryPhone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        errors.primaryPhone = 'profile.validation.phoneFormat';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Step 11: Insurance Details Validation
   */
  public static validateInsurance(data: InsuranceData): StepValidationResult {
    const errors: Record<string, string> = {};

    if (data.hasInsurance) {
      if (!data.providerName || !data.providerName.trim()) {
        errors.providerName = 'profile.validation.providerRequired';
      }
      if (!data.policyNumberMasked || !data.policyNumberMasked.trim()) {
        errors.policyNumberMasked = 'profile.validation.policyRequired';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Step 15: Security & Consent Validation
   */
  public static validateSecurityConsent(data: SecurityConsentData): StepValidationResult {
    const errors: Record<string, string> = {};

    if (!data.storeHealthDataConsent) {
      errors.storeHealthDataConsent = 'profile.validation.consentRequired';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Complete Profile Contract Validation (Gates final submission)
   */
  public static validateFullProfileContract(draft: ProfileDraft): StepValidationResult {
    const basicRes = this.validateBasicInfo(draft.basic);
    const contactRes = this.validateContactDetails(draft.contact);
    const emergencyRes = this.validateEmergencyContact(draft.emergencyContact);
    const consentRes = this.validateSecurityConsent(draft.securityConsent);

    const allErrors = {
      ...basicRes.errors,
      ...contactRes.errors,
      ...emergencyRes.errors,
      ...consentRes.errors,
    };

    return {
      isValid: Object.keys(allErrors).length === 0,
      errors: allErrors,
    };
  }
}

export default ProfileValidationService;
