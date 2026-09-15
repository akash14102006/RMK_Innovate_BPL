/**
 * Bharat PulseLink — Hospital Map & Clustering Service (Prompt 44)
 *
 * Provides geospatial calculations, bounding box fitting,
 * grid/distance clustering for dense Indian hospital hubs,
 * coordinate validation, and safe native maps abstraction.
 */

import type { HospitalSummaryItem, GeoLocationState } from '../types/hospitals';
import type {
  MapRegion,
  HospitalMapMarkerData,
  HospitalMapCluster,
  MapItem,
} from '../types/map';

export class HospitalMapService {
  /**
   * Earth radius in kilometers for Haversine calculations.
   */
  private static EARTH_RADIUS_KM = 6371;

  /**
   * Validate if latitude and longitude are strictly valid real numbers.
   */
  public static isValidCoordinate(lat?: number, lon?: number): boolean {
    if (typeof lat !== 'number' || typeof lon !== 'number') return false;
    if (isNaN(lat) || isNaN(lon)) return false;
    return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
  }

  /**
   * Convert hospital summary items to clean, validated map markers.
   */
  public static normalizeHospitalMarkers(
    hospitals: HospitalSummaryItem[]
  ): HospitalMapMarkerData[] {
    const seenIds = new Set<string>();
    const markers: HospitalMapMarkerData[] = [];

    for (const hosp of hospitals) {
      if (!hosp.id || seenIds.has(hosp.id)) continue;
      seenIds.add(hosp.id);

      // Default fallback coordinates if missing
      const lat = hosp.latitude ?? 13.0827;
      const lon = hosp.longitude ?? 80.2707;

      if (!this.isValidCoordinate(lat, lon)) continue;

      markers.push({
        id: hosp.id,
        name: hosp.name,
        latitude: lat,
        longitude: lon,
        distanceKm: hosp.distanceKm,
        ownership: hosp.ownership,
        category: hosp.category,
        is24x7: hosp.is24x7,
        rating: hosp.rating,
        totalBeds: hosp.totalBeds,
        totalDoctors: hosp.totalDoctors,
        services: hosp.services || [],
        address: hosp.address,
        city: hosp.city,
        state: hosp.state,
        pincode: hosp.pincode,
        rawHospital: hosp,
      });
    }

    return markers;
  }

  /**
   * Calculate distance between two coordinates in Kilometers using Haversine formula.
   */
  public static calculateDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return this.EARTH_RADIUS_KM * c;
  }

  /**
   * Calculate optimal bounding MapRegion enclosing all hospital markers and user search center.
   */
  public static calculateBoundingRegion(
    hospitals: HospitalMapMarkerData[],
    centerLocation?: GeoLocationState,
    paddingRatio = 1.35
  ): MapRegion {
    const hasValidCenter =
      typeof centerLocation?.latitude === 'number' &&
      typeof centerLocation?.longitude === 'number' &&
      !isNaN(centerLocation.latitude) &&
      !isNaN(centerLocation.longitude);

    const defaultCenter = {
      latitude: hasValidCenter ? (centerLocation!.latitude as number) : 13.0827,
      longitude: hasValidCenter ? (centerLocation!.longitude as number) : 80.2707,
    };

    if (!hospitals || hospitals.length === 0) {
      return {
        latitude: defaultCenter.latitude,
        longitude: defaultCenter.longitude,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      };
    }

    let minLat = hasValidCenter ? (centerLocation!.latitude as number) : hospitals[0].latitude;
    let maxLat = hasValidCenter ? (centerLocation!.latitude as number) : hospitals[0].latitude;
    let minLon = hasValidCenter ? (centerLocation!.longitude as number) : hospitals[0].longitude;
    let maxLon = hasValidCenter ? (centerLocation!.longitude as number) : hospitals[0].longitude;

    for (const h of hospitals) {
      if (h.latitude < minLat) minLat = h.latitude;
      if (h.latitude > maxLat) maxLat = h.latitude;
      if (h.longitude < minLon) minLon = h.longitude;
      if (h.longitude > maxLon) maxLon = h.longitude;
    }

    const midLat = (minLat + maxLat) / 2;
    const midLon = (minLon + maxLon) / 2;

    const latDelta = Math.max((maxLat - minLat) * paddingRatio, 0.045);
    const lonDelta = Math.max((maxLon - minLon) * paddingRatio, 0.045);

    return {
      latitude: midLat,
      longitude: midLon,
      latitudeDelta: Math.min(latDelta, 1.5),
      longitudeDelta: Math.min(lonDelta, 1.5),
    };
  }

  /**
   * Cluster dense nearby hospital markers when zoomed out to prevent visual clutter.
   * Uses proximity threshold based on active map viewport latitudeDelta.
   */
  public static clusterHospitalMarkers(
    markers: HospitalMapMarkerData[],
    region: MapRegion
  ): MapItem[] {
    // If zoomed in close (latitudeDelta < 0.04), display individual markers
    if (region.latitudeDelta < 0.04 || markers.length <= 3) {
      return markers.map((m) => ({ type: 'MARKER', data: m }));
    }

    // Cluster distance threshold dynamically scaled by viewport zoom
    const clusterThresholdKm = Math.max(region.latitudeDelta * 18, 0.8);
    const clustered: MapItem[] = [];
    const visited = new Set<string>();

    for (let i = 0; i < markers.length; i++) {
      const current = markers[i];
      if (visited.has(current.id)) continue;

      const group: HospitalMapMarkerData[] = [current];
      visited.add(current.id);

      for (let j = i + 1; j < markers.length; j++) {
        const candidate = markers[j];
        if (visited.has(candidate.id)) continue;

        const dist = this.calculateDistanceKm(
          current.latitude,
          current.longitude,
          candidate.latitude,
          candidate.longitude
        );

        if (dist <= clusterThresholdKm) {
          group.push(candidate);
          visited.add(candidate.id);
        }
      }

      if (group.length === 1) {
        clustered.push({ type: 'MARKER', data: current });
      } else {
        // Compute cluster center of mass
        const avgLat =
          group.reduce((acc, curr) => acc + curr.latitude, 0) / group.length;
        const avgLon =
          group.reduce((acc, curr) => acc + curr.longitude, 0) / group.length;

        const clusterItem: HospitalMapCluster = {
          id: `cluster_${current.id}_${group.length}`,
          latitude: avgLat,
          longitude: avgLon,
          count: group.length,
          hospitalIds: group.map((g) => g.id),
          hospitals: group,
        };

        clustered.push({ type: 'CLUSTER', data: clusterItem });
      }
    }

    return clustered;
  }
}

export default HospitalMapService;
