/**
 * Unit test setup
 * Runs before every unit test file.
 * Sets environment variables for testing.
 */

// Set test environment (must happen before any module imports)
process.env['NODE_ENV'] = 'test';
process.env['PORT'] = '0'; // OS-assigned port for tests
process.env['HOST'] = '127.0.0.1';
process.env['LOG_LEVEL'] = 'silent';
process.env['DATABASE_URL'] = 'postgresql://bpl_test_user:bpl_test_local_only@localhost:5433/bharat_pulselink_test';
process.env['REDIS_REQUIRED'] = 'false';
process.env['CORS_ORIGINS'] = 'http://localhost:8081';
process.env['SHUTDOWN_TIMEOUT_MS'] = '1000';
process.env['DATABASE_POOL_MIN'] = '1';
process.env['DATABASE_POOL_MAX'] = '3';
process.env['BLOCKCHAIN_PROVIDER'] = 'disabled';
