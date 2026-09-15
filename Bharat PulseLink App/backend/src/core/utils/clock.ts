/**
 * Clock Abstraction
 *
 * Testable time interface. All domain code that needs the current time
 * should depend on this interface, not on `new Date()` directly.
 *
 * This ensures:
 * - OTP expiry, session expiry, QR expiry, appointment windows can be tested
 * - Time-sensitive security rules can be verified deterministically
 *
 * Owned by: Platform Foundation (Prompt 87)
 */

export interface Clock {
  /** Returns the current UTC time */
  now(): Date;
  /** Returns the current Unix timestamp in milliseconds */
  nowMs(): number;
}

/**
 * Real system clock — used in production.
 */
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }

  nowMs(): number {
    return Date.now();
  }
}

/**
 * Fixed clock for deterministic testing.
 */
export class FixedClock implements Clock {
  private _time: Date;

  constructor(fixedTime: Date | string | number = new Date()) {
    this._time = new Date(fixedTime);
  }

  now(): Date {
    return new Date(this._time);
  }

  nowMs(): number {
    return this._time.getTime();
  }

  /** Advance the clock by milliseconds (useful for expiry testing) */
  advance(ms: number): void {
    this._time = new Date(this._time.getTime() + ms);
  }

  /** Set the clock to a specific time */
  set(time: Date | string | number): void {
    this._time = new Date(time);
  }
}

/** Default system clock singleton for production use */
export const systemClock: Clock = new SystemClock();
