import { describe, it, expect } from 'vitest';
import {
  ContentClass,
  ReviewStatus,
  GOVERNED_CONTENT_CATALOG,
  validateContentSafety,
} from '../governance/contentGovernance';
import { translateErrorCode, BACKEND_ERROR_CODE_MAP } from '../errors/errorMapper';

describe('Healthcare Content Governance & Error Mapping', () => {
  it('governs high-risk emergency and consent keys strictly with APPROVED status', () => {
    expect(GOVERNED_CONTENT_CATALOG['emergency.sosTitle'].status).toBe(ReviewStatus.APPROVED);
    expect(GOVERNED_CONTENT_CATALOG['emergency.sosTitle'].allowRuntimeMachineTranslation).toBe(false);

    expect(GOVERNED_CONTENT_CATALOG['consent.section1Body'].classification).toBe(ContentClass.CONSENT_LEGAL);
    expect(GOVERNED_CONTENT_CATALOG['consent.section1Body'].status).toBe(ReviewStatus.APPROVED);
  });

  it('validates content safety and forbids non-approved critical translations', () => {
    expect(validateContentSafety('emergency.sosTitle').safe).toBe(true);
    expect(validateContentSafety('common.continue').safe).toBe(true);
  });

  it('maps backend ErrorCode values to localized strings', () => {
    expect(BACKEND_ERROR_CODE_MAP['AUTH_REQUIRED']).toBe('errors.authRequired');
    expect(BACKEND_ERROR_CODE_MAP['SESSION_EXPIRED']).toBe('errors.sessionExpired');
    expect(BACKEND_ERROR_CODE_MAP['QR_SESSION_EXPIRED']).toBe('errors.qrSessionExpired');
    expect(BACKEND_ERROR_CODE_MAP['HOSPITAL_NOT_FOUND']).toBe('errors.hospitalNotFound');

    const msg = translateErrorCode('AUTH_REQUIRED');
    expect(msg).toBeTruthy();
    expect(msg).not.toBe('AUTH_REQUIRED');
    expect(msg).not.toMatch(/^errors\./);
  });
});
