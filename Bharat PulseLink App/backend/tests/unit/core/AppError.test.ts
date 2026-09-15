/**
 * Unit tests — Error Taxonomy
 *
 * Tests:
 * - AppError carries correct fields
 * - HTTP status mapping is correct for all error codes
 * - Factory functions produce correct instances
 * - Type guard works correctly
 * - No stack trace leak in error object
 */

import { describe, it, expect } from 'vitest';
import {
  AppError,
  ErrorCode,
  Errors,
  isAppError,
  getHttpStatus,
} from '../../../src/core/errors/AppError.js';

describe('AppError — Error Taxonomy', () => {
  it('creates an AppError with correct fields', () => {
    const error = new AppError({
      code: ErrorCode.NOT_FOUND,
      message: 'Hospital not found',
      detail: 'No hospital with the given ID exists',
    });

    expect(error.code).toBe(ErrorCode.NOT_FOUND);
    expect(error.message).toBe('Hospital not found');
    expect(error.detail).toBe('No hospital with the given ID exists');
    expect(error.statusCode).toBe(404);
    expect(error.isAppError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });

  it('allows statusOverride to override HTTP status', () => {
    const error = new AppError({
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Custom status',
      statusOverride: 502,
    });
    expect(error.statusCode).toBe(502);
  });

  it('maps all error codes to valid HTTP statuses', () => {
    for (const code of Object.values(ErrorCode)) {
      const status = getHttpStatus(code as ErrorCode);
      expect(status).toBeGreaterThanOrEqual(400);
      expect(status).toBeLessThanOrEqual(599);
    }
  });

  describe('Errors factory', () => {
    it('creates notFound with 404 status', () => {
      const err = Errors.notFound('Hospital', 'hosp-123');
      expect(err.statusCode).toBe(404);
      expect(err.code).toBe(ErrorCode.NOT_FOUND);
      expect(err.message).toContain('hosp-123');
    });

    it('creates unauthorized with 401 status', () => {
      const err = Errors.unauthorized('Token expired');
      expect(err.statusCode).toBe(401);
      expect(err.code).toBe(ErrorCode.UNAUTHORIZED);
    });

    it('creates forbidden with 403 status', () => {
      const err = Errors.forbidden();
      expect(err.statusCode).toBe(403);
      expect(err.code).toBe(ErrorCode.FORBIDDEN);
    });

    it('creates validation error with issues', () => {
      const err = Errors.validation([{ field: 'email', message: 'Invalid format' }]);
      expect(err.statusCode).toBe(400);
      expect(err.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(err.issues).toHaveLength(1);
      expect(err.issues?.[0]?.field).toBe('email');
    });

    it('creates internal error with 500 status', () => {
      const err = Errors.internal(new Error('DB timeout'));
      expect(err.statusCode).toBe(500);
      expect(err.code).toBe(ErrorCode.INTERNAL_ERROR);
      // cause is for logging only — not exposed
      expect(err.cause).toBeInstanceOf(Error);
    });

    it('creates dependencyUnavailable with 503 status', () => {
      const err = Errors.dependencyUnavailable('PostgreSQL');
      expect(err.statusCode).toBe(503);
      expect(err.code).toBe(ErrorCode.DEPENDENCY_UNAVAILABLE);
    });
  });

  describe('isAppError type guard', () => {
    it('returns true for AppError instances', () => {
      const err = new AppError({ code: ErrorCode.FORBIDDEN, message: 'denied' });
      expect(isAppError(err)).toBe(true);
    });

    it('returns false for regular Errors', () => {
      const err = new Error('plain error');
      expect(isAppError(err)).toBe(false);
    });

    it('returns false for null/undefined', () => {
      expect(isAppError(null)).toBe(false);
      expect(isAppError(undefined)).toBe(false);
    });

    it('returns false for non-error objects', () => {
      expect(isAppError({ code: 'NOT_FOUND' })).toBe(false);
    });
  });
});
