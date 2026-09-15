import { describe, it, expect, vi, beforeEach } from 'vitest';
import OnboardingManager from '../onboardingManager';
import secureStore from '../secureStore';

vi.mock('../secureStore', () => ({
  default: {
    set: vi.fn(),
    get: vi.fn(),
    remove: vi.fn(),
  },
  set: vi.fn(),
  get: vi.fn(),
  remove: vi.fn(),
}));

describe('OnboardingManager Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Reset private cache
    (OnboardingManager as any).completedCache = null;
  });

  it('returns false when onboarding key is not set', async () => {
    vi.mocked(secureStore.get).mockResolvedValue(null);
    const isCompleted = await OnboardingManager.isOnboardingCompleted();
    expect(isCompleted).toBe(false);
  });

  it('returns true when onboarding key is set to true', async () => {
    vi.mocked(secureStore.get).mockResolvedValue('true');
    const isCompleted = await OnboardingManager.isOnboardingCompleted();
    expect(isCompleted).toBe(true);
  });

  it('persists onboarding completion state cleanly', async () => {
    vi.mocked(secureStore.set).mockResolvedValue(undefined);
    await OnboardingManager.setOnboardingCompleted();
    expect(secureStore.set).toHaveBeenCalledWith(
      'bharat_pulselink_onboarding_completed_v1',
      'true'
    );
  });

  it('resets onboarding state cleanly', async () => {
    vi.mocked(secureStore.remove).mockResolvedValue(undefined);
    await OnboardingManager.resetOnboarding();
    expect(secureStore.remove).toHaveBeenCalledWith(
      'bharat_pulselink_onboarding_completed_v1'
    );
  });
});
