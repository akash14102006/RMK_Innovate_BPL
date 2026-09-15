import { setupServer } from 'msw/node';
import { rest } from 'msw';
import * as SecureStore from '../secureStore';
import { vi, beforeAll, afterAll, afterEach, beforeEach, describe, it, expect } from 'vitest';

vi.mock('../secureStore', () => ({
  set: vi.fn(),
  get: vi.fn(),
  remove: vi.fn(),
  default: {
    set: vi.fn(),
    get: vi.fn(),
    remove: vi.fn(),
  },
}));

const API_BASE = 'http://localhost';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(async () => {
  vi.resetAllMocks();
  vi.resetModules();
  (SecureStore as any).set = vi.fn();
  (SecureStore as any).get = vi.fn();
  (SecureStore as any).remove = vi.fn();
});

describe('SessionManager MSW contract for /auth/refresh', () => {
  it('strictly accepts expected request and returns tokens (success)', async () => {
    server.use(
      rest.post(`${API_BASE}/auth/refresh`, async (req, res, ctx) => {
        const body = await req.json();
        if (!body || body.refreshToken !== 'r-msw') {
          return res(ctx.status(400));
        }
        return res(
          ctx.status(200),
          ctx.json({
            accessToken: 'msw-access',
            refreshToken: 'msw-refresh',
            expiresAt: Date.now() + 60 * 60 * 1000,
          })
        );
      })
    );

    (globalThis as any).API_BASE = API_BASE;
    const mod = await import('../sessionManager.js');
    const SessionManager = (mod as any).default;
    await SessionManager.setTokens({ accessToken: 'old', refreshToken: 'r-msw', expiresAt: Date.now() - 1000 });

    await SessionManager.refreshIfNeeded();

    const token = await SessionManager.getAccessToken();
    expect(token).toBe('msw-access');
    expect((SecureStore as any).set).toHaveBeenCalled();
  });

  it('strictly checks request body and clears on 401', async () => {
    server.use(
      rest.post(`${API_BASE}/auth/refresh`, async (req, res, ctx) => {
        const body = await req.json();
        if (body && body.refreshToken === 'r-msw-fail') return res(ctx.status(401));
        return res(ctx.status(200), ctx.json({ accessToken: 'x', refreshToken: 'y', expiresAt: Date.now() + 1000 }));
      })
    );

    (globalThis as any).API_BASE = API_BASE;
    const mod = await import('../sessionManager.js');
    const SessionManager = (mod as any).default;
    await SessionManager.setTokens({ accessToken: 'old2', refreshToken: 'r-msw-fail', expiresAt: Date.now() - 1000 });

    try {
      await SessionManager.refreshIfNeeded();
    } catch (e) {
      // acceptable: implementation may throw on 401
    }

    const token = await SessionManager.getAccessToken();
    expect(token).toBeNull();
    expect((SecureStore as any).remove).toHaveBeenCalled();
  });
});
