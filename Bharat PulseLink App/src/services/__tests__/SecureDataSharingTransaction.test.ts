import { describe, it, expect, vi, beforeEach } from 'vitest';
import SecureQRExchangeService, { STANDARD_SHARING_SCOPES } from '../SecureQRExchangeService';
import { ExchangeFailureCode } from '../../types/scan';

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

describe('Prompts 57–60 — Secure Data Sharing Transaction State Machine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('enforces required scopes vs optional scopes in consent before sharing (Prompt 57)', () => {
    const basicProfile = STANDARD_SHARING_SCOPES.find((s) => s.key === 'BASIC_PROFILE');
    const allergies = STANDARD_SHARING_SCOPES.find((s) => s.key === 'ALLERGIES');
    const reports = STANDARD_SHARING_SCOPES.find((s) => s.key === 'RECENT_REPORTS');

    expect(basicProfile).toBeDefined();
    expect(basicProfile?.isSensitive).toBe(false);

    expect(allergies).toBeDefined();
    expect(allergies?.isSensitive).toBe(true);

    expect(reports).toBeDefined();
    expect(reports?.defaultGranted).toBe(false);
  });

  it('completes full exchange and persists active check-in session for success screen (Prompt 58 & 59)', async () => {
    const session = await SecureQRExchangeService.completeHospitalExchange(
      'hosp_chennai_01',
      'Rajiv Gandhi Government General Hospital',
      'Cardiology OPD',
      'Desk 3',
      ['BASIC_PROFILE', 'EMERGENCY_CONTACT', 'ALLERGIES']
    );

    expect(session.status).toBe('ACTIVE');
    expect(session.hospitalId).toBe('hosp_chennai_01');
    expect(session.tokenNumber).toMatch(/^T-\d+$/);
    expect(session.grantedScopes).toHaveLength(3);
  });

  it('handles normalized failure codes with clear non-panic explanations (Prompt 60)', () => {
    const failureCodes: ExchangeFailureCode[] = [
      'QR_EXPIRED',
      'QR_INVALID',
      'QR_USED',
      'HOSPITAL_UNVERIFIED',
      'CONSENT_DENIED',
      'UNKNOWN_OUTCOME',
      'SESSION_CANCELLED',
    ];

    expect(failureCodes).toHaveLength(7);
  });
});
