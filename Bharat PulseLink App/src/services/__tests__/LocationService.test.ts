import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocationService, COMPREHENSIVE_INDIAN_LOCATIONS } from '../LocationService';

vi.mock('../secureStore', () => {
  const store = new Map<string, string>();
  return {
    set: vi.fn(async (k: string, v: string) => {
      store.set(k, v);
    }),
    get: vi.fn(async (k: string) => store.get(k) || null),
    remove: vi.fn(async (k: string) => {
      store.delete(k);
    }),
    default: {
      set: vi.fn(async (k: string, v: string) => {
        store.set(k, v);
      }),
      get: vi.fn(async (k: string) => store.get(k) || null),
      remove: vi.fn(async (k: string) => {
        store.delete(k);
      }),
    },
  };
});

const mockExpoLocation = {
  PermissionStatus: {
    GRANTED: 'granted',
    DENIED: 'denied',
    UNDETERMINED: 'undetermined',
  },
  Accuracy: {
    Balanced: 3,
    Highest: 5,
  },
  getForegroundPermissionsAsync: vi.fn(),
  requestForegroundPermissionsAsync: vi.fn(),
  hasServicesEnabledAsync: vi.fn(),
  getCurrentPositionAsync: vi.fn(),
  reverseGeocodeAsync: vi.fn(),
};

describe('Prompt 43 — LocationService & State Machine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    LocationService.setLocationModule(mockExpoLocation);
  });

  describe('Permission Lifecycle & Status Checks', () => {
    it('returns GRANTED when foreground permission is already approved', async () => {
      mockExpoLocation.getForegroundPermissionsAsync.mockResolvedValueOnce({
        status: 'granted',
        granted: true,
        canAskAgain: true,
        expires: 'never',
      });

      const status = await LocationService.getPermissionStatus();
      expect(status).toBe('GRANTED');
    });

    it('returns DENIED when permission is denied but can ask again', async () => {
      mockExpoLocation.getForegroundPermissionsAsync.mockResolvedValueOnce({
        status: 'denied',
        granted: false,
        canAskAgain: true,
        expires: 'never',
      });

      const status = await LocationService.getPermissionStatus();
      expect(status).toBe('DENIED');
    });

    it('returns SETTINGS_REQUIRED when permission is permanently denied (canAskAgain = false)', async () => {
      mockExpoLocation.getForegroundPermissionsAsync.mockResolvedValueOnce({
        status: 'denied',
        granted: false,
        canAskAgain: false,
        expires: 'never',
      });

      const status = await LocationService.getPermissionStatus();
      expect(status).toBe('SETTINGS_REQUIRED');
    });
  });

  describe('Device Location & Reverse Geocoding', () => {
    it('fetches one-shot foreground GPS coordinates with version tracking', async () => {
      mockExpoLocation.hasServicesEnabledAsync.mockResolvedValueOnce(true);
      mockExpoLocation.getCurrentPositionAsync.mockResolvedValueOnce({
        coords: {
          latitude: 13.0827,
          longitude: 80.2707,
          altitude: 10,
          accuracy: 15,
          altitudeAccuracy: 5,
          heading: 0,
          speed: 0,
        },
        timestamp: Date.now(),
      });

      const { location, version } = await LocationService.getCurrentDevicePosition({ timeoutMs: 3000 });
      expect(location.latitude).toBeCloseTo(13.0827);
      expect(location.longitude).toBeCloseTo(80.2707);
      expect(location.isApproximate).toBe(false);
      expect(version).toBeGreaterThan(0);
    });

    it('throws SERVICES_DISABLED when location hardware/switch is off', async () => {
      mockExpoLocation.hasServicesEnabledAsync.mockResolvedValueOnce(false);

      await expect(
        LocationService.getCurrentDevicePosition({ timeoutMs: 1000 })
      ).rejects.toThrow('SERVICES_DISABLED');
    });

    it('reverse geocodes coordinates to human-readable Indian location', async () => {
      mockExpoLocation.reverseGeocodeAsync.mockResolvedValueOnce([
        {
          city: 'Chennai',
          subregion: 'Chennai',
          district: 'Chennai',
          region: 'Tamil Nadu',
          postalCode: '600003',
          street: 'EVR Periyar Salai',
          name: 'Park Town',
          country: 'India',
          isoCountryCode: 'IN',
        },
      ]);

      const geo = await LocationService.reverseGeocode({ latitude: 13.0827, longitude: 80.2707 });
      expect(geo.city).toBe('Chennai');
      expect(geo.state).toBe('Tamil Nadu');
      expect(geo.pincode).toBe('600003');
      expect(geo.isGps).toBe(true);
    });
  });

  describe('Manual Indian Location Search & Fallbacks', () => {
    it('searches locations by city name (e.g. Bengaluru)', () => {
      const results = LocationService.searchManualLocations('Bengaluru', 5);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].city).toBe('Bengaluru');
      expect(results[0].state).toBe('Karnataka');
    });

    it('searches locations by pincode (e.g. 600003)', () => {
      const results = LocationService.searchManualLocations('600003', 5);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].pincode).toBe('600003');
      expect(results[0].city).toBe('Chennai');
    });

    it('searches locations by locality or hospital hub (e.g. AIIMS / Ansari Nagar)', () => {
      const results = LocationService.searchManualLocations('Ansari Nagar', 5);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('Ansari Nagar');
      expect(results[0].city).toBe('New Delhi');
    });

    it('searches locations by district (e.g. Gautam Buddha Nagar / Noida)', () => {
      const results = LocationService.searchManualLocations('Noida', 5);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].city).toBe('Noida');
      expect(results[0].state).toBe('Uttar Pradesh');
    });
  });

  describe('Location Persistence & Stale GPS Protection', () => {
    it('persists and restores selected search location', async () => {
      const loc = {
        label: 'Park Town, Chennai',
        isGps: false,
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600003',
        latitude: 13.0827,
        longitude: 80.2707,
      };

      await LocationService.saveSelectedLocation(loc);
      const retrieved = await LocationService.getSelectedLocation();
      expect(retrieved).toBeDefined();
      expect(retrieved?.city).toBe('Chennai');
      expect(retrieved?.pincode).toBe('600003');
    });

    it('invalidates pending GPS response when manual selection is made', () => {
      const initialVer = LocationService.invalidatePendingGps();
      expect(LocationService.isResponseStale(initialVer - 1)).toBe(true);
      expect(LocationService.isResponseStale(initialVer)).toBe(false);
    });
  });
});
