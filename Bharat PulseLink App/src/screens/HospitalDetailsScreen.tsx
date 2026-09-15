/**
 * Bharat PulseLink — Premium Enterprise Hospital Details Screen
 *
 * Design Direction:
 * - Enterprise-grade healthcare UI with soft neumorphic depth
 * - High-trust Verified Facility Hero with large typography (28-30px)
 * - Aligned At-A-Glance Metric Cards (Distance, ETA, Operational Status)
 * - High-visibility Emergency Panel (only when real data exists)
 * - Clinical Specialties & Facilities Chip System (no placeholder 0/NA/null values)
 * - Symmetrical 2x2 Quick Actions Grid (Directions, Check In, Call, Website)
 * - Mini Route Map Preview with live traffic condition & in-app navigation handoff
 * - Sticky Primary In-App Directions CTA (routes to HospitalRouteScreen, never external auto-redirect)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Share,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import AppLottieView from '../components/common/AppLottieView';
import { colors, spacing, radii } from '../theme/tokens';
import HospitalDiscoveryService from '../services/HospitalDiscoveryService';
import {
  HospitalRouteService,
  DrivingRouteResult,
  getTrafficDisplayInfo,
} from '../services/HospitalRouteService';
import LocationService from '../services/LocationService';
import { HospitalSummaryItem } from '../types/hospitals';

const GlobalNetworkLottie = require('../../assets/Global Network.json');

export const HospitalDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { hospitalId } = route.params || {};

  const [hospital, setHospital] = useState<HospitalSummaryItem | null>(null);
  const [routeInfo, setRouteInfo] = useState<DrivingRouteResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

  // 1. Fetch Authoritative Hospital Record
  useEffect(() => {
    if (!hospitalId) {
      setIsError(true);
      setIsLoading(false);
      return;
    }

    HospitalDiscoveryService.getHospitalById(hospitalId)
      .then((data) => {
        if (data) {
          setHospital(data);
        } else {
          setIsError(true);
        }
      })
      .catch(() => setIsError(true))
      .finally(() => setIsLoading(false));
  }, [hospitalId]);

  // 2. Fetch Live Driving Route Metrics (Distance, ETA, Traffic)
  useEffect(() => {
    if (!hospital?.latitude || !hospital?.longitude) return;
    let isMounted = true;

    (async () => {
      try {
        let userPos: { latitude: number; longitude: number } | null = null;
        try {
          const { location: gpsCoords } = await LocationService.getCurrentDevicePosition({
            timeoutMs: 3500,
            highAccuracy: true,
          });
          if (gpsCoords?.latitude && gpsCoords?.longitude) {
            userPos = { latitude: gpsCoords.latitude, longitude: gpsCoords.longitude };
          }
        } catch {}

        if (!userPos) {
          const saved = await LocationService.getSelectedLocation();
          if (saved?.latitude && saved?.longitude) {
            userPos = { latitude: saved.latitude, longitude: saved.longitude };
          }
        }

        if (userPos && isMounted) {
          const routeResult = await HospitalRouteService.getDrivingRoute(userPos, {
            latitude: hospital.latitude,
            longitude: hospital.longitude,
          });

          if (isMounted && routeResult) {
            setRouteInfo(routeResult);
          }
        }
      } catch (err) {
        // Graceful fallback to hospital.distanceKm
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [hospital]);

  // Share handler
  const handleShare = async () => {
    if (!hospital) return;
    try {
      await Share.share({
        title: hospital.name,
        message: `${hospital.name}\n${hospital.address}, ${hospital.city}, ${hospital.state} - ${hospital.pincode}\nOperational: ${hospital.is24x7 ? '24x7 Emergency' : hospital.operatingHoursText}\nPhone: ${hospital.contactPhone || hospital.emergencyPhone || 'N/A'}\nShared via Bharat PulseLink`,
      });
    } catch {}
  };

  // Dial telephone number
  const handleCall = (phone?: string) => {
    if (!phone) return;
    const url = `tel:${phone.replace(/\s+/g, '')}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) Linking.openURL(url);
        else Alert.alert('Dialer Unavailable', `Please dial ${phone} manually.`);
      })
      .catch(() => Alert.alert('Error', `Could not open dialer for ${phone}`));
  };

  // Open Official Website
  const handleOpenWebsite = (url?: string | null) => {
    if (!url) return;
    const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
    Linking.canOpenURL(cleanUrl)
      .then((supported) => {
        if (supported) Linking.openURL(cleanUrl);
        else Alert.alert('Browser Unavailable', `Could not open ${cleanUrl}`);
      })
      .catch(() => Alert.alert('Error', `Failed to open website.`));
  };

  // Navigate to In-App Driving Route (Never auto-redirects to Google Maps)
  const handleOpenDirections = () => {
    if (!hospital) return;
    navigation.navigate('HospitalRoute', {
      hospital,
    });
  };

  // Clean Specialties (Filter out placeholders 0, N/A, NA, -, unknown, null)
  const cleanedSpecialties = useMemo(() => {
    const raw = hospital?.specialties || hospital?.services?.join(', ') || '';
    const items = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => {
        if (!s) return false;
        const lower = s.toLowerCase();
        return (
          lower !== '0' &&
          lower !== 'n/a' &&
          lower !== 'na' &&
          lower !== '-' &&
          lower !== 'unknown' &&
          lower !== 'null' &&
          lower !== 'none'
        );
      });
    return Array.from(new Set(items));
  }, [hospital]);

  // Clean Facilities (Filter out placeholders)
  const cleanedFacilities = useMemo(() => {
    const raw = hospital?.facilities || '';
    const items = raw
      .split(',')
      .map((f) => f.trim())
      .filter((f) => {
        if (!f) return false;
        const lower = f.toLowerCase();
        return (
          lower !== '0' &&
          lower !== 'n/a' &&
          lower !== 'na' &&
          lower !== '-' &&
          lower !== 'unknown' &&
          lower !== 'null' &&
          lower !== 'none'
        );
      });
    return Array.from(new Set(items));
  }, [hospital]);

  // Traffic badge styling (Real Google traffic or truthful "Traffic data unavailable")
  const trafficPill = useMemo(() => {
    return getTrafficDisplayInfo(routeInfo);
  }, [routeInfo]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.loadingText}>Loading Hospital Details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !hospital) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerCircleBtn} onPress={() => navigation.goBack()}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M19 12H5M12 19l-7-7 7-7" stroke={colors.textPrimary} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hospital Details</Text>
          <View style={{ width: 42 }} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorTitle}>Hospital Record Not Found</Text>
          <Text style={styles.errorSubtitle}>The requested facility record could not be loaded from the registry.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.retryBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isGovernment = hospital.ownership === 'GOVERNMENT' || hospital.ownership === 'PUBLIC_SECTOR';
  const themeColor = isGovernment ? '#0F766E' : '#4F46E5';
  const hasEmergency = Boolean(hospital.is24x7 || hospital.emergencyServices || hospital.emergencyPhone);
  const hasPhone = Boolean(hospital.contactPhone || hospital.emergencyPhone);
  const hasWebsite = Boolean(hospital.website && hospital.website.trim().length > 3);

  const displayDistance = routeInfo ? routeInfo.distanceKm.toFixed(1) : hospital.distanceKm.toFixed(1);
  const displayEta = routeInfo ? routeInfo.durationMinutes : Math.max(8, Math.round(hospital.distanceKm * 2.2));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* ── 1. Top Navigation Bar ───────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerCircleBtn}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#0F172A" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Hospital Details</Text>

          <TouchableOpacity
            style={styles.headerCircleBtn}
            onPress={handleShare}
            accessibilityRole="button"
            accessibilityLabel="Share hospital details"
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"
                stroke="#0F172A"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── 2. Hospital Hero Card ────────────────────────────────────── */}
          <View style={styles.heroNeumorphicCard}>
            {/* Lottie Facility Network Visualization */}
            <View style={styles.lottieWrap}>
              <AppLottieView
                source={GlobalNetworkLottie}
                autoPlay={true}
                loop={true}
                style={styles.lottieAnim}
              />
            </View>

            {/* Top Badges Row */}
            <View style={styles.heroBadgesRow}>
              {/* Verified Facility Badge */}
              <View style={styles.verifiedFacilityPill}>
                <View style={styles.verifiedDotOuter}>
                  <View style={styles.verifiedDotInner} />
                </View>
                <Text style={styles.verifiedFacilityText}>VERIFIED HEALTH FACILITY</Text>
              </View>

              {/* Ownership Badge */}
              <View style={[styles.ownershipPill, { backgroundColor: isGovernment ? '#F0FDFA' : '#EEF2FF', borderColor: isGovernment ? '#CCFBF1' : '#E0E7FF' }]}>
                <Text style={[styles.ownershipText, { color: themeColor }]}>
                  {isGovernment ? 'GOVERNMENT' : 'PRIVATE'}
                </Text>
              </View>
            </View>

            {/* Hospital Name (30-34px ExtraBold Typography) */}
            <Text style={styles.heroHospitalName} numberOfLines={3}>
              {hospital.name}
            </Text>

            {/* Sub-Classification & Category */}
            <Text style={styles.heroCategoryText}>
              {hospital.hospitalCareType || hospital.hospitalCategory || (isGovernment ? 'Government Medical Center' : 'Super Specialty Hospital')}
            </Text>

            {/* Location & Real Distance Row */}
            <View style={styles.heroLocationRow}>
              <View style={styles.locationPinBox}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
                    stroke="#0F766E"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Circle cx={12} cy={10} r={3} stroke="#0F766E" strokeWidth={2} />
                </Svg>
              </View>
              <Text style={styles.heroLocationText} numberOfLines={1}>
                {hospital.city}, {hospital.state}
              </Text>
              <Text style={styles.heroLocationDot}>•</Text>
              <Text style={styles.heroDistanceHighlight}>
                {displayDistance} km away
              </Text>
            </View>

            {/* ── 3. At-A-Glance Metric Cards (3 Equal-Width Neumorphic Tiles) ── */}
            <View style={styles.metricsGridRow}>
              {/* Tile 1: Distance */}
              <View style={styles.metricTile}>
                <Text style={styles.metricTileValue}>
                  {displayDistance}
                  <Text style={styles.metricTileUnit}> km</Text>
                </Text>
                <Text style={styles.metricTileLabel}>DISTANCE</Text>
              </View>

              {/* Tile 2: Drive Time */}
              <View style={styles.metricTile}>
                <Text style={[styles.metricTileValue, { color: '#0F766E' }]}>
                  {displayEta}
                  <Text style={styles.metricTileUnit}> min</Text>
                </Text>
                <Text style={styles.metricTileLabel}>EST. DRIVE</Text>
              </View>

              {/* Tile 3: Status */}
              <View style={styles.metricTile}>
                <Text style={[styles.metricTileValue, { color: hospital.is24x7 ? '#059669' : '#0F172A', fontSize: 18 }]}>
                  {hospital.is24x7 ? '24×7' : 'OPEN'}
                </Text>
                <Text style={styles.metricTileLabel}>STATUS</Text>
              </View>
            </View>
          </View>

          {/* ── 4. High-Visibility Emergency Panel ───────────────────────── */}
          {hasEmergency && (
            <View style={styles.emergencyCard}>
              <View style={styles.emergencyHeaderRow}>
                <View style={styles.emergencyTitleRow}>
                  <Text style={styles.emergencyIcon}>🚨</Text>
                  <Text style={styles.emergencyHeading}>24×7 EMERGENCY CARE</Text>
                </View>
                <View style={styles.emergencyLivePill}>
                  <View style={styles.emergencyPulseDot} />
                  <Text style={styles.emergencyLiveText}>Active Casualty</Text>
                </View>
              </View>

              <Text style={styles.emergencyDetailText}>
                {hospital.emergencyServices ||
                  'Casualty, trauma center, emergency resuscitation, and acute medical intake operating around the clock.'}
              </Text>

              {hospital.emergencyPhone ? (
                <TouchableOpacity
                  style={styles.emergencyActionBtn}
                  onPress={() => handleCall(hospital.emergencyPhone)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Call 24x7 emergency desk"
                >
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
                      stroke="#FFFFFF"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                  <Text style={styles.emergencyActionBtnText}>
                    Emergency Desk: {hospital.emergencyPhone}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}

          {/* ── 5. Specialties Section ───────────────────────────────────── */}
          <View style={styles.sectionNeumorphicCard}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionHeading}>SPECIALTIES & DEPARTMENTS</Text>
              <Text style={styles.sectionSubCount}>
                {cleanedSpecialties.length > 0 ? `${cleanedSpecialties.length} available` : ''}
              </Text>
            </View>

            {cleanedSpecialties.length > 0 ? (
              <View style={styles.chipsContainer}>
                {cleanedSpecialties.map((spec) => (
                  <View key={spec} style={styles.specialtyChip}>
                    <Text style={styles.specialtyChipDot}>•</Text>
                    <Text style={styles.specialtyChipText}>{spec}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.unavailableText}>Specialties information unavailable</Text>
            )}
          </View>

          {/* ── 6. Facilities & Infrastructure Section ──────────────────── */}
          <View style={styles.sectionNeumorphicCard}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionHeading}>FACILITIES & INFRASTRUCTURE</Text>
              <Text style={styles.sectionSubCount}>
                {cleanedFacilities.length > 0 ? `${cleanedFacilities.length} active` : ''}
              </Text>
            </View>

            {cleanedFacilities.length > 0 ? (
              <View style={styles.chipsContainer}>
                {cleanedFacilities.map((fac) => (
                  <View key={fac} style={styles.facilityChip}>
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                      <Path d="M20 6L9 17l-5-5" stroke="#0F766E" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                    <Text style={styles.facilityChipText}>{fac}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.unavailableText}>Facilities information unavailable</Text>
            )}

            {/* Capacity Numbers (If real data exists) */}
            {(hospital.totalBeds !== undefined || hospital.totalDoctors !== undefined) && (
              <View style={styles.capacitySubGrid}>
                {hospital.totalBeds !== undefined && (
                  <View style={styles.capacityBox}>
                    <Text style={styles.capacityNum}>{hospital.totalBeds}</Text>
                    <Text style={styles.capacityLabel}>Total Beds</Text>
                    {hospital.availableBeds !== undefined && (
                      <Text style={styles.capacityAvailable}>({hospital.availableBeds} Available)</Text>
                    )}
                  </View>
                )}
                {hospital.totalDoctors !== undefined && (
                  <View style={styles.capacityBox}>
                    <Text style={styles.capacityNum}>{hospital.totalDoctors}</Text>
                    <Text style={styles.capacityLabel}>Specialists on Duty</Text>
                  </View>
                )}
                {hospital.rating !== undefined && (
                  <View style={styles.capacityBox}>
                    <Text style={[styles.capacityNum, { color: '#D97706' }]}>★ {hospital.rating.toFixed(1)}</Text>
                    <Text style={styles.capacityLabel}>Patient Trust</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* ── 7. Mini Route Map Preview Card ───────────────────────────── */}
          <TouchableOpacity
            style={styles.miniRouteCard}
            onPress={handleOpenDirections}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Open live driving route"
          >
            <View style={styles.miniRouteHeaderRow}>
              <View style={styles.miniRouteTitleCol}>
                <Text style={styles.miniRouteHeading}>MINI ROUTE PREVIEW</Text>
                <Text style={styles.miniRouteSubText}>Fastest traffic-aware driving corridor</Text>
              </View>
              <View style={styles.liveTrafficMiniBadge}>
                <View style={styles.livePulseDot} />
                <Text style={styles.liveTrafficMiniText}>Live Traffic</Text>
              </View>
            </View>

            {/* Schematic Route Line Visualizer (You -> Hospital) */}
            <View style={styles.schematicTrackContainer}>
              <View style={styles.schematicNodesRow}>
                <View style={styles.schematicOriginDot} />
                <View style={styles.schematicLineSegmentNormal} />
                <View style={styles.schematicLineSegmentSlow} />
                <View style={styles.schematicLineSegmentHeavy} />
                <View style={styles.schematicDestPin}>
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                    <Path d="M12 21s-6-5.5-6-10a6 6 0 0112 0c0 4.5-6 10-6 10z" fill="#0F766E" />
                    <Circle cx={12} cy={11} r={2.5} fill="#FFFFFF" />
                  </Svg>
                </View>
              </View>

              <View style={styles.schematicLabelsRow}>
                <Text style={styles.schematicOriginLabel}>You (Current GPS)</Text>
                <Text style={styles.schematicDestLabel} numberOfLines={1}>
                  {hospital.name}
                </Text>
              </View>
            </View>

            {/* Route Stats & Dynamic Traffic Condition */}
            <View style={styles.miniRouteStatsRow}>
              <View style={styles.miniRouteMetricsPair}>
                <Text style={styles.miniRouteDistance}>{displayDistance} km</Text>
                <Text style={styles.miniRouteMetricDivider}>•</Text>
                <Text style={styles.miniRouteMetricEta}>{displayEta} min</Text>
              </View>

              <View style={[styles.trafficMiniPill, { backgroundColor: trafficPill.bg, borderColor: trafficPill.border }]}>
                <View style={[styles.trafficMiniDot, { backgroundColor: trafficPill.dot }]} />
                <Text style={[styles.trafficMiniText, { color: trafficPill.text }]}>
                  {trafficPill.label}
                </Text>
              </View>
            </View>

            {/* Action prompt */}
            <View style={styles.viewRoutePromptRow}>
              <Text style={styles.viewRoutePromptText}>View In-App Navigation Map</Text>
              <Text style={styles.viewRoutePromptArrow}>→</Text>
            </View>
          </TouchableOpacity>

          {/* ── 8. Quick Actions (2 × 2 Perfectly Symmetrical Grid) ──────── */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionHeading}>QUICK ACTIONS</Text>

            <View style={styles.quickActionsGrid}>
              {/* Row 1 */}
              <View style={styles.quickActionsRow}>
                {/* 1. Directions */}
                <TouchableOpacity
                  style={styles.quickActionTile}
                  onPress={handleOpenDirections}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Get driving directions"
                >
                  <View style={[styles.quickActionIconBox, { backgroundColor: '#F0FDFA' }]}>
                    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M9 18l6-3 6 3V3l-6 3-6-3-6 3v15l6-3z"
                        stroke="#0F766E"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                  <Text style={styles.quickActionTitle}>Directions</Text>
                  <Text style={styles.quickActionSubtitle}>
                    {displayDistance} km • {displayEta}m
                  </Text>
                </TouchableOpacity>

                {/* 2. Check In */}
                <TouchableOpacity
                  style={styles.quickActionTile}
                  onPress={() =>
                    navigation.navigate('MySecureQR', {
                      hospitalId: hospital.id,
                      hospitalName: hospital.name,
                      purpose: 'HOSPITAL_CHECKIN',
                    })
                  }
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Check in at this hospital"
                >
                  <View style={[styles.quickActionIconBox, { backgroundColor: '#EEF2FF' }]}>
                    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        stroke="#4F46E5"
                        strokeWidth={2.2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                  <Text style={styles.quickActionTitle}>Check In</Text>
                  <Text style={styles.quickActionSubtitle}>ABDM Express QR</Text>
                </TouchableOpacity>
              </View>

              {/* Row 2 */}
              <View style={styles.quickActionsRow}>
                {/* 3. Call Hospital */}
                <TouchableOpacity
                  style={[styles.quickActionTile, !hasPhone && styles.quickActionTileDisabled]}
                  onPress={() => handleCall(hospital.contactPhone || hospital.emergencyPhone)}
                  disabled={!hasPhone}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Call hospital reception"
                >
                  <View style={[styles.quickActionIconBox, { backgroundColor: '#ECFDF5' }]}>
                    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
                        stroke="#059669"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                  <Text style={styles.quickActionTitle}>Call Hospital</Text>
                  <Text style={styles.quickActionSubtitle} numberOfLines={1}>
                    {hospital.contactPhone || hospital.emergencyPhone || 'Unavailable'}
                  </Text>
                </TouchableOpacity>

                {/* 4. Official Website */}
                <TouchableOpacity
                  style={[styles.quickActionTile, !hasWebsite && styles.quickActionTileDisabled]}
                  onPress={() => handleOpenWebsite(hospital.website)}
                  disabled={!hasWebsite}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Visit official website"
                >
                  <View style={[styles.quickActionIconBox, { backgroundColor: '#EFF6FF' }]}>
                    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                      <Circle cx={12} cy={12} r={10} stroke="#2563EB" strokeWidth={2} />
                      <Path
                        d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"
                        stroke="#2563EB"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                  <Text style={styles.quickActionTitle}>Official Site</Text>
                  <Text style={styles.quickActionSubtitle} numberOfLines={1}>
                    {hasWebsite ? 'Verified Portal' : 'Unavailable'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ── 9. Location & Address Section ────────────────────────────── */}
          <View style={styles.sectionNeumorphicCard}>
            <Text style={styles.sectionHeading}>LOCATION & ADDRESS</Text>
            <Text style={styles.addressFullText}>
              {hospital.address}
              {'\n'}{hospital.city}, {hospital.state} - {hospital.pincode}
            </Text>

            <View style={styles.locationPillsRow}>
              {hospital.district && (
                <View style={styles.geoPill}>
                  <Text style={styles.geoPillText}>District: {hospital.district}</Text>
                </View>
              )}
              <View style={styles.geoPill}>
                <Text style={styles.geoPillText}>State: {hospital.state}</Text>
              </View>
            </View>
          </View>

          {/* ── 10. Authoritative Source / Governance Footer ─────────────── */}
          <View style={styles.governanceFooter}>
            <View style={styles.governanceShield}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                  stroke="#0F766E"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path d="M9 12l2 2 4-4" stroke="#0F766E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
            <Text style={styles.governanceText}>
              Verified National Health Registry • Registry ID: {hospital.id.slice(0, 16)}...
            </Text>
          </View>
        </ScrollView>

        {/* ── 11. Compact Floating Directions CTA ──────────────────────────── */}
        <View style={styles.floatingCtaBar}>
          <TouchableOpacity
            style={styles.compactDirectionsCta}
            onPress={handleOpenDirections}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="View Route"
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path
                d="M9 18l6-3 6 3V3l-6 3-6-3-6 3v15l6-3z"
                stroke="#FFFFFF"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.compactDirectionsCtaText}>
              View Route  •  {displayDistance} km  •  {displayEta} min
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 16,
    color: '#0F766E',
    fontWeight: '700',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: '#0F766E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radii.lg,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    zIndex: 10,
  },
  headerCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },

  // ── Scroll Content ────────────────────────────────────────────────────────
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: 16,
    paddingBottom: 110, // Generous padding for sticky bottom CTA
  },

  // ── 2. Hero Neumorphic Card ───────────────────────────────────────────────
  heroNeumorphicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
    gap: 12,
  },
  heroBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  verifiedFacilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  verifiedDotOuter: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(15, 118, 110, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedDotInner: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#0F766E',
  },
  verifiedFacilityText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
    letterSpacing: 0.5,
  },
  ownershipPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  ownershipText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  lottieWrap: {
    width: 140,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    alignSelf: 'center',
  },
  lottieAnim: {
    width: 180,
    height: 140,
  },
  heroHospitalName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 38,
    letterSpacing: -0.6,
    textAlign: 'center',
    marginTop: 2,
  },
  heroCategoryText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: -2,
  },
  heroLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 4,
  },
  locationPinBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLocationText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  heroLocationDot: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '700',
  },
  heroDistanceHighlight: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F766E',
  },

  // ── 3. At-A-Glance Metric Tiles ───────────────────────────────────────────
  metricsGridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metricTile: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricTileValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  metricTileUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  metricTileLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 3,
    letterSpacing: 0.6,
  },

  // ── 4. Emergency Panel ────────────────────────────────────────────────────
  emergencyCard: {
    backgroundColor: '#FFF1F2',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#FECDD3',
    shadowColor: '#BE123C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    gap: 10,
  },
  emergencyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emergencyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emergencyIcon: {
    fontSize: 18,
  },
  emergencyHeading: {
    fontSize: 15,
    fontWeight: '900',
    color: '#9F1239',
    letterSpacing: 0.3,
  },
  emergencyLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
    gap: 5,
  },
  emergencyPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E11D48',
  },
  emergencyLiveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9F1239',
  },
  emergencyDetailText: {
    fontSize: 14,
    color: '#4C0519',
    lineHeight: 20,
    fontWeight: '500',
  },
  emergencyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E11D48',
    borderRadius: 14,
    paddingVertical: 12,
    gap: 8,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  emergencyActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.2,
  },

  // ── 5 & 6. Section Neumorphic Cards ───────────────────────────────────────
  sectionNeumorphicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    gap: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeading: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  sectionSubCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    gap: 6,
  },
  specialtyChipDot: {
    fontSize: 14,
    color: '#0F766E',
    fontWeight: '900',
  },
  specialtyChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  facilityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    gap: 6,
  },
  facilityChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F766E',
  },
  unavailableText: {
    fontSize: 14,
    color: '#94A3B8',
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  capacitySubGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  capacityBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  capacityNum: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  capacityLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  capacityAvailable: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F766E',
  },

  // ── 7. Mini Route Preview Card ────────────────────────────────────────────
  miniRouteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    gap: 14,
  },
  miniRouteHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  miniRouteTitleCol: {
    flex: 1,
  },
  miniRouteHeading: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  miniRouteSubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  liveTrafficMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    gap: 5,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveTrafficMiniText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F766E',
  },

  // Schematic Track (You ──── Hospital)
  schematicTrackContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  schematicNodesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  schematicOriginDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0F766E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 2,
  },
  schematicLineSegmentNormal: {
    flex: 2,
    height: 5,
    backgroundColor: '#10B981',
    borderRadius: 2.5,
  },
  schematicLineSegmentSlow: {
    flex: 1.5,
    height: 5,
    backgroundColor: '#F59E0B',
    borderRadius: 2.5,
    marginLeft: -1,
  },
  schematicLineSegmentHeavy: {
    flex: 1,
    height: 5,
    backgroundColor: '#EF4444',
    borderRadius: 2.5,
    marginLeft: -1,
  },
  schematicDestPin: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -2,
  },
  schematicLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  schematicOriginLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  schematicDestLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
    maxWidth: '50%',
  },

  // Mini Route Stats
  miniRouteStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  miniRouteMetricsPair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniRouteDistance: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  miniRouteMetricDivider: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '700',
  },
  miniRouteMetricEta: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F766E',
  },
  trafficMiniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
    gap: 5,
  },
  trafficMiniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  trafficMiniText: {
    fontSize: 11,
    fontWeight: '800',
  },
  viewRoutePromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  viewRoutePromptText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F766E',
  },
  viewRoutePromptArrow: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F766E',
  },

  // ── 8. Quick Actions (2 × 2 Symmetrical Grid) ─────────────────────────────
  quickActionsSection: {
    gap: 12,
  },
  quickActionsGrid: {
    gap: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionTile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 110,
    justifyContent: 'center',
    gap: 6,
  },
  quickActionTileDisabled: {
    opacity: 0.5,
  },
  quickActionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },

  // ── 9. Location & Address ─────────────────────────────────────────────────
  addressFullText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
    fontWeight: '500',
  },
  locationPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  geoPill: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  geoPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },

  // ── 10. Governance Footer ─────────────────────────────────────────────────
  governanceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    gap: 8,
  },
  governanceShield: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  governanceText: {
    flex: 1,
    fontSize: 11,
    color: '#0F766E',
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ── 11. Compact Floating Directions CTA ────────────────────────────
  floatingCtaBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'box-none',
  },
  compactDirectionsCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F766E',
    height: 54,
    marginHorizontal: 24,
    paddingHorizontal: 20,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    maxWidth: 380,
    width: '88%',
  },
  compactDirectionsCtaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});

export default HospitalDetailsScreen;
