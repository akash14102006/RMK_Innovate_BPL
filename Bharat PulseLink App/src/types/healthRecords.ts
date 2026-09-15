/**
 * Bharat PulseLink — Health Records Platform Types (Prompts 63–73)
 *
 * Domain types for:
 * 1. Health Records Home, Visit History & Details (Prompts 63–65)
 * 2. Lab & Blood Test Reports, General Imaging Reports (Prompts 66–67)
 * 3. Prescriptions & Medication Management (Prompts 68–70)
 * 4. Health Summary & Provenance (Prompt 71)
 * 5. Secure Documents & Upload Pipeline (Prompts 72–73)
 */

export type RecordProvenance =
  | 'HOSPITAL_VERIFIED'
  | 'LAB_VERIFIED'
  | 'DOCTOR_PRESCRIBED'
  | 'PATIENT_UPLOADED'
  | 'PATIENT_ENTERED';

export type VisitStatus =
  | 'COMPLETED'
  | 'IN_PROGRESS'
  | 'SCHEDULED'
  | 'CANCELLED';

export type MedicationStatus =
  | 'ACTIVE'
  | 'COMPLETED'
  | 'STOPPED'
  | 'INACTIVE';

export type DocumentCategory =
  | 'MEDICAL_REPORT'
  | 'PRESCRIPTION'
  | 'LAB_REPORT'
  | 'INSURANCE'
  | 'IDENTITY'
  | 'DISCHARGE_SUMMARY'
  | 'OTHER';

export interface VisitRecord {
  visitId: string;
  hospitalId: string;
  hospitalName: string;
  departmentName: string;
  serviceName: string;
  doctorName: string;
  visitDateISO: string;
  status: VisitStatus;
  visitType: 'OPD' | 'EMERGENCY' | 'FOLLOW_UP' | 'INPATIENT';
  reasonForVisit: string;
  diagnosisSummary?: string;
  provenance: RecordProvenance;
  associatedReportIds?: string[];
  associatedPrescriptionIds?: string[];
  associatedDocumentIds?: string[];
}

export interface LabParameter {
  parameterName: string;
  value: string;
  unit: string;
  referenceRange: string;
  isAbnormal?: boolean;
}

export interface LabReportRecord {
  reportId: string;
  testName: string;
  panelCategory: string; // e.g. 'Hematology', 'Biochemistry', 'Lipid Profile'
  hospitalName: string;
  laboratoryName: string;
  collectedAtISO: string;
  reportedAtISO: string;
  provenance: RecordProvenance;
  parameters: LabParameter[];
  notes?: string;
  fileUrl?: string;
  fileSize?: string;
}

export interface GeneralReportRecord {
  reportId: string;
  reportTitle: string;
  category: 'X_RAY' | 'MRI' | 'CT_SCAN' | 'ULTRASOUND' | 'ECG' | 'ECHO' | 'PATHOLOGY' | 'DISCHARGE_SUMMARY';
  hospitalName: string;
  performedBy: string;
  reportDateISO: string;
  clinicalImpression: string;
  provenance: RecordProvenance;
  fileUrl?: string;
  fileType: 'PDF' | 'IMAGE';
  fileSize: string;
}

export interface PrescribedMedicine {
  medicineName: string;
  genericName?: string;
  strength: string; // e.g. '500 mg'
  dosage: string;   // e.g. '1 tablet'
  frequency: string; // e.g. 'Twice daily (after meals)'
  duration: string;  // e.g. '5 days'
  instructions?: string;
}

export interface PrescriptionRecord {
  prescriptionId: string;
  hospitalName: string;
  doctorName: string;
  doctorSpecialty: string;
  issuedDateISO: string;
  diagnosisContext: string;
  medicines: PrescribedMedicine[];
  provenance: RecordProvenance;
  fileUrl?: string;
}

export interface PatientMedication {
  medicationId: string;
  medicineName: string;
  genericName?: string;
  strength: string;
  dosage: string;
  frequency: string;
  timing: string; // e.g. 'Morning & Night'
  startDateISO: string;
  endDateISO?: string;
  purpose: string;
  status: MedicationStatus;
  provenance: RecordProvenance;
  prescribedBy?: string;
  notes?: string;
}

export interface HealthDocument {
  documentId: string;
  documentTitle: string;
  category: DocumentCategory;
  fileName: string;
  fileType: 'PDF' | 'JPG' | 'PNG';
  fileSizeBytes: number;
  uploadedAtISO: string;
  provenance: RecordProvenance;
  sha256Hash: string;
  isEncrypted: boolean;
  notes?: string;
}
