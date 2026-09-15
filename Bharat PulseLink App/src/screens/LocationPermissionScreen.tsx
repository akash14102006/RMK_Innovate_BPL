/**
 * Bharat PulseLink — Location Permission & Selection Screen (Prompt 43)
 *
 * Enterprise-grade location gateway for Hospital Discovery:
 * 1. Custom pre-permission explanation before OS dialog
 * 2. Real device location with one-shot foreground fetch
 * 3. State machine handling GRANTED, DENIED, SETTINGS_REQUIRED, SERVICES_DISABLED, TIMEOUT
 * 4. Offline manual search across Indian States, Districts, Cities, Localities, Pincodes
 * 5. Privacy guarantees: foreground-only, zero background tracking, zero persistent GPS storage
 * 6. Clean handoff to HospitalDiscoveryService
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors, spacing, radii } from '../theme/tokens';
import LocationVisualHero from '../components/location/LocationVisualHero';
import { useLocationService } from '../hooks/useLocationService';
import { ManualLocationItem } from '../types/location';

export const LocationPermissionScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  const {
    flowState,
    isLocating,
    errorMessage,
    manualSearchQuery,
    manualResults,
    requestCurrentLocation,
    setSearchQuery,
    selectManualLocation,
    openSettings,
    cancelLocating,
    retryGps,
  } = useLocationService((selectedLoc) => {
    // Handoff: navigate to Hospitals with selected location active
    navigation.navigate('Hospitals');
  });

  const handleUseCurrentLocation = async () => {
    const loc = await requestCurrentLocation();
    if (loc) {
      navigation.navigate('Hospitals');
    }
  };

  const handleSelectManual = async (item: ManualLocationItem) => {
    await selectManualLocation(item);
    setIsManualModalOpen(false);
    navigation.navigate('Hospitals');
  };

  const handleSkip = () => {
    navigation.navigate('Hospitals');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go Back"
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M19 12H5M12 19l-7-7 7-7"
                stroke={colors.textPrimary}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Location Access</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Visual */}
          <LocationVisualHero />

          {/* Main Title & Subtitle */}
          <View style={styles.textSection}>
            <Text style={styles.title}>Find hospitals near you</Text>
            <Text style={styles.subtitle}>
              Use your current location to discover nearby hospitals faster.
            </Text>
          </View>

          {/* Status Banners (State Machine feedback) */}
          {flowState === 'SETTINGS_REQUIRED' && (
            <View style={styles.alertBanner}>
              <View style={styles.alertHeader}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Circle cx={12} cy={12} r={10} stroke="#B45309" strokeWidth={2} />
                  <Path d="M12 8v4M12 16h.01" stroke="#B45309" strokeWidth={2} strokeLinecap="round" />
                </Svg>
                <Text style={styles.alertTitle}>Location Access Turned Off</Text>
              </View>
              <Text style={styles.alertText}>
                Location permission is disabled for Bharat PulseLink. Enable it in settings or choose your location manually.
              </Text>
              <TouchableOpacity
                style={styles.settingsBtn}
                onPress={openSettings}
                accessibilityRole="button"
              >
                <Text style={styles.settingsBtnText}>Open Device Settings</Text>
              </TouchableOpacity>
            </View>
          )}

          {flowState === 'SERVICES_DISABLED' && (
            <View style={styles.alertBanner}>
              <View style={styles.alertHeader}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Circle cx={12} cy={12} r={10} stroke="#B45309" strokeWidth={2} />
                  <Path d="M12 8v4M12 16h.01" stroke="#B45309" strokeWidth={2} strokeLinecap="round" />
                </Svg>
                <Text style={styles.alertTitle}>Location Services Disabled</Text>
              </View>
              <Text style={styles.alertText}>
                GPS / location services are turned off on your device. Turn on location or select your city manually.
              </Text>
              <TouchableOpacity
                style={styles.settingsBtn}
                onPress={openSettings}
                accessibilityRole="button"
              >
                <Text style={styles.settingsBtnText}>Open Settings</Text>
              </TouchableOpacity>
            </View>
          )}

          {(flowState === 'TIMEOUT' || flowState === 'ERROR') && (
            <View style={[styles.alertBanner, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
              <Text style={[styles.alertTitle, { color: '#991B1B' }]}>
                {flowState === 'TIMEOUT' ? 'GPS Signal Timed Out' : 'Location Detection Failed'}
              </Text>
              <Text style={[styles.alertText, { color: '#B91C1C' }]}>
                {errorMessage || 'Unable to determine GPS location. You can retry or search your city manually.'}
              </Text>
              <TouchableOpacity
                style={[styles.settingsBtn, { backgroundColor: '#DC2626' }]}
                onPress={retryGps}
                accessibilityRole="button"
              >
                <Text style={styles.settingsBtnText}>Retry Current Location</Text>
              </TouchableOpacity>
            </View>
          )}

          {flowState === 'DENIED' && (
            <View style={styles.infoBanner}>
              <Text style={styles.infoBannerText}>
                You can still search hospitals by city, district, or pincode.
              </Text>
            </View>
          )}

          {/* Privacy & Trust Features */}
          <View style={styles.featuresCard}>
            <View style={styles.featureRow}>
              <View style={styles.featureIconBox}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#0F766E" strokeWidth={2} />
                </Svg>
              </View>
              <View style={styles.featureTextBox}>
                <Text style={styles.featureTitle}>Foreground Only</Text>
                <Text style={styles.featureSubtitle}>
                  Location is used only while you are actively searching for hospitals. Never tracked in background.
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.featureRow}>
              <View style={styles.featureIconBox}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Rect x={3} y={4} width={18} height={18} rx={2} stroke="#0F766E" strokeWidth={2} />
                  <Path d="M16 2v4M8 2v4M3 10h18" stroke="#0F766E" strokeWidth={2} />
                </Svg>
              </View>
              <View style={styles.featureTextBox}>
                <Text style={styles.featureTitle}>Real Distances & Verified Care</Text>
                <Text style={styles.featureSubtitle}>
                  Calculates true distances to nearby emergency, government, and private hospitals.
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.featureRow}>
              <View style={styles.featureIconBox}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="#0F766E" strokeWidth={2} />
                </Svg>
              </View>
              <View style={styles.featureTextBox}>
                <Text style={styles.featureTitle}>Privacy Protected</Text>
                <Text style={styles.featureSubtitle}>
                  Your coordinates are never sent to analytics or permanently saved to your profile.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Actions Bar */}
        <View style={styles.bottomActions}>
          {isLocating ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#0F766E" />
              <Text style={styles.loadingLabel}>Detecting GPS location...</Text>
              <TouchableOpacity style={styles.cancelLink} onPress={cancelLocating}>
                <Text style={styles.cancelLinkText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Primary CTA */}
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleUseCurrentLocation}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel="Use Current Location"
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Circle cx={12} cy={12} r={3} fill="#FFFFFF" />
                  <Path
                    d="M12 2v3M12 19v3M2 12h3M19 12h3"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                  <Circle cx={12} cy={12} r={7} stroke="#FFFFFF" strokeWidth={2} />
                </Svg>
                <Text style={styles.primaryBtnText}>Use Current Location</Text>
              </TouchableOpacity>

              {/* Secondary CTA */}
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => setIsManualModalOpen(true)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Choose Location Manually"
              >
                <Text style={styles.secondaryBtnText}>Choose Location Manually</Text>
              </TouchableOpacity>

              {/* Tertiary CTA */}
              <TouchableOpacity
                style={styles.skipBtn}
                onPress={handleSkip}
                accessibilityRole="button"
                accessibilityLabel="Not Now"
              >
                <Text style={styles.skipBtnText}>Not Now</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Manual Location Selection Modal / Overlay */}
        {isManualModalOpen && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Choose City or Area</Text>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setIsManualModalOpen(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path d="M18 6L6 18M6 6l12 12" stroke="#64748B" strokeWidth={2} strokeLinecap="round" />
                  </Svg>
                </TouchableOpacity>
              </View>

              {/* Search Bar */}
              <View style={styles.modalSearchBox}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Circle cx={11} cy={11} r={8} stroke="#64748B" strokeWidth={2} />
                  <Path d="M21 21l-4.35-4.35" stroke="#64748B" strokeWidth={2} strokeLinecap="round" />
                </Svg>
                <TextInput
                  style={styles.modalSearchInput}
                  placeholder="Search city, district, area or pincode..."
                  placeholderTextColor="#94A3B8"
                  value={manualSearchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                  accessible
                  accessibilityLabel="Search location by city, district, area, or pincode"
                />
                {manualSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Circle cx={12} cy={12} r={10} fill="#E2E8F0" />
                      <Path d="M15 9l-6 6M9 9l6 6" stroke="#475569" strokeWidth={1.5} strokeLinecap="round" />
                    </Svg>
                  </TouchableOpacity>
                )}
              </View>

              {/* Indian Locations List */}
              <FlatList
                data={manualResults}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.locationRow}
                    onPress={() => handleSelectManual(item)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={item.displayName}
                  >
                    <View style={styles.rowPinIcon}>
                      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                          stroke="#0F766E"
                          strokeWidth={2}
                        />
                        <Circle cx={12} cy={9} r={2.5} fill="#0F766E" />
                      </Svg>
                    </View>
                    <View style={styles.rowDetails}>
                      <Text style={styles.rowTitle}>{item.name}</Text>
                      <Text style={styles.rowSubtitle}>
                        {item.city}, {item.state} • {item.pincode}
                      </Text>
                    </View>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Path d="M9 18l6-6-6-6" stroke="#94A3B8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>No matching Indian location found</Text>
                    <Text style={styles.emptySubtitle}>
                      Try searching by major city (e.g., Chennai, Bengaluru, Delhi, Mumbai, Hyderabad) or pincode.
                    </Text>
                  </View>
                }
              />
            </View>
          </View>
        )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  textSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
  alertBanner: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  alertText: {
    fontSize: 13,
    color: '#B45309',
    lineHeight: 18,
    marginBottom: 8,
  },
  settingsBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#0F766E',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.sm,
    marginTop: 4,
  },
  settingsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoBanner: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  infoBannerText: {
    fontSize: 13,
    color: '#0F766E',
    textAlign: 'center',
    fontWeight: '600',
  },
  featuresCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginTop: spacing.xs,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  featureIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    marginTop: 2,
  },
  featureTextBox: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  featureSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  bottomActions: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: '#0F766E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radii.md,
    gap: 8,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: radii.md,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F766E',
  },
  skipBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  skipBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  loadingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F766E',
  },
  cancelLink: {
    marginLeft: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  cancelLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
    zIndex: 999,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '85%',
    minHeight: '60%',
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    gap: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 2,
  },
  listContent: {
    paddingVertical: spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowPinIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rowDetails: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  rowSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default LocationPermissionScreen;
