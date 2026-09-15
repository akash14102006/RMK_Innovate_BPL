export type ProfileStepId =
  | 'basic'
  | 'contact'
  | 'identification'
  | 'medicalBasics'
  | 'conditions'
  | 'allergies'
  | 'medications'
  | 'surgicalHistory'
  | 'lifestyle'
  | 'emergencyContact'
  | 'insurance'
  | 'documents'
  | 'vitalRecords'
  | 'review'
  | 'securityConsent'
  | 'complete';

export interface ProfileStepConfig {
  stepId: ProfileStepId;
  stepNumber: number;
  titleKey: string;
  subtitleKey: string;
  heroIcon: string;
  isOptional: boolean;
}

export interface BasicInfoData {
  fullName: string;
  dateOfBirth: string; // ISO format YYYY-MM-DD
  gender: 'MALE' | 'FEMALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY' | '';
  maritalStatus: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | 'PREFER_NOT_TO_SAY' | '';
  nationality: string;
}

export interface ContactDetailsData {
  primaryPhone: string; // Read-only from auth
  alternatePhone?: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  district?: string;
  pincode: string;
  country: string;
}

export interface IdentificationData {
  aadhaarNumberMasked?: string; // Optional/masked
  panNumberMasked?: string; // Optional/masked
  passportNumber?: string; // Optional
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-' | 'UNKNOWN' | '';
  occupation?: string;
}

export interface MedicalBasicsData {
  heightCm?: number;
  weightKg?: number;
  bodyType?: string;
  bpSystolic?: number;
  bpDiastolic?: number;
  bloodSugarMgDl?: number;
  bloodSugarType?: 'FASTING' | 'POST_MEAL' | 'RANDOM' | 'UNKNOWN';
}

export interface HealthConditionsData {
  hasDiabetes: boolean;
  hasHypertension: boolean;
  hasAsthma: boolean;
  hasThyroid: boolean;
  hasHeartDisease: boolean;
  otherConditionEnabled: boolean;
  otherConditionDetails?: string;
}

export interface AllergiesData {
  hasPollen: boolean;
  hasDust: boolean;
  hasPeanuts: boolean;
  hasMedications: boolean;
  hasSeafood: boolean;
  otherAllergyEnabled: boolean;
  otherAllergyDetails?: string;
}

export interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  notes?: string;
}

export interface SurgeryItem {
  id: string;
  procedureName: string;
  yearOrDate: string;
  hospitalName?: string;
  notes?: string;
}

export interface LifestyleData {
  smokingStatus?: 'NO' | 'FORMER' | 'OCCASIONALLY' | 'REGULARLY' | 'PREFER_NOT_TO_SAY';
  alcoholStatus?: 'NONE' | 'OCCASIONAL' | 'REGULAR' | 'PREFER_NOT_TO_SAY';
  exerciseFrequency?: 'RARELY' | 'OCCASIONALLY' | 'REGULARLY' | 'VERY_ACTIVE' | 'PREFER_NOT_TO_SAY';
  dietType?: 'VEGETARIAN' | 'NON_VEGETARIAN' | 'VEGAN' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  sleepHoursAverage?: number;
}

export interface EmergencyContactData {
  contactName: string;
  relationship: 'PARENT' | 'SPOUSE' | 'SIBLING' | 'CHILD' | 'FRIEND' | 'GUARDIAN' | 'OTHER' | '';
  primaryPhone: string;
  alternatePhone?: string;
  address?: string;
}

export interface InsuranceData {
  hasInsurance: boolean;
  providerName?: string;
  policyNumberMasked?: string;
  memberIdMasked?: string;
  validTillDate?: string;
  nomineeName?: string;
}

export interface UploadedDocumentItem {
  id: string;
  category: 'AADHAAR' | 'PAN' | 'PROFILE_PHOTO' | 'INSURANCE' | 'PRESCRIPTION' | 'OTHER';
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  secureReferenceUri: string;
  uploadedAt: string;
}

export interface VitalRecordItem {
  id: string;
  recordType: 'ECG' | 'X_RAY' | 'BLOOD_TEST' | 'MRI' | 'ULTRASOUND' | 'OTHER';
  recordDate: string;
  facilityName?: string;
  documentReferenceId?: string;
  notes?: string;
}

export interface SecurityConsentData {
  storeHealthDataConsent: boolean;
  consentTimestampISO?: string;
}

export interface ProfileDraft {
  version: number;
  userId: string;
  updatedAtISO: string;
  completedStepIds: ProfileStepId[];
  isComplete: boolean;

  basic: BasicInfoData;
  contact: ContactDetailsData;
  identification: IdentificationData;
  medicalBasics: MedicalBasicsData;
  conditions: HealthConditionsData;
  allergies: AllergiesData;
  medications: MedicationItem[];
  surgicalHistory: SurgeryItem[];
  lifestyle: LifestyleData;
  emergencyContact: EmergencyContactData;
  insurance: InsuranceData;
  documents: UploadedDocumentItem[];
  vitalRecords: VitalRecordItem[];
  securityConsent: SecurityConsentData;
}

export const PROFILE_STEPS: ProfileStepConfig[] = [
  { stepId: 'basic', stepNumber: 1, titleKey: 'profile.step.basic.title', subtitleKey: 'profile.step.basic.subtitle', heroIcon: 'person', isOptional: false },
  { stepId: 'contact', stepNumber: 2, titleKey: 'profile.step.contact.title', subtitleKey: 'profile.step.contact.subtitle', heroIcon: 'phone', isOptional: false },
  { stepId: 'identification', stepNumber: 3, titleKey: 'profile.step.identification.title', subtitleKey: 'profile.step.identification.subtitle', heroIcon: 'id-card', isOptional: true },
  { stepId: 'medicalBasics', stepNumber: 4, titleKey: 'profile.step.medicalBasics.title', subtitleKey: 'profile.step.medicalBasics.subtitle', heroIcon: 'heart', isOptional: true },
  { stepId: 'conditions', stepNumber: 5, titleKey: 'profile.step.conditions.title', subtitleKey: 'profile.step.conditions.subtitle', heroIcon: 'shield', isOptional: true },
  { stepId: 'allergies', stepNumber: 6, titleKey: 'profile.step.allergies.title', subtitleKey: 'profile.step.allergies.subtitle', heroIcon: 'allergy', isOptional: true },
  { stepId: 'medications', stepNumber: 7, titleKey: 'profile.step.medications.title', subtitleKey: 'profile.step.medications.subtitle', heroIcon: 'pill', isOptional: true },
  { stepId: 'surgicalHistory', stepNumber: 8, titleKey: 'profile.step.surgicalHistory.title', subtitleKey: 'profile.step.surgicalHistory.subtitle', heroIcon: 'medical', isOptional: true },
  { stepId: 'lifestyle', stepNumber: 9, titleKey: 'profile.step.lifestyle.title', subtitleKey: 'profile.step.lifestyle.subtitle', heroIcon: 'activity', isOptional: true },
  { stepId: 'emergencyContact', stepNumber: 10, titleKey: 'profile.step.emergencyContact.title', subtitleKey: 'profile.step.emergencyContact.subtitle', heroIcon: 'emergency', isOptional: false },
  { stepId: 'insurance', stepNumber: 11, titleKey: 'profile.step.insurance.title', subtitleKey: 'profile.step.insurance.subtitle', heroIcon: 'shield-card', isOptional: true },
  { stepId: 'documents', stepNumber: 12, titleKey: 'profile.step.documents.title', subtitleKey: 'profile.step.documents.subtitle', heroIcon: 'upload', isOptional: true },
  { stepId: 'vitalRecords', stepNumber: 13, titleKey: 'profile.step.vitalRecords.title', subtitleKey: 'profile.step.vitalRecords.subtitle', heroIcon: 'records', isOptional: true },
  { stepId: 'review', stepNumber: 14, titleKey: 'profile.step.review.title', subtitleKey: 'profile.step.review.subtitle', heroIcon: 'checklist', isOptional: false },
  { stepId: 'securityConsent', stepNumber: 15, titleKey: 'profile.step.securityConsent.title', subtitleKey: 'profile.step.securityConsent.subtitle', heroIcon: 'shield-check', isOptional: false },
  { stepId: 'complete', stepNumber: 16, titleKey: 'profile.step.complete.title', subtitleKey: 'profile.step.complete.subtitle', heroIcon: 'success-check', isOptional: false },
];

export const createDefaultProfileDraft = (userId: string = 'guest_user', phone: string = ''): ProfileDraft => ({
  version: 1,
  userId,
  updatedAtISO: new Date().toISOString(),
  completedStepIds: [],
  isComplete: false,
  basic: {
    fullName: '',
    dateOfBirth: '',
    gender: '',
    maritalStatus: '',
    nationality: 'Indian',
  },
  contact: {
    primaryPhone: phone,
    alternatePhone: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    district: '',
    pincode: '',
    country: 'India',
  },
  identification: {
    aadhaarNumberMasked: '',
    panNumberMasked: '',
    passportNumber: '',
    bloodGroup: '',
    occupation: '',
  },
  medicalBasics: {
    heightCm: undefined,
    weightKg: undefined,
    bodyType: '',
    bpSystolic: undefined,
    bpDiastolic: undefined,
    bloodSugarMgDl: undefined,
    bloodSugarType: 'FASTING',
  },
  conditions: {
    hasDiabetes: false,
    hasHypertension: false,
    hasAsthma: false,
    hasThyroid: false,
    hasHeartDisease: false,
    otherConditionEnabled: false,
    otherConditionDetails: '',
  },
  allergies: {
    hasPollen: false,
    hasDust: false,
    hasPeanuts: false,
    hasMedications: false,
    hasSeafood: false,
    otherAllergyEnabled: false,
    otherAllergyDetails: '',
  },
  medications: [],
  surgicalHistory: [],
  lifestyle: {
    smokingStatus: undefined,
    alcoholStatus: undefined,
    exerciseFrequency: undefined,
    dietType: undefined,
    sleepHoursAverage: undefined,
  },
  emergencyContact: {
    contactName: '',
    relationship: '',
    primaryPhone: '',
    alternatePhone: '',
    address: '',
  },
  insurance: {
    hasInsurance: false,
    providerName: '',
    policyNumberMasked: '',
    memberIdMasked: '',
    validTillDate: '',
    nomineeName: '',
  },
  documents: [],
  vitalRecords: [],
  securityConsent: {
    storeHealthDataConsent: false,
    consentTimestampISO: undefined,
  },
});

export function calculateProfileProgress(draft: ProfileDraft): number {
  if (!draft) return 0;
  if (draft.isComplete) return 100;

  let totalScore = 0;

  // Step 1: Basic Info (15 points)
  if (draft.basic?.fullName?.trim()) totalScore += 5;
  if (draft.basic?.dateOfBirth?.trim()) totalScore += 5;
  if (draft.basic?.gender?.trim()) totalScore += 5;

  // Step 2: Contact Details (15 points)
  if (draft.contact?.addressLine1?.trim()) totalScore += 3;
  if (draft.contact?.city?.trim()) totalScore += 3;
  if (draft.contact?.state?.trim()) totalScore += 3;
  if (draft.contact?.pincode?.trim()) totalScore += 3;
  if (draft.contact?.primaryPhone?.trim()) totalScore += 3;

  // Step 3: Identification (10 points)
  if (draft.identification?.aadhaarNumberMasked?.trim() || draft.identification?.panNumberMasked?.trim() || draft.identification?.passportNumber?.trim()) {
    totalScore += 10;
  }

  // Step 4: Medical Basics (15 points)
  if (draft.identification?.bloodGroup) totalScore += 5;
  if (draft.medicalBasics?.heightCm || draft.medicalBasics?.weightKg) totalScore += 5;
  if (draft.medicalBasics?.bpSystolic || draft.medicalBasics?.bloodSugarMgDl) totalScore += 5;

  // Step 5: Conditions (5 points)
  if (draft.conditions && (draft.conditions.hasDiabetes || draft.conditions.hasHypertension || draft.conditions.hasAsthma || draft.conditions.hasThyroid)) {
    totalScore += 5;
  }

  // Step 6: Allergies (5 points)
  if (draft.allergies && (draft.allergies.hasPeanuts || draft.allergies.hasMedications || draft.allergies.hasDust || draft.allergies.hasPollen)) {
    totalScore += 5;
  }

  // Step 7: Emergency Contact (15 points)
  if (draft.emergencyContact?.contactName?.trim()) totalScore += 5;
  if (draft.emergencyContact?.relationship?.trim()) totalScore += 5;
  if (draft.emergencyContact?.primaryPhone?.trim()) totalScore += 5;

  // Step 8: Insurance / Lifestyle / Docs (10 points)
  if (draft.insurance?.hasInsurance || (draft.documents && draft.documents.length > 0) || (draft.lifestyle && draft.lifestyle.dietType)) {
    totalScore += 10;
  }

  // Step 9: Consent (10 points)
  if (draft.securityConsent?.storeHealthDataConsent) {
    totalScore += 10;
  }

  return Math.min(100, Math.max(7, Math.round(totalScore)));
}



export type AppointmentStatus = 'CONFIRMED' | 'REQUESTED' | 'COMPLETED' | 'CANCELLED';

export interface AppointmentItem {
  id: string;
  hospitalName: string;
  department: string;
  doctorName?: string;
  scheduledAtISO: string;
  displayDateText: string;
  status: AppointmentStatus;
  locationAddress?: string;
}

export interface HealthSnapshotSummary {
  statusTitle: string;
  statusBadge: string;
  statusDescription: string;
  completionPercentage?: number;
  lastUpdatedISO?: string;
}

export interface MetricCounts {
  appointmentsCount: number;
  medicationsCount: number;
  reportsCount: number;
}

export interface NotificationAlert {
  id: string;
  title: string;
  message: string;
  category: 'APPOINTMENT' | 'PRESCRIPTION' | 'CONSENT' | 'SYSTEM';
  timestampISO: string;
  isRead: boolean;
}

export interface AttentionItem {
  id: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  actionLabel: string;
  targetStepId: ProfileStepId;
}

export interface ActivityFeedItem {
  id: string;
  title: string;
  description: string;
  category: 'PROFILE' | 'DOCUMENT' | 'SECURITY' | 'CLINICAL';
  timestampText: string;
}

export interface HospitalPreviewItem {
  id: string;
  hospitalName: string;
  category: string;
  distanceKmText: string;
  emergencyAvailable: boolean;
  address: string;
}

export interface HomeDashboardData {
  patientPreferredName: string;
  patientFullName: string;
  greetingTimeOfDay: string;
  healthSnapshot: HealthSnapshotSummary;
  metrics: MetricCounts;
  attentionItem: AttentionItem | null;
  nextAppointment: AppointmentItem | null;
  careTimeline: AppointmentItem[];
  recentActivity: ActivityFeedItem[];
  hospitalDiscovery: HospitalPreviewItem;
  unreadNotificationsCount: number;
  notifications: NotificationAlert[];
  profileCompletionPercentage: number;
  isProfileComplete: boolean;
  isOffline: boolean;
  lastSyncedAtISO: string;
}



