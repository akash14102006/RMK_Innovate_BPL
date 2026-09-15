/**
 * Bharat PulseLink — Map Bottom Preview Card (Prompt 44)
 *
 * Neumorphic slide-up preview card for selected hospital on map canvas:
 * - Hospital name & verified badge
 * - Ownership & 24x7 indicators
 * - Distance, Rating, Beds, Doctors
 * - Services chips
 * - Direct "View Details" & "Book Appointment" CTAs
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { HospitalMapMarkerData } from '../../types/map';
import { radii, spacing } from '../../theme/tokens';

export interface MapBottomPreviewCardProps {
  hospital: HospitalMapMarkerData | null;
  onClose: () => void;
  onViewDetails: (hospital: HospitalMapMarkerData) => void;
  onGetDirections?: (hospital: HospitalMapMarkerData) => void;
  onBookAppointment: (hospital: HospitalMapMarkerData) => void;
  onCheckIn?: (hospital: HospitalMapMarkerData) => void;
}

export const MapBottomPreviewCard: React.FC<MapBottomPreviewCardProps> = ({
  hospital,
  onClose,
  onViewDetails,
  onGetDirections,
  onBookAppointment,
  onCheckIn,
}) => {
  if (!hospital) return null;

  const isGovt = hospital.ownership === 'GOVERNMENT' || hospital.ownership === 'PUBLIC_SECTOR';
  const raw = hospital.rawHospital;
  const categoryBadge = [raw?.hospitalCategory, raw?.hospitalCareType].filter(Boolean).join(' • ') ||
    (isGovt ? 'GOVERNMENT FACILITY' : 'HEALTHCARE FACILITY');

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Top Handle & Close */}
        <View style={styles.topRow}>
          <View style={styles.ownershipPill}>
            <Text style={[styles.ownershipText, { color: isGovt ? '#0F766E' : '#4F46E5' }]}>
              {categoryBadge.toUpperCase()}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close preview"
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path d="M18 6L6 18M6 6l12 12" stroke="#64748B" strokeWidth={2} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Hospital Title & Rating */}
        <View style={styles.titleRow}>
          <Text style={styles.hospitalName} numberOfLines={2}>
            {hospital.name}
          </Text>
          {hospital.rating && (
            <View style={styles.ratingBadge}>
              <Text style={styles.starText}>★</Text>
              <Text style={styles.ratingText}>{hospital.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>

        {/* Distance & Hours */}
        <View style={styles.metaRow}>
          <Text style={styles.distanceText}>📍 {hospital.distanceKm.toFixed(1)} km away</Text>
          <Text style={styles.dotSeparator}>•</Text>
          <Text style={[styles.hoursText, { color: hospital.is24x7 ? '#059669' : '#475569' }]}>
            {hospital.is24x7 ? '24x7 Open' : 'Open Regular Hours'}
          </Text>
        </View>

        {/* Capacity Metrics */}
        {(hospital.totalBeds || hospital.totalDoctors) && (
          <View style={styles.capacityRow}>
            {hospital.totalBeds && (
              <View style={styles.capacityPill}>
                <Text style={styles.capacityLabel}>Total Beds: </Text>
                <Text style={styles.capacityValue}>{hospital.totalBeds}</Text>
              </View>
            )}
            {hospital.totalDoctors && (
              <View style={styles.capacityPill}>
                <Text style={styles.capacityLabel}>Doctors: </Text>
                <Text style={styles.capacityValue}>{hospital.totalDoctors}</Text>
              </View>
            )}
          </View>
        )}

        {/* Service Chips */}
        {hospital.services && hospital.services.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.servicesScroll}
          >
            {hospital.services.slice(0, 4).map((svc) => (
              <View key={svc} style={styles.serviceChip}>
                <Text style={styles.serviceChipText}>{svc}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          {onCheckIn && (
            <TouchableOpacity
              style={styles.checkInBtn}
              onPress={() => onCheckIn(hospital)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Check in at ${hospital.name}`}
            >
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={styles.checkInBtnText}>Check In</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.detailsBtn}
            onPress={() => onViewDetails(hospital)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`View full details of ${hospital.name}`}
          >
            <Text style={styles.detailsBtnText}>Details</Text>
          </TouchableOpacity>

          {onGetDirections && (
            <TouchableOpacity
              style={styles.directionsBtn}
              onPress={() => onGetDirections(hospital)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Get directions to ${hospital.name}`}
            >
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Path d="M9 18l6-3 6 3V3l-6 3-6-3-6 3v15l6-3z" stroke="#0F766E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={styles.directionsBtnText}>Directions</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => onBookAppointment(hospital)}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={`Book appointment at ${hospital.name}`}
          >
            <Text style={styles.bookBtnText}>Book →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 12,
    left: spacing.md,
    right: spacing.md,
    zIndex: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  ownershipPill: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ownershipText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  hospitalName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  starText: {
    fontSize: 11,
    color: '#D97706',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F766E',
  },
  dotSeparator: {
    color: '#CBD5E1',
  },
  hoursText: {
    fontSize: 12,
    fontWeight: '600',
  },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  capacityPill: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  capacityLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  capacityValue: {
    fontSize: 11,
    color: '#0F172A',
    fontWeight: '700',
  },
  servicesScroll: {
    gap: 6,
    paddingBottom: 10,
  },
  serviceChip: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  serviceChipText: {
    fontSize: 11,
    color: '#0F766E',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  checkInBtn: {
    flex: 1.1,
    flexDirection: 'row',
    backgroundColor: '#0F766E',
    paddingVertical: 10,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  checkInBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  detailsBtn: {
    flex: 1.1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 10,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  directionsBtn: {
    flex: 1.1,
    flexDirection: 'row',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingVertical: 10,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  directionsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  bookBtn: {
    flex: 0.9,
    backgroundColor: '#0F766E',
    paddingVertical: 10,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  bookBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default MapBottomPreviewCard;
