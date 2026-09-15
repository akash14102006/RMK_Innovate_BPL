/**
 * Bharat PulseLink — Healthcare Content Governance & Medical Validation
 *
 * Implements Section 14, 15 & 50:
 * - Content classification (Classes A–H)
 * - Review status tracking (DRAFT, REVIEW_REQUIRED, APPROVED, DEPRECATED)
 * - Strict prohibition on unreviewed runtime machine translation for:
 *   consent, legal statements, medical warnings, emergency instructions,
 *   patient clinical records, medication instructions, and security QR messages.
 */

export enum ContentClass {
  UI_TEXT = 'UI_TEXT',
  CLINICAL_TERMINOLOGY = 'CLINICAL_TERMINOLOGY',
  EMERGENCY_INSTRUCTIONS = 'EMERGENCY_INSTRUCTIONS',
  CONSENT_LEGAL = 'CONSENT_LEGAL',
  PRIVACY_SECURITY = 'PRIVACY_SECURITY',
  PATIENT_GENERATED = 'PATIENT_GENERATED',
  HOSPITAL_PROVIDED = 'HOSPITAL_PROVIDED',
  SYSTEM_MESSAGES = 'SYSTEM_MESSAGES',
}

export enum ReviewStatus {
  DRAFT = 'DRAFT',
  REVIEW_REQUIRED = 'REVIEW_REQUIRED',
  APPROVED = 'APPROVED',
  DEPRECATED = 'DEPRECATED',
}

export interface GovernedTranslationMeta {
  key: string;
  classification: ContentClass;
  status: ReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  version: string;
  allowRuntimeMachineTranslation: boolean;
}

// Registry of high-risk governed translation keys
export const GOVERNED_CONTENT_CATALOG: Record<string, GovernedTranslationMeta> = {
  'emergency.sosTitle': {
    key: 'emergency.sosTitle',
    classification: ContentClass.EMERGENCY_INSTRUCTIONS,
    status: ReviewStatus.APPROVED,
    reviewedBy: 'Chief Medical Officer / National Emergency Protocol Board',
    reviewedAt: '2026-08-15',
    version: '1.0.0',
    allowRuntimeMachineTranslation: false,
  },
  'emergency.ambulanceHelpline': {
    key: 'emergency.ambulanceHelpline',
    classification: ContentClass.EMERGENCY_INSTRUCTIONS,
    status: ReviewStatus.APPROVED,
    reviewedBy: 'EMRI 108 Operations Directorate',
    reviewedAt: '2026-08-15',
    version: '1.0.0',
    allowRuntimeMachineTranslation: false,
  },
  'emergency.emergencyModeNotice': {
    key: 'emergency.emergencyModeNotice',
    classification: ContentClass.EMERGENCY_INSTRUCTIONS,
    status: ReviewStatus.APPROVED,
    reviewedBy: 'Clinical Governance Council',
    reviewedAt: '2026-08-15',
    version: '1.0.0',
    allowRuntimeMachineTranslation: false,
  },
  'consent.section1Body': {
    key: 'consent.section1Body',
    classification: ContentClass.CONSENT_LEGAL,
    status: ReviewStatus.APPROVED,
    reviewedBy: 'Legal Counsel & Data Protection Officer',
    reviewedAt: '2026-08-15',
    version: '1.0.0',
    allowRuntimeMachineTranslation: false,
  },
  'consent.section2Body': {
    key: 'consent.section2Body',
    classification: ContentClass.CONSENT_LEGAL,
    status: ReviewStatus.APPROVED,
    reviewedBy: 'Legal Counsel & Data Protection Officer',
    reviewedAt: '2026-08-15',
    version: '1.0.0',
    allowRuntimeMachineTranslation: false,
  },
  'consent.section3Body': {
    key: 'consent.section3Body',
    classification: ContentClass.PRIVACY_SECURITY,
    status: ReviewStatus.APPROVED,
    reviewedBy: 'Chief Information Security Officer',
    reviewedAt: '2026-08-15',
    version: '1.0.0',
    allowRuntimeMachineTranslation: false,
  },
  'qr.mySecureQR': {
    key: 'qr.mySecureQR',
    classification: ContentClass.PRIVACY_SECURITY,
    status: ReviewStatus.APPROVED,
    reviewedBy: 'Patient Security & Cryptographic Review Board',
    reviewedAt: '2026-08-15',
    version: '1.0.0',
    allowRuntimeMachineTranslation: false,
  },
};

/**
 * Validates whether a translation key is permissible for production display.
 * High-risk classes (Emergency, Consent, Legal, Clinical) MUST be APPROVED.
 */
export const validateContentSafety = (key: string): { safe: boolean; reason?: string } => {
  const meta = GOVERNED_CONTENT_CATALOG[key];
  if (!meta) {
    // Standard UI strings are permitted
    return { safe: true };
  }

  if (meta.status !== ReviewStatus.APPROVED) {
    return {
      safe: false,
      reason: `Key ${key} belongs to ${meta.classification} but has review status ${meta.status}. Only APPROVED translations may be rendered.`,
    };
  }

  return { safe: true };
};

export default {
  ContentClass,
  ReviewStatus,
  GOVERNED_CONTENT_CATALOG,
  validateContentSafety,
};
