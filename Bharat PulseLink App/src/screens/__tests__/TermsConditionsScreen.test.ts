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

describe('Terms & Conditions Screen Logic (Prompt 16)', () => {
  it('requires explicit checkbox agreement before recording consent', async () => {
    await ConsentService.clearConsent();
    expect(await ConsentService.hasAcceptedLatestTerms()).toBe(false);

    await ConsentService.recordConsent({
      healthcareDataConsent: true,
    });

    expect(await ConsentService.hasAcceptedLatestTerms()).toBe(true);
  });
});
