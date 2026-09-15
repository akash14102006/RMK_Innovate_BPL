/**
 * Bharat PulseLink — Dedicated Production Hospital Search Screen (Prompt 47)
 *
 * Search across:
 * 1. Hospital Name
 * 2. Specialty & Clinical Department
 * 3. Area, Locality & Indian Pincode
 * 4. Healthcare Services & Emergency Facilities
 *
 * Privacy & Performance Guarantees:
 * - Debounced queries (300ms) with cancellation
 * - Newest query version wins
 * - Clearable local search history (stored privately)
 * - Zero sensitive health query telemetry
 * - Synchronized with location & filter context
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, spacing, radii, typography } from '../theme/tokens';
import { useHospitalDiscovery } from '../hooks/useHospitalDiscovery';
import { HospitalSummaryItem } from '../types/hospitals';
import HospitalCard from '../components/hospitals/HospitalCard';
import HospitalEmptyState from '../components/hospitals/HospitalEmptyState';
import HospitalDetailsModal from '../components/hospitals/HospitalDetailsModal';
import SecureStoreService from '../services/secureStore';

const STORAGE_KEY_RECENT_SEARCHES = 'bharat_recent_hospital_searches';

const SUGGESTED_SPECIALTIES = [
  'Cardiology',
  'Pediatrics',
  'Orthopedics',
  'Oncology',
  'Emergency',
  'ICU',
  'Diagnostics',
];

export const HospitalSearchScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const inputRef = useRef<TextInput>(null);

  const {
    searchQuery,
    setSearchQuery,
    location,
    hospitals,
    totalCount,
    isLoading,
    refetch,
    selectedHospital,
    setSelectedHospital,
  } = useHospitalDiscovery();

  const [inputVal, setInputVal] = useState(searchQuery);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRequestId = useRef<number>(0);

  // Load recent searches from private storage
  useEffect(() => {
    SecureStoreService.get(STORAGE_KEY_RECENT_SEARCHES).then((data) => {
      if (data) {
        try {
          setRecentSearches(JSON.parse(data));
        } catch {}
      }
    });
  }, []);

  // Auto-focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Standardized 300ms debounce with request version protection
  useEffect(() => {
    const currentReq = ++searchRequestId.current;
    const timer = setTimeout(() => {
      if (currentReq === searchRequestId.current) {
        setSearchQuery(inputVal);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputVal, setSearchQuery]);

  const saveRecentSearch = async (term: string) => {
    const clean = term.trim();
    if (!clean || clean.length < 2) return;

    const updated = [clean, ...recentSearches.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(
      0,
      5
    );
    setRecentSearches(updated);
    try {
      await SecureStoreService.set(STORAGE_KEY_RECENT_SEARCHES, JSON.stringify(updated));
    } catch {}
  };

  const handleClearRecentSearches = async () => {
    setRecentSearches([]);
    try {
      await SecureStoreService.remove(STORAGE_KEY_RECENT_SEARCHES);
    } catch {}
  };

  const handleSelectSuggestion = (term: string) => {
    setInputVal(term);
    setSearchQuery(term);
    saveRecentSearch(term);
    Keyboard.dismiss();
  };

  const handleClearInput = () => {
    setInputVal('');
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const handleSelectHospital = (hosp: HospitalSummaryItem) => {
    if (inputVal.trim()) {
      saveRecentSearch(inputVal.trim());
    }
    setSelectedHospital(hosp);
  };

  const handleBookAppointment = (hosp: HospitalSummaryItem) => {
    setSelectedHospital(null);
    navigation.navigate('Appointments');
  };

  const handleGetDirections = (hosp: HospitalSummaryItem) => {
    setSelectedHospital(null);
    navigation.navigate('HospitalRoute', {
      hospital: hosp,
    });
  };

  const handleViewHospitalDetails = (hosp: HospitalSummaryItem) => {
    setSelectedHospital(null);
    navigation.navigate('HospitalDetails', { hospitalId: hosp.id });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Search Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
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

          <View style={styles.inputWrapper}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={styles.searchIcon}>
              <Circle cx={11} cy={11} r={8} stroke="#0F766E" strokeWidth={2} />
              <Path d="M21 21l-4.35-4.35" stroke="#0F766E" strokeWidth={2} strokeLinecap="round" />
            </Svg>

            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Search hospitals, specialty, pincode..."
              placeholderTextColor="#94A3B8"
              value={inputVal}
              onChangeText={setInputVal}
              returnKeyType="search"
              onSubmitEditing={() => {
                if (inputVal.trim()) saveRecentSearch(inputVal.trim());
              }}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Search hospitals, specialties, departments, or Indian pincode"
            />

            {inputVal.length > 0 && (
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={handleClearInput}
                accessibilityRole="button"
                accessibilityLabel="Clear search input"
              >
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="#64748B"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Location Context Pill */}
        <View style={styles.locationContext}>
          <Text style={styles.locationContextText}>
            Searching in <Text style={styles.locationBold}>{location.label}</Text>
          </Text>
        </View>

        {/* Suggestions & Recent Searches (When input is empty) */}
        {!inputVal.trim() ? (
          <View style={styles.suggestionsContainer}>
            {recentSearches.length > 0 && (
              <View style={styles.suggestionSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>RECENT SEARCHES</Text>
                  <TouchableOpacity onPress={handleClearRecentSearches}>
                    <Text style={styles.clearRecentText}>Clear</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.tagWrap}>
                  {recentSearches.map((term) => (
                    <TouchableOpacity
                      key={term}
                      style={styles.recentTag}
                      onPress={() => handleSelectSuggestion(term)}
                      accessibilityRole="button"
                    >
                      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                        <Circle cx={12} cy={12} r={10} stroke="#94A3B8" strokeWidth={1.5} />
                        <Path d="M12 6v6l4 2" stroke="#94A3B8" strokeWidth={1.5} strokeLinecap="round" />
                      </Svg>
                      <Text style={styles.recentTagText}>{term}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.suggestionSection}>
              <Text style={styles.sectionTitle}>POPULAR SPECIALTIES & FACILITIES</Text>
              <View style={styles.tagWrap}>
                {SUGGESTED_SPECIALTIES.map((spec) => (
                  <TouchableOpacity
                    key={spec}
                    style={styles.specTag}
                    onPress={() => handleSelectSuggestion(spec)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.specTagText}>{spec}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ) : (
          /* Live Results List */
          <FlatList
            data={hospitals}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <HospitalCard
                hospital={item}
                onPress={handleSelectHospital}
                onPressMenu={handleSelectHospital}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              hospitals.length > 0 ? (
                <View style={styles.resultsHeader}>
                  <Text style={styles.resultsCountText}>
                    Matching Hospitals ({totalCount})
                  </Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#0F766E" />
                  <Text style={styles.loadingText}>Searching directory...</Text>
                </View>
              ) : (
                <HospitalEmptyState
                  type="SEARCH"
                  searchQuery={inputVal}
                  onClearSearch={handleClearInput}
                  onChangeLocation={() => navigation.navigate('LocationPermission')}
                  onRetry={refetch}
                />
              )
            }
          />
        )}

        {/* Hospital Details Full Modal */}
        <HospitalDetailsModal
          visible={Boolean(selectedHospital)}
          hospital={selectedHospital}
          onClose={() => setSelectedHospital(null)}
          onViewDetails={handleViewHospitalDetails}
          onBookAppointment={handleBookAppointment}
          onGetDirections={handleGetDirections}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: radii.full,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  locationContext: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: '#F0FDFA',
    borderBottomWidth: 1,
    borderBottomColor: '#CCFBF1',
  },
  locationContextText: {
    fontSize: 12,
    color: '#0F766E',
    fontWeight: '500',
  },
  locationBold: {
    fontWeight: '800',
  },
  suggestionsContainer: {
    padding: spacing.md,
    gap: 24,
  },
  suggestionSection: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  clearRecentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    gap: 6,
  },
  recentTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  specTag: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
  },
  specTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F766E',
  },
  resultsHeader: {
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.sm,
  },
  resultsCountText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  listContent: {
    padding: spacing.md,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
});

export default HospitalSearchScreen;
