/**
 * Bharat PulseLink — In-App Hospital Driving Route Screen
 *
 * Implements:
 * - Live in-app navigation with traffic-colored route segments (NORMAL, SLOW, TRAFFIC_JAM)
 * - MapView integration with patient origin marker, destination beacon, and segmented polylines
 * - Dynamic ETA and distance display from server-side Google Routes API
 * - Camera controls: Recenter and Fit Route
 * - Direct "Check in at this hospital" integration
 * - Resilient offline/error fallback
 *
 * Owned by: In-App Navigation & Routing Domain
 */

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  Linking,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import { AppStackParamList } from '../navigation/types';
import {
  HospitalRouteService,
  DrivingRouteResult,
  RouteTrafficSegment,
  TRAFFIC_COLORS,
  TRAFFIC_LABELS,
  LatLng,
  getTrafficDisplayInfo,
} from '../services/HospitalRouteService';
import LocationService from '../services/LocationService';
import type { HospitalSummaryItem } from '../types/hospitals';

type HospitalRouteRouteProp = RouteProp<AppStackParamList, 'HospitalRoute'>;
type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const HospitalRouteScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<HospitalRouteRouteProp>();
  const { hospital, originLocation } = route.params || {};

  const mapRef = useRef<MapView | null>(null);

  const [patientLocation, setPatientLocation] = useState<LatLng>(
    originLocation || { latitude: 13.0827, longitude: 80.2707 },
  );
  const [routeResult, setRouteResult] = useState<DrivingRouteResult | null>(null);
  const [routeSegments, setRouteSegments] = useState<RouteTrafficSegment[]>([]);
  const [decodedPoints, setDecodedPoints] = useState<LatLng[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const destinationLocation: LatLng = useMemo(() => {
    return {
      latitude: hospital?.latitude || 13.0919,
      longitude: hospital?.longitude || 80.2907,
    };
  }, [hospital]);

  // 1. Initial GPS Resolution & Route Fetch
  useEffect(() => {
    let isMounted = true;

    async function initializeRoute() {
      setIsLoading(true);
      setErrorMsg(null);

      let currentOrigin = patientLocation;
      try {
        const { location: gpsCoords } = await LocationService.getCurrentDevicePosition({
          timeoutMs: 4000,
          highAccuracy: true,
        });
        if (gpsCoords && isMounted) {
          currentOrigin = {
            latitude: gpsCoords.latitude,
            longitude: gpsCoords.longitude,
          };
          setPatientLocation(currentOrigin);
        }
      } catch (e) {
        console.log('[HospitalRouteScreen] Using fallback/provided origin coordinates');
      }

      try {
        const result = await HospitalRouteService.getDrivingRoute(
          currentOrigin,
          destinationLocation,
        );

        if (isMounted && result) {
          setRouteResult(result);
          const points = result.polyline
            ? HospitalRouteService.decodePolyline(result.polyline)
            : [currentOrigin, destinationLocation];

          setDecodedPoints(points);

          const segments = HospitalRouteService.splitPolylineIntoTrafficSegments(
            points,
            result.traffic,
          );
          setRouteSegments(segments);

          // Fit map after state updates
          setTimeout(() => {
            fitRouteBounds(points, currentOrigin, destinationLocation);
          }, 400);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMsg(err?.message || 'Failed to calculate route to hospital');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initializeRoute();

    return () => {
      isMounted = false;
    };
  }, [hospital, destinationLocation]);

  // Recalculate route on demand
  const handleRecalculate = useCallback(async () => {
    setIsRecalculating(true);
    try {
      let currentOrigin = patientLocation;
      try {
        const { location: gpsCoords } = await LocationService.getCurrentDevicePosition({
          timeoutMs: 4000,
          highAccuracy: true,
        });
        if (gpsCoords) {
          currentOrigin = { latitude: gpsCoords.latitude, longitude: gpsCoords.longitude };
          setPatientLocation(currentOrigin);
        }
      } catch (e) {}

      const result = await HospitalRouteService.getDrivingRoute(
        currentOrigin,
        destinationLocation,
        true, // force refresh
      );

      setRouteResult(result);
      const points = result.polyline
        ? HospitalRouteService.decodePolyline(result.polyline)
        : [currentOrigin, destinationLocation];

      setDecodedPoints(points);
      const segments = HospitalRouteService.splitPolylineIntoTrafficSegments(
        points,
        result.traffic,
      );
      setRouteSegments(segments);

      fitRouteBounds(points, currentOrigin, destinationLocation);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Recalculation failed');
    } finally {
      setIsRecalculating(false);
    }
  }, [patientLocation, destinationLocation]);

  // Fit camera bounds to show patient, hospital, and full route
  const fitRouteBounds = useCallback(
    (points: LatLng[], origin: LatLng, dest: LatLng) => {
      const allCoords = points.length > 0 ? points : [origin, dest];
      if (mapRef.current && allCoords.length > 0) {
        mapRef.current.fitToCoordinates(allCoords, {
          edgePadding: {
            top: Platform.OS === 'ios' ? 190 : 170,
            right: 50,
            bottom: Platform.OS === 'ios' ? 100 : 90,
            left: 50,
          },
          animated: true,
        });
      }
    },
    [],
  );

  const handleRecenter = useCallback(() => {
    fitRouteBounds(decodedPoints, patientLocation, destinationLocation);
  }, [decodedPoints, patientLocation, destinationLocation, fitRouteBounds]);

  const handleCheckIn = () => {
    if (!hospital) return;
    navigation.navigate('MySecureQR' as any, {
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      purpose: 'HOSPITAL_CHECKIN',
    });
  };

  const handleOpenExternalMapsFallback = () => {
    const lat = destinationLocation.latitude;
    const lon = destinationLocation.longitude;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&destination_place_id=${encodeURIComponent(
      hospital?.name || 'Hospital',
    )}`;
    Linking.openURL(url).catch((err) => console.error('Failed to open external maps URL:', err));
  };

  // Initial map region
  const initialRegion = useMemo(() => {
    const minLat = Math.min(patientLocation.latitude, destinationLocation.latitude);
    const maxLat = Math.max(patientLocation.latitude, destinationLocation.latitude);
    const minLng = Math.min(patientLocation.longitude, destinationLocation.longitude);
    const maxLng = Math.max(patientLocation.longitude, destinationLocation.longitude);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(0.04, (maxLat - minLat) * 1.5),
      longitudeDelta: Math.max(0.04, (maxLng - minLng) * 1.5),
    };
  }, [patientLocation, destinationLocation]);

  // Traffic summary badge info (Truthful Google Live Traffic or Offline Fallback)
  const trafficBadge = useMemo(() => {
    return getTrafficDisplayInfo(routeResult);
  }, [routeResult]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Interactive Native Map ────────────────────────────────────────── */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsCompass={false}
        showsTraffic={false} // We draw our own authoritative traffic polylines
      >
        {/* Patient Origin Marker */}
        <Marker coordinate={patientLocation} title="Your Location" anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.patientMarkerContainer}>
            <View style={styles.patientPulseRing} />
            <View style={styles.patientInnerDot} />
          </View>
        </Marker>

        {/* Hospital Destination Marker */}
        <Marker coordinate={destinationLocation} title={hospital?.name || 'Hospital'}>
          <View style={styles.hospitalMarkerContainer}>
            <View style={styles.hospitalMarkerPin}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M19 14V6c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v8M3 14h18v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4z"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path d="M12 7v4M10 9h4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
              </Svg>
            </View>
            <View style={styles.hospitalMarkerArrow} />
          </View>
        </Marker>

        {/* Traffic-Colored Polyline Segments when live traffic is present, else solid route */}
        {routeResult?.isLiveTraffic && routeSegments.length > 0 ? (
          routeSegments.map((segment) => {
            const segmentColor =
              segment.speed === 'NORMAL'
                ? '#10B981' // Green (Normal / Fast)
                : segment.speed === 'SLOW'
                ? '#F59E0B' // Yellow / Amber (Slow)
                : '#EF4444'; // Red (Heavy)
            return (
              <Polyline
                key={segment.id}
                coordinates={segment.coordinates}
                strokeColor={segmentColor}
                strokeWidth={6}
                lineCap="round"
                lineJoin="round"
              />
            );
          })
        ) : (
          <Polyline
            coordinates={decodedPoints.length > 0 ? decodedPoints : [patientLocation, destinationLocation]}
            strokeColor="#0F766E"
            strokeWidth={6}
            lineCap="round"
            lineJoin="round"
          />
        )}
      </MapView>

      {/* ── TOP SECTION: User-Requested Route Overview Card ───────────────── */}
      <SafeAreaView style={styles.topSafeArea}>
        <View style={styles.topRouteCard}>
          {/* Header Row: Back Button, Hospital Name & Recenter */}
          <View style={styles.cardHeaderRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Go back"
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M19 12H5M12 19l-7-7 7-7"
                  stroke="#0F172A"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>

            <View style={styles.hospitalInfoCol}>
              <Text style={styles.hospitalName} numberOfLines={1}>
                {hospital?.name || 'Apollo Hospital'}
              </Text>
              <Text style={styles.hospitalAddress} numberOfLines={1}>
                {hospital?.address || hospital?.district || 'Nearby Medical Center'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.recenterIconBtn}
              onPress={handleRecenter}
              accessibilityLabel="Recenter route"
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M3 12h3M18 12h3M12 3v3M12 18v3M12 16a4 4 0 100-8 4 4 0 000 8z"
                  stroke="#0F766E"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Metrics & Traffic Status Row: 7.3 km   16 min  |  Slow traffic */}
          <View style={styles.metricsTrafficRow}>
            <View style={styles.metricsContainer}>
              <Text style={styles.metricDistanceText}>
                {routeResult
                  ? `${routeResult.distanceKm.toFixed(1)} km`
                  : `${(hospital?.distanceKm || 7.3).toFixed(1)} km`}
              </Text>
              <Text style={styles.metricDividerDot}>•</Text>
              <Text style={styles.metricDurationText}>
                {routeResult ? `${routeResult.durationMinutes} min` : '16 min'}
              </Text>
            </View>

            {/* Traffic Badge */}
            <View
              style={[
                styles.trafficBadge,
                { backgroundColor: trafficBadge.bg, borderColor: trafficBadge.border },
              ]}
            >
              <View style={[styles.trafficDot, { backgroundColor: trafficBadge.dot }]} />
              <Text style={[styles.trafficBadgeText, { color: trafficBadge.text }]}>
                {trafficBadge.label}
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* ── ON-MAP TRAFFIC LEGEND ─────────────────────── */}
      <View style={styles.mapLegendContainer}>
        {routeResult?.isLiveTraffic ? (
          <View style={styles.legendBar}>
            <View style={styles.legendSegment}>
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendText}>green (fast)</Text>
            </View>
            <Text style={styles.legendConnector}>─</Text>
            <View style={styles.legendSegment}>
              <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.legendText}>yellow (slow)</Text>
            </View>
            <Text style={styles.legendConnector}>─</Text>
            <View style={styles.legendSegment}>
              <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.legendText}>red (heavy)</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.legendBar, { paddingHorizontal: 12 }]}>
            <View style={[styles.legendDot, { backgroundColor: '#94A3B8' }]} />
            <Text style={styles.legendText}>Traffic unavailable • Standard driving route</Text>
          </View>
        )}
      </View>

      {/* ── Floating Controls (Right side) ─────────────────────────────────── */}
      <View style={styles.floatingControls}>
        <TouchableOpacity
          style={styles.fabButton}
          onPress={handleRecalculate}
          disabled={isRecalculating}
          accessibilityLabel="Refresh live route"
        >
          {isRecalculating ? (
            <ActivityIndicator size="small" color="#0F766E" />
          ) : (
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M23 4v6h-6M1 20v-6h6"
                stroke="#0F766E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"
                stroke="#0F766E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Bottom Action Bar ──────────────────────────────────────────────── */}
      <View style={styles.bottomActionBar}>
        <TouchableOpacity
          style={styles.checkInButton}
          onPress={handleCheckIn}
          accessibilityLabel="Check in at this hospital"
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              stroke="#FFFFFF"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={styles.checkInButtonText}>Check In at Hospital</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.fallbackButton}
          onPress={handleOpenExternalMapsFallback}
          accessibilityLabel="Open in external Google Maps"
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"
              stroke="#0F766E"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  map: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  topSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topRouteCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: Platform.OS === 'android' ? 12 : 8,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hospitalInfoCol: {
    flex: 1,
  },
  hospitalName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  hospitalAddress: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  recenterIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricsTrafficRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricDistanceText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricDividerDot: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '700',
  },
  metricDurationText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F766E',
  },
  trafficBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  trafficDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  trafficBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  mapLegendContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 145 : 165,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 9,
  },
  legendBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 8,
  },
  legendSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  legendConnector: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  floatingControls: {
    position: 'absolute',
    right: 16,
    top: Platform.OS === 'android' ? 200 : 225,
    zIndex: 9,
  },
  fabButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    zIndex: 10,
  },
  checkInButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F766E',
    paddingVertical: 13,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  checkInButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  fallbackButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#F0FDFA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  patientMarkerContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientPulseRing: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(15, 118, 110, 0.25)',
  },
  patientInnerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#0F766E',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  hospitalMarkerContainer: {
    alignItems: 'center',
  },
  hospitalMarkerPin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0F766E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  hospitalMarkerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#0F766E',
  },
});

export default HospitalRouteScreen;
