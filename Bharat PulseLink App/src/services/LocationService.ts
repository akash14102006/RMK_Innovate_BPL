/**
 * Bharat PulseLink — Location Service & Permission Manager
 *
 * Single reusable domain abstraction for:
 * 1. Permission checks & requests (with settings recovery)
 * 2. Device location discovery (one-shot foreground only, timeout & accuracy protection)
 * 3. Reverse geocoding for Indian geographic hierarchy
 * 4. Comprehensive offline Indian manual location search (State, District, City, Locality, Pincode)
 * 5. Privacy-safe handoff to HospitalDiscoveryService
 */

import {
  LocationPermissionStatus,
  LocationAvailabilityStatus,
  LocationFlowState,
  DeviceLocation,
  ManualLocationItem,
  LocationRequestOptions,
} from '../types/location';
import { GeoLocationState } from '../types/hospitals';
import SecureStoreService from './secureStore';

let LinkingModule: any = null;
try {
  LinkingModule = require('react-native').Linking;
} catch {}

let ExpoLocationModule: any = null;
try {
  ExpoLocationModule = require('expo-location');
} catch {
  // In test environment, mocked via setLocationModule
}

export const COMPREHENSIVE_INDIAN_LOCATIONS: ManualLocationItem[] = [
  // ── TAMIL NADU ──
  {
    id: 'in_tn_chn_01',
    name: 'Park Town',
    locality: 'Park Town / Central',
    city: 'Chennai',
    district: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600003',
    latitude: 13.0827,
    longitude: 80.2707,
    displayName: 'Park Town, Chennai, Tamil Nadu - 600003',
  },
  {
    id: 'in_tn_chn_02',
    name: 'Thousand Lights',
    locality: 'Greams Road / Thousand Lights',
    city: 'Chennai',
    district: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600006',
    latitude: 13.0569,
    longitude: 80.2525,
    displayName: 'Thousand Lights (Greams Rd), Chennai, Tamil Nadu - 600006',
  },
  {
    id: 'in_tn_chn_03',
    name: 'Kilpauk',
    locality: 'Kilpauk / Medical College',
    city: 'Chennai',
    district: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600010',
    latitude: 13.0784,
    longitude: 80.2412,
    displayName: 'Kilpauk, Chennai, Tamil Nadu - 600010',
  },
  {
    id: 'in_tn_chn_04',
    name: 'Adyar',
    locality: 'Gandhi Nagar / Adyar',
    city: 'Chennai',
    district: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600020',
    latitude: 13.0012,
    longitude: 80.2565,
    displayName: 'Adyar, Chennai, Tamil Nadu - 600020',
  },
  {
    id: 'in_tn_chn_05',
    name: 'Anna Nagar',
    locality: 'Anna Nagar West / East',
    city: 'Chennai',
    district: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600040',
    latitude: 13.085,
    longitude: 80.2101,
    displayName: 'Anna Nagar, Chennai, Tamil Nadu - 600040',
  },
  {
    id: 'in_tn_chn_06',
    name: 'T Nagar',
    locality: 'Thyagaraya Nagar',
    city: 'Chennai',
    district: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600017',
    latitude: 13.0418,
    longitude: 80.2341,
    displayName: 'T. Nagar, Chennai, Tamil Nadu - 600017',
  },
  {
    id: 'in_tn_cbe_01',
    name: 'Gandhipuram',
    locality: 'Gandhipuram / RS Puram',
    city: 'Coimbatore',
    district: 'Coimbatore',
    state: 'Tamil Nadu',
    pincode: '641012',
    latitude: 11.0168,
    longitude: 76.9558,
    displayName: 'Gandhipuram, Coimbatore, Tamil Nadu - 641012',
  },
  {
    id: 'in_tn_mdu_01',
    name: 'Madurai Main',
    locality: 'Goripalayam / Anna Nagar',
    city: 'Madurai',
    district: 'Madurai',
    state: 'Tamil Nadu',
    pincode: '625020',
    latitude: 9.9252,
    longitude: 78.1198,
    displayName: 'Goripalayam, Madurai, Tamil Nadu - 625020',
  },
  {
    id: 'in_tn_try_01',
    name: 'Thillai Nagar',
    locality: 'Thillai Nagar',
    city: 'Tiruchirappalli',
    district: 'Tiruchirappalli',
    state: 'Tamil Nadu',
    pincode: '620018',
    latitude: 10.8269,
    longitude: 78.6856,
    displayName: 'Thillai Nagar, Tiruchirappalli, Tamil Nadu - 620018',
  },
  {
    id: 'in_tn_slm_01',
    name: 'Fairlands',
    locality: 'Fairlands / Alagapuram',
    city: 'Salem',
    district: 'Salem',
    state: 'Tamil Nadu',
    pincode: '636016',
    latitude: 11.6643,
    longitude: 78.146,
    displayName: 'Fairlands, Salem, Tamil Nadu - 636016',
  },

  // ── KARNATAKA ──
  {
    id: 'in_ka_blr_01',
    name: 'Kalasipalya',
    locality: 'City Market / Fort Road',
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    pincode: '560002',
    latitude: 12.9634,
    longitude: 77.577,
    displayName: 'Kalasipalya (Victoria Hospital Area), Bengaluru, Karnataka - 560002',
  },
  {
    id: 'in_ka_blr_02',
    name: 'Koramangala',
    locality: 'Koramangala 4th Block',
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    pincode: '560034',
    latitude: 12.9352,
    longitude: 77.6245,
    displayName: 'Koramangala, Bengaluru, Karnataka - 560034',
  },
  {
    id: 'in_ka_blr_03',
    name: 'Indiranagar',
    locality: '100ft Road / CMH Road',
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    pincode: '560038',
    latitude: 12.9784,
    longitude: 77.6408,
    displayName: 'Indiranagar, Bengaluru, Karnataka - 560038',
  },
  {
    id: 'in_ka_blr_04',
    name: 'Whitefield',
    locality: 'ITPL Main Road',
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    pincode: '560066',
    latitude: 12.9698,
    longitude: 77.7499,
    displayName: 'Whitefield, Bengaluru, Karnataka - 560066',
  },
  {
    id: 'in_ka_mys_01',
    name: 'Saraswathipuram',
    locality: 'Saraswathipuram / Kuvempunagar',
    city: 'Mysuru',
    district: 'Mysuru',
    state: 'Karnataka',
    pincode: '570009',
    latitude: 12.3051,
    longitude: 76.6346,
    displayName: 'Saraswathipuram, Mysuru, Karnataka - 570009',
  },

  // ── DELHI NCR ──
  {
    id: 'in_dl_del_01',
    name: 'Ansari Nagar',
    locality: 'AIIMS / Sri Aurobindo Marg',
    city: 'New Delhi',
    district: 'South Delhi',
    state: 'Delhi',
    pincode: '110029',
    latitude: 28.5672,
    longitude: 77.21,
    displayName: 'Ansari Nagar (AIIMS Area), New Delhi, Delhi - 110029',
  },
  {
    id: 'in_dl_del_02',
    name: 'Connaught Place',
    locality: 'Barakhamba / Rajiv Chowk',
    city: 'New Delhi',
    district: 'Central Delhi',
    state: 'Delhi',
    pincode: '110001',
    latitude: 28.6315,
    longitude: 77.2167,
    displayName: 'Connaught Place, New Delhi, Delhi - 110001',
  },
  {
    id: 'in_dl_del_03',
    name: 'Hauz Khas',
    locality: 'Hauz Khas Enclave / Green Park',
    city: 'New Delhi',
    district: 'South Delhi',
    state: 'Delhi',
    pincode: '110016',
    latitude: 28.5494,
    longitude: 77.2001,
    displayName: 'Hauz Khas, New Delhi, Delhi - 110016',
  },
  {
    id: 'in_dl_del_04',
    name: 'Dwarka',
    locality: 'Sector 6 / Sector 12',
    city: 'New Delhi',
    district: 'South West Delhi',
    state: 'Delhi',
    pincode: '110075',
    latitude: 28.5921,
    longitude: 77.046,
    displayName: 'Dwarka, New Delhi, Delhi - 110075',
  },
  {
    id: 'in_hr_ggn_01',
    name: 'DLF Cyber City',
    locality: 'Sector 24 / Cyber Hub',
    city: 'Gurugram',
    district: 'Gurugram',
    state: 'Haryana',
    pincode: '122002',
    latitude: 28.495,
    longitude: 77.0895,
    displayName: 'DLF Phase 2 / Cyber City, Gurugram, Haryana - 122002',
  },
  {
    id: 'in_up_noi_01',
    name: 'Sector 18',
    locality: 'Sector 18 / Atta Market',
    city: 'Noida',
    district: 'Gautam Buddha Nagar',
    state: 'Uttar Pradesh',
    pincode: '201301',
    latitude: 28.5708,
    longitude: 77.3271,
    displayName: 'Sector 18, Noida, Uttar Pradesh - 201301',
  },

  // ── MAHARASHTRA ──
  {
    id: 'in_mh_mum_01',
    name: 'Parel',
    locality: 'Acharya Donde Marg / KEM Area',
    city: 'Mumbai',
    district: 'Mumbai City',
    state: 'Maharashtra',
    pincode: '400012',
    latitude: 18.9953,
    longitude: 72.8402,
    displayName: 'Parel (KEM Area), Mumbai, Maharashtra - 400012',
  },
  {
    id: 'in_mh_mum_02',
    name: 'Bandra West',
    locality: 'Linking Road / Hill Road',
    city: 'Mumbai',
    district: 'Mumbai Suburban',
    state: 'Maharashtra',
    pincode: '400050',
    latitude: 19.0596,
    longitude: 72.8295,
    displayName: 'Bandra West, Mumbai, Maharashtra - 400050',
  },
  {
    id: 'in_mh_mum_03',
    name: 'Andheri East',
    locality: 'Chakala / MIDC',
    city: 'Mumbai',
    district: 'Mumbai Suburban',
    state: 'Maharashtra',
    pincode: '400069',
    latitude: 19.1136,
    longitude: 72.8697,
    displayName: 'Andheri East, Mumbai, Maharashtra - 400069',
  },
  {
    id: 'in_mh_pun_01',
    name: 'Shivajinagar',
    locality: 'FC Road / JM Road',
    city: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    pincode: '411005',
    latitude: 18.5308,
    longitude: 73.8475,
    displayName: 'Shivajinagar, Pune, Maharashtra - 411005',
  },
  {
    id: 'in_mh_nag_01',
    name: 'Dharampeth',
    locality: 'Dharampeth / Ramdaspeth',
    city: 'Nagpur',
    district: 'Nagpur',
    state: 'Maharashtra',
    pincode: '440010',
    latitude: 21.1458,
    longitude: 79.0645,
    displayName: 'Dharampeth, Nagpur, Maharashtra - 440010',
  },

  // ── TELANGANA & ANDHRA PRADESH ──
  {
    id: 'in_ts_hyd_01',
    name: 'Banjara Hills',
    locality: 'Road No. 1 / 12',
    city: 'Hyderabad',
    district: 'Hyderabad',
    state: 'Telangana',
    pincode: '500034',
    latitude: 17.4156,
    longitude: 78.4357,
    displayName: 'Banjara Hills, Hyderabad, Telangana - 500034',
  },
  {
    id: 'in_ts_hyd_02',
    name: 'Gachibowli',
    locality: 'Financial District / Hitec City',
    city: 'Hyderabad',
    district: 'Rangareddy',
    state: 'Telangana',
    pincode: '500032',
    latitude: 17.44,
    longitude: 78.3489,
    displayName: 'Gachibowli, Hyderabad, Telangana - 500032',
  },
  {
    id: 'in_ap_vzg_01',
    name: 'Siripuram',
    locality: 'Siripuram / MVP Colony',
    city: 'Visakhapatnam',
    district: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    pincode: '530003',
    latitude: 17.7215,
    longitude: 83.3142,
    displayName: 'Siripuram, Visakhapatnam, Andhra Pradesh - 530003',
  },

  // ── KERALA ──
  {
    id: 'in_kl_tvm_01',
    name: 'Medical College Area',
    locality: 'Ulloor / Medical College',
    city: 'Thiruvananthapuram',
    district: 'Thiruvananthapuram',
    state: 'Kerala',
    pincode: '695011',
    latitude: 8.5241,
    longitude: 76.9366,
    displayName: 'Medical College, Thiruvananthapuram, Kerala - 695011',
  },
  {
    id: 'in_kl_koc_01',
    name: 'MG Road',
    locality: 'Kadavanthra / Panampilly Nagar',
    city: 'Kochi',
    district: 'Ernakulam',
    state: 'Kerala',
    pincode: '682016',
    latitude: 9.9674,
    longitude: 76.2999,
    displayName: 'Panampilly Nagar, Kochi, Kerala - 682016',
  },

  // ── WEST BENGAL ──
  {
    id: 'in_wb_kol_01',
    name: 'Park Street',
    locality: 'Park Street / Camac Street',
    city: 'Kolkata',
    district: 'Kolkata',
    state: 'West Bengal',
    pincode: '700016',
    latitude: 22.5516,
    longitude: 88.3524,
    displayName: 'Park Street, Kolkata, West Bengal - 700016',
  },
  {
    id: 'in_wb_kol_02',
    name: 'Salt Lake',
    locality: 'Sector V / Karunamoyee',
    city: 'Kolkata',
    district: 'North 24 Parganas',
    state: 'West Bengal',
    pincode: '700091',
    latitude: 22.5804,
    longitude: 88.428,
    displayName: 'Salt Lake (Sector V), Kolkata, West Bengal - 700091',
  },

  // ── GUJARAT ──
  {
    id: 'in_gj_ahm_01',
    name: 'Navrangpura',
    locality: 'Navrangpura / CG Road',
    city: 'Ahmedabad',
    district: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380009',
    latitude: 23.0365,
    longitude: 72.5611,
    displayName: 'Navrangpura, Ahmedabad, Gujarat - 380009',
  },

  // ── UTTAR PRADESH ──
  {
    id: 'in_up_lko_01',
    name: 'Hazratganj',
    locality: 'Hazratganj / Gomti Nagar',
    city: 'Lucknow',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    pincode: '226001',
    latitude: 26.8467,
    longitude: 80.9462,
    displayName: 'Hazratganj, Lucknow, Uttar Pradesh - 226001',
  },

  // ── RAJASTHAN ──
  {
    id: 'in_rj_jai_01',
    name: 'C-Scheme',
    locality: 'C-Scheme / Malviya Nagar',
    city: 'Jaipur',
    district: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302001',
    latitude: 26.9124,
    longitude: 75.7873,
    displayName: 'C-Scheme, Jaipur, Rajasthan - 302001',
  },
];

export class LocationService {
  private static STORAGE_KEY_SELECTED = 'bharat_selected_location';
  private static activeLocationVersion = 0;

  public static setLocationModule(mod: any): void {
    ExpoLocationModule = mod;
  }

  /**
   * Get the current permission status without prompting the OS dialog.
   */
  public static async getPermissionStatus(): Promise<LocationPermissionStatus> {
    try {
      if (!ExpoLocationModule) return 'DENIED';
      const response = await ExpoLocationModule.getForegroundPermissionsAsync();
      if (response.status === 'granted' || response.status === ExpoLocationModule?.PermissionStatus?.GRANTED) {
        return 'GRANTED';
      }
      if (response.status === 'denied' || response.status === ExpoLocationModule?.PermissionStatus?.DENIED) {
        return response.canAskAgain ? 'DENIED' : 'SETTINGS_REQUIRED';
      }
      return 'NOT_REQUESTED';
    } catch (error) {
      console.warn('[LOCATION_SERVICE] getPermissionStatus error:', error);
      return 'DENIED';
    }
  }

  /**
   * Explicitly request foreground location permission.
   */
  public static async requestPermission(): Promise<LocationPermissionStatus> {
    try {
      if (!ExpoLocationModule) return 'DENIED';
      const response = await ExpoLocationModule.requestForegroundPermissionsAsync();
      if (response.status === 'granted' || response.status === ExpoLocationModule?.PermissionStatus?.GRANTED) {
        return 'GRANTED';
      }
      return response.canAskAgain ? 'DENIED' : 'SETTINGS_REQUIRED';
    } catch (error) {
      console.warn('[LOCATION_SERVICE] requestPermission error:', error);
      return 'DENIED';
    }
  }

  /**
   * Check if device location services (GPS hardware/switches) are turned on.
   */
  public static async isLocationServicesEnabled(): Promise<boolean> {
    try {
      if (!ExpoLocationModule) return false;
      return await ExpoLocationModule.hasServicesEnabledAsync();
    } catch (error) {
      console.warn('[LOCATION_SERVICE] isLocationServicesEnabled error:', error);
      return false;
    }
  }

  /**
   * One-shot foreground device position fetch with accuracy verification and timeout.
   */
  public static async getCurrentDevicePosition(
    options: LocationRequestOptions = {}
  ): Promise<{ location: DeviceLocation; version: number }> {
    const currentVersion = ++this.activeLocationVersion;
    const timeoutMs = options.timeoutMs || 8000;

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs)
    );

    const locationPromise = (async () => {
      const isServicesOn = await this.isLocationServicesEnabled();
      if (!isServicesOn) {
        throw new Error('SERVICES_DISABLED');
      }

      if (!ExpoLocationModule) {
        throw new Error('UNAVAILABLE');
      }

      const raw = await ExpoLocationModule.getCurrentPositionAsync({
        accuracy: options.highAccuracy
          ? ExpoLocationModule?.Accuracy?.Highest || 5
          : ExpoLocationModule?.Accuracy?.Balanced || 3,
      });

      const isApproximate = (raw.coords.accuracy || 0) > 500;

      const deviceLoc: DeviceLocation = {
        latitude: raw.coords.latitude,
        longitude: raw.coords.longitude,
        altitude: raw.coords.altitude,
        accuracy: raw.coords.accuracy,
        altitudeAccuracy: raw.coords.altitudeAccuracy,
        heading: raw.coords.heading,
        speed: raw.coords.speed,
        timestamp: raw.timestamp,
        isApproximate,
      };

      return deviceLoc;
    })();

    const location = await Promise.race([locationPromise, timeoutPromise]);
    return { location, version: currentVersion };
  }

  /**
   * Reverse geocode GPS coordinates to find nearest Indian city/district/state.
   */
  public static async reverseGeocode(coords: {
    latitude: number;
    longitude: number;
  }): Promise<Partial<GeoLocationState>> {
    try {
      if (ExpoLocationModule && ExpoLocationModule.reverseGeocodeAsync) {
        const timeoutPromise = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), 2500)
        );

        const geocodePromise = ExpoLocationModule.reverseGeocodeAsync(coords).catch(() => null);

        const results = await Promise.race([geocodePromise, timeoutPromise]);
        if (results && results.length > 0) {
          const item = results[0];
          const city = item.city || item.subregion || item.district || undefined;
          const state = item.region || 'India';
          const pincode = item.postalCode || undefined;
          const district = item.district || item.subregion || undefined;
          const locality = item.street || item.name || undefined;

          // Deduplicate address parts cleanly
          const candidateParts = [
            locality,
            city,
            district && district !== city ? district : undefined,
            state,
          ].filter(Boolean) as string[];

          const uniqueParts = candidateParts.filter(
            (val, idx, arr) => arr.findIndex((x) => x.toLowerCase() === val.toLowerCase()) === idx
          );

          const label = uniqueParts.length > 0 ? uniqueParts.join(', ') : 'Current location';

          return {
            label,
            city: city || 'Current location',
            district,
            state,
            locality,
            pincode,
            latitude: coords.latitude,
            longitude: coords.longitude,
            isGps: true,
          };
        }
      }
    } catch (err) {
      // Non-blocking presentation fallback: do not log intrusive warning
      if (__DEV__) {
        console.log('[LOCATION_SERVICE] Reverse geocode non-blocking fallback applied:', err);
      }
    }

    return {
      label: 'Current location',
      city: 'Current location',
      latitude: coords.latitude,
      longitude: coords.longitude,
      isGps: true,
    };
  }

  /**
   * Search Indian locations offline by State, District, City, Locality, or Pincode.
   */
  public static searchManualLocations(
    query: string,
    limit = 10
  ): ManualLocationItem[] {
    const clean = query.trim().toLowerCase();
    if (!clean) {
      return COMPREHENSIVE_INDIAN_LOCATIONS.slice(0, limit);
    }

    const matches = COMPREHENSIVE_INDIAN_LOCATIONS.filter((item) => {
      const inName = item.name.toLowerCase().includes(clean);
      const inLocality = item.locality?.toLowerCase().includes(clean);
      const inCity = item.city.toLowerCase().includes(clean);
      const inDistrict = item.district.toLowerCase().includes(clean);
      const inState = item.state.toLowerCase().includes(clean);
      const inPincode = item.pincode.includes(clean);

      return inName || inLocality || inCity || inDistrict || inState || inPincode;
    });

    return matches.slice(0, limit);
  }

  /**
   * Open system App Settings for permission recovery.
   */
  public static async openAppSettings(): Promise<boolean> {
    try {
      if (LinkingModule && LinkingModule.openSettings) {
        await LinkingModule.openSettings();
      }
      return true;
    } catch (err) {
      console.warn('[LOCATION_SERVICE] Failed to open app settings:', err);
      return false;
    }
  }

  /**
   * Persist user's selected search location.
   */
  public static async saveSelectedLocation(location: GeoLocationState): Promise<void> {
    try {
      await SecureStoreService.set(this.STORAGE_KEY_SELECTED, JSON.stringify(location));
    } catch (err) {
      console.warn('[LOCATION_SERVICE] Failed to persist location:', err);
    }
  }

  /**
   * Retrieve user's selected search location.
   */
  public static async getSelectedLocation(): Promise<GeoLocationState | null> {
    try {
      const raw = await SecureStoreService.get(this.STORAGE_KEY_SELECTED);
      if (raw) {
        return JSON.parse(raw) as GeoLocationState;
      }
    } catch {}
    return null;
  }

  /**
   * Check if a GPS response is stale compared to user's latest manual action.
   */
  public static isResponseStale(responseVersion: number): boolean {
    return responseVersion < this.activeLocationVersion;
  }

  /**
   * Invalidate any in-flight GPS request when manual selection is made.
   */
  public static invalidatePendingGps(): number {
    return ++this.activeLocationVersion;
  }
}

export default LocationService;
