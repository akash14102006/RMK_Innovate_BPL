import SessionManager from '../sessionManager';
import * as SecureStore from '../secureStore';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import ProfileDraftService from '../ProfileDraftService';

vi.mock('../secureStore', () => {
  const mockFns = {
    set: vi.fn().mockResolvedValue(true),
    get: vi.fn().mockResolvedValue(null),
    remove: vi.fn().mockResolvedValue(true),
  };
  return {
    ...mockFns,
    default: mockFns,
  };
});

describe('SessionManager & Logout Flow', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    (SecureStore as any).set = vi.fn().mockResolvedValue(true);
    (SecureStore as any).get = vi.fn().mockResolvedValue(null);
    (SecureStore as any).remove = vi.fn().mockResolvedValue(true);
    try {
      await SessionManager.clear();
    } catch (e) {}
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('refreshes tokens successfully and persists them', async () => {
    const expiresAtPast = Date.now() - 1000;
    await SessionManager.setTokens({ accessToken: 'old', refreshToken: 'r1', expiresAt: expiresAtPast });

    const mockFetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ accessToken: 'new-access', refreshToken: 'new-refresh', expiresAt: Date.now() + 1000 * 60 * 60 }),
    }));

    // @ts-ignore - stubbing global fetch
    global.fetch = mockFetch as any;

    await SessionManager.refreshIfNeeded();

    const token = await SessionManager.getAccessToken();
    expect(token).toBe('new-access');
    expect((SecureStore as any).set).toHaveBeenCalled();
  });

  it('clears session and throws when refresh fails', async () => {
    const expiresAtPast = Date.now() - 1000;
    await SessionManager.setTokens({ accessToken: 'old2', refreshToken: 'r2', expiresAt: expiresAtPast });

    const mockFetch = vi.fn(async () => ({ ok: false }));
    // @ts-ignore
    global.fetch = mockFetch as any;

    await expect(SessionManager.refreshIfNeeded()).rejects.toThrow('refresh failed');

    const token = await SessionManager.getAccessToken();
    expect(token).toBeNull();
    expect((SecureStore as any).remove).toHaveBeenCalled();
  });

  it('performs complete logout and notifies subscribers with false', async () => {
    const mockListener = vi.fn();
    const unsubscribe = SessionManager.subscribe(mockListener);

    await SessionManager.setTokens({ accessToken: 'user_a_token', refreshToken: 'user_a_refresh' });
    expect(mockListener).toHaveBeenCalledWith(true);

    const mockFetch = vi.fn(async () => ({ ok: true, json: async () => ({ success: true }) }));
    // @ts-ignore
    global.fetch = mockFetch as any;

    await SessionManager.logout();

    // Verify token is cleared
    const token = await SessionManager.getAccessToken();
    expect(token).toBeNull();

    // Verify subscriber received false
    expect(mockListener).toHaveBeenCalledWith(false);

    // Verify SecureStore removal calls
    expect((SecureStore as any).remove).toHaveBeenCalled();

    unsubscribe();
  });

  it('performs local logout and state purge even when backend is offline', async () => {
    const mockListener = vi.fn();
    const unsubscribe = SessionManager.subscribe(mockListener);

    await SessionManager.setTokens({ accessToken: 'user_a_token', refreshToken: 'user_a_refresh' });

    // Mock network failure
    // @ts-ignore
    global.fetch = vi.fn().mockRejectedValue(new Error('Network request failed'));

    // Should complete cleanly without throwing
    await expect(SessionManager.logout()).resolves.not.toThrow();

    const token = await SessionManager.getAccessToken();
    expect(token).toBeNull();
    expect(mockListener).toHaveBeenCalledWith(false);

    unsubscribe();
  });

  it('clears profile drafts and prevents User B from inheriting User A draft', async () => {
    // User A sets draft
    await ProfileDraftService.loadDraft('user_patient_primary');
    await ProfileDraftService.markProfileCompleted();

    // Logout
    await SessionManager.logout();

    // In-memory draft for User A must be cleared
    expect(ProfileDraftService.getActiveMemoryDraft()).toBeNull();
  });
});
