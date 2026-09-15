/**
 * Test mock for expo-auth-session, expo-web-browser, expo-crypto, expo-constants, expo-modules-core, expo-secure-store, and expo-camera in Node.js Vitest environment
 */

import crypto from 'crypto';

export function makeRedirectUri(options: { scheme?: string; path?: string; preferLocalhost?: boolean; native?: string } = {}): string {
  if (options.native) {
    return options.native;
  }
  const scheme = options.scheme || 'bharatpulselink';
  const path = options.path ? (options.path.startsWith('/') ? options.path.slice(1) : options.path) : '';
  return path ? `${scheme}://${path}` : `${scheme}://`;
}

export async function openAuthSessionAsync(url: string, redirectUrl: string): Promise<{ type: string; url?: string }> {
  return {
    type: 'success',
    url: `${redirectUrl}?code=test_mock_oauth_code&state=test_state`,
  };
}

export function maybeCompleteAuthSession(): { type: string } {
  return { type: 'success' };
}

export enum CryptoDigestAlgorithm {
  SHA1 = 'SHA-1',
  SHA256 = 'SHA-256',
  SHA384 = 'SHA-384',
  SHA512 = 'SHA-512',
}

export enum CryptoEncoding {
  HEX = 'hex',
  BASE64 = 'base64',
}

export function getRandomBytes(byteCount: number): Uint8Array {
  return new Uint8Array(crypto.randomBytes(byteCount));
}

export async function getRandomBytesAsync(byteCount: number): Promise<Uint8Array> {
  return new Uint8Array(crypto.randomBytes(byteCount));
}

export async function digestStringAsync(
  algorithm: CryptoDigestAlgorithm,
  data: string,
  options: { encoding: CryptoEncoding } = { encoding: CryptoEncoding.HEX }
): Promise<string> {
  const hash = crypto.createHash('sha256').update(data);
  return options.encoding === CryptoEncoding.BASE64
    ? hash.digest('base64')
    : hash.digest('hex');
}

export function requireNativeModule(_name: string): Record<string, unknown> {
  return {
    getValueWithKeyAsync: async () => null,
    setValueWithKeyAsync: async () => true,
    deleteValueWithKeyAsync: async () => true,
  };
}

export class UnavailabilityError extends Error {
  constructor(moduleName: string, propertyName: string) {
    super(`The method or property ${moduleName}.${propertyName} is not available.`);
  }
}

export enum ExecutionEnvironment {
  Bare = 'bare',
  Standalone = 'standalone',
  StoreClient = 'storeClient',
}

export const Constants = {
  executionEnvironment: ExecutionEnvironment.Bare,
  appOwnership: 'standalone',
  expoConfig: {
    name: 'Bharat PulseLink',
    slug: 'bharat-pulselink-app',
    owner: 'akash14102006',
    scheme: 'bharatpulselink',
  },
};

// Mock SecureStore
const _mockSecureStoreMap = new Map<string, string>();
export const ALWAYS_THIS_DEVICE_ONLY = 0;
export const AFTER_FIRST_UNLOCK = 1;
export const AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY = 2;
export const ALWAYS = 3;
export const WHEN_PASSCODE_SET_THIS_DEVICE_ONLY = 4;
export const WHEN_UNLOCKED = 5;
export const WHEN_UNLOCKED_THIS_DEVICE_ONLY = 6;

export async function isAvailableAsync(): Promise<boolean> {
  return true;
}

export async function setItemAsync(key: string, value: string, _options?: any): Promise<void> {
  _mockSecureStoreMap.set(key, value);
}

export async function getItemAsync(key: string, _options?: any): Promise<string | null> {
  return _mockSecureStoreMap.get(key) ?? null;
}

export async function deleteItemAsync(key: string, _options?: any): Promise<void> {
  _mockSecureStoreMap.delete(key);
}

// Mock Camera
export const CameraView = 'CameraView';
export function useCameraPermissions() {
  return [{ granted: true, status: 'granted', canAskAgain: true, expires: 'never' }, async () => ({ granted: true })];
}

export default Constants;
