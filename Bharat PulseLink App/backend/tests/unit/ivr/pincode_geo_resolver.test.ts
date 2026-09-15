import { describe, it, expect } from 'vitest';
import { PincodeGeoResolver } from '../../../src/modules/ivr/geospatial/PincodeGeoResolver.js';

describe('PincodeGeoResolver — Postal PIN Geographic Resolution', () => {
  const resolver = new PincodeGeoResolver();

  it('resolves valid Indian PIN 600001 to Chennai George Town coordinates', async () => {
    const res = await resolver.resolve('600001');
    expect(res.isValid).toBe(true);
    if (res.isValid) {
      expect(res.pincode).toBe('600001');
      expect(res.latitude).toBeCloseTo(13.0827, 4);
      expect(res.longitude).toBeCloseTo(80.2707, 4);
      expect(res.district).toBe('Chennai');
      expect(res.state).toBe('Tamil Nadu');
      expect(res.source).toBe('CENTROID_REGISTRY');
      expect(res.confidence).toBeGreaterThanOrEqual(0.9);
    }
  });

  it('resolves valid Indian PIN 110001 to New Delhi Connaught Place coordinates', async () => {
    const res = await resolver.resolve('110001');
    expect(res.isValid).toBe(true);
    if (res.isValid) {
      expect(res.pincode).toBe('110001');
      expect(res.latitude).toBeCloseTo(28.6304, 4);
      expect(res.longitude).toBeCloseTo(77.2177, 4);
      expect(res.district).toBe('New Delhi');
      expect(res.state).toBe('Delhi');
    }
  });

  it('resolves valid Indian PIN 560001 to Bengaluru Urban coordinates', async () => {
    const res = await resolver.resolve('560001');
    expect(res.isValid).toBe(true);
    if (res.isValid) {
      expect(res.latitude).toBeCloseTo(12.9716, 4);
      expect(res.longitude).toBeCloseTo(77.5946, 4);
      expect(res.district).toBe('Bengaluru Urban');
      expect(res.state).toBe('Karnataka');
    }
  });

  it('resolves valid Indian PIN 400001 to Mumbai City Fort coordinates', async () => {
    const res = await resolver.resolve('400001');
    expect(res.isValid).toBe(true);
    if (res.isValid) {
      expect(res.latitude).toBeCloseTo(18.9388, 4);
      expect(res.longitude).toBeCloseTo(72.8354, 4);
      expect(res.state).toBe('Maharashtra');
    }
  });

  it('returns PIN_GEO_NOT_FOUND when valid 6-digit PIN has no registered geographic mapping', async () => {
    const res = await resolver.resolve('999999');
    expect(res.isValid).toBe(false);
    if (!res.isValid) {
      expect(res.error).toBe('PIN_GEO_NOT_FOUND');
      expect(res.pincode).toBe('999999');
    }
  });

  it('returns INVALID_PIN_FORMAT when input is malformed or wrong length', async () => {
    const res = await resolver.resolve('123');
    expect(res.isValid).toBe(false);
    if (!res.isValid) {
      expect(res.error).toBe('INVALID_PIN_FORMAT');
    }
  });

  it('verifies coordinate correctness: Longitude is X, Latitude is Y', async () => {
    const res = await resolver.resolve('600001');
    expect(res.isValid).toBe(true);
    if (res.isValid) {
      // Longitude for India is ~68°E to 97°E
      expect(res.longitude).toBeGreaterThan(68);
      expect(res.longitude).toBeLessThan(98);
      // Latitude for India is ~8°N to 37°N
      expect(res.latitude).toBeGreaterThan(8);
      expect(res.latitude).toBeLessThan(38);
    }
  });
});
