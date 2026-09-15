/**
 * Integration test setup
 * Used by vitest.integration.config.ts
 * Requires real PostgreSQL (port 5433) and Redis (port 6380).
 */

process.env['NODE_ENV'] = 'test';
process.env['PORT'] = '0';
process.env['HOST'] = '127.0.0.1';
process.env['LOG_LEVEL'] = 'warn'; // Reduced noise in integration tests
process.env['DATABASE_URL'] = process.env['TEST_DATABASE_URL']
  ?? 'postgresql://bpl_test_user:bpl_test_local_only@localhost:5433/bharat_pulselink_test';
process.env['REDIS_URL'] = process.env['TEST_REDIS_URL']
  ?? 'redis://:bpl_redis_test_only@localhost:6380';
process.env['REDIS_REQUIRED'] = 'false';
process.env['CORS_ORIGINS'] = 'http://localhost:8081';
process.env['SHUTDOWN_TIMEOUT_MS'] = '5000';
process.env['DATABASE_POOL_MIN'] = '1';
process.env['DATABASE_POOL_MAX'] = '5';
process.env['BLOCKCHAIN_PROVIDER'] = 'disabled';
