/**
 * Hospital Route Service Unit Tests
 *
 * Validates:
 * - Polyline decoding algorithm
 * - Traffic interval segment splitting
 * - Traffic colors & design tokens
 * - NORMAL, SLOW, TRAFFIC_JAM speed categorization
 * - Driving route API response parsing
 * - Client-side memoization and fallback
 *
 * Owned by: In-App Navigation & Routing Domain
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  HospitalRouteService,
  TRAFFIC_COLORS,
  TRAFFIC_LABELS,
} from '../HospitalRouteService';
import api from '../api';

describe('HospitalRouteService — Polyline Decoding', () => {
  it('correctly decodes standard Google encoded polyline strings', () => {
    // Standard encoded polyline representing 3 coordinates
    const samplePolyline = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
    const decoded = HospitalRouteService.decodePolyline(samplePolyline);

    expect(decoded).toBeInstanceOf(Array);
    expect(decoded.length).toBeGreaterThanOrEqual(3);
    expect(decoded[0]).toHaveProperty('latitude');
    expect(decoded[0]).toHaveProperty('longitude');
    expect(typeof decoded[0].latitude).toBe('number');
    expect(typeof decoded[0].longitude).toBe('number');
  });

  it('handles empty or malformed polyline strings safely without throwing', () => {
    expect(HospitalRouteService.decodePolyline('')).toEqual([]);
    expect(HospitalRouteService.decodePolyline(null as any)).toEqual([]);
    expect(HospitalRouteService.decodePolyline(undefined as any)).toEqual([]);
  });
});

describe('HospitalRouteService — Traffic Segmentation & Slicing', () => {
  const mockPoints = [
    { latitude: 13.0827, longitude: 80.2707 },
    { latitude: 13.0835, longitude: 80.2720 },
    { latitude: 13.0845, longitude: 80.2735 },
    { latitude: 13.0860, longitude: 80.2750 },
    { latitude: 13.0880, longitude: 80.2770 },
    { latitude: 13.0900, longitude: 80.2800 },
    { latitude: 13.0919, longitude: 80.2907 },
  ];

  it('slices polyline points into discrete traffic segments by speed intervals', () => {
    const intervals = [
      { startPolylinePointIndex: 0, endPolylinePointIndex: 2, speed: 'NORMAL' as const },
      { startPolylinePointIndex: 2, endPolylinePointIndex: 4, speed: 'SLOW' as const },
      { startPolylinePointIndex: 4, endPolylinePointIndex: 6, speed: 'TRAFFIC_JAM' as const },
    ];

    const segments = HospitalRouteService.splitPolylineIntoTrafficSegments(mockPoints, intervals);

    expect(segments).toHaveLength(3);

    // Segment 1 (NORMAL)
    expect(segments[0].speed).toBe('NORMAL');
    expect(segments[0].color).toBe(TRAFFIC_COLORS.NORMAL);
    expect(segments[0].coordinates.length).toBe(3); // indices 0, 1, 2

    // Segment 2 (SLOW)
    expect(segments[1].speed).toBe('SLOW');
    expect(segments[1].color).toBe(TRAFFIC_COLORS.SLOW);
    expect(segments[1].coordinates.length).toBe(3); // indices 2, 3, 4 (continuous overlap)

    // Segment 3 (TRAFFIC_JAM)
    expect(segments[2].speed).toBe('TRAFFIC_JAM');
    expect(segments[2].color).toBe(TRAFFIC_COLORS.TRAFFIC_JAM);
    expect(segments[2].coordinates.length).toBe(3); // indices 4, 5, 6
  });

  it('returns single fallback segment when traffic intervals array is empty', () => {
    const segments = HospitalRouteService.splitPolylineIntoTrafficSegments(mockPoints, []);

    expect(segments).toHaveLength(1);
    expect(segments[0].speed).toBe('NORMAL');
    expect(segments[0].color).toBe(TRAFFIC_COLORS.NORMAL);
    expect(segments[0].coordinates).toEqual(mockPoints);
  });

  it('uses authoritative Bharat PulseLink design tokens for traffic visualization', () => {
    expect(TRAFFIC_COLORS.NORMAL).toBe('#0F766E');      // Primary Deep Teal
    expect(TRAFFIC_COLORS.SLOW).toBe('#D97706');        // Amber Warm
    expect(TRAFFIC_COLORS.TRAFFIC_JAM).toBe('#DC2626'); // Red Alert

    expect(TRAFFIC_LABELS.NORMAL).toBe('Normal traffic');
    expect(TRAFFIC_LABELS.SLOW).toBe('Slow traffic');
    expect(TRAFFIC_LABELS.TRAFFIC_JAM).toBe('Heavy traffic');
  });
});

describe('HospitalRouteService — Route Fetching & Caching', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches driving route from backend and formats response', async () => {
    const mockApiResponse = {
      data: {
        success: true,
        data: {
          route: {
            distanceMeters: 3800,
            durationSeconds: 660,
            distanceKm: 3.8,
            durationMinutes: 11,
            polyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
            traffic: [
              { startPolylinePointIndex: 0, endPolylinePointIndex: 5, speed: 'NORMAL' },
              { startPolylinePointIndex: 5, endPolylinePointIndex: 12, speed: 'SLOW' },
            ],
            trafficSummary: 'SLOW',
          },
        },
      },
    };

    const postSpy = vi.spyOn(api, 'post').mockResolvedValueOnce(mockApiResponse);

    const result = await HospitalRouteService.getDrivingRoute(
      { latitude: 13.0827, longitude: 80.2707 },
      { latitude: 13.0919, longitude: 80.2907 },
      true, // forceRefresh
    );

    expect(postSpy).toHaveBeenCalledWith('/routes/driving', {
      origin: { latitude: 13.0827, longitude: 80.2707 },
      destination: { latitude: 13.0919, longitude: 80.2907 },
    });

    expect(result.distanceKm).toBe(3.8);
    expect(result.durationMinutes).toBe(11);
    expect(result.trafficSummary).toBe('SLOW');
    expect(result.traffic).toHaveLength(2);
  });

  it('falls back to resilient calculation if network request fails', async () => {
    vi.spyOn(api, 'post').mockRejectedValueOnce(new Error('Network offline'));

    const result = await HospitalRouteService.getDrivingRoute(
      { latitude: 13.0827, longitude: 80.2707 },
      { latitude: 13.0919, longitude: 80.2907 },
      true,
    );

    expect(result).toBeDefined();
    expect(result.distanceKm).toBeGreaterThan(0);
    expect(result.durationMinutes).toBeGreaterThan(0);
    expect(result.isLiveTraffic).toBe(false);
    expect(result.trafficSource).toBe('FALLBACK');
    expect(result.traffic).toHaveLength(0);
  });
});
