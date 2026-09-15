/**
 * Route & Traffic Types
 *
 * Owned by: In-App Navigation & Routing Domain
 */

export type TrafficSpeed = 'NORMAL' | 'SLOW' | 'TRAFFIC_JAM';

export interface TrafficInterval {
  startPolylinePointIndex: number;
  endPolylinePointIndex: number;
  speed: TrafficSpeed;
}

export interface LatLngPoint {
  latitude: number;
  longitude: number;
}

export interface DrivingRouteRequest {
  origin: LatLngPoint;
  destination: LatLngPoint;
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

export interface DrivingRouteResponseDto {
  route: DrivingRouteResult;
}
