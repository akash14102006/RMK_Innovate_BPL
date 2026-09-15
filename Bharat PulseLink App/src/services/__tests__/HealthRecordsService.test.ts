import { describe, it, expect, vi, beforeEach } from 'vitest';
import HealthRecordsService from '../HealthRecordsService';

vi.mock('../secureStore', () => {
  let mockStore: Record<string, string> = {};
  return {
    default: {
      set: vi.fn().mockImplementation((k: string, v: string) => {
        mockStore[k] = v;
        return Promise.resolve();
      }),
      get: vi.fn().mockImplementation((k: string) => {
        return Promise.resolve(mockStore[k] || null);
      }),
      remove: vi.fn().mockImplementation((k: string) => {
        delete mockStore[k];
        return Promise.resolve();
      }),
    },
    set: vi.fn().mockImplementation((k: string, v: string) => {
      mockStore[k] = v;
      return Promise.resolve();
    }),
    get: vi.fn().mockImplementation((k: string) => {
      return Promise.resolve(mockStore[k] || null);
    }),
    remove: vi.fn().mockImplementation((k: string) => {
      delete mockStore[k];
      return Promise.resolve();
    }),
  };
});

describe('Prompts 63–73 — Production Health Records Ecosystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('aggregates category counts and recent activity overview (Prompt 63)', async () => {
    const overview = await HealthRecordsService.getHealthRecordsOverview();
    expect(overview.counts.visits).toBeGreaterThanOrEqual(2);
    expect(overview.counts.labReports).toBeGreaterThanOrEqual(2);
    expect(overview.counts.generalReports).toBeGreaterThanOrEqual(2);
    expect(overview.counts.prescriptions).toBeGreaterThanOrEqual(2);
    expect(overview.counts.activeMedications).toBeGreaterThanOrEqual(2);
    expect(overview.counts.documents).toBeGreaterThanOrEqual(2);
    expect(overview.recentVisits.length).toBeGreaterThanOrEqual(1);
  });

  it('retrieves chronological visit encounters with verified hospital provenance (Prompts 64–65)', async () => {
    const visits = await HealthRecordsService.getVisitHistory();
    expect(visits.length).toBeGreaterThanOrEqual(2);
    expect(visits[0].hospitalName).toBe('Rajiv Gandhi Government General Hospital');
    expect(visits[0].provenance).toBe('HOSPITAL_VERIFIED');

    const singleVisit = await HealthRecordsService.getVisitById('vis_chennai_01');
    expect(singleVisit).not.toBeNull();
    expect(singleVisit?.doctorName).toBe('Dr. R. Sundaram, MD, DM');
    expect(singleVisit?.associatedReportIds).toContain('lab_cbc_01');
  });

  it('retrieves lab reports with parameter values, units, and reference ranges (Prompt 66)', async () => {
    const reports = await HealthRecordsService.getLabReports();
    expect(reports.length).toBeGreaterThanOrEqual(2);

    const cbc = reports.find((r) => r.reportId === 'lab_cbc_01');
    expect(cbc).toBeDefined();
    expect(cbc?.testName).toBe('Complete Blood Count (CBC) with ESR');
    expect(cbc?.parameters.length).toBe(4);
    expect(cbc?.parameters[0].parameterName).toBe('Hemoglobin');
    expect(cbc?.parameters[0].unit).toBe('g/dL');
    expect(cbc?.provenance).toBe('LAB_VERIFIED');
  });

  it('retrieves imaging and diagnostic reports with clinical impressions (Prompt 67)', async () => {
    const generalReports = await HealthRecordsService.getGeneralReports();
    expect(generalReports.length).toBeGreaterThanOrEqual(2);

    const ecg = generalReports.find((r) => r.category === 'ECG');
    expect(ecg).toBeDefined();
    expect(ecg?.clinicalImpression).toContain('Normal sinus rhythm');
    expect(ecg?.provenance).toBe('HOSPITAL_VERIFIED');
  });

  it('retrieves doctor-issued prescriptions distinct from self-medication (Prompt 68)', async () => {
    const rxList = await HealthRecordsService.getPrescriptions();
    expect(rxList.length).toBeGreaterThanOrEqual(2);
    expect(rxList[0].doctorName).toBe('Dr. R. Sundaram, MD, DM');
    expect(rxList[0].provenance).toBe('DOCTOR_PRESCRIBED');
    expect(rxList[0].medicines.length).toBe(2);
    expect(rxList[0].medicines[0].medicineName).toBe('Metoprolol Succinate');
  });

  it('records patient-entered medications with PATIENT_ENTERED provenance (Prompts 69–70)', async () => {
    const newMed = await HealthRecordsService.addPatientMedication({
      medicineName: 'Ashwagandha Extract',
      strength: '500 mg',
      dosage: '1 Capsule',
      frequency: 'Once daily',
      timing: 'Night with warm milk',
      purpose: 'Sleep quality and stress reduction',
      startDateISO: '2026-08-19',
    });

    expect(newMed.medicineName).toBe('Ashwagandha Extract');
    expect(newMed.provenance).toBe('PATIENT_ENTERED');
    expect(newMed.status).toBe('ACTIVE');

    const allMeds = await HealthRecordsService.getMedications('ACTIVE');
    expect(allMeds.some((m) => m.medicineName === 'Ashwagandha Extract')).toBe(true);
  });

  it('ingests and encrypts patient documents with PATIENT_UPLOADED provenance and SHA-256 hash (Prompts 72–73)', async () => {
    const uploaded = await HealthRecordsService.uploadDocument({
      documentTitle: 'Apollo Lab Bill Receipt',
      category: 'MEDICAL_REPORT',
      fileName: 'Apollo_Bill_2026.pdf',
      fileType: 'PDF',
      fileSizeBytes: 650000,
      sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      isEncrypted: true,
    });

    expect(uploaded.documentTitle).toBe('Apollo Lab Bill Receipt');
    expect(uploaded.provenance).toBe('PATIENT_UPLOADED');
    expect(uploaded.isEncrypted).toBe(true);

    const allDocs = await HealthRecordsService.getDocuments('MEDICAL_REPORT');
    expect(allDocs.some((d) => d.documentTitle === 'Apollo Lab Bill Receipt')).toBe(true);
  });
});
