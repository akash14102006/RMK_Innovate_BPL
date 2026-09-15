import * as SecureStore from './secureStore';

export interface DeviceSecurityConfig {
  biometricEnabled: boolean;
  pinConfigured: boolean;
  lockoutUntil?: number;
  failedAttempts: number;
}

const SECURITY_CONFIG_KEY = 'bharat_pulselink_device_security_v1';
const PIN_HASH_KEY = 'bharat_pulselink_pin_hash_v1';
const PIN_SALT = 'bp_salt_sec_2026';

function withTimeout<T>(promise: Promise<T>, ms: number, fallbackValue: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallbackValue), ms)),
  ]);
}

export function isWeakPin(pin: string): boolean {
  const weakPins = ['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1234', '4321', '1122', '1212', '000000', '111111', '123456', '654321'];
  return weakPins.includes(pin);
}

function hashPin(pin: string): string {
  let hash = 0;
  const combined = `${PIN_SALT}:${pin}:${PIN_SALT}`;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `hash_${Math.abs(hash).toString(36)}_${combined.length}`;
}

export class DeviceSecurityService {
  private static config: DeviceSecurityConfig | null = null;
  private static isLockedState = false;

  static isWeakPin(pin: string): boolean {
    return isWeakPin(pin);
  }

  static async getConfig(): Promise<DeviceSecurityConfig> {
    if (this.config) return this.config;

    try {
      const raw = await withTimeout(SecureStore.get(SECURITY_CONFIG_KEY), 2000, null);
      if (raw) {
        this.config = JSON.parse(raw) as DeviceSecurityConfig;
        return this.config;
      }
    } catch (err) {
      console.warn('[DEVICE_SECURITY] Failed to read config from storage', err);
    }

    this.config = {
      biometricEnabled: false,
      pinConfigured: false,
      failedAttempts: 0,
    };
    return this.config;
  }

  static async setBiometricEnabled(enabled: boolean): Promise<void> {
    const config = await this.getConfig();
    config.biometricEnabled = enabled;
    await this.saveConfig(config);
    console.log('[DEVICE_SECURITY] BIOMETRIC_ENABLED_SET', enabled);
  }

  static async setSecurityPin(pin: string): Promise<boolean> {
    if (!/^\d{4,6}$/.test(pin)) {
      return false;
    }

    const hashed = hashPin(pin);
    await SecureStore.set(PIN_HASH_KEY, hashed);

    const config = await this.getConfig();
    config.pinConfigured = true;
    await this.saveConfig(config);
    console.log('[DEVICE_SECURITY] SECURITY_PIN_CONFIGURED');
    return true;
  }

  static async configureSecurityPin(pin: string): Promise<boolean> {
    return this.setSecurityPin(pin);
  }

  static async verifyPin(pinInput: string): Promise<{ success: boolean; lockoutSeconds?: number; attemptsRemaining?: number }> {
    const config = await this.getConfig();

    if (config.lockoutUntil && Date.now() < config.lockoutUntil) {
      const remainingSeconds = Math.ceil((config.lockoutUntil - Date.now()) / 1000);
      return { success: false, lockoutSeconds: remainingSeconds };
    }

    const storedHash = await withTimeout(SecureStore.get(PIN_HASH_KEY), 2000, null);
    const inputHash = hashPin(pinInput);

    if (storedHash && storedHash === inputHash) {
      config.failedAttempts = 0;
      config.lockoutUntil = undefined;
      await this.saveConfig(config);
      this.isLockedState = false;
      return { success: true };
    }

    config.failedAttempts = (config.failedAttempts || 0) + 1;
    let lockoutSeconds = 0;

    if (config.failedAttempts >= 5) {
      lockoutSeconds = 30;
      config.lockoutUntil = Date.now() + 30 * 1000;
      config.failedAttempts = 0;
    }

    await this.saveConfig(config);
    const attemptsRemaining = Math.max(0, 5 - config.failedAttempts);
    return { success: false, lockoutSeconds, attemptsRemaining };
  }

  static async verifySecurityPin(pinInput: string): Promise<boolean> {
    const res = await this.verifyPin(pinInput);
    return res.success;
  }

  static getLockoutSeconds(): number {
    if (!this.config?.lockoutUntil) return 0;
    const remaining = Math.ceil((this.config.lockoutUntil - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  }

  static isAppLocked(): boolean {
    return this.isLockedState;
  }

  static lockApp(): void {
    this.isLockedState = true;
    console.log('[DEVICE_SECURITY] APP_LOCKED');
  }

  static unlockApp(): void {
    this.isLockedState = false;
    console.log('[DEVICE_SECURITY] APP_UNLOCKED');
  }

  static async clearSecurityConfig(): Promise<void> {
    this.config = null;
    this.isLockedState = false;
    try {
      await SecureStore.remove(SECURITY_CONFIG_KEY);
      await SecureStore.remove(PIN_HASH_KEY);
    } catch {
      // Ignore cleanup error
    }
  }

  private static async saveConfig(config: DeviceSecurityConfig): Promise<void> {
    this.config = config;
    try {
      await SecureStore.set(SECURITY_CONFIG_KEY, JSON.stringify(config));
    } catch (err) {
      console.error('[DEVICE_SECURITY] Failed to save security config', err);
    }
  }
}

export default DeviceSecurityService;
