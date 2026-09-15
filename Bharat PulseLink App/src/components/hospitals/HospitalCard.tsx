/**
 * Bharat PulseLink — World-Class Hospital Card Component (Prompt 45)
 *
 * Top 1% healthcare discovery card:
 * 1. Neumorphic elevation with subtle glass depth
 * 2. Ownership badge (GOVERNMENT vs PRIVATE)
 * 3. Real backend-authoritative distance & hours
 * 4. Capacity metrics (Beds, Doctors) only when verified (unknown != zero)
 * 5. Clean service chips with "+N more" overflow
 * 6. Actionable three-dot menu and full card tap
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, spacing, radii } from '../../theme/tokens';
import { HospitalSummaryItem } from '../../types/hospitals';

export interface HospitalCardProps {
  hospital: HospitalSummaryItem;
  onPress: (hospital: HospitalSummaryItem) => void;
  onPressMenu?: (hospital: HospitalSummaryItem) => void;
}

export const HospitalCard: React.FC<HospitalCardProps> = memo(
  ({ hospital, onPress, onPressMenu }) => {
    const isGovernment =
      hospital.ownership === 'GOVERNMENT' || hospital.ownership === 'PUBLIC_SECTOR';
    const themeColor = isGovernment ? '#0F766E' : '#4F46E5';

    // Show up to 3 services and compute overflow count
    const visibleServices = hospital.services ? hospital.services.slice(0, 3) : [];
    const overflowServicesCount =
      hospital.services && hospital.services.length > 3
        ? hospital.services.length - 3
        : 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => onPress(hospital)}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel={`${hospital.name}, ${isGovernment ? 'Government' : 'Private'} Hospital. ${hospital.distanceKm} kilometers away. ${hospital.is24x7 ? '24x7 Open' : hospital.operatingHoursText}.`}
      >
        {/* Top Ownership & Action Row */}
        <View style={styles.topRow}>
          <View style={styles.ownershipPill}>
            <Text style={[styles.ownershipText, { color: themeColor }]}>
              {isGovernment ? 'GOVERNMENT HOSPITAL' : 'PRIVATE SUPER SPECIALTY'}
            </Text>
          </View>

          {/* Three-dot menu button */}
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => (onPressMenu ? onPressMenu(hospital) : onPress(hospital))}
            accessibilityRole="button"
            accessibilityLabel={`Options for ${hospital.name}`}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Circle cx="12" cy="12" r="1.5" fill="#64748B" />
              <Circle cx="6" cy="12" r="1.5" fill="#64748B" />
              <Circle cx="18" cy="12" r="1.5" fill="#64748B" />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Facility Header Section */}
        <View style={styles.headerSection}>
          {/* Facility Emblem */}
          <View
            style={[
              styles.iconBox,
              { backgroundColor: isGovernment ? '#F0FDFA' : '#EEF2FF' },
            ]}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path
                d="M3 21h18M5 21V7l8-4v18M13 21V3l6 4v14"
                stroke={themeColor}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M9 10h.01M9 14h.01M17 10h.01M17 14h.01"
                stroke={themeColor}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            </Svg>
          </View>

          {/* Hospital Title, Verified Badge & Rating */}
          <View style={styles.titleColumn}>
            <View style={styles.nameRow}>
              <Text style={styles.hospitalName} numberOfLines={2}>
                {hospital.name}
              </Text>
              {hospital.verified && (
                <View style={styles.verifiedBadge} accessible accessibilityLabel="Verified Facility">
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                    <Circle cx={12} cy={12} r={10} fill="#0F766E" />
                    <Path
                      d="M8 12l3 3 5-5"
                      stroke="#FFFFFF"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
              )}
            </View>

            {/* Distance & Hours Row */}
            <View style={styles.metaRow}>
              <Text style={styles.distanceText}>
                📍 {hospital.distanceKm.toFixed(1)} km away
              </Text>
              <Text style={styles.dotDivider}>•</Text>
              <Text
                style={[
                  styles.hoursText,
                  { color: hospital.is24x7 ? '#059669' : '#64748B' },
                ]}
              >
                {hospital.is24x7 ? '24x7 Open' : hospital.operatingHoursText}
              </Text>
            </View>
          </View>
        </View>

        {/* Capacity Row (Rendered ONLY when backend provides authoritative metrics) */}
        {(hospital.totalBeds !== undefined || hospital.totalDoctors !== undefined || hospital.rating !== undefined) && (
          <View style={styles.statsBar}>
            {hospital.totalBeds !== undefined && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Beds: </Text>
                <Text style={styles.statValue}>{hospital.totalBeds}</Text>
              </View>
            )}

            {hospital.totalBeds !== undefined && hospital.totalDoctors !== undefined && (
              <Text style={styles.statDivider}>|</Text>
            )}

            {hospital.totalDoctors !== undefined && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Doctors: </Text>
                <Text style={styles.statValue}>{hospital.totalDoctors}</Text>
              </View>
            )}

            {hospital.rating !== undefined && (
              <>
                <Text style={styles.statDivider}>|</Text>
                <View style={styles.ratingBadge}>
                  <Text style={styles.starText}>★</Text>
                  <Text style={styles.ratingValue}>{hospital.rating.toFixed(1)}</Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Verified Services Chips */}
        {visibleServices.length > 0 && (
          <View style={styles.servicesRow}>
            {visibleServices.map((svc) => (
              <View key={svc} style={styles.servicePill}>
                <Text style={styles.serviceText}>{svc}</Text>
              </View>
            ))}
            {overflowServicesCount > 0 && (
              <View style={styles.overflowPill}>
                <Text style={styles.overflowText}>+{overflowServicesCount} more</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  }
);

HospitalCard.displayName = 'HospitalCard';

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  menuBtn: {
    padding: 4,
    borderRadius: radii.full,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleColumn: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hospitalName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  verifiedBadge: {
    marginTop: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 6,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  dotDivider: {
    fontSize: 11,
    color: '#CBD5E1',
  },
  hoursText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: radii.md,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm,
    gap: 8,
    marginTop: 2,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  statDivider: {
    fontSize: 11,
    color: '#CBD5E1',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  starText: {
    fontSize: 11,
    color: '#D97706',
  },
  ratingValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  servicesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 2,
  },
  servicePill: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  serviceText: {
    fontSize: 11,
    color: '#0F766E',
    fontWeight: '600',
  },
  overflowPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  overflowText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
});

export default HospitalCard;
