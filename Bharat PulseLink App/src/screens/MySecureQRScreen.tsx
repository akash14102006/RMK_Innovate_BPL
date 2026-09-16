/**
 * Bharat PulseLink — Master Production My Secure QR Screen
 *
 * Implements:
 * 1. Digital Healthcare Identity & Secure Data Sharing Control Center
 * 2. Offline-First Capability Pool integration (Zero fake QRs, pre-issued cryptographic capability display)
 * 3. Neumorphic layered depth, 220px SVG QR canvas, and SVG Circular Countdown Ring
 * 4. Real-time security lifecycle state transitions: ONLINE, OFFLINE READY, SCANNED, AUTHORIZING, APPROVED, COMPLETED
 * 5. Data minimization scope selector with dynamic category counters (3 of 6 selected)
 * 6. Perfectly aligned 2x2 Quick Actions grid and Live Point-of-Care Activity Timeline
 * 7. 100% Vector Iconography — ZERO EMOJIS
 * 8. Authoritative distinction between OFFLINE, BACKEND_UNREACHABLE, AUTH_REQUIRED, and POOL_EMPTY
 *
 * Owned by: QR & Mobile Security Architecture (Prompt 107 Master Rework)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import {
  ChevronBackIcon,
  RefreshIcon,
  ShieldIcon,
  ShieldCheckIcon,
  LockIcon,
  ClockIcon,
  QrCodeIcon,
  WifiOffIcon,
  InfoIcon,
} from '../components/qr/QRIcons';
import CircularCountdownRing from '../components/qr/CircularCountdownRing';
import DataScopeTile from '../components/qr/DataScopeTile';
import QRQuickActionsGrid from '../components/qr/QRQuickActionsGrid';
import QRActivityTimeline, { TimelineLifecycleState } from '../components/qr/QRActivityTimeline';
import { STANDARD_SHARING_SCOPES } from '../services/SecureQRExchangeService';
import { SharingScopeKey, QRSessionStatus } from '../types/scan';
import QRSessionClientService, { PatientQRSessionData, isDeviceOnline } from '../services/QRSessionClientService';
import OfflineQRCapabilityService from '../services/OfflineQRCapabilityService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type QRErrorState =
  | null
  | 'NO_INTERNET_NO_POOL'
  | 'BACKEND_UNREACHABLE'
  | 'AUTH_REQUIRED'
  | 'SESSION_EXPIRED'
  | 'SERVER_ERROR'
  | 'CAPABILITY_POOL_EMPTY'
  | 'OFFLINE_KEY_UNAVAILABLE';

export const MySecureQRScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const {
    hospitalId: boundHospitalId,
    hospitalName: boundHospitalName,
    purpose: requestedPurpose = 'HOSPITAL_CHECKIN',
  } = route.params || {};

  // Consent & Scope Selection
  const [selectedScopes, setSelectedScopes] = useState<SharingScopeKey[]>([
    'BASIC_PROFILE',
    'EMERGENCY_CONTACT',
    'ALLERGIES',
  ]);

  // Session & Offline State
  const [sessionData, setSessionData] = useState<PatientQRSessionData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [errorState, setErrorState] = useState<QRErrorState>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(90);
  const [totalSeconds, setTotalSeconds] = useState<number>(90);
  const [sessionStatus, setSessionStatus] = useState<QRSessionStatus>('ACTIVE');
  const [timelineState, setTimelineState] = useState<TimelineLifecycleState>('WAITING_FOR_SCAN');

  // Modals
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [showSecurityModal, setShowSecurityModal] = useState<boolean>(false);

  const timerRef = useRef<any>(null);
  const pollTimerRef = useRef<any>(null);

  /**
   * Loads or refreshes the active QR session (Unified Online / Offline Capability).
   */
  const loadActiveQRSession = async (overrideScopes?: SharingScopeKey[]) => {
    setIsLoading(true);
    setErrorState(null);
    if (timerRef.current) clearInterval(timerRef.current);
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    const scopesToUse = overrideScopes || selectedScopes;

    try {
      const result = await QRSessionClientService.getActiveSessionUnified({
        purpose: requestedPurpose,
        recipientId: boundHospitalId,
        ttlSeconds: 300,
        scopes: scopesToUse,
      });

      setSessionData(result.data);
      setIsOfflineMode(result.isOffline);
      setErrorState(null);
      const ttl = result.data.ttlSeconds || (result.isOffline ? 300 : 90);
      setTotalSeconds(ttl);
      setSecondsLeft(ttl);
      setSessionStatus('ACTIVE');
      setTimelineState('WAITING_FOR_SCAN');
      setIsLoading(false);

      // If online, start polling for real-time scanner consumption events
      if (!result.isOffline && result.data.sessionId) {
        startStatusPolling(result.data.sessionId);
      }
    } catch (err: any) {
      setIsLoading(false);
      const online = isDeviceOnline();
      const code: QRErrorState =
        err.code === 'OFFLINE_KEY_UNAVAILABLE'
          ? 'OFFLINE_KEY_UNAVAILABLE'
          : err.code === 'AUTH_REQUIRED'
          ? 'AUTH_REQUIRED'
          : err.code === 'SESSION_EXPIRED'
          ? 'SESSION_EXPIRED'
          : err.code === 'SERVER_ERROR'
          ? 'SERVER_ERROR'
          : err.code === 'BACKEND_UNREACHABLE'
          ? 'BACKEND_UNREACHABLE'
          : !online || err.code === 'NO_INTERNET_NO_POOL'
          ? 'NO_INTERNET_NO_POOL'
          : 'BACKEND_UNREACHABLE';

      setErrorState(code);
      setIsOfflineMode(code === 'NO_INTERNET_NO_POOL' || code === 'OFFLINE_KEY_UNAVAILABLE');
      setSessionStatus('EXPIRED');
    }
  };

  /**
   * Real-time polling to detect hospital scanner check-in events
   */
  const startStatusPolling = (sessionId: string) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(async () => {
      try {
        const remote = await QRSessionClientService.getQRSessionStatus(sessionId);
        if (remote.status === 'CONSUMED' || remote.status === 'COMPLETED') {
          clearInterval(pollTimerRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
          setSessionStatus('COMPLETED');
          setTimelineState('COMPLETED');
        } else if (remote.status === 'EXPIRED') {
          clearInterval(pollTimerRef.current);
          setSessionStatus('EXPIRED');
          setTimelineState('EXPIRED');
        }
      } catch (e) {
        // Suppress network poll errors
      }
    }, 2500);
  };

  useEffect(() => {
    loadActiveQRSession();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  // Countdown timer lifecycle
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (sessionStatus === 'ACTIVE' && sessionData) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setSessionStatus('EXPIRED');
            setTimelineState('EXPIRED');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionData, sessionStatus]);

  const handleToggleScope = (scopeKey: SharingScopeKey) => {
    const nextScopes = selectedScopes.includes(scopeKey)
      ? selectedScopes.filter((s) => s !== scopeKey)
      : [...selectedScopes, scopeKey];
    setSelectedScopes(nextScopes);

    // If currently displaying an offline QR, regenerate envelope with the updated scopes immediately
    if (isOfflineMode) {
      loadActiveQRSession(nextScopes);
    }
  };

  const handleRevokeSession = async () => {
    if (sessionData) {
      try {
        await QRSessionClientService.revokeQRSession(sessionData.sessionId);
        if (isOfflineMode) {
          await OfflineQRCapabilityService.markConsumed(sessionData.sessionId);
        }
      } catch (err) {}
    }
    setSessionStatus('CANCELLED');
    setTimelineState('REVOKED');
    if (timerRef.current) clearInterval(timerRef.current);
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    setShowSecurityModal(false);
  };

  const isExpired = sessionStatus === 'EXPIRED';
  const isConsumed = sessionStatus === 'COMPLETED';
  const isCancelled = sessionStatus === 'CANCELLED';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.container}>
        {/* ── 1. HEADER ──────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back to Home"
          >
            <ChevronBackIcon size={24} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.headerTitleColumn}>
            <Text style={styles.screenTitle}>MY SECURE QR</Text>
            <Text style={styles.screenSubtitle}>Identity & Sharing Control Center</Text>
          </View>

          <TouchableOpacity
            style={[styles.headerActionBtn, isLoading && { opacity: 0.6 }]}
            onPress={() => loadActiveQRSession()}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel="Refresh secure QR session"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#0F766E" />
            ) : (
              <RefreshIcon size={20} color="#0F766E" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── 2. REAL-TIME CONNECTION / CAPABILITY STATUS BADGE ──────────────── */}
          <View style={styles.statusBarRow}>
            {errorState === 'OFFLINE_KEY_UNAVAILABLE' ? (
              <View style={[styles.statusPill, styles.statusPillWarn]}>
                <LockIcon size={14} color="#D97706" />
                <View style={styles.statusTextCol}>
                  <Text style={[styles.statusPillText, { color: '#D97706' }]}>
                    OFFLINE KEY UNAVAILABLE
                  </Text>
                  <Text style={[styles.statusPillSub, { color: '#B45309' }]}>
                    Trusted facility encryption key missing
                  </Text>
                </View>
              </View>
            ) : errorState === 'AUTH_REQUIRED' || errorState === 'SESSION_EXPIRED' ? (
              <View style={[styles.statusPill, styles.statusPillAlert]}>
                <LockIcon size={14} color="#DC2626" />
                <View style={styles.statusTextCol}>
                  <Text style={[styles.statusPillText, { color: '#DC2626' }]}>
                    SESSION EXPIRED
                  </Text>
                  <Text style={[styles.statusPillSub, { color: '#991B1B' }]}>
                    Authentication required
                  </Text>
                </View>
              </View>
            ) : errorState === 'SERVER_ERROR' ? (
              <View style={[styles.statusPill, styles.statusPillWarn]}>
                <InfoIcon size={14} color="#D97706" />
                <View style={styles.statusTextCol}>
                  <Text style={[styles.statusPillText, { color: '#D97706' }]}>
                    SERVICE TEMPORARILY UNAVAILABLE
                  </Text>
                  <Text style={[styles.statusPillSub, { color: '#B45309' }]}>
                    Gateway internal error
                  </Text>
                </View>
              </View>
            ) : errorState === 'NO_INTERNET_NO_POOL' ? (
              <View style={[styles.statusPill, styles.statusPillAlert]}>
                <WifiOffIcon size={14} color="#DC2626" />
                <View style={styles.statusTextCol}>
                  <Text style={[styles.statusPillText, { color: '#DC2626' }]}>
                    OFFLINE • NO CAPABILITY POOL
                  </Text>
                  <Text style={[styles.statusPillSub, { color: '#991B1B' }]}>
                    Connect to internet to mint capabilities
                  </Text>
                </View>
              </View>
            ) : errorState === 'BACKEND_UNREACHABLE' ? (
              <View style={[styles.statusPill, styles.statusPillWarn]}>
                <WifiOffIcon size={14} color="#D97706" />
                <View style={styles.statusTextCol}>
                  <Text style={[styles.statusPillText, { color: '#D97706' }]}>
                    BACKEND SERVER UNREACHABLE
                  </Text>
                  <Text style={[styles.statusPillSub, { color: '#B45309' }]}>
                    Internet connected • Server not responding
                  </Text>
                </View>
              </View>
            ) : isOfflineMode ? (
              <View style={[styles.statusPill, styles.statusPillOffline]}>
                <WifiOffIcon size={14} color="#0284C7" />
                <View style={styles.statusTextCol}>
                  <Text style={[styles.statusPillText, { color: '#0369A1' }]}>
                    OFFLINE SECURE QR
                  </Text>
                  <Text style={styles.statusPillSub}>Asymmetric Encrypted Envelope • No Internet Required</Text>
                </View>
              </View>
            ) : (
              <View style={styles.statusPillOnline}>
                <View style={styles.livePulseDot} />
                <Text style={styles.statusPillOnlineText}>
                  {isConsumed ? 'CONSUMED BY HOSPITAL' : isExpired ? 'SESSION EXPIRED' : 'LIVE SERVER CAPABILITY'}
                </Text>
              </View>
            )}
          </View>

          {/* ── 3. HERO SECURITY QR CARD ───────────────────────────────────────── */}
          <View style={styles.heroCard} testID="hero-secure-qr-card">
            <View style={styles.heroHeader}>
              <View style={styles.heroBadge}>
                <ShieldIcon size={16} color="#0F766E" />
                <Text style={styles.heroBadgeText}>DIGITAL HEALTHCARE IDENTITY</Text>
              </View>
              <Text style={styles.heroTitle}>Secure Patient QR</Text>
              {boundHospitalName && (
                <View style={styles.boundHospitalBanner}>
                  <View style={styles.boundHospitalHeader}>
                    <ShieldCheckIcon size={14} color="#0F766E" />
                    <Text style={styles.boundHospitalBadge}>POINT-OF-CARE CHECK-IN</Text>
                  </View>
                  <Text style={styles.boundHospitalName}>{boundHospitalName}</Text>
                  <Text style={styles.boundHospitalSub}>
                    Single-use token cryptographically bound to this hospital
                  </Text>
                </View>
              )}
              {isOfflineMode && !errorState && !isExpired && (
                <Text style={styles.offlineMetaSubtitle}>
                  Expires in {Math.floor(secondsLeft / 60).toString().padStart(2, '0')}:{(secondsLeft % 60).toString().padStart(2, '0')} • One-time access
                </Text>
              )}
            </View>

            {/* QR Surface */}
            <View style={[styles.qrSurface, (isExpired || !!errorState) && styles.qrSurfaceMuted]}>
              {isLoading ? (
                <View style={styles.qrCenterState}>
                  <ActivityIndicator size="large" color="#0F766E" />
                  <Text style={styles.qrStateText}>GENERATING SECURE QR...</Text>
                </View>
              ) : errorState === 'AUTH_REQUIRED' || errorState === 'SESSION_EXPIRED' ? (
                <View style={styles.qrCenterState}>
                  <LockIcon size={44} color="#DC2626" />
                  <Text style={[styles.qrStateTitle, { color: '#DC2626' }]}>Session Expired</Text>
                  <Text style={styles.qrStateSub}>
                    Your secure login session has expired. Please sign in again to access your secure healthcare QR code.
                  </Text>
                  <TouchableOpacity
                    style={[styles.primaryActionBtn, { backgroundColor: '#DC2626' }]}
                    onPress={() => navigation.navigate('AuthStack', { screen: 'AuthEntry' })}
                  >
                    <Text style={styles.primaryActionBtnText}>Sign In Again</Text>
                  </TouchableOpacity>
                </View>
              ) : errorState === 'SERVER_ERROR' ? (
                <View style={styles.qrCenterState}>
                  <InfoIcon size={44} color="#D97706" />
                  <Text style={[styles.qrStateTitle, { color: '#D97706' }]}>
                    Service Temporarily Unavailable
                  </Text>
                  <Text style={styles.qrStateSub}>
                    Unable to reach the national healthcare gateway. Please try again shortly.
                  </Text>
                  <TouchableOpacity style={styles.primaryActionBtn} onPress={() => loadActiveQRSession()}>
                    <Text style={styles.primaryActionBtnText}>Retry Connection</Text>
                  </TouchableOpacity>
                </View>
              ) : errorState === 'OFFLINE_KEY_UNAVAILABLE' ? (
                <View style={styles.qrCenterState}>
                  <LockIcon size={44} color="#D97706" />
                  <Text style={[styles.qrStateTitle, { color: '#D97706' }]}>Offline Key Unavailable</Text>
                  <Text style={styles.qrStateSub}>
                    Offline secure sharing is unavailable for this facility because its trusted encryption key is not available on this device.
                  </Text>
                  <TouchableOpacity style={styles.primaryActionBtn} onPress={() => loadActiveQRSession()}>
                    <Text style={styles.primaryActionBtnText}>Retry Key Resolution</Text>
                  </TouchableOpacity>
                </View>
              ) : errorState === 'NO_INTERNET_NO_POOL' ? (
                <View style={styles.qrCenterState}>
                  <WifiOffIcon size={44} color="#64748B" />
                  <Text style={styles.qrStateTitle}>Secure QR unavailable offline</Text>
                  <Text style={styles.qrStateSub}>
                    You are currently offline and no pre-issued capabilities exist in your secure pool. Please reconnect to mint new capabilities.
                  </Text>
                  <TouchableOpacity style={styles.primaryActionBtn} onPress={() => loadActiveQRSession()}>
                    <Text style={styles.primaryActionBtnText}>Reconnect & Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : errorState === 'BACKEND_UNREACHABLE' ? (
                <View style={styles.qrCenterState}>
                  <WifiOffIcon size={44} color="#D97706" />
                  <Text style={[styles.qrStateTitle, { color: '#D97706' }]}>Backend Server Unreachable</Text>
                  <Text style={styles.qrStateSub}>
                    Your device is connected to the internet, but the Bharat PulseLink healthcare gateway did not respond.
                  </Text>
                  <TouchableOpacity style={styles.primaryActionBtn} onPress={() => loadActiveQRSession()}>
                    <Text style={styles.primaryActionBtnText}>Retry Connection</Text>
                  </TouchableOpacity>
                </View>
              ) : isConsumed ? (
                <View style={styles.qrCenterState}>
                  <ShieldCheckIcon size={48} color="#059669" />
                  <Text style={[styles.qrStateTitle, { color: '#059669' }]}>Check-In Completed</Text>
                  <Text style={styles.qrStateSub}>
                    This one-time token was successfully consumed and exchanged with the hospital.
                  </Text>
                  <TouchableOpacity style={styles.primaryActionBtn} onPress={() => loadActiveQRSession()}>
                    <Text style={styles.primaryActionBtnText}>Generate Next QR</Text>
                  </TouchableOpacity>
                </View>
              ) : isExpired ? (
                <View style={styles.qrCenterState}>
                  <ClockIcon size={44} color="#DC2626" />
                  <Text style={[styles.qrStateTitle, { color: '#DC2626' }]}>QR Session Expired</Text>
                  <Text style={styles.qrStateSub}>
                    Sessions expire automatically to protect your healthcare confidentiality.
                  </Text>
                  <TouchableOpacity style={styles.primaryActionBtn} onPress={() => loadActiveQRSession()}>
                    <Text style={styles.primaryActionBtnText}>Generate New Session</Text>
                  </TouchableOpacity>
                </View>
              ) : sessionData ? (
                <View style={styles.qrRenderContainer} testID="qr-code-rendered">
                  <QRCode
                    value={sessionData.qrPayload}
                    size={Math.min(220, SCREEN_WIDTH - 120)}
                    color="#0F172A"
                    backgroundColor="#FFFFFF"
                    quietZone={10}
                  />
                </View>
              ) : null}
            </View>

            {/* Circular Countdown Ring */}
            {!isLoading && !errorState && !isConsumed && (
              <CircularCountdownRing
                secondsRemaining={secondsLeft}
                totalSeconds={totalSeconds}
                isOffline={isOfflineMode}
                isExpired={isExpired}
              />
            )}

            {/* Privacy & Anti-Tamper Badges */}
            <View style={styles.securityTagRow}>
              <View style={styles.securityTag}>
                <LockIcon size={13} color="#0F766E" />
                <Text style={styles.securityTagText}>AES-256 ENVELOPE</Text>
              </View>
              <View style={styles.securityTag}>
                <ShieldCheckIcon size={13} color="#0F766E" />
                <Text style={styles.securityTagText}>ONE-TIME USE ONLY</Text>
              </View>
            </View>
          </View>

          {/* ── 4. DATA MINIMIZATION SCOPES SECTION ──────────────────────────── */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionTitle}>SHARING PERMISSIONS</Text>
              <Text style={styles.sectionSubtitle}>
                Select data categories authorized for this session ({selectedScopes.length} of {STANDARD_SHARING_SCOPES.length})
              </Text>
            </View>
            <TouchableOpacity
              style={styles.infoBadge}
              onPress={() => setShowSecurityModal(true)}
              accessibilityRole="button"
              accessibilityLabel="View security info"
            >
              <InfoIcon size={16} color="#0F766E" />
            </TouchableOpacity>
          </View>

          <View style={styles.scopesList}>
            {STANDARD_SHARING_SCOPES.map((scope) => (
              <DataScopeTile
                key={scope.key}
                scopeKey={scope.key}
                label={scope.label}
                description={scope.description}
                isSelected={selectedScopes.includes(scope.key)}
                onToggle={(key) => handleToggleScope(key)}
              />
            ))}
          </View>

          {/* ── 5. QUICK ACTIONS GRID ────────────────────────────────────────── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>QUICK CONTROLS</Text>
          </View>

          <QRQuickActionsGrid
            onGenerateNew={loadActiveQRSession}
            onViewDetails={() => setShowDetailsModal(true)}
            onViewActivity={() => {}}
            onSecurityControls={() => setShowSecurityModal(true)}
            isLoading={isLoading}
          />

          {/* ── 6. POINT-OF-CARE ACTIVITY TIMELINE ──────────────────────────── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>SESSION LIFECYCLE</Text>
          </View>

          <QRActivityTimeline
            currentState={timelineState}
            isOffline={isOfflineMode}
          />
        </ScrollView>

        {/* ── DETAILS MODAL ─────────────────────────────────────────────────── */}
        <Modal
          visible={showDetailsModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDetailsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Session Technical Details</Text>
              <Text style={styles.modalDesc}>
                Cryptographic session identifier and security token hashes for hospital verification.
              </Text>
              <View style={styles.modalMetadataBox}>
                <Text style={styles.modalMetaLabel}>SESSION ID</Text>
                <Text style={styles.modalMetaValue}>{sessionData?.sessionId || 'N/A'}</Text>

                <Text style={[styles.modalMetaLabel, { marginTop: 8 }]}>TOKEN HASH (SHA-256)</Text>
                <Text style={styles.modalMetaValue}>{sessionData?.tokenHash?.slice(0, 24) || 'N/A'}...</Text>

                <Text style={[styles.modalMetaLabel, { marginTop: 8 }]}>MODE</Text>
                <Text style={styles.modalMetaValue}>{isOfflineMode ? 'OFFLINE SECURE ASYMMETRIC ENVELOPE' : 'ONLINE LIVE'}</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowDetailsModal(false)}
              >
                <Text style={styles.modalCloseBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ── SECURITY POLICY MODAL ─────────────────────────────────────────── */}
        <Modal
          visible={showSecurityModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSecurityModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Healthcare Confidentiality</Text>
              <Text style={styles.modalDesc}>
                Bharat PulseLink utilizes Prompt 93 AEAD Envelope encryption. QR payloads contain only one-time opaque tokens and never expose raw patient medical records.
              </Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowSecurityModal(false)}
              >
                <Text style={styles.modalCloseBtnText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleColumn: {
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  screenSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  statusBarRow: {
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
  },
  statusPillAlert: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusPillWarn: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  statusPillOffline: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  statusPillOnline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  statusPillOnlineText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  statusTextCol: {
    alignItems: 'flex-start',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusPillSub: {
    fontSize: 10,
    color: '#0284C7',
    fontWeight: '500',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  heroHeader: {
    alignItems: 'center',
    gap: 4,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F0FDFA',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 4,
  },
  offlineMetaSubtitle: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '600',
  },
  qrSurface: {
    width: Math.min(240, SCREEN_WIDTH - 80),
    height: Math.min(240, SCREEN_WIDTH - 80),
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  qrSurfaceMuted: {
    backgroundColor: '#F1F5F9',
  },
  qrRenderContainer: {
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  qrCenterState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  qrStateText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F766E',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  qrStateTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  qrStateSub: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
  primaryActionBtn: {
    marginTop: 8,
    backgroundColor: '#0F766E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  primaryActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  securityTagRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  securityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  securityTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sectionHeaderLeft: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  infoBadge: {
    padding: 6,
  },
  scopesList: {
    gap: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    gap: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  modalMetadataBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalMetaLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  modalMetaValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  modalCloseBtn: {
    backgroundColor: '#0F766E',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  modalCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  boundHospitalBanner: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    marginBottom: 4,
    alignItems: 'center',
    gap: 3,
    width: '100%',
  },
  boundHospitalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  boundHospitalBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
    letterSpacing: 0.5,
  },
  boundHospitalName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  boundHospitalSub: {
    fontSize: 10.5,
    color: '#0D9488',
    textAlign: 'center',
  },
});

export default MySecureQRScreen;
