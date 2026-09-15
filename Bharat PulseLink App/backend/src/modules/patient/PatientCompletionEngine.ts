/**
 * Patient Completion Engine
 *
 * Deterministic calculation of patient profile completion status,
 * section completeness breakdown, and percentage according to healthcare onboarding rules.
 *
 * Owned by: Patient Domain (Prompt 90)
 */

import type {
  PatientProfileRow,
  EmergencyContactRow,
  PatientInsuranceRow,
} from '../../core/types/database.types.js';
import type { ProfileCompletionDTO } from './patient.schemas.js';

export interface SectionEvaluation {
  id: string;
  title: string;
  weight: number;
  isComplete: boolean;
  missingFields: string[];
}

export class PatientCompletionEngine {
  /**
   * Evaluates patient profile completeness deterministically.
   */
  static evaluate(
    profile: PatientProfileRow,
    emergencyContacts: EmergencyContactRow[] = [],
    _insurance: PatientInsuranceRow[] = [],
  ): ProfileCompletionDTO {
    const sections: SectionEvaluation[] = [
      this._evaluateBasicInfo(profile),
      this._evaluateContactInfo(profile),
      this._evaluateMedicalBasics(profile),
      this._evaluateEmergencyContact(emergencyContacts),
    ];

    const completedSections = sections.filter((s) => s.isComplete).map((s) => s.id);
    const missingRequirements = sections.flatMap((s) => s.missingFields);

    // Calculate weighted completion percentage
    let totalScore = 0;
    for (const section of sections) {
      if (section.isComplete) {
        totalScore += section.weight;
      }
    }
    const completionPercentage = Math.round(totalScore);

    const isComplete = sections.every((s) => s.isComplete);

    let profileStatus = profile.status;
    if (isComplete && (profileStatus === 'INCOMPLETE' || profileStatus === 'DRAFT' || profileStatus === 'NOT_STARTED')) {
      profileStatus = 'ACTIVE';
    }

    return {
      isComplete,
      completionPercentage,
      profileStatus,
      requiredSections: sections.map((s) => ({
        id: s.id,
        title: s.title,
        isComplete: s.isComplete,
        missingFields: s.missingFields,
      })),
      completedSections,
      missingRequirements,
    };
  }

  private static _evaluateBasicInfo(profile: PatientProfileRow): SectionEvaluation {
    const missingFields: string[] = [];

    if (!profile.full_name || profile.full_name.trim().length === 0) {
      missingFields.push('Full Name is required');
    }

    if (!profile.gender || !['MALE', 'FEMALE', 'OTHER', 'UNDISCLOSED'].includes(profile.gender)) {
      missingFields.push('Gender is required');
    }

    if (!profile.date_of_birth) {
      missingFields.push('Date of Birth is required');
    }

    return {
      id: 'basic_info',
      title: 'Basic Information',
      weight: 35,
      isComplete: missingFields.length === 0,
      missingFields,
    };
  }

  private static _evaluateContactInfo(profile: PatientProfileRow): SectionEvaluation {
    const missingFields: string[] = [];

    const hasPhone = Boolean(profile.primary_phone && profile.primary_phone.trim().length > 0);
    const hasEmail = Boolean(profile.primary_email && profile.primary_email.trim().length > 0);

    if (!hasPhone && !hasEmail) {
      missingFields.push('At least one contact method (phone or email) is required');
    }

    const hasAddress = Boolean(
      (profile.address_line_1 && profile.address_line_1.trim().length > 0) ||
      (profile.pincode && profile.pincode.trim().length > 0) ||
      (profile.locality && profile.locality.trim().length > 0)
    );

    if (!hasAddress) {
      missingFields.push('Address or Pincode is required');
    }

    return {
      id: 'contact_info',
      title: 'Contact Information',
      weight: 25,
      isComplete: missingFields.length === 0,
      missingFields,
    };
  }

  private static _evaluateMedicalBasics(profile: PatientProfileRow): SectionEvaluation {
    const missingFields: string[] = [];

    if (!profile.blood_group || profile.blood_group === 'UNKNOWN') {
      missingFields.push('Blood Group is required');
    }

    return {
      id: 'medical_basics',
      title: 'Medical Basics',
      weight: 20,
      isComplete: missingFields.length === 0,
      missingFields,
    };
  }

  private static _evaluateEmergencyContact(contacts: EmergencyContactRow[]): SectionEvaluation {
    const missingFields: string[] = [];

    if (contacts.length === 0) {
      missingFields.push('At least one emergency contact is required');
    }

    return {
      id: 'emergency_contact',
      title: 'Emergency Contact',
      weight: 20,
      isComplete: missingFields.length === 0,
      missingFields,
    };
  }
}
