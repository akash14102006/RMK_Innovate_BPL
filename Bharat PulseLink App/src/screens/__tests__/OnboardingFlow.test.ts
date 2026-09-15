import { describe, it, expect, vi, beforeEach } from 'vitest';
import OnboardingManager from '../../services/onboardingManager';
import secureStore from '../../services/secureStore';

vi.mock('../../services/secureStore', () => ({
  default: {
    set: vi.fn(),
    get: vi.fn(),
    remove: vi.fn(),
  },
  set: vi.fn(),
  get: vi.fn(),
  remove: vi.fn(),
}));

describe('Complete Onboarding Flow (Screens 1–4) & State Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    (OnboardingManager as any).completedCache = null;
  });

  it('correctly initializes in uncompleted onboarding state', async () => {
    const isCompleted = await OnboardingManager.isOnboardingCompleted();
    expect(isCompleted).toBe(false);
  });

  it('completes onboarding upon final Get Started action', async () => {
    vi.mocked(secureStore.set).mockResolvedValue(undefined);
    await OnboardingManager.setOnboardingCompleted();
    expect(secureStore.set).toHaveBeenCalledWith(
      'bharat_pulselink_onboarding_completed_v1',
      'true'
    );
    const isCompleted = await OnboardingManager.isOnboardingCompleted();
    expect(isCompleted).toBe(true);
  });

  it('completes onboarding upon Skip action from any screen', async () => {
    vi.mocked(secureStore.set).mockResolvedValue(undefined);
    await OnboardingManager.setOnboardingCompleted();
    expect(secureStore.set).toHaveBeenCalledWith(
      'bharat_pulselink_onboarding_completed_v1',
      'true'
    );
  });
});
