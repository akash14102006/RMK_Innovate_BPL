import { describe, it, expect, beforeEach, vi } from 'vitest';
import ConsentService, { CURRENT_TERMS_VERSION, CURRENT_PRIVACY_VERSION } from '../ConsentService';

vi.mock('../secureStore', () => {
  const store = new Map<string, string>();
  return {
    set: vi.fn(async (k: string, v: string) => { store.set(k, v); }),
    get: vi.fn(async (k: string) => store.get(k) || null),
    remove: vi.fn(async (k: string) => { store.delete(k); }),
    default: {
      set: vi.fn(async (k: string, v: string) => { store.set(k, v); }),
      get: vi.fn(async (k: string) => store.get(k) || null),
      remove: vi.fn(async (k: string) => { store.delete(k); }),
    },
  };
});

describe('ConsentService Legal & Privacy Version Tracking', () => {
  beforeEach(async () => {
    await ConsentService.clearConsent();
  });

  it('records terms and privacy consent with timestamp and versioning', async () => {
    const record = await ConsentService.recordConsent({
      healthcareDataConsent: true,
      analyticsConsent: true,
    });

    expect(record.termsVersion).toBe(CURRENT_TERMS_VERSION);
    expect(record.privacyVersion).toBe(CURRENT_PRIVACY_VERSION);
    expect(record.healthcareDataConsent).toBe(true);
    expect(record.analyticsConsent).toBe(true);
    expect(record.acceptedAt).toBeDefined();

    const stored = await ConsentService.getConsentRecord();
    expect(stored).toEqual(record);
  });

  it('validates latest terms and privacy consent acceptance correctly', async () => {
    expect(await ConsentService.hasAcceptedLatestTerms()).toBe(false);
    expect(await ConsentService.hasAcceptedLatestPrivacy()).toBe(false);

    await ConsentService.recordConsent({
      healthcareDataConsent: true,
    });

    expect(await ConsentService.hasAcceptedLatestTerms()).toBe(true);
    expect(await ConsentService.hasAcceptedLatestPrivacy()).toBe(true);
  });
});
