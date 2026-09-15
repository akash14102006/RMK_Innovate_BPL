import secureStore from './secureStore';

const ONBOARDING_COMPLETED_KEY = 'bharat_pulselink_onboarding_completed_v1';

function withTimeout<T>(promise: Promise<T>, ms: number, fallbackValue: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallbackValue), ms)),
  ]);
}

export class OnboardingManager {
  private static completedCache: boolean | null = null;

  static async isOnboardingCompleted(): Promise<boolean> {
    if (this.completedCache !== null) {
      return this.completedCache;
    }
    try {
      const val = await withTimeout(secureStore.get(ONBOARDING_COMPLETED_KEY), 2000, null);
      this.completedCache = val === 'true';
      return this.completedCache;
    } catch {
      return false;
    }
  }

  static async setOnboardingCompleted(): Promise<void> {
    try {
      this.completedCache = true;
      await secureStore.set(ONBOARDING_COMPLETED_KEY, 'true');
      console.log('[ONBOARDING] COMPLETED_STATE_PERSISTED');
    } catch (error) {
      console.error('[ONBOARDING] PERSISTENCE_FAILED', error);
      throw error;
    }
  }

  static async resetOnboarding(): Promise<void> {
    this.completedCache = false;
    try {
      await secureStore.remove(ONBOARDING_COMPLETED_KEY);
      console.log('[ONBOARDING] STATE_RESET');
    } catch (error) {
      console.warn('[ONBOARDING] RESET_STORAGE_NOTICE', error);
    }
  }
}

export default OnboardingManager;
