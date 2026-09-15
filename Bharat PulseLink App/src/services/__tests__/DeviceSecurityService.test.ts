import { describe, it, expect, beforeEach, vi } from 'vitest';
import DeviceSecurityService from '../DeviceSecurityService';

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

describe('DeviceSecurityService Local PIN & Lockout State', () => {
  beforeEach(async () => {
    await DeviceSecurityService.clearSecurityConfig();
  });

  it('sets biometric enabled flag cleanly', async () => {
    let config = await DeviceSecurityService.getConfig();
    expect(config.biometricEnabled).toBe(false);

    await DeviceSecurityService.setBiometricEnabled(true);
    config = await DeviceSecurityService.getConfig();
    expect(config.biometricEnabled).toBe(true);
  });

  it('configures security PIN with salted hash and verifies clean input', async () => {
    const success = await DeviceSecurityService.setSecurityPin('1234');
    expect(success).toBe(true);

    const config = await DeviceSecurityService.getConfig();
    expect(config.pinConfigured).toBe(true);

    const correctRes = await DeviceSecurityService.verifyPin('1234');
    expect(correctRes.success).toBe(true);

    const wrongRes = await DeviceSecurityService.verifyPin('9999');
    expect(wrongRes.success).toBe(false);
  });

  it('triggers lockout timer after 5 failed PIN attempts', async () => {
    await DeviceSecurityService.setSecurityPin('4321');

    for (let i = 0; i < 4; i++) {
      const res = await DeviceSecurityService.verifyPin('0000');
      expect(res.success).toBe(false);
      expect(res.lockoutSeconds).toBe(0);
    }

    // 5th attempt triggers lockout
    const fifthRes = await DeviceSecurityService.verifyPin('0000');
    expect(fifthRes.success).toBe(false);
    expect(fifthRes.lockoutSeconds).toBe(30);
  });

  it('tracks local app lock and unlock state', () => {
    expect(DeviceSecurityService.isAppLocked()).toBe(false);
    DeviceSecurityService.lockApp();
    expect(DeviceSecurityService.isAppLocked()).toBe(true);
    DeviceSecurityService.unlockApp();
    expect(DeviceSecurityService.isAppLocked()).toBe(false);
  });
});
