import * as SecureStore from '../services/secureStore';

const CACHE_STORAGE_KEY = 'pulselink_query_cache';

export interface PersistentCacheState {
  timestamp: number;
  data: Record<string, any>;
}

export async function saveQueryCache(data: Record<string, any>): Promise<void> {
  try {
    const payload: PersistentCacheState = {
      timestamp: Date.now(),
      data,
    };
    await SecureStore.set(CACHE_STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    // Fail safe on storage error
  }
}

export async function loadQueryCache(): Promise<PersistentCacheState | null> {
  try {
    const raw = await SecureStore.get(CACHE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistentCacheState;
  } catch (e) {
    return null;
  }
}

export async function clearQueryCacheStorage(): Promise<void> {
  try {
    await SecureStore.remove(CACHE_STORAGE_KEY);
  } catch (e) {
    // Fail safe
  }
}

export default { saveQueryCache, loadQueryCache, clearQueryCacheStorage };
