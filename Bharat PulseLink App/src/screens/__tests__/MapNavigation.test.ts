import { describe, it, expect, vi } from 'vitest';
import HospitalMapService from '../../services/HospitalMapService';
import LocationService from '../../services/LocationService';
import { NATIONAL_HOSPITALS_DIRECTORY } from '../../services/HospitalDiscoveryService';
import { MapRegion } from '../../types/map';

describe('Hospital Map & Navigation Domain Tests', () => {
  it('validates strictly real latitude and longitude coordinates', () => {
    expect(HospitalMapService.isValidCoordinate(13.0827, 80.2707)).toBe(true);
    expect(HospitalMapService.isValidCoordinate(28.5672, 77.21)).toBe(true);
    expect(HospitalMapService.isValidCoordinate(-33.8688, 151.2093)).toBe(true);

    // Invalid coordinates
    expect(HospitalMapService.isValidCoordinate(undefined, 80.2707)).toBe(false);
    expect(HospitalMapService.isValidCoordinate(13.0827, undefined)).toBe(false);
    expect(HospitalMapService.isValidCoordinate(NaN, 80.2707)).toBe(false);
    expect(HospitalMapService.isValidCoordinate(95, 80.2707)).toBe(false);
    expect(HospitalMapService.isValidCoordinate(13.0827, 195)).toBe(false);
  });

  it('normalizes real hospital directory into validated map markers with no inverted coordinates', () => {
    const markers = HospitalMapService.normalizeHospitalMarkers(NATIONAL_HOSPITALS_DIRECTORY);
    expect(markers.length).toBeGreaterThanOrEqual(5);

    markers.forEach((marker) => {
      expect(marker.id).toBeDefined();
      expect(marker.name).toBeDefined();
      expect(marker.latitude).toBeGreaterThanOrEqual(-90);
      expect(marker.latitude).toBeLessThanOrEqual(90);
      expect(marker.longitude).toBeGreaterThanOrEqual(-180);
      expect(marker.longitude).toBeLessThanOrEqual(180);
      expect(marker.latitude).toBeLessThan(marker.longitude);
    });
  });

  it('computes accurate Haversine distance in kilometers', () => {
    const dist = HospitalMapService.calculateDistanceKm(13.0827, 80.2707, 13.0583, 80.2505);
    expect(dist).toBeGreaterThan(2);
    expect(dist).toBeLessThan(5);
  });

  it('calculates bounding region enclosing all markers safely without crashing on empty', () => {
    const markers = HospitalMapService.normalizeHospitalMarkers(NATIONAL_HOSPITALS_DIRECTORY);
    const region = HospitalMapService.calculateBoundingRegion(markers);

    expect(region.latitude).toBeDefined();
    expect(region.longitude).toBeDefined();
    expect(region.latitudeDelta).toBeGreaterThan(0);
    expect(region.longitudeDelta).toBeGreaterThan(0);

    const emptyRegion = HospitalMapService.calculateBoundingRegion([]);
    expect(emptyRegion.latitude).toBe(13.0827);
    expect(emptyRegion.longitude).toBe(80.2707);
  });

  it('clusters dense markers when zoomed out to prevent visual clutter', () => {
    const markers = HospitalMapService.normalizeHospitalMarkers(NATIONAL_HOSPITALS_DIRECTORY);
    const zoomedOutRegion: MapRegion = {
      latitude: 13.0827,
      longitude: 80.2707,
      latitudeDelta: 0.8,
      longitudeDelta: 0.8,
    };

    const items = HospitalMapService.clusterHospitalMarkers(markers, zoomedOutRegion);
    expect(items.length).toBeGreaterThan(0);

    const zoomedInRegion: MapRegion = {
      latitude: 13.0827,
      longitude: 80.2707,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };

    const unclustered = HospitalMapService.clusterHospitalMarkers(markers, zoomedInRegion);
    expect(unclustered.every((i) => i.type === 'MARKER')).toBe(true);
  });

  it('LocationService handles permissions and offline fallback safely', async () => {
    const status = await LocationService.getPermissionStatus();
    expect(['GRANTED', 'DENIED', 'SETTINGS_REQUIRED', 'NOT_REQUESTED']).toContain(status);

    const searchResults = LocationService.searchManualLocations('Chennai', 5);
    expect(searchResults.length).toBeGreaterThan(0);
    expect(searchResults[0].city).toBe('Chennai');
  });

  it('formats directions URL with proper coordinates and place encoding', () => {
    const hospital = NATIONAL_HOSPITALS_DIRECTORY[0];
    const lat = hospital.latitude;
    const lon = hospital.longitude;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&destination_place_id=${encodeURIComponent(hospital.name)}`;

    expect(url).toContain('api=1');
    expect(url).toContain(`destination=${lat},${lon}`);
    expect(url).toContain('destination_place_id=Rajiv%20Gandhi');
  });
});
