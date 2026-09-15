/**
 * Records Module (Prompt 110+ Extension Point)
 *
 * Domain Boundary:
 * - Patient-owned health records (Visits, Blood Tests, Prescriptions, Medications, Imaging, Documents)
 * - Cryptographic hash anchoring for report integrity (Prompt 113)
 * - Secure presigned upload/download authorization
 */

export interface HealthRecordItem {
  id: string;
  patientId: string;
  recordType: 'VISIT' | 'BLOOD_TEST' | 'PRESCRIPTION' | 'MEDICATION' | 'GENERAL_REPORT' | 'DOCUMENT';
  title: string;
  date: string;
  facilityName?: string;
  doctorName?: string;
  fileStorageKey?: string;
  contentHash?: string;
  blockchainTxId?: string;
}
