/**
 * Unit tests — Clock Abstraction
 */

import { describe, it, expect } from 'vitest';
import { SystemClock, FixedClock } from '../../../src/core/utils/clock.js';

describe('Clock Abstraction', () => {
  describe('SystemClock', () => {
    it('now() returns a current Date', () => {
      const clock = new SystemClock();
      const before = Date.now();
      const result = clock.now();
      const after = Date.now();
      expect(result.getTime()).toBeGreaterThanOrEqual(before);
      expect(result.getTime()).toBeLessThanOrEqual(after);
    });

    it('nowMs() returns a timestamp', () => {
      const clock = new SystemClock();
      const result = clock.nowMs();
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('FixedClock', () => {
    it('returns the fixed time', () => {
      const fixedTime = new Date('2025-01-01T12:00:00Z');
      const clock = new FixedClock(fixedTime);
      expect(clock.now().toISOString()).toBe('2025-01-01T12:00:00.000Z');
    });

    it('advance() moves time forward', () => {
      const clock = new FixedClock(new Date('2025-01-01T00:00:00Z'));
      clock.advance(60 * 1000); // 1 minute
      expect(clock.now().toISOString()).toBe('2025-01-01T00:01:00.000Z');
    });

    it('advance() is useful for testing OTP/session expiry', () => {
      const sessionCreatedAt = new Date('2025-01-01T00:00:00Z');
      const clock = new FixedClock(sessionCreatedAt);
      const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

      // Before expiry
      const isExpiredBefore = clock.nowMs() - sessionCreatedAt.getTime() > SESSION_TTL_MS;
      expect(isExpiredBefore).toBe(false);

      // Advance past expiry
      clock.advance(SESSION_TTL_MS + 1);
      const isExpiredAfter = clock.nowMs() - sessionCreatedAt.getTime() > SESSION_TTL_MS;
      expect(isExpiredAfter).toBe(true);
    });

    it('set() resets the clock to a specific time', () => {
      const clock = new FixedClock(new Date('2025-01-01T00:00:00Z'));
      clock.set(new Date('2026-06-15T10:30:00Z'));
      expect(clock.now().toISOString()).toBe('2026-06-15T10:30:00.000Z');
    });
  });
});
