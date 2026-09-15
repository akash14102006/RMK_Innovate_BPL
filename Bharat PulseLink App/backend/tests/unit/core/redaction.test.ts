/**
 * Unit tests — Redaction Utility
 *
 * Tests:
 * - Sensitive keys are redacted in objects
 * - Nested objects are redacted
 * - Authorization headers are redacted
 * - Non-sensitive data is unchanged
 * - PHI field names are redacted
 */

import { describe, it, expect } from 'vitest';
import { redactObject, redactHeaders } from '../../../src/core/utils/redaction.js';

describe('Log Redaction', () => {
  describe('redactObject', () => {
    it('redacts password fields', () => {
      const obj = { username: 'akash', password: 'super_secret_123' };
      const result = redactObject(obj) as Record<string, unknown>;
      expect(result['username']).toBe('akash');
      expect(result['password']).toBe('[REDACTED]');
    });

    it('redacts token fields', () => {
      const obj = { userId: 'u-123', accessToken: 'eyJhb...', refreshToken: 'rft...' };
      const result = redactObject(obj) as Record<string, unknown>;
      expect(result['userId']).toBe('u-123');
      expect(result['accessToken']).toBe('[REDACTED]');
      expect(result['refreshToken']).toBe('[REDACTED]');
    });

    it('redacts OTP and PIN fields', () => {
      const obj = { phoneNumber: '+919876543210', otp: '123456', pin: '9182' };
      const result = redactObject(obj) as Record<string, unknown>;
      expect(result['phoneNumber']).toBe('[REDACTED]');
      expect(result['otp']).toBe('[REDACTED]');
      expect(result['pin']).toBe('[REDACTED]');
    });

    it('redacts Aadhaar number', () => {
      const obj = { name: 'Akash Kumar', aadhaarNumber: '1234-5678-9012' };
      const result = redactObject(obj) as Record<string, unknown>;
      expect(result['name']).toBe('Akash Kumar');
      expect(result['aadhaarNumber']).toBe('[REDACTED]');
    });

    it('preserves non-sensitive fields unchanged', () => {
      const obj = { hospitalName: 'AIIMS Delhi', city: 'New Delhi', rating: 4.5 };
      const result = redactObject(obj) as Record<string, unknown>;
      expect(result['hospitalName']).toBe('AIIMS Delhi');
      expect(result['city']).toBe('New Delhi');
      expect(result['rating']).toBe(4.5);
    });

    it('redacts nested sensitive fields', () => {
      const obj = {
        user: {
          id: 'u-123',
          credentials: {
            password: 'hashed_value',
            apiKey: 'key_12345',
          },
        },
      };
      const result = redactObject(obj) as { user: { credentials: Record<string, unknown> } };
      expect(result.user.credentials['password']).toBe('[REDACTED]');
      expect(result.user.credentials['apiKey']).toBe('[REDACTED]');
    });

    it('handles arrays without mutation', () => {
      const arr = [
        { name: 'John', secret: 'abc' },
        { name: 'Jane', secret: 'xyz' },
      ];
      const result = redactObject(arr) as Array<Record<string, unknown>>;
      expect(result[0]?.['name']).toBe('John');
      expect(result[0]?.['secret']).toBe('[REDACTED]');
      expect(result[1]?.['name']).toBe('Jane');
    });

    it('handles null and undefined gracefully', () => {
      expect(redactObject(null)).toBeNull();
      expect(redactObject(undefined)).toBeUndefined();
    });
  });

  describe('redactHeaders', () => {
    it('redacts authorization header', () => {
      const headers = {
        'authorization': 'Bearer eyJhb...',
        'content-type': 'application/json',
        'x-request-id': 'req-123',
      };
      const result = redactHeaders(headers);
      expect(result['authorization']).toBe('[REDACTED]');
      expect(result['content-type']).toBe('application/json');
      expect(result['x-request-id']).toBe('req-123');
    });

    it('redacts cookie header', () => {
      const headers = {
        'cookie': 'session=abc123; path=/',
        'accept': 'application/json',
      };
      const result = redactHeaders(headers);
      expect(result['cookie']).toBe('[REDACTED]');
      expect(result['accept']).toBe('application/json');
    });

    it('redacts x-api-key header', () => {
      const headers = { 'x-api-key': 'secret-api-key' };
      const result = redactHeaders(headers);
      expect(result['x-api-key']).toBe('[REDACTED]');
    });
  });
});
