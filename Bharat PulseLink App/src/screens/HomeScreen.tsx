import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing } from '../theme/tokens';
import MotionContainer from '../components/MotionContainer';
import SessionManager from '../services/sessionManager';
import QRSessionClientService from '../services/QRSessionClientService';
import { useHomeDashboard } from '../hooks/useHomeDashboard';
import { useI18n } from '../i18n/I18nContext';
import { TabId } from '../components/home/BottomTabBar';

// Components
import HomeHeader from '../components/home/HomeHeader';
import ProfileHeroCard from '../components/home/ProfileHeroCard';
import ConnectedMetricsModule from '../components/home/ConnectedMetricsModule';
import TodayCareSection from '../components/home/TodayCareSection';
import QuickActionsGrid from '../components/home/QuickActionsGrid';
import CareJourneyTimeline from '../components/home/CareJourneyTimeline';
import HospitalDiscoveryCard from '../components/home/HospitalDiscoveryCard';
import BottomTabBar from '../components/home/BottomTabBar';
import EmergencyActionModal from '../components/home/EmergencyActionModal';
import HomeSideMenuModal from '../components/home/HomeSideMenuModal';
import NotificationsModal from '../components/home/NotificationsModal';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useI18n();
  const { data: dashboard, isLoading, isRefetching, refetch } = useHomeDashboard();

  const [activeTab, setActiveTab] = useState<TabId>('Home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);

  useEffect(() => {
    console.log('[HOME] COMMAND_CENTER_INITIALIZED');
    console.log('[RUNTIME] RUNTIME_ROUTE=HomeScreen');
    // Startup background check and prefetch of capability pool (Step 8)
    QRSessionClientService.syncOfflinePool().catch((e) => {
      console.log('[QR_PREFETCH] backgroundStartupDeferred', e?.message);
    });
  }, []);

  const handleRefresh = async () => {
    await refetch();
  };

  const handleLogout = async () => {
    console.log('[HOME] LOGOUT_TRIGGERED');
    await SessionManager.logout();
  };

  const handleSelectTab = (tab: TabId) => {
    setActiveTab(tab);
    if (tab === 'Profile') {
      navigation.navigate('ProfileHome');
    } else if (tab === 'Records') {
      navigation.navigate('HealthRecordsHome');
    } else if (tab === 'Scan') {
      navigation.navigate('ScanEntry');
    } else if (tab === 'Hospitals') {
      navigation.navigate('Hospitals');
    }
  };

  if (isLoading && !dashboard) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.loadingText}>{t('home.connectingNetwork')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const preferredName = dashboard?.patientPreferredName || 'Patient';
  const unreadCount = dashboard?.unreadNotificationsCount || 0;
  const percentage = dashboard?.profileCompletionPercentage || 0;
  const isComplete = dashboard?.isProfileComplete || false;

  const handleDrawerNavigation = (itemId: any) => {
    switch (itemId) {
      case 'home':
        // Already on Home — no-op
        break;
      case 'hospitals':
        navigation.navigate('Hospitals');
        break;
      case 'scan':
        navigation.navigate('ScanEntry');
        break;
      case 'records':
        navigation.navigate('HealthRecordsHome');
        break;
      case 'medications':
        navigation.navigate('Medications');
        break;
      case 'appointments':
        navigation.navigate('Appointments');
        break;
      case 'alerts':
        navigation.navigate('Alerts');
        break;
      case 'profile':
        navigation.navigate('ProfileHome');
        break;
      case 'language':
        navigation.navigate('LanguageSettings');
        break;
      case 'settings':
        navigation.navigate('Settings');
        break;
      case 'support':
        navigation.navigate('HelpSupport');
        break;
      case 'logout':
        handleLogout();
        break;
    }
  };

  const handleTabSelect = (tab: TabId) => {
    setActiveTab(tab);
    if (tab === 'Hospitals') {
      navigation.navigate('Hospitals');
    } else if (tab === 'Profile') {
      navigation.navigate('ProfileHome');
    } else if (tab === 'Records') {
      navigation.navigate('HealthRecordsHome');
    } else if (tab === 'Scan') {
      navigation.navigate('ScanEntry');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container} accessible accessibilityLabel="Bharat PulseLink Command Center">
        {/* Offline Status Bar */}
        {dashboard?.isOffline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>
              Working Offline • Showing local encrypted health memory
            </Text>
          </View>
        )}

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              tintColor="#0F766E"
              colors={['#0F766E']}
            />
          }
        >
          <MotionContainer>
            {/* 1. Minimal Header */}
            <HomeHeader
              unreadCount={unreadCount}
              onPressMenu={() => setIsMenuOpen(true)}
              onPressNotifications={() => navigation.navigate('Alerts')}
            />

            {/* 2. Hero Profile Health Card */}
            <ProfileHeroCard
              percentage={percentage}
              isComplete={isComplete}
              onPressCTA={() => navigation.navigate(isComplete ? 'HealthSummary' : 'ProfileSetup', { stepId: 'review' })}
            />

            {/* 3. Connected Metrics Module */}
            {dashboard?.metrics && (
              <ConnectedMetricsModule
                metrics={dashboard.metrics}
                onPressAppointments={() => navigation.navigate('Appointments')}
                onPressMedications={() => navigation.navigate('ProfileSetup', { stepId: 'medications' })}
                onPressReports={() => navigation.navigate('ProfileSetup', { stepId: 'documents' })}
              />
            )}

            {/* 4. Today / Care Section */}
            <TodayCareSection
              appointment={dashboard?.nextAppointment || null}
              onPressFindCare={() => navigation.navigate('Appointments')}
              onPressViewDetails={() => navigation.navigate('Appointments')}
            />

            {/* 5. Balanced 2×2 Quick Actions Grid */}
            <QuickActionsGrid
              onPressScan={() => navigation.navigate('ScanEntry')}
              onPressFindHospital={() => navigation.navigate('Hospitals')}
              onPressRecords={() => navigation.navigate('HealthRecordsHome')}
              onPressEmergency={() => navigation.navigate('EmergencyMode')}
            />

            {/* 6. Care Journey Continuous Health Memory Timeline */}
            <CareJourneyTimeline
              isProfileComplete={isComplete}
              hasRecords={(dashboard?.metrics?.reportsCount || 0) > 0}
              hasCare={(dashboard?.metrics?.appointmentsCount || 0) > 0}
            />

            {/* 7. Hospital Discovery Preview */}
            {dashboard?.hospitalDiscovery && (
              <HospitalDiscoveryCard
                hospital={dashboard.hospitalDiscovery}
                onPressExplore={() => navigation.navigate('Hospitals')}
              />
            )}
          </MotionContainer>
        </ScrollView>

        {/* 8. Floating Bottom Navigation Bar */}
        <BottomTabBar activeTab={activeTab} onSelectTab={handleTabSelect} />

        {/* Emergency Modal */}
        <EmergencyActionModal
          visible={isEmergencyOpen}
          onClose={() => setIsEmergencyOpen(false)}
          emergencyContactName="Primary Emergency Contact"
          emergencyContactPhone="+91 98765 43210"
          onOpenQR={() => navigation.navigate('ProfileSetup', { stepId: 'complete' })}
        />

        {/* Production Dashboard Navigation Drawer */}
        <HomeSideMenuModal
          visible={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          activeItem="home"
          unreadAlertsCount={unreadCount}
          onNavigateItem={handleDrawerNavigation}
        />

        {/* Notifications Modal */}
        <NotificationsModal
          visible={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          notifications={dashboard?.notifications || []}
        />
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
  offlineBanner: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  offlineText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '700',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});

export default HomeScreen;
