import { describe, it, expect, vi, beforeEach } from 'vitest';
import SecureQRExchangeService from '../SecureQRExchangeService';

vi.mock('../secureStore', () => ({
  default: {
    set: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    remove: vi.fn().mockResolvedValue(undefined),
  },
  set: vi.fn().mockResolvedValue(undefined),
  get: vi.fn().mockResolvedValue(null),
  remove: vi.fn().mockResolvedValue(undefined),
}));

describe('Prompts 54–56 — SecureQRExchangeService & Point-of-Care Handshake', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates a legitimate hospital QR code with URI protocol (Prompt 55)', () => {
    const validURI =
      'bpl://qr/v1/session?sid=sess_rggh_88&hid=hosp_chennai_01&hname=Rajiv+Gandhi+Government+General+Hospital&dept=Cardiology+OPD&desk=Desk+3&nonce=nc8371&exp=2029-12-31T23:59:59Z';

    const res = SecureQRExchangeService.parseAndValidateHospitalQR(validURI);
    expect(res.isValid).toBe(true);
    expect(res.hospitalId).toBe('hosp_chennai_01');
    expect(res.hospitalName).toBe('Rajiv Gandhi Government General Hospital');
    expect(res.verifiedRegistry).toBe(true);
    expect(res.departmentName).toBe('Cardiology OPD');
  });

  it('rejects an expired hospital QR code cleanly (Prompt 55)', () => {
    const expiredURI =
      'bpl://qr/v1/session?sid=sess_old&hid=hosp_chennai_01&hname=Rajiv+Gandhi&dept=OPD&desk=Desk+1&nonce=nc1&exp=2020-01-01T00:00:00Z';

    const res = SecureQRExchangeService.parseAndValidateHospitalQR(expiredURI);
    expect(res.isValid).toBe(false);
    expect(res.errorMessage).toContain('expired');
  });

  it('rejects an arbitrary unsupported QR code or malicious payload (Prompt 55)', () => {
    const maliciousPayload = 'https://malicious-phishing-site.example.com/login';
    const res = SecureQRExchangeService.parseAndValidateHospitalQR(maliciousPayload);

    expect(res.isValid).toBe(false);
    expect(res.errorMessage).toBeDefined();
  });

  it('generates patient secure QR with short-lived session, nonce, and ZERO PII in payload (Prompt 56)', () => {
    const { payload, qrString, expiresAtISO } = SecureQRExchangeService.generatePatientQRSession([
      'BASIC_PROFILE',
      'ALLERGIES',
    ]);

    expect(payload.protocol).toBe('bpl_patient_v1');
    expect(payload.sessionId).toContain('bpl_sess_');
    expect(payload.nonce.length).toBeGreaterThan(5);
    expect(new Date(expiresAtISO).getTime()).toBeGreaterThan(Date.now());

    // ZERO PII guarantee
    expect(qrString).not.toContain('Aadhaar');
    expect(qrString).not.toContain('PAN');
    expect(qrString).not.toContain('9876543210'); // No phone number
    expect(qrString).not.toContain('Akash'); // No patient name in QR payload!
  });

  it('completes hospital check-in exchange and stores active point-of-care session (Prompt 54 & 55)', async () => {
    const session = await SecureQRExchangeService.completeHospitalExchange(
      'hosp_chennai_01',
      'Rajiv Gandhi Government General Hospital',
      'Cardiology OPD',
      'Desk 3',
      ['BASIC_PROFILE', 'ALLERGIES']
    );

    expect(session.status).toBe('ACTIVE');
    expect(session.tokenNumber).toContain('T-');
    expect(session.hospitalId).toBe('hosp_chennai_01');
    expect(session.grantedScopes).toEqual(['BASIC_PROFILE', 'ALLERGIES']);
  });
});
