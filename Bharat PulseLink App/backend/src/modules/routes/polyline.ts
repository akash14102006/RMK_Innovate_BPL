/**
 * Polyline Encoding & Decoding Utilities
 *
 * Implements the standard Google Encoded Polyline algorithm (5 decimal precision).
 * Owned by: In-App Navigation & Routing Domain
 */

import type { LatLngPoint } from './types.js';

/**
 * Decodes a Google-encoded polyline string into an array of { latitude, longitude } points.
 */
export function decodePolyline(encoded: string): LatLngPoint[] {
  if (!encoded || typeof encoded !== 'string') return [];

  const points: LatLngPoint[] = [];
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
 * Encodes an array of { latitude, longitude } points into a Google-encoded polyline string.
 */
export function encodePolyline(points: LatLngPoint[]): string {
  if (!points || points.length === 0) return '';

  let encoded = '';
  let prevLat = 0;
  let prevLng = 0;

  for (const point of points) {
    const lat = Math.round(point.latitude * 1e5);
    const lng = Math.round(point.longitude * 1e5);

    encoded += encodeSignedNumber(lat - prevLat);
    encoded += encodeSignedNumber(lng - prevLng);

    prevLat = lat;
    prevLng = lng;
  }

  return encoded;
}

function encodeSignedNumber(num: number): string {
  let sgnNum = num < 0 ? ~(num << 1) : num << 1;
  let result = '';
  while (sgnNum >= 0x20) {
    result += String.fromCharCode((0x20 | (sgnNum & 0x1f)) + 63);
    sgnNum >>= 5;
  }
  result += String.fromCharCode(sgnNum + 63);
  return result;
}
