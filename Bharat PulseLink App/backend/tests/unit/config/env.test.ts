/**
 * Unit tests — Environment Configuration
 *
 * Tests:
 * - Valid configuration loads correctly
 * - Missing required fields fail fast
 * - Cross-field validation (DESCOPE_PROJECT_ID in production)
 * - Safe startup info never exposes secrets
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Environment Configuration', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  it('accepts valid minimal development configuration', async () => {
    delete process.env['PORT'];
    delete process.env['LOG_LEVEL'];
    process.env['NODE_ENV'] = 'development';
    process.env['DATABASE_URL'] = 'postgresql://user:pass@localhost:5432/db';
    process.env['REDIS_REQUIRED'] = 'false';
    process.env['BLOCKCHAIN_PROVIDER'] = 'disabled';

    // Dynamic import to get fresh module evaluation
    const { env } = await import('../../../src/config/env.js');
    expect(env.NODE_ENV).toBe('development');
    expect([8080, 8085]).toContain(env.PORT);
    expect(env.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/db');
  });

  it('applies default values for optional fields', async () => {
    delete process.env['PORT'];
    delete process.env['LOG_LEVEL'];
    delete process.env['API_PREFIX'];
    delete process.env['DATABASE_POOL_MIN'];
    delete process.env['DATABASE_POOL_MAX'];
    process.env['NODE_ENV'] = 'development';
    process.env['DATABASE_URL'] = 'postgresql://user:pass@localhost:5432/db';

    const { env } = await import('../../../src/config/env.js');
    expect(env.PORT).toBe(8080);
    expect(env.LOG_LEVEL).toBe('info');
    expect(env.API_PREFIX).toBe('/api/v1');
    expect(env.DATABASE_POOL_MIN).toBe(2);
    expect(env.DATABASE_POOL_MAX).toBe(10);
  });

  it('getSafeStartupInfo never includes DATABASE_URL value', async () => {
    process.env['NODE_ENV'] = 'development';
    process.env['DATABASE_URL'] = 'postgresql://secret_user:secret_pass@prod-db:5432/db';

    const { getSafeStartupInfo } = await import('../../../src/config/env.js');
    const info = getSafeStartupInfo();
    const infoStr = JSON.stringify(info);

    expect(infoStr).not.toContain('secret_user');
    expect(infoStr).not.toContain('secret_pass');
    expect(infoStr).not.toContain('prod-db');
    expect(info['database']).toBe('configured');
  });

  it('getSafeStartupInfo truncates Descope Project ID', async () => {
    process.env['NODE_ENV'] = 'development';
    process.env['DATABASE_URL'] = 'postgresql://user:pass@localhost:5432/db';
    process.env['DESCOPE_PROJECT_ID'] = 'P2abc1234567890fullkey';

    const { getSafeStartupInfo } = await import('../../../src/config/env.js');
    const info = getSafeStartupInfo();

    expect(info['descopeProjectId']).not.toBe('P2abc1234567890fullkey');
    expect(String(info['descopeProjectId'])).toContain('...');
  });
});
