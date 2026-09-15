import { describe, it, expect } from 'vitest';
import { IVRPincodeValidator } from '../../../src/modules/ivr/pincode/IVRPincodeValidator.js';

describe('IVRPincodeValidator — Format & String Preservation', () => {
  it('validates standard 6-digit Indian PIN codes', () => {
    const validPins = ['600001', '110001', '560001', '700001', '400001'];
    for (const pin of validPins) {
      const res = IVRPincodeValidator.validate(pin);
      expect(res.isValid).toBe(true);
      expect(res.normalized).toBe(pin);
      expect(typeof res.normalized).toBe('string');
    }
  });

  it('preserves leading zeros as string (e.g. 060001)', () => {
    const pin = '060001';
    const res = IVRPincodeValidator.validate(pin);
    expect(res.isValid).toBe(true);
    expect(res.normalized).toBe('060001');
    expect(res.normalized?.startsWith('0')).toBe(true);
  });

  it('rejects PIN codes with length less than 6 digits', () => {
    const invalidPins = ['6', '60', '600', '6000', '60000'];
    for (const pin of invalidPins) {
      const res = IVRPincodeValidator.validate(pin);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('exactly 6 digits');
    }
  });

  it('rejects PIN codes with length greater than 6 digits', () => {
    const invalidPins = ['6000001', '60000000', '123456789'];
    for (const pin of invalidPins) {
      const res = IVRPincodeValidator.validate(pin);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('exactly 6 digits');
    }
  });

  it('rejects non-numeric characters, letters, and symbols', () => {
    const invalidPins = ['60000A', '600-01', '60 001', '60000#', 'ABCDEF'];
    for (const pin of invalidPins) {
      const res = IVRPincodeValidator.validate(pin);
      expect(res.isValid).toBe(false);
    }
  });

  it('rejects null, undefined, and empty string', () => {
    expect(IVRPincodeValidator.validate(null).isValid).toBe(false);
    expect(IVRPincodeValidator.validate(undefined).isValid).toBe(false);
    expect(IVRPincodeValidator.validate('').isValid).toBe(false);
  });
});
