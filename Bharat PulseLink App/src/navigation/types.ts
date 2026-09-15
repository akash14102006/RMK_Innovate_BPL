/**
 * Bharat PulseLink — Canonical Navigation Type Registry
 *
 * SINGLE SOURCE OF TRUTH for all route param lists.
 * Every navigator, screen, and navigate() call is typed against these definitions.
 * Adding a route here without registering it in the correct navigator produces
 * a TypeScript error at the call site — no silent runtime crashes.
 */
import { NavigatorScreenParams } from '@react-navigation/native';
import type { HospitalSummaryItem } from '../types/hospitals';

// ─── Onboarding Stack ───────────────────────────────────────────────────────
export type OnboardingStackParamList = {
  OnboardingScreen1: undefined;
  OnboardingScreen2: undefined;
  OnboardingScreen3: undefined;
  OnboardingScreen4: undefined;
};

// ─── Auth Stack ──────────────────────────────────────────────────────────────
// Screens that belong to the unauthenticated / setup flow.
// DO NOT include AppStack-level destinations here.
export type AuthStackParamList = {
  LanguageSelection: undefined;
  AuthEntry: undefined;
  OTPVerification: { phoneE164: string; maskedPhone: string; challengeId: string };
  TermsPrivacy: undefined;
  TermsConditions: undefined;
  PrivacyPolicy: undefined;
  BiometricSetup: undefined;
  SecurityPinSetup: undefined;
  LocalLock: undefined;
  BiometricPinSetup: undefined;
  // Profile setup lives in AuthStack (first-time) AND AppStack (re-entry from Home)
  ProfileSetup: { stepId?: string } | undefined;
};

// ─── App Stack ───────────────────────────────────────────────────────────────
// Every destination reachable from Home, Drawer, Bottom Nav, Alerts deep links.
// If a route is referenced by navigate() it MUST appear here.
export type AppStackParamList = {
  // ── Core ──
  Home: undefined;

  // ── Care Destinations ──
  Alerts: undefined;
  Appointments: undefined;
  Hospitals: undefined;
  HospitalMap: undefined;
  HospitalsMap: undefined;
  HospitalSearch: undefined;
  HospitalDetails: { hospitalId: string };
  HospitalRoute: {
    hospital: HospitalSummaryItem;
    originLocation?: { latitude: number; longitude: number };
  };
  DoctorAvailability: { hospitalId: string; hospitalName?: string; specialty?: string };
  ServiceAvailability: { hospitalId: string; hospitalName?: string; department?: string };
  AppointmentSelection: {
    hospitalId: string;
    hospitalName?: string;
    department?: string;
    serviceId?: string;
    serviceName?: string;
    doctorId?: string;
    doctorName?: string;
    doctorSpecialty?: string;
    locationAddress?: string;
  };
  BookingReview: {
    hospitalId: string;
    hospitalName: string;
    department: string;
    serviceId?: string;
    serviceName?: string;
    doctorId?: string;
    doctorName?: string;
    scheduledDate: string;
    displayDate: string;
    displayTime: string;
    slotId: string;
    locationAddress?: string;
  };
  BookingConfirmation: {
    appointmentId: string;
    status: 'CONFIRMED' | 'PENDING_CONFIRMATION' | 'UNKNOWN' | 'REJECTED';
    bookingReference?: string;
    hospitalName: string;
    department: string;
    doctorName?: string;
    serviceName?: string;
    displayDate: string;
    displayTime: string;
    locationAddress?: string;
    rejectionReason?: string;
  };
  LocationPermission: undefined;
  LocationSelection: undefined;

  // ── Health Records Platform (Prompts 63–73) ──
  HealthRecordsHome: undefined;   // Drawer/Tab → Records
  VisitHistory: undefined;
  VisitDetails: { visitId: string };
  BloodTestReports: undefined;
  GeneralReports: undefined;
  PrescriptionRecords: undefined;
  Medications: undefined;         // Drawer → Medications
  AddMedication: undefined;
  HealthSummary: undefined;       // "Profile" tab destination
  Documents: undefined;
  UploadDocument: undefined;

  // ── Scan ──
  ScanEntry: undefined;           // Drawer/Tab → Scan at Hospital
  QRScanner: undefined;           // Camera QR Scanner
  MySecureQR: undefined;          // Patient Temporary Secure QR Code
  ConsentBeforeSharing: {
    hospitalId: string;
    hospitalName: string;
    departmentName?: string;
    counterDesk?: string;
    purpose: string;
    requestedScopes: import('../types/scan').SharingScopeKey[];
    sessionId: string;
  };
  SecureDataExchange: {
    hospitalId: string;
    hospitalName: string;
    departmentName?: string;
    counterDesk?: string;
    purpose: string;
    grantedScopes: import('../types/scan').SharingScopeKey[];
    sessionId: string;
  };
  ScanSuccess: {
    hospitalId: string;
    hospitalName: string;
    departmentName?: string;
    counterDesk?: string;
    purpose: string;
    sharedScopes: import('../types/scan').SharingScopeKey[];
    completedAtISO: string;
    tokenNumber?: string;
  };
  ScanFailure: {
    failureCode: import('../types/scan').ExchangeFailureCode;
    hospitalName?: string;
    message?: string;
    canRetry?: boolean;
  };

  // ── Hospital Check-In & Queue (Prompts 61–62) ──
  MyCheckIn: { checkInId?: string } | undefined;
  LiveCheckInStatus: { checkInId: string };

  // ── Account, Emergency, Security, Consent, Support (Prompts 74–86) ──
  EmergencyContact: undefined;    // Prompt 74
  EmergencyMode: undefined;       // Prompt 75
  Insurance: undefined;           // Prompt 76
  ProfileHome: undefined;         // Prompt 77 (Profile Command Center)
  EditProfile: undefined;         // Prompt 78
  Settings: undefined;            // Prompt 79
  SecurityCenter: undefined;      // Prompt 80
  ConsentDataSharing: undefined;  // Prompt 81
  AccessHistory: undefined;       // Prompt 82
  NotificationCenter: undefined;  // Prompt 83
  LanguageSettings: undefined;    // Prompt 84
  AccessibilityCenter: undefined; // Adaptive Care Access Platform
  HelpSupport: undefined;         // Prompt 85
  ProfileSetup: { stepId?: string } | undefined;
};

// ─── Root Stack ──────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Splash: undefined;
  OnboardingStack: NavigatorScreenParams<OnboardingStackParamList>;
  LanguageSelection: undefined;
  AuthStack: NavigatorScreenParams<AuthStackParamList>;
  AppStack: NavigatorScreenParams<AppStackParamList>;
};
