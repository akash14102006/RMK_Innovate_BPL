/**
 * Bharat PulseLink — Production Edit Profile Screen (Prompt 78)
 *
 * Patient demographic modification:
 * 1. Editable personal fields (Full Name, Address, City, State, Pincode)
 * 2. Immutable/Locked verified identity fields (ABHA ID, Aadhaar, DOB, Gender)
 * 3. Client validation & instant encrypted persistence.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, spacing, radii } from '../theme/tokens';
import AccountManagementService from '../services/AccountManagementService';
import { UserAccountProfile } from '../types/account';

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [profile, setProfile] = useState<UserAccountProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Form State
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [addressLine1, setAddressLine1] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [stateName, setStateName] = useState<string>('');
  const [pincode, setPincode] = useState<string>('');

  useEffect(() => {
    AccountManagementService.getUserProfile().then((data) => {
      setProfile(data);
      setFullName(data.fullName);
      setEmail(data.email);
      setAddressLine1(data.addressLine1);
      setCity(data.city);
      setStateName(data.state);
      setPincode(data.pincode);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!fullName.trim() || !city.trim() || !pincode.trim()) {
      Alert.alert('Required Fields', 'Please fill in your name, city, and pincode.');
      return;
    }

    setSaving(true);
    try {
      await AccountManagementService.updateUserProfile({
        fullName: fullName.trim(),
        email: email.trim(),
        addressLine1: addressLine1.trim(),
        city: city.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
      });

      Alert.alert('Profile Updated', 'Your personal details were saved successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.loadingText}>Loading profile details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back"
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

          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Verified / Locked Fields Notice */}
          <View style={styles.lockedFieldsCard}>
            <View style={styles.lockedHeaderRow}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Circle cx={12} cy={12} r={10} stroke="#0F766E" strokeWidth={2} />
                <Path d="M12 8v4M12 16h.01" stroke="#0F766E" strokeWidth={2} strokeLinecap="round" />
              </Svg>
              <Text style={styles.lockedHeading}>GOVERNMENT VERIFIED IDENTITY (LOCKED)</Text>
            </View>
            <Text style={styles.lockedSub}>
              ABHA ID, Aadhaar, Date of Birth, and Gender are verified against the National Health Registry and cannot be casually changed here.
            </Text>

            <View style={styles.lockedGrid}>
              <View style={styles.lockedItem}>
                <Text style={styles.lockedItemLabel}>ABHA NUMBER</Text>
                <Text style={styles.lockedItemVal}>{profile.abhaId}</Text>
              </View>
              <View style={styles.lockedItem}>
                <Text style={styles.lockedItemLabel}>AADHAAR</Text>
                <Text style={styles.lockedItemVal}>{profile.aadhaarMasked}</Text>
              </View>
              <View style={styles.lockedItem}>
                <Text style={styles.lockedItemLabel}>DATE OF BIRTH</Text>
                <Text style={styles.lockedItemVal}>{profile.dateOfBirth}</Text>
              </View>
              <View style={styles.lockedItem}>
                <Text style={styles.lockedItemLabel}>GENDER</Text>
                <Text style={styles.lockedItemVal}>{profile.gender}</Text>
              </View>
            </View>
          </View>

          {/* 2. Editable Demographic Fields */}
          <View style={styles.formSection}>
            <Text style={styles.sectionHeading}>EDITABLE PERSONAL DETAILS</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FULL NAME *</Text>
              <TextInput
                style={styles.textInput}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Full Name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                placeholder="email@domain.com"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>STREET ADDRESS</Text>
              <TextInput
                style={styles.textInput}
                value={addressLine1}
                onChangeText={setAddressLine1}
                placeholder="Flat / House / Street"
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>CITY *</Text>
                <TextInput
                  style={styles.textInput}
                  value={city}
                  onChangeText={setCity}
                  placeholder="City"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>STATE</Text>
                <TextInput
                  style={styles.textInput}
                  value={stateName}
                  onChangeText={setStateName}
                  placeholder="State"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PINCODE *</Text>
              <TextInput
                style={styles.textInput}
                value={pincode}
                onChangeText={setPincode}
                keyboardType="numeric"
                placeholder="6-digit Pincode"
              />
            </View>
          </View>

          {/* Primary CTA */}
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={saving}
            accessibilityRole="button"
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveBtnText}>Save Profile Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
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
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: 16,
    paddingBottom: 40,
  },
  lockedFieldsCard: {
    backgroundColor: '#F0FDFA',
    borderRadius: radii.xxl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    gap: 8,
  },
  lockedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lockedHeading: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0F766E',
    letterSpacing: 0.5,
  },
  lockedSub: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
  },
  lockedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: 10,
    gap: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  lockedItem: {
    width: '45%',
    gap: 2,
  },
  lockedItemLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  lockedItemVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xxl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  inputGroup: {
    gap: 6,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radii.xl,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  saveBtn: {
    backgroundColor: '#0F766E',
    paddingVertical: 14,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default EditProfileScreen;
