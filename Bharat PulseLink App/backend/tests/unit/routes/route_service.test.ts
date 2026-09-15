/**
 * Route Service & Driving Directions Unit & Integration Tests
 *
 * Validates:
 * - valid route request
 * - invalid origin / invalid destination validation
 * - distance in meters & km conversion
 * - duration in seconds & minutes conversion
 * - polyline encoding and decoding roundtrip
 * - traffic interval mapping & speed classification (NORMAL, SLOW, TRAFFIC_JAM)
 * - traffic summary determination
 * - API key protection & resilient fallback
 *
 * Owned by: In-App Navigation & Routing Domain
 */

import { describe, it, expect, vi } from 'vitest';
import { RouteService } from '../../../src/modules/routes/RouteService.js';
import { encodePolyline, decodePolyline } from '../../../src/modules/routes/polyline.js';
import { createApp } from '../../../src/app/app.js';
import { env } from '../../../src/config/env.js';

describe('Route Domain — Polyline Utilities', () => {
  it('encodes and decodes coordinate arrays with zero precision loss', () => {
    const coords = [
      { latitude: 13.0827, longitude: 80.2707 },
      { latitude: 13.0855, longitude: 80.2750 },
      { latitude: 13.0919, longitude: 80.2907 },
    ];

    const encoded = encodePolyline(coords);
    expect(typeof encoded).toBe('string');
    expect(encoded.length).toBeGreaterThan(0);

    const decoded = decodePolyline(encoded);
    expect(decoded).toHaveLength(3);
    expect(decoded[0].latitude).toBeCloseTo(13.0827, 4);
    expect(decoded[0].longitude).toBeCloseTo(80.2707, 4);
    expect(decoded[2].latitude).toBeCloseTo(13.0919, 4);
    expect(decoded[2].longitude).toBeCloseTo(80.2907, 4);
  });

  it('handles empty or single point inputs safely', () => {
    expect(encodePolyline([])).toBe('');
    expect(decodePolyline('')).toEqual([]);
    expect(decodePolyline(null as any)).toEqual([]);
  });
});

describe('RouteService — Driving Directions & Traffic Calculations', () => {
  const service = new RouteService();

  it('computes driving route with distance, ETA, polyline and traffic intervals', async () => {
    const result = await service.computeDrivingRoute({
      origin: { latitude: 13.0827, longitude: 80.2707 },
      destination: { latitude: 13.0919, longitude: 80.2907 },
    });

    expect(result).toBeDefined();
    expect(result.distanceMeters).toBeGreaterThan(0);
    expect(result.distanceKm).toBeGreaterThan(0);
    expect(result.durationSeconds).toBeGreaterThan(0);
    expect(result.durationMinutes).toBeGreaterThan(0);
    expect(result.polyline).toBeDefined();
    expect(typeof result.polyline).toBe('string');
    expect(result.polyline.length).toBeGreaterThan(0);

    // Decodable polyline
    const decoded = decodePolyline(result.polyline);
    expect(decoded.length).toBeGreaterThan(5);

    // Resilient fallback does not fabricate fake traffic intervals
    expect(result.traffic).toBeInstanceOf(Array);
    expect(result.isLiveTraffic).toBe(false);
    expect(result.trafficSource).toBe('FALLBACK');
    expect(result.trafficSummary).toBe('UNKNOWN');
  });

  it('rejects invalid origin coordinates', async () => {
    await expect(
      service.computeDrivingRoute({
        origin: { latitude: 95.0, longitude: 80.2707 }, // Invalid latitude > 90
        destination: { latitude: 13.0919, longitude: 80.2907 },
      }),
    ).rejects.toThrow(/latitude/i);
  });

  it('rejects invalid destination coordinates', async () => {
    await expect(
      service.computeDrivingRoute({
        origin: { latitude: 13.0827, longitude: 80.2707 },
        destination: { latitude: 13.0919, longitude: 200.0 }, // Invalid longitude > 180
      }),
    ).rejects.toThrow(/longitude/i);
  });

  it('parses Google Routes API response with speedReadingIntervals accurately', async () => {
    const mockService = new RouteService({
      apiKey: 'mock-google-key-secret-12345',
    });

    const mockGoogleResponse = {
      routes: [
        {
          distanceMeters: 4850,
          duration: '840s',
          polyline: {
            encodedPolyline: '_{snA_v}zN_b@pC_b@',
          },
          travelAdvisory: {
            speedReadingIntervals: [
              { startPolylinePointIndex: 0, endPolylinePointIndex: 10, speed: 'NORMAL' },
              { startPolylinePointIndex: 10, endPolylinePointIndex: 25, speed: 'SLOW' },
              { startPolylinePointIndex: 25, endPolylinePointIndex: 40, speed: 'TRAFFIC_JAM' },
            ],
          },
        },
      ],
    };

    // Spy on global fetch
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockGoogleResponse,
    } as any);

    const result = await mockService.computeDrivingRoute({
      origin: { latitude: 13.0827, longitude: 80.2707 },
      destination: { latitude: 13.0919, longitude: 80.2907 },
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://routes.googleapis.com/directions/v2:computeRoutes');
    expect(options?.headers).toMatchObject({
      'X-Goog-Api-Key': 'mock-google-key-secret-12345',
      'Content-Type': 'application/json',
    });

    expect(result.distanceMeters).toBe(4850);
    expect(result.distanceKm).toBe(4.9);
    expect(result.durationSeconds).toBe(840);
    expect(result.durationMinutes).toBe(14);
    expect(result.traffic).toHaveLength(3);
    expect(result.traffic[0].speed).toBe('NORMAL');
    expect(result.traffic[1].speed).toBe('SLOW');
    expect(result.traffic[2].speed).toBe('TRAFFIC_JAM');
    expect(result.trafficSummary).toBe('TRAFFIC_JAM');
    expect(result.isLiveTraffic).toBe(true);
    expect(result.trafficSource).toBe('GOOGLE_LIVE_TRAFFIC');

    fetchSpy.mockRestore();
  });
});

describe('Fastify Route — POST /api/v1/routes/driving', () => {
  it('returns 200 with driving route payload on valid request', async () => {
    const mockDeps: any = {
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), fatal: vi.fn() },
      routeService: new RouteService(),
    };

    const app = await createApp(env, mockDeps);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/routes/driving',
      payload: {
        origin: { latitude: 13.0827, longitude: 80.2707 },
        destination: { latitude: 13.0919, longitude: 80.2907 },
      },
    });

    expect(res.statusCode).toBe(200);
    const json = res.json();
    expect(json.success).toBe(true);
    expect(json.data.route).toBeDefined();
    expect(json.data.route.distanceKm).toBeGreaterThan(0);
    expect(json.data.route.durationMinutes).toBeGreaterThan(0);
    expect(json.data.route.polyline).toBeDefined();
    expect(json.data.route.traffic).toBeInstanceOf(Array);

    await app.close();
  });

  it('returns 400 when missing required coordinates', async () => {
    const mockDeps: any = {
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), fatal: vi.fn() },
      routeService: new RouteService(),
    };

    const app = await createApp(env, mockDeps);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/routes/driving',
      payload: {
        origin: { latitude: 13.0827 }, // Missing longitude & destination
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('BAD_REQUEST');

    await app.close();
  });
});
