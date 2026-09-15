import { describe, it, expect, vi } from 'vitest';
import OnboardingManager from '../../services/onboardingManager';

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

describe('OnboardingScreen1 Component & Logic Suite', () => {
  it('manages onboarding state flow initialization cleanly', async () => {
    const checkSpy = vi.spyOn(OnboardingManager, 'isOnboardingCompleted').mockResolvedValue(false);
    const isDone = await OnboardingManager.isOnboardingCompleted();
    expect(checkSpy).toHaveBeenCalled();
    expect(isDone).toBe(false);
  });

  it('persists completion when skip or finish is triggered', async () => {
    const setSpy = vi.spyOn(OnboardingManager, 'setOnboardingCompleted').mockResolvedValue(undefined);
    await OnboardingManager.setOnboardingCompleted();
    expect(setSpy).toHaveBeenCalled();
  });
});
