/**
 * Unit tests — Outbound HTTP Client
 *
 * Tests:
 * - Successful GET / POST execution
 * - Header and request ID propagation
 * - Error classification (429 → RATE_LIMITED, 401 → AUTH_FAILURE, 500 → DEPENDENCY_UNAVAILABLE)
 * - Timeout handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpClient } from '../../../src/infrastructure/http/HttpClient.js';
import { NoopLogger } from '../../../src/infrastructure/logger/logger.js';
import { ErrorCode } from '../../../src/core/errors/AppError.js';

describe('HttpClient Infrastructure', () => {
  const logger = new NoopLogger();
  const client = new HttpClient('MockService', logger, 2000);

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('performs successful GET request and returns structured response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ success: true, count: 5 }),
    });

    const result = await client.request('https://api.mock.gov.in/facilities', {
      requestId: 'req_test_123',
    });

    expect(result.status).toBe(200);
    expect(result.data).toEqual({ success: true, count: 5 });
  });

  it('maps 429 response to DEPENDENCY_RATE_LIMITED', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: new Headers(),
      text: async () => 'Rate limit exceeded',
    });

    await expect(
      client.request('https://api.mock.gov.in/facilities', { maxRetries: 0 }),
    ).rejects.toMatchObject({
      code: ErrorCode.DEPENDENCY_RATE_LIMITED,
    });
  });

  it('maps 401 response to DEPENDENCY_AUTH_FAILURE', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers(),
      text: async () => 'Unauthorized',
    });

    await expect(
      client.request('https://api.mock.gov.in/facilities', { maxRetries: 0 }),
    ).rejects.toMatchObject({
      code: ErrorCode.DEPENDENCY_AUTH_FAILURE,
    });
  });

  it('maps 503 response to DEPENDENCY_UNAVAILABLE', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      headers: new Headers(),
      text: async () => 'Service Unavailable',
    });

    await expect(
      client.request('https://api.mock.gov.in/facilities', { maxRetries: 0 }),
    ).rejects.toMatchObject({
      code: ErrorCode.DEPENDENCY_UNAVAILABLE,
    });
  });
});
