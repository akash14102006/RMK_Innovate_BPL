import { describe, it, expect, vi } from 'vitest';
import ConsentService from '../../services/ConsentService';

vi.mock('../../services/secureStore', () => {
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

describe('Privacy Policy Screen Logic (Prompt 17)', () => {
  it('records explicit healthcare continuity consent', async () => {
    await ConsentService.clearConsent();
    expect(await ConsentService.hasAcceptedLatestPrivacy()).toBe(false);

    await ConsentService.recordConsent({
      healthcareDataConsent: true,
      analyticsConsent: false,
    });

    const record = await ConsentService.getConsentRecord();
    expect(record?.healthcareDataConsent).toBe(true);
    expect(record?.analyticsConsent).toBe(false);
  });
});
