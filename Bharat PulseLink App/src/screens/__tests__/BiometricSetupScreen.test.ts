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

describe('Biometric Setup Screen Logic (Prompt 18)', () => {
  it('enables biometric unlock on explicit user action', async () => {
    await DeviceSecurityService.clearSecurityConfig();
    let config = await DeviceSecurityService.getConfig();
    expect(config.biometricEnabled).toBe(false);

    await DeviceSecurityService.setBiometricEnabled(true);
    config = await DeviceSecurityService.getConfig();
    expect(config.biometricEnabled).toBe(true);
  });
});
