import { describe, it, expect, vi, beforeEach } from 'vitest';
import HospitalMapService from '../HospitalMapService';
import { NATIONAL_HOSPITALS_DIRECTORY } from '../HospitalDiscoveryService';
import type { HospitalMapMarkerData, MapRegion } from '../../types/map';

vi.mock('../secureStore', () => ({
  default: {
    set: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    remove: vi.fn().mockResolvedValue(undefined),
  },
  set: vi.fn().mockResolvedValue(undefined),
  get: vi.fn().mockResolvedValue(null),
  remove: vi.fn().mockResolvedValue(undefined),
}));

describe('Prompt 44 — HospitalMapService & Geospatial Clustering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Coordinate Validation', () => {
    it('validates correct latitude and longitude ranges', () => {
      expect(HospitalMapService.isValidCoordinate(13.0827, 80.2707)).toBe(true);
      expect(HospitalMapService.isValidCoordinate(28.6139, 77.209)).toBe(true);
      expect(HospitalMapService.isValidCoordinate(-33.8688, 151.2093)).toBe(true);
    });

    it('rejects invalid or NaN or out-of-range coordinates', () => {
      expect(HospitalMapService.isValidCoordinate(95, 80.27)).toBe(false);
      expect(HospitalMapService.isValidCoordinate(13.08, 190)).toBe(false);
      expect(HospitalMapService.isValidCoordinate(NaN, 80.27)).toBe(false);
      expect(HospitalMapService.isValidCoordinate(undefined, 80.27)).toBe(false);
    });
  });

  describe('Marker Normalization & Deduplication', () => {
    it('normalizes hospitals into clean map markers and ignores duplicate IDs', () => {
      const sample = [
        ...NATIONAL_HOSPITALS_DIRECTORY,
        NATIONAL_HOSPITALS_DIRECTORY[0], // duplicate item
      ];

      const markers = HospitalMapService.normalizeHospitalMarkers(sample);
      expect(markers.length).toBe(NATIONAL_HOSPITALS_DIRECTORY.length);

      const first = markers[0];
      expect(first.id).toBe('hosp_chennai_01');
      expect(first.latitude).toBeCloseTo(13.0818);
      expect(first.longitude).toBeCloseTo(80.2785);
      expect(first.is24x7).toBe(true);
    });
  });

  describe('Haversine Distance Calculation', () => {
    it('calculates distance between Chennai Central and AIIMS Delhi correctly (~1760 km)', () => {
      const distance = HospitalMapService.calculateDistanceKm(
        13.0827,
        80.2707,
        28.5672,
        77.21
      );

      expect(distance).toBeGreaterThan(1700);
      expect(distance).toBeLessThan(1800);
    });

    it('calculates short intra-city distance in Chennai (~2-4 km)', () => {
      const distance = HospitalMapService.calculateDistanceKm(
        13.0818,
        80.2785, // Rajiv Gandhi Govt Hospital
        13.0583,
        80.2505 // Apollo Greams Road
      );

      expect(distance).toBeGreaterThan(2);
      expect(distance).toBeLessThan(5);
    });
  });

  describe('Bounding Region Calculation', () => {
    it('calculates enclosing bounding region for multiple hospital markers', () => {
      const markers = HospitalMapService.normalizeHospitalMarkers(
        NATIONAL_HOSPITALS_DIRECTORY.slice(0, 4) // 4 Chennai hospitals
      );

      const region = HospitalMapService.calculateBoundingRegion(markers, {
        label: 'Chennai, Tamil Nadu',
        isGps: false,
        city: 'Chennai',
        state: 'Tamil Nadu',
        latitude: 13.0827,
        longitude: 80.2707,
      });

      expect(region.latitude).toBeCloseTo(13.04, 1);
      expect(region.longitude).toBeCloseTo(80.25, 1);
      expect(region.latitudeDelta).toBeGreaterThan(0.04);
      expect(region.longitudeDelta).toBeGreaterThan(0.04);
    });

    it('returns sensible default bounding region when marker list is empty', () => {
      const region = HospitalMapService.calculateBoundingRegion([], {
        label: 'Bengaluru, Karnataka',
        isGps: false,
        city: 'Bengaluru',
        state: 'Karnataka',
        latitude: 12.9716,
        longitude: 77.5946,
      });

      expect(region.latitude).toBeCloseTo(12.9716);
      expect(region.longitude).toBeCloseTo(77.5946);
    });
  });

  describe('Marker Clustering', () => {
    it('clusters dense nearby markers when viewport is zoomed out (wide delta)', () => {
      const markers = HospitalMapService.normalizeHospitalMarkers(
        NATIONAL_HOSPITALS_DIRECTORY.slice(0, 4)
      );

      const wideRegion: MapRegion = {
        latitude: 13.05,
        longitude: 80.25,
        latitudeDelta: 0.15,
        longitudeDelta: 0.15,
      };

      const clustered = HospitalMapService.clusterHospitalMarkers(markers, wideRegion);
      expect(clustered.length).toBeLessThan(markers.length);

      const hasCluster = clustered.some((c) => c.type === 'CLUSTER');
      expect(hasCluster).toBe(true);
    });

    it('displays individual markers without clustering when zoomed in close', () => {
      const markers = HospitalMapService.normalizeHospitalMarkers(
        NATIONAL_HOSPITALS_DIRECTORY.slice(0, 4)
      );

      const closeRegion: MapRegion = {
        latitude: 13.0583,
        longitude: 80.2505,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };

      const items = HospitalMapService.clusterHospitalMarkers(markers, closeRegion);
      expect(items.length).toBe(markers.length);
      items.forEach((item) => {
        expect(item.type).toBe('MARKER');
      });
    });
  });
});
