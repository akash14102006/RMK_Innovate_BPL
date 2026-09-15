import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// Mock react-native-svg
vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Svg: 'Svg',
  Path: 'Path',
  Circle: 'Circle',
  Rect: 'Rect',
  G: 'G',
}));

// Mock react-native
vi.mock('react-native', () => {
  const RN = {
    View: 'View',
    Text: 'Text',
    Modal: 'Modal',
    TouchableOpacity: 'TouchableOpacity',
    ScrollView: 'ScrollView',
    Linking: {
      canOpenURL: vi.fn().mockResolvedValue(true),
      openURL: vi.fn().mockResolvedValue(undefined),
    },
    Alert: {
      alert: vi.fn(),
    },
    Share: {
      share: vi.fn().mockResolvedValue(undefined),
    },
    Platform: {
      OS: 'android',
    },
    Dimensions: {
      get: vi.fn().mockReturnValue({ width: 390, height: 844 }),
    },
    StyleSheet: {
      create: (styles: any) => styles,
    },
  };
  return RN;
});

// Mock @react-navigation/native
const mockNavigate = vi.fn();
vi.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock AppLottieView
vi.mock('../../common/AppLottieView', () => ({
  default: 'AppLottieView',
}));

// Mock LocationService & HospitalRouteService
vi.mock('../../../services/LocationService', () => ({
  default: {
    getCurrentDevicePosition: vi.fn().mockResolvedValue({
      location: { latitude: 13.0827, longitude: 80.2707 },
    }),
  },
}));

vi.mock('../../../services/HospitalRouteService', () => ({
  HospitalRouteService: {
    getDrivingRoute: vi.fn().mockResolvedValue({
      distanceKm: 2.3,
      durationMinutes: 8,
      trafficSummary: 'SLOW',
      routeCoordinates: [],
      segments: [],
      isLiveTraffic: true,
      trafficSource: 'GOOGLE_LIVE_TRAFFIC',
    }),
  },
  getTrafficDisplayInfo: vi.fn().mockReturnValue({
    label: 'Slow traffic',
    isLive: true,
    badgeText: 'Live Google Traffic',
    bg: '#FFFBEB',
    border: '#FDE68A',
    text: '#D97706',
    dot: '#F59E0B',
  }),
}));

import { HospitalDetailsModal } from '../HospitalDetailsModal';
import { HospitalSummaryItem } from '../../../types/hospitals';

const mockHospital: HospitalSummaryItem = {
  id: 'hosp_test_01',
  name: 'GCC Urban Primary Health Centre, Kolathur',
  category: 'PRIMARY_HEALTH_CENTER',
  hospitalCategory: 'Urban Primary Health Centre',
  ownership: 'GOVERNMENT',
  latitude: 13.1234,
  longitude: 80.2123,
  address: 'Redhills Road, Kolathur',
  city: 'Chennai',
  state: 'Tamil Nadu',
  district: 'Chennai',
  pincode: '600099',
  distanceKm: 2.3,
  is24x7: true,
  operatingHoursText: '24 Hours Open',
  contactPhone: '+91 44 2556 1234',
  emergencyPhone: '108',
  website: 'https://chennaicorporation.gov.in',
  emergencyServices: 'Emergency First Aid & 24x7 Obstetric Referral',
  specialties: 'General OPD, Maternal & Child Health, Immunization, 0, N/A, NA, null, Geriatric Care',
  services: ['General OPD', 'Maternal & Child Health'],
  facilities: '24x7 Delivery Care, Diagnostic Lab, Pharmacy, -, unknown',
  sourceLabel: 'MoHFW National Health Directory',
  verified: true,
};

// Mock react hooks
let capturedHookSequence: string[] = [];
let customUseMemoHandler: ((factory: any) => any) | null = null;

vi.mock('react', async () => {
  const actual = await vi.importActual<any>('react');
  return {
    ...actual,
    useState: (initial: any) => {
      capturedHookSequence.push('useState');
      return [initial, vi.fn()];
    },
    useEffect: (effect: any, deps: any) => {
      capturedHookSequence.push('useEffect');
    },
    useMemo: (factory: any, deps: any) => {
      capturedHookSequence.push('useMemo');
      if (customUseMemoHandler) {
        return customUseMemoHandler(factory);
      }
      return factory();
    },
  };
});

describe('HospitalDetailsModal — Hook Order Invariance & Regression Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedHookSequence = [];
    customUseMemoHandler = null;
  });

  it('maintains invariant hook count and order across transitions: hospital null -> hospital object -> hospital null', () => {
    const hookExecutionLog: string[][] = [];

    // Render 1: hospital is null (modal closed or initializing)
    capturedHookSequence = [];
    HospitalDetailsModal({
      visible: false,
      hospital: null,
      onClose: vi.fn(),
    });
    hookExecutionLog.push([...capturedHookSequence]);

    // Render 2: hospital is null, visible is true
    capturedHookSequence = [];
    HospitalDetailsModal({
      visible: true,
      hospital: null,
      onClose: vi.fn(),
    });
    hookExecutionLog.push([...capturedHookSequence]);

    // Render 3: hospital object provided (modal opened by user tap)
    capturedHookSequence = [];
    HospitalDetailsModal({
      visible: true,
      hospital: mockHospital,
      onClose: vi.fn(),
    });
    hookExecutionLog.push([...capturedHookSequence]);

    // Render 4: hospital switches to another hospital
    capturedHookSequence = [];
    HospitalDetailsModal({
      visible: true,
      hospital: { ...mockHospital, id: 'hosp_test_02', name: 'Apollo Hospital' },
      onClose: vi.fn(),
    });
    hookExecutionLog.push([...capturedHookSequence]);

    // Render 5: hospital set back to null (modal closed)
    capturedHookSequence = [];
    HospitalDetailsModal({
      visible: false,
      hospital: null,
      onClose: vi.fn(),
    });
    hookExecutionLog.push([...capturedHookSequence]);

    // VERIFICATION: Hook sequence must be 100% IDENTICAL across all renders!
    const expectedSequence = [
      'useState', // routeInfo
      'useEffect', // dynamic route fetch
      'useMemo', // cleanedSpecialties
      'useMemo', // cleanedFacilities
      'useMemo', // trafficPill
    ];

    for (let i = 0; i < hookExecutionLog.length; i++) {
      expect(hookExecutionLog[i]).toEqual(expectedSequence);
    }
  });

  it('correctly cleans specialties and strips placeholders 0, N/A, NA, -, unknown, null', () => {
    let capturedSpecialties: string[] = [];
    customUseMemoHandler = (factory: any) => {
      const result = factory();
      if (Array.isArray(result) && result.includes('General OPD')) {
        capturedSpecialties = result;
      }
      return result;
    };

    HospitalDetailsModal({
      visible: true,
      hospital: mockHospital,
      onClose: vi.fn(),
    });

    expect(capturedSpecialties).toContain('General OPD');
    expect(capturedSpecialties).toContain('Maternal & Child Health');
    expect(capturedSpecialties).toContain('Immunization');
    expect(capturedSpecialties).toContain('Geriatric Care');
    expect(capturedSpecialties).not.toContain('0');
    expect(capturedSpecialties).not.toContain('N/A');
    expect(capturedSpecialties).not.toContain('NA');
    expect(capturedSpecialties).not.toContain('null');
  });

  it('returns null when hospital is null without throwing hook order errors', () => {
    const result = HospitalDetailsModal({
      visible: true,
      hospital: null,
      onClose: vi.fn(),
    });
    expect(result).toBeNull();
  });
});
