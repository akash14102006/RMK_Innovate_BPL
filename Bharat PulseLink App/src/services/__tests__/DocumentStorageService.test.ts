import { describe, it, expect, vi, beforeEach } from 'vitest';
import DocumentStorageService from '../DocumentStorageService';

vi.mock('expo-crypto', () => ({
  digestStringAsync: vi.fn().mockImplementation((algo: string, str: string) => {
    return Promise.resolve(`sha256_mock_hash_${str.length}`);
  }),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA-256',
  },
}));

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
  };
});

describe('Prompts 72–73 — MinIO / S3 Document Ingestion & Storage Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('computes cryptographic SHA-256 digest for document integrity', async () => {
    const hash = await DocumentStorageService.computeFileHash('Apollo_Lab_Report.pdf');
    expect(hash).toContain('sha256');
  });

  it('creates presigned upload session with opaque object key and zero PII', async () => {
    const session = await DocumentStorageService.createUploadSession({
      fileName: 'Discharge_Summary_2026.pdf',
      fileType: 'PDF',
      fileSizeBytes: 1200000,
      category: 'DISCHARGE_SUMMARY',
      documentTitle: 'Cardiology Discharge Summary',
    });

    expect(session.sessionId).toContain('upsess_');
    expect(session.presignedUploadUrl).toContain('bpl-patient-vault');
    expect(session.objectKey).not.toContain('patient_name');
    expect(session.objectKey).toContain('.pdf');
  });

  it('rejects files larger than 15 MB limit', async () => {
    await expect(
      DocumentStorageService.createUploadSession({
        fileName: 'Massive_MRI_Scan.pdf',
        fileType: 'PDF',
        fileSizeBytes: 20 * 1024 * 1024, // 20 MB
        category: 'MEDICAL_REPORT',
        documentTitle: 'MRI Scan File',
      })
    ).rejects.toThrow('15 MB');
  });

  it('uploads document through pipeline stages and saves with PATIENT_UPLOADED provenance', async () => {
    const session = await DocumentStorageService.createUploadSession({
      fileName: 'Insurance_Card.png',
      fileType: 'PNG',
      fileSizeBytes: 450000,
      category: 'INSURANCE',
      documentTitle: 'Star Health E-Card',
    });

    const stagesRecorded: string[] = [];
    const doc = await DocumentStorageService.uploadToPrivateVault(
      session,
      {
        fileName: 'Insurance_Card.png',
        fileType: 'PNG',
        fileSizeBytes: 450000,
        category: 'INSURANCE',
        documentTitle: 'Star Health E-Card',
      },
      (prog) => {
        stagesRecorded.push(prog.stage);
      }
    );

    expect(doc.documentTitle).toBe('Star Health E-Card');
    expect(doc.provenance).toBe('PATIENT_UPLOADED');
    expect(doc.isEncrypted).toBe(true);
    expect(stagesRecorded).toContain('VALIDATING');
    expect(stagesRecorded).toContain('UPLOADING');
    expect(stagesRecorded).toContain('SCANNING');
    expect(stagesRecorded).toContain('AVAILABLE');
  });

  it('generates short-lived presigned GET download URL for authorized retrieval', async () => {
    const res = await DocumentStorageService.getPresignedDownloadUrl('doc_12345');
    expect(res.url).toContain('bpl-patient-vault/docs/doc_12345');
    expect(res.url).toContain('X-Amz-Expires=300');
  });
});
