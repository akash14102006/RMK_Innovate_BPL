/**
 * Bharat PulseLink — App Stack Navigator
 *
 * This is the ONLY navigator that owns authenticated app destinations.
 * Every route in AppStackParamList MUST have a registered screen here.
 * Home, Drawer, Bottom Nav, and Alert deep links all resolve within this stack.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppStackParamList } from './types';

// ── Fully implemented screens ───────────────────────────────────────────────
import HomeScreen from '../screens/HomeScreen';
import AlertsScreen from '../screens/AlertsScreen';
import AppointmentsScreen from '../screens/AppointmentsScreen';
import HealthSummaryScreen from '../screens/HealthSummaryScreen';
import HospitalsScreen from '../screens/HospitalsScreen';
import ProfileStepScreen from '../screens/profile/ProfileStepScreen';
import LocationPermissionScreen from '../screens/LocationPermissionScreen';
import HospitalMapScreen from '../screens/HospitalMapScreen';
import HospitalSearchScreen from '../screens/HospitalSearchScreen';
import HospitalDetailsScreen from '../screens/HospitalDetailsScreen';
import HospitalRouteScreen from '../screens/HospitalRouteScreen';
import DoctorAvailabilityScreen from '../screens/DoctorAvailabilityScreen';
import ServiceAvailabilityScreen from '../screens/ServiceAvailabilityScreen';
import AppointmentSelectionScreen from '../screens/AppointmentSelectionScreen';
import BookingReviewScreen from '../screens/BookingReviewScreen';
import BookingConfirmationScreen from '../screens/BookingConfirmationScreen';
import ScanEntryScreen from '../screens/ScanEntryScreen';
import QRScannerScreen from '../screens/QRScannerScreen';
import MySecureQRScreen from '../screens/MySecureQRScreen';
import ConsentBeforeSharingScreen from '../screens/ConsentBeforeSharingScreen';
import SecureDataExchangeScreen from '../screens/SecureDataExchangeScreen';
import ScanSuccessScreen from '../screens/ScanSuccessScreen';
import ScanFailureScreen from '../screens/ScanFailureScreen';
import MyCheckInScreen from '../screens/MyCheckInScreen';
import LiveCheckInStatusScreen from '../screens/LiveCheckInStatusScreen';

// ── Health Records Platform (Prompts 63–73) ──
import HealthRecordsHomeScreen from '../screens/HealthRecordsHomeScreen';
import VisitHistoryScreen from '../screens/VisitHistoryScreen';
import VisitDetailsScreen from '../screens/VisitDetailsScreen';
import BloodTestReportsScreen from '../screens/BloodTestReportsScreen';
import GeneralReportsScreen from '../screens/GeneralReportsScreen';
import PrescriptionRecordsScreen from '../screens/PrescriptionRecordsScreen';
import MedicationsScreen from '../screens/MedicationsScreen';
import AddMedicationScreen from '../screens/AddMedicationScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import UploadDocumentScreen from '../screens/UploadDocumentScreen';

// ── Account, Security, Consent, Emergency & Support (Prompts 74–86) ──
import EmergencyContactScreen from '../screens/EmergencyContactScreen';
import EmergencyModeScreen from '../screens/EmergencyModeScreen';
import InsuranceScreen from '../screens/InsuranceScreen';
import ProfileHomeScreen from '../screens/ProfileHomeScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SecurityCenterScreen from '../screens/SecurityCenterScreen';
import ConsentDataSharingScreen from '../screens/ConsentDataSharingScreen';
import AccessHistoryScreen from '../screens/AccessHistoryScreen';
import NotificationCenterScreen from '../screens/NotificationCenterScreen';
import LanguageSettingsScreen from '../screens/LanguageSettingsScreen';
import AccessibilityCenterScreen from '../screens/AccessibilityCenterScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';

const Stack = createNativeStackNavigator<AppStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {/* ── Core ── */}
      <Stack.Screen name="Home" component={HomeScreen} />

      {/* ── Care Destinations ── */}
      <Stack.Screen name="Alerts" component={AlertsScreen} />
      <Stack.Screen name="Appointments" component={AppointmentsScreen} />
      <Stack.Screen name="Hospitals" component={HospitalsScreen} />
      <Stack.Screen name="HospitalMap" component={HospitalMapScreen} />
      <Stack.Screen name="HospitalsMap" component={HospitalMapScreen} />
      <Stack.Screen name="HospitalSearch" component={HospitalSearchScreen} />
      <Stack.Screen name="HospitalDetails" component={HospitalDetailsScreen} />
      <Stack.Screen name="HospitalRoute" component={HospitalRouteScreen} />
      <Stack.Screen name="DoctorAvailability" component={DoctorAvailabilityScreen} />
      <Stack.Screen name="ServiceAvailability" component={ServiceAvailabilityScreen} />
      <Stack.Screen name="AppointmentSelection" component={AppointmentSelectionScreen} />
      <Stack.Screen name="BookingReview" component={BookingReviewScreen} />
      <Stack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
      <Stack.Screen name="LocationPermission" component={LocationPermissionScreen} />
      <Stack.Screen name="LocationSelection" component={LocationPermissionScreen} />

      {/* ── Health Records Platform (Prompts 63–73) ── */}
      <Stack.Screen name="HealthRecordsHome" component={HealthRecordsHomeScreen} />
      <Stack.Screen name="VisitHistory" component={VisitHistoryScreen} />
      <Stack.Screen name="VisitDetails" component={VisitDetailsScreen} />
      <Stack.Screen name="BloodTestReports" component={BloodTestReportsScreen} />
      <Stack.Screen name="GeneralReports" component={GeneralReportsScreen} />
      <Stack.Screen name="PrescriptionRecords" component={PrescriptionRecordsScreen} />
      <Stack.Screen name="Medications" component={MedicationsScreen} />
      <Stack.Screen name="AddMedication" component={AddMedicationScreen} />
      <Stack.Screen name="HealthSummary" component={HealthSummaryScreen} />
      <Stack.Screen name="Documents" component={DocumentsScreen} />
      <Stack.Screen name="UploadDocument" component={UploadDocumentScreen} />

      {/* ── Scan ── */}
      <Stack.Screen name="ScanEntry" component={ScanEntryScreen} />
      <Stack.Screen name="QRScanner" component={QRScannerScreen} />
      <Stack.Screen name="MySecureQR" component={MySecureQRScreen} />
      <Stack.Screen name="ConsentBeforeSharing" component={ConsentBeforeSharingScreen} />
      <Stack.Screen name="SecureDataExchange" component={SecureDataExchangeScreen} />
      <Stack.Screen name="ScanSuccess" component={ScanSuccessScreen} />
      <Stack.Screen name="ScanFailure" component={ScanFailureScreen} />
      <Stack.Screen name="MyCheckIn" component={MyCheckInScreen} />
      <Stack.Screen name="LiveCheckInStatus" component={LiveCheckInStatusScreen} />

      {/* ── Profile & Account (Prompts 74–86) ── */}
      <Stack.Screen name="ProfileSetup" component={ProfileStepScreen} />
      <Stack.Screen name="ProfileHome" component={ProfileHomeScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="EmergencyContact" component={EmergencyContactScreen} />
      <Stack.Screen name="EmergencyMode" component={EmergencyModeScreen} />
      <Stack.Screen name="Insurance" component={InsuranceScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="SecurityCenter" component={SecurityCenterScreen} />
      <Stack.Screen name="ConsentDataSharing" component={ConsentDataSharingScreen} />
      <Stack.Screen name="AccessHistory" component={AccessHistoryScreen} />
      <Stack.Screen name="NotificationCenter" component={NotificationCenterScreen} />
      <Stack.Screen name="LanguageSettings" component={LanguageSettingsScreen} />
      <Stack.Screen name="AccessibilityCenter" component={AccessibilityCenterScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
