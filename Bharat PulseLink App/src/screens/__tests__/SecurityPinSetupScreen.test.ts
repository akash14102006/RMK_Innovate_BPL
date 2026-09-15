import { describe, it, expect, vi } from 'vitest';
import DeviceSecurityService from '../../services/DeviceSecurityService';

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

describe('Security PIN Setup Screen Logic (Prompt 19)', () => {
  it('configures 4-digit PIN with salted local hash', async () => {
    await DeviceSecurityService.clearSecurityConfig();
    const success = await DeviceSecurityService.setSecurityPin('5678');
    expect(success).toBe(true);

    const res = await DeviceSecurityService.verifyPin('5678');
    expect(res.success).toBe(true);
  });
});
