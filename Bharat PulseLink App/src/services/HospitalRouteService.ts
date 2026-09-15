/**
 * Hospital Route Service — In-App Traffic-Aware Driving Navigation
 *
 * Implements:
 * - Client-side interface to POST /api/v1/routes/driving
 * - Polyline decoding & segment slicing by speedReadingIntervals
 * - Color-coded traffic segments using Bharat PulseLink design tokens
 * - Smart memoization / caching to eliminate redundant backend calls
 *
 * Owned by: In-App Navigation & Routing Domain
 */

import api from './api';
import type { HospitalSummaryItem } from '../types/hospitals';

export type TrafficSpeed = 'NORMAL' | 'SLOW' | 'TRAFFIC_JAM';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface TrafficInterval {
  startPolylinePointIndex: number;
  endPolylinePointIndex: number;
  speed: TrafficSpeed;
}

export interface DrivingRouteResult {
  distanceMeters: number;
  durationSeconds: number;
  distanceKm: number;
  durationMinutes: number;
  polyline: string;
  traffic: TrafficInterval[];
  trafficSummary: 'NORMAL' | 'SLOW' | 'TRAFFIC_JAM' | 'UNKNOWN';
  isLiveTraffic: boolean;
  trafficSource: 'GOOGLE_LIVE_TRAFFIC' | 'FALLBACK';
}

export interface RouteTrafficSegment {
  id: string;
  coordinates: LatLng[];
  speed: TrafficSpeed;
  color: string;
  strokeWidth: number;
}

// Bharat PulseLink Design Palette Tokens for Traffic
export const TRAFFIC_COLORS: Record<TrafficSpeed, string> = {
  NORMAL: '#0F766E',      // Primary Teal
  SLOW: '#D97706',        // Amber Warm
  TRAFFIC_JAM: '#DC2626', // Red Emergency Alert
};

export const TRAFFIC_LABELS: Record<TrafficSpeed, string> = {
  NORMAL: 'Normal traffic',
  SLOW: 'Slow traffic',
  TRAFFIC_JAM: 'Heavy traffic',
};

export function getTrafficDisplayInfo(route: DrivingRouteResult | null): {
  label: string;
  isLive: boolean;
  badgeText: string;
  bg: string;
  border: string;
  text: string;
  dot: string;
} {
  if (!route || !route.isLiveTraffic || route.trafficSummary === 'UNKNOWN') {
    return {
      label: 'Traffic data unavailable',
      isLive: false,
      badgeText: 'Traffic unavailable',
      bg: '#F1F5F9',
      border: '#E2E8F0',
      text: '#64748B',
      dot: '#94A3B8',
    };
  }
  if (route.trafficSummary === 'TRAFFIC_JAM') {
    return {
      label: 'Heavy traffic',
      isLive: true,
      badgeText: 'Live Google Traffic',
      bg: '#FEF2F2',
      border: '#FECACA',
      text: '#DC2626',
      dot: '#EF4444',
    };
  }
  if (route.trafficSummary === 'SLOW') {
    return {
      label: 'Slow traffic',
      isLive: true,
      badgeText: 'Live Google Traffic',
      bg: '#FFFBEB',
      border: '#FDE68A',
      text: '#D97706',
      dot: '#F59E0B',
    };
  }
  return {
    label: 'Normal traffic',
    isLive: true,
    badgeText: 'Live Google Traffic',
    bg: '#F0FDF4',
    border: '#BBF7D0',
    text: '#16A34A',
    dot: '#10B981',
  };
}

export class HospitalRouteService {
  private static _cache = new Map<string, { result: DrivingRouteResult; timestamp: number }>();
  private static _CACHE_TTL_MS = 60 * 1000; // 1 minute cache

  /**
   * Fetches driving route from backend with traffic-awareness
   */
  public static async getDrivingRoute(
    origin: LatLng,
    destination: LatLng,
    forceRefresh: boolean = false,
  ): Promise<DrivingRouteResult> {
    const cacheKey = `${origin.latitude.toFixed(3)},${origin.longitude.toFixed(3)}->${destination.latitude.toFixed(3)},${destination.longitude.toFixed(3)}`;

    if (!forceRefresh) {
      const cached = this._cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this._CACHE_TTL_MS) {
        return cached.result;
      }
    }

    try {
      const response = await api.post('/routes/driving', {
        origin: {
          latitude: origin.latitude,
          longitude: origin.longitude,
        },
        destination: {
          latitude: destination.latitude,
          longitude: destination.longitude,
        },
      });

      if (response.data?.success && response.data?.data?.route) {
        const result: DrivingRouteResult = response.data.data.route;
        this._cache.set(cacheKey, { result, timestamp: Date.now() });
        return result;
      }

      throw new Error('Invalid response structure from routing backend');
    } catch (error: any) {
      // If backend call fails, provide resilient client-side fallback
      console.warn('[HospitalRouteService] Backend route calculation failed, using fallback:', error?.message);
      return this._generateClientFallbackRoute(origin, destination);
    }
  }

  /**
   * Decodes Google Encoded Polyline into LatLng array
   */
  public static decodePolyline(encoded: string): LatLng[] {
    if (!encoded || typeof encoded !== 'string') return [];

    const points: LatLng[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let b: number;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({
        latitude: Number((lat * 1e-5).toFixed(6)),
        longitude: Number((lng * 1e-5).toFixed(6)),
      });
    }

    return points;
  }

  /**
   * Slices decoded polyline points into discrete traffic-colored segments
   */
  public static splitPolylineIntoTrafficSegments(
    points: LatLng[],
    trafficIntervals: TrafficInterval[],
  ): RouteTrafficSegment[] {
    if (!points || points.length === 0) return [];
    if (!trafficIntervals || trafficIntervals.length === 0) {
      // If no interval data, render entire polyline with default neutral route color
      return [
        {
          id: 'segment-0',
          coordinates: points,
          speed: 'NORMAL',
          color: '#0F766E',
          strokeWidth: 6,
        },
      ];
    }

    const segments: RouteTrafficSegment[] = [];

    for (let i = 0; i < trafficIntervals.length; i++) {
      const interval = trafficIntervals[i];
      const startIdx = Math.max(0, Math.min(interval.startPolylinePointIndex, points.length - 1));
      const endIdx = Math.max(startIdx, Math.min(interval.endPolylinePointIndex, points.length - 1));

      // Include end index (plus 1 for slice) to ensure continuity with adjacent segments
      const segmentPoints = points.slice(startIdx, endIdx + 1);

      if (segmentPoints.length >= 2) {
        segments.push({
          id: `segment-${i}-${interval.speed}`,
          coordinates: segmentPoints,
          speed: interval.speed,
          color: TRAFFIC_COLORS[interval.speed] || TRAFFIC_COLORS.NORMAL,
          strokeWidth: 5,
        });
      }
    }

    // If intervals did not produce valid segments, fallback to full line
    if (segments.length === 0) {
      segments.push({
        id: 'segment-fallback',
        coordinates: points,
        speed: 'NORMAL',
        color: TRAFFIC_COLORS.NORMAL,
        strokeWidth: 5,
      });
    }

    return segments;
  }

  /**
   * Client-side fallback route when offline or disconnected
   */
  private static _generateClientFallbackRoute(
    origin: LatLng,
    destination: LatLng,
  ): DrivingRouteResult {
    const directMeters = this._calculateHaversineDistance(origin, destination);
    const distanceMeters = Math.max(100, Math.round(directMeters * 1.28));
    const distanceKm = Math.round((distanceMeters / 1000) * 10) / 10;
    const durationSeconds = Math.max(60, Math.round(distanceMeters / 7.77));
    const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));

    // Generate intermediate curved coordinates
    const points: LatLng[] = [];
    const count = 16;
    const dLat = destination.latitude - origin.latitude;
    const dLng = destination.longitude - origin.longitude;
    const perpLat = -dLng * 0.1;
    const perpLng = dLat * 0.1;

    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const curve = Math.sin(t * Math.PI);
      points.push({
        latitude: origin.latitude + dLat * t + perpLat * curve,
        longitude: origin.longitude + dLng * t + perpLng * curve,
      });
    }

    return {
      distanceMeters,
      durationSeconds,
      distanceKm,
      durationMinutes,
      polyline: '', // Can use raw points
      traffic: [],
      trafficSummary: 'UNKNOWN',
      isLiveTraffic: false,
      trafficSource: 'FALLBACK',
    };
  }

  private static _calculateHaversineDistance(p1: LatLng, p2: LatLng): number {
    const R = 6371000;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(p2.latitude - p1.latitude);
    const dLng = toRad(p2.longitude - p1.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(p1.latitude)) *
        Math.cos(toRad(p2.latitude)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
