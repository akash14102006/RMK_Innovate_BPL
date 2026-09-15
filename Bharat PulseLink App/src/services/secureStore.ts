/**
 * Bharat PulseLink — Secure Storage Service
 *
 * Platform-Safe Storage Architecture:
 * - Android/iOS: Uses hardware-backed OS Keystore / Keychain via expo-secure-store public API
 *   (SecureStore.setItemAsync, SecureStore.getItemAsync, SecureStore.deleteItemAsync)
 * - Web: Uses explicit Web Storage (localStorage / in-memory fallback) with clear isolation
 * - Fallback: In-memory store for SSR / Vitest / testing environments
 *
 * Owned by: Patient Data Encryption & Mobile Security Domain (Prompt 93 & Prompt 88)
 */

import { Platform } from 'react-native';

// In-memory fallback map for test environments, SSR, or storage failures
const inMemoryStore = new Map<string, string>();

/**
 * Lazy resolver for native expo-secure-store (Native Android/iOS only)
 */
function getNativeSecureStore(): any {
  if (Platform.OS === 'web') {
    return null;
  }
  try {
    return require('expo-secure-store');
  } catch {
    return null;
  }
}

/**
 * Checks if the Web environment has functional localStorage
 */
function isWebStorageAvailable(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    const testKey = '__bpl_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export class SecureStorageService {
  /**
   * Persists a key-value pair into platform-appropriate secure storage.
   * - Android/iOS: Hardware-backed Keystore / Keychain via SecureStore.setItemAsync
   * - Web: Web Storage partition [WEB_STORAGE]
   */
  static async set(key: string, value: string): Promise<void> {
    if (!key || typeof key !== 'string') {
      throw new Error('[SECURE_STORAGE] Invalid storage key provided');
    }

    if (Platform.OS === 'web') {
      try {
        if (isWebStorageAvailable()) {
          window.localStorage.setItem(key, value);
        } else {
          inMemoryStore.set(key, value);
        }
        return;
      } catch {
        inMemoryStore.set(key, value);
        return;
      }
    }

    // Native Platform (Android / iOS)
    const nativeStore = getNativeSecureStore();
    if (nativeStore && typeof nativeStore.setItemAsync === 'function') {
      try {
        await nativeStore.setItemAsync(key, value, {
          keychainAccessible: nativeStore.ALWAYS_THIS_DEVICE_ONLY ?? 0,
        });
        return;
      } catch (nativeErr: any) {
        console.warn('[NATIVE_SECURE_STORAGE] Native write error, falling back to memory store');
        inMemoryStore.set(key, value);
        return;
      }
    }

    inMemoryStore.set(key, value);
  }

  /**
   * Reads a stored value by key from platform-appropriate storage.
   * - Android/iOS: SecureStore.getItemAsync
   * - Web: localStorage / memory fallback
   */
  static async get(key: string): Promise<string | null> {
    if (!key || typeof key !== 'string') {
      return null;
    }

    if (Platform.OS === 'web') {
      try {
        if (isWebStorageAvailable()) {
          const item = window.localStorage.getItem(key);
          if (item !== null) return item;
        }
        return inMemoryStore.get(key) ?? null;
      } catch {
        return inMemoryStore.get(key) ?? null;
      }
    }

    // Native Platform (Android / iOS)
    const nativeStore = getNativeSecureStore();
    if (nativeStore && typeof nativeStore.getItemAsync === 'function') {
      try {
        const result = await nativeStore.getItemAsync(key, {
          keychainAccessible: nativeStore.ALWAYS_THIS_DEVICE_ONLY ?? 0,
        });
        if (result !== null) {
          return result;
        }
        return inMemoryStore.get(key) ?? null;
      } catch {
        return inMemoryStore.get(key) ?? null;
      }
    }

    return inMemoryStore.get(key) ?? null;
  }

  /**
   * Removes a stored value by key.
   * - Android/iOS: SecureStore.deleteItemAsync
   * - Web: localStorage.removeItem
   */
  static async remove(key: string): Promise<void> {
    if (!key || typeof key !== 'string') {
      return;
    }

    inMemoryStore.delete(key);

    if (Platform.OS === 'web') {
      try {
        if (isWebStorageAvailable()) {
          window.localStorage.removeItem(key);
        }
      } catch {
        // Fail-safe
      }
      return;
    }

    // Native Platform (Android / iOS)
    const nativeStore = getNativeSecureStore();
    if (nativeStore && typeof nativeStore.deleteItemAsync === 'function') {
      try {
        await nativeStore.deleteItemAsync(key, {
          keychainAccessible: nativeStore.ALWAYS_THIS_DEVICE_ONLY ?? 0,
        });
      } catch {
        // Fail-safe
      }
    }
  }

  /**
   * Checks if native secure storage is available on this device
   */
  static async isAvailable(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return isWebStorageAvailable();
    }
    const nativeStore = getNativeSecureStore();
    if (nativeStore && typeof nativeStore.isAvailableAsync === 'function') {
      try {
        return await nativeStore.isAvailableAsync();
      } catch {
        return false;
      }
    }
    return false;
  }
}

// Export individual functions for 100% backward compatibility
export const set = SecureStorageService.set;
export const get = SecureStorageService.get;
export const remove = SecureStorageService.remove;
export const isAvailable = SecureStorageService.isAvailable;

export default {
  set,
  get,
  remove,
  isAvailable,
  SecureStorageService,
};
