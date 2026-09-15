import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing, radii, typography } from '../../theme/tokens';
import { GeoLocationState } from '../../types/hospitals';
import { DEFAULT_INDIAN_LOCATIONS } from '../../services/HospitalDiscoveryService';

export interface LocationPickerModalProps {
  visible: boolean;
  selectedLocation: GeoLocationState;
  onClose: () => void;
  onSelectLocation: (location: GeoLocationState) => void;
  onOpenPermissionScreen?: () => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  visible,
  selectedLocation,
  onClose,
  onSelectLocation,
  onOpenPermissionScreen,
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheetPanel}>
          <View style={styles.handleBar} />

          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Location</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} accessibilityLabel="Close Location Picker">
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path d="M18 6L6 18M6 6l12 12" stroke="#64748B" strokeWidth={2.2} strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* GPS Option */}
            <TouchableOpacity
              style={styles.gpsOption}
              onPress={() => {
                onClose();
                if (onOpenPermissionScreen) {
                  onOpenPermissionScreen();
                } else {
                  onSelectLocation({
                    label: 'Current GPS Location',
                    isGps: true,
                    city: 'Current Area',
                    state: 'India',
                  });
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="Use Current GPS Location"
            >
              <View style={styles.gpsIconBox}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 2v3M12 19v3M2 12h3M19 12h3M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"
                    stroke="#0F766E"
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                </Svg>
              </View>
              <View style={styles.gpsTextCol}>
                <Text style={styles.gpsTitle}>Use Current GPS Location</Text>
                <Text style={styles.gpsSubtitle}>Detect nearest verified facilities</Text>
              </View>
            </TouchableOpacity>

            {/* Custom Search Option */}
            <TouchableOpacity
              style={styles.searchAllOption}
              onPress={() => {
                onClose();
                if (onOpenPermissionScreen) {
                  onOpenPermissionScreen();
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="Search all Indian cities and pincodes"
            >
              <View style={styles.searchIconBox}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35"
                    stroke="#0F766E"
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                </Svg>
              </View>
              <View style={styles.gpsTextCol}>
                <Text style={styles.searchAllTitle}>Search All Cities & Pincodes</Text>
                <Text style={styles.gpsSubtitle}>Choose district, locality, or town manually</Text>
              </View>
            </TouchableOpacity>

            <Text style={styles.sectionHeading}>POPULAR INDIAN HEALTH HUBS</Text>

            {/* Default Indian Cities */}
            {DEFAULT_INDIAN_LOCATIONS.map((loc) => {
              const isSelected = selectedLocation.label === loc.label;
              return (
                <TouchableOpacity
                  key={loc.label}
                  style={[styles.cityRow, isSelected && styles.cityRowSelected]}
                  onPress={() => {
                    onSelectLocation(loc);
                    onClose();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${loc.label}`}
                >
                  <View style={styles.cityTextCol}>
                    <Text style={[styles.cityTitle, isSelected && styles.cityTitleSelected]}>
                      {loc.city}
                    </Text>
                    <Text style={styles.cityState}>{loc.state}</Text>
                  </View>

                  {isSelected && (
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                      <Path d="M20 6L9 17l-5-5" stroke="#0F766E" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheetPanel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 34,
    paddingHorizontal: spacing.md,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.8)',
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  content: {
    gap: 10,
  },
  gpsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 118, 110, 0.06)',
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.15)',
    gap: 12,
    marginBottom: spacing.sm,
  },
  gpsIconBox: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsTextCol: {
    flex: 1,
  },
  gpsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F766E',
  },
  gpsSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  searchAllOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    marginBottom: spacing.sm,
  },
  searchIconBox: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchAllTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    marginBottom: 4,
  },
  cityRowSelected: {
    backgroundColor: '#F1F5F9',
  },
  cityTextCol: {
    gap: 2,
  },
  cityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cityTitleSelected: {
    color: '#0F766E',
    fontWeight: '800',
  },
  cityState: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});

export default LocationPickerModal;
