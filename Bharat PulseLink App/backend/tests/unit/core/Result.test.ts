/**
 * Unit tests — Result monad
 */

import { describe, it, expect } from 'vitest';
import { ok, err, isOk, isErr, mapResult, unwrap } from '../../../src/core/result/Result.js';

describe('Result Monad', () => {
  it('ok() creates a successful result', () => {
    const result = ok(42);
    expect(result.success).toBe(true);
    expect(isOk(result)).toBe(true);
    expect(isErr(result)).toBe(false);
    if (result.success) {
      expect(result.value).toBe(42);
    }
  });

  it('err() creates a failure result', () => {
    const error = new Error('not found');
    const result = err(error);
    expect(result.success).toBe(false);
    expect(isOk(result)).toBe(false);
    expect(isErr(result)).toBe(true);
    if (!result.success) {
      expect(result.error).toBe(error);
    }
  });

  it('mapResult transforms the value on success', () => {
    const result = ok(5);
    const mapped = mapResult(result, (v) => v * 2);
    expect(isOk(mapped)).toBe(true);
    if (mapped.success) expect(mapped.value).toBe(10);
  });

  it('mapResult passes through error unchanged', () => {
    const error = new Error('fail');
    const result = err(error);
    const mapped = mapResult(result, (v: number) => v * 2);
    expect(isErr(mapped)).toBe(true);
    if (!mapped.success) expect(mapped.error).toBe(error);
  });

  it('unwrap returns value for ok result', () => {
    const result = ok('hello');
    expect(unwrap(result)).toBe('hello');
  });

  it('unwrap throws for error result', () => {
    const error = new Error('domain failure');
    const result = err(error);
    expect(() => unwrap(result)).toThrow('domain failure');
  });
});
