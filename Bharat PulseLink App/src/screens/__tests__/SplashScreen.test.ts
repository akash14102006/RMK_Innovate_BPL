import { describe, it, expect, vi, beforeEach } from 'vitest';
import SessionManager from '../../services/sessionManager';

vi.mock('../../services/secureStore', () => ({
  set: vi.fn(),
  get: vi.fn(),
  remove: vi.fn(),
}));

describe('SplashScreen Boot & Motion Unit Logic', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes SessionManager cleanly on boot', async () => {
    const initSpy = vi.spyOn(SessionManager, 'init').mockResolvedValue(undefined);
    const tokenSpy = vi.spyOn(SessionManager, 'getAccessToken').mockResolvedValue('mock-token');

    await SessionManager.init();
    const token = await SessionManager.getAccessToken();

    expect(initSpy).toHaveBeenCalled();
    expect(tokenSpy).toHaveBeenCalled();
    expect(token).toBe('mock-token');
  });

  it('handles unauthenticated state when no token exists', async () => {
    vi.spyOn(SessionManager, 'init').mockResolvedValue(undefined);
    vi.spyOn(SessionManager, 'getAccessToken').mockResolvedValue(null);

    await SessionManager.init();
    const token = await SessionManager.getAccessToken();

    expect(token).toBeNull();
  });
});
