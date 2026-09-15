/**
 * Unit tests — Health & Readiness Routes
 *
 * Tests:
 * - GET /health → 200 (process alive)
 * - GET /ready → 200 when DB + Cache healthy
 * - GET /ready → 503 when DB fails
 * - GET /version → 200 with safe metadata
 * - No secrets in any response
 * - X-Request-Id header present in responses
 */

import { describe, it, expect } from 'vitest';
import { createTestApp } from '../../helpers/createTestApp.js';

describe('Health & Readiness Routes', () => {
  it('GET /health returns 200 with alive status', async () => {
    const app = await createTestApp();
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    const body = response.json<{ status: string; timestamp: string }>();
    expect(body.status).toBe('alive');
    expect(body.timestamp).toBeTruthy();

    await app.close();
  });

  it('GET /ready returns 200 when database pings successfully', async () => {
    const app = await createTestApp({ dbPingResult: true });
    const response = await app.inject({ method: 'GET', url: '/ready' });

    expect(response.statusCode).toBe(200);
    const body = response.json<{ status: string; checks: Record<string, string> }>();
    expect(body.status).toBe('ready');
    expect(body.checks['database']).toBe('ok');

    await app.close();
  });

  it('GET /ready returns 503 when database is unavailable', async () => {
    const app = await createTestApp({ dbPingResult: false });
    const response = await app.inject({ method: 'GET', url: '/ready' });

    expect(response.statusCode).toBe(503);
    const body = response.json<{ status: string; checks: Record<string, string> }>();
    expect(body.status).toBe('not_ready');
    expect(body.checks['database']).toBe('error');

    await app.close();
  });

  it('GET /version returns safe build metadata', async () => {
    const app = await createTestApp();
    const response = await app.inject({ method: 'GET', url: '/version' });

    expect(response.statusCode).toBe(200);
    const body = response.json<Record<string, string>>();
    expect(body['service']).toBe('bharat-pulselink-api');
    expect(body['version']).toBeTruthy();
    expect(body['nodeVersion']).toBeTruthy();

    // Must never expose secrets
    const bodyStr = JSON.stringify(body);
    expect(bodyStr).not.toContain('postgresql://');
    expect(bodyStr).not.toContain('redis://');
    expect(bodyStr).not.toContain('secret');

    await app.close();
  });

  it('GET /health includes X-Request-Id response header', async () => {
    const app = await createTestApp();
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.headers['x-request-id']).toBeTruthy();

    await app.close();
  });

  it('propagates X-Request-Id from request to response', async () => {
    const app = await createTestApp();
    const customId = 'test-request-id-12345';
    const response = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { 'x-request-id': customId },
    });

    expect(response.headers['x-request-id']).toBe(customId);

    await app.close();
  });

  it('GET /unknown-route returns 404 with error envelope', async () => {
    const app = await createTestApp();
    const response = await app.inject({ method: 'GET', url: '/api/v1/does-not-exist' });

    expect(response.statusCode).toBe(404);
    const body = response.json<{ error: { code: string }; requestId: string }>();
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.requestId).toBeTruthy();
    // No stack trace
    expect(JSON.stringify(body)).not.toContain('stack');
    expect(JSON.stringify(body)).not.toContain('Error:');

    await app.close();
  });

  it('response includes Cache-Control no-store header for authenticated responses', async () => {
    const app = await createTestApp();
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.headers['cache-control']).toContain('no-store');

    await app.close();
  });
});
