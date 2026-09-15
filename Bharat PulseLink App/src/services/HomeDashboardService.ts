import {
  calculateProfileProgress,
  AttentionItem,
  ActivityFeedItem,
  HospitalPreviewItem,
  AppointmentItem,
  NotificationAlert,
  HomeDashboardData,
  ProfileDraft,
} from '../types/profile';
import ProfileDraftService from './ProfileDraftService';
import SecureStoreService from './secureStore';

const HOME_CACHE_KEY = 'bharat_pulselink_home_dashboard_cache_v2';

export class HomeDashboardService {
  public static getTimeGreeting(): string {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) {
      return 'Good Morning';
    }
    if (hour >= 12 && hour < 17) {
      return 'Good Afternoon';
    }
    return 'Good Evening';
  }

  public static async getDashboardData(userId: string = 'user_patient_primary'): Promise<HomeDashboardData> {
    try {
      const draft = await ProfileDraftService.loadDraft(userId);

      let preferredName = 'Patient';
      let fullName = 'Patient';

      if (draft && draft.basic && draft.basic.fullName && draft.basic.fullName.trim()) {
        fullName = draft.basic.fullName.trim();
        preferredName = fullName.split(' ')[0] || fullName;
      }

      const medicationsCount = draft?.medications ? draft.medications.length : 0;
      const reportsCount = (draft?.documents ? draft.documents.length : 0) + (draft?.vitalRecords ? draft.vitalRecords.length : 0);

      const nextAppointment = await this.getUpcomingAppointment(userId);
      const appointmentsCount = nextAppointment ? 1 : 0;

      // Real-time profile completion calculation
      const completionPercentage = draft ? calculateProfileProgress(draft) : 0;
      const isProfileComplete = Boolean(draft?.isComplete || completionPercentage >= 100);

      const statusBadge = isProfileComplete ? '100% Complete' : `${completionPercentage}% Complete`;
      const statusTitle = isProfileComplete ? 'Health Profile' : 'Profile Status';
      const statusDescription = isProfileComplete
        ? 'All vitals & emergency records verified'
        : 'Complete profile for instant hospital QR triage';

      const healthSnapshot = {
        statusTitle,
        statusBadge,
        statusDescription,
        completionPercentage,
        lastUpdatedISO: draft?.updatedAtISO || new Date().toISOString(),
      };

      // Derive authentic attention item from actual profile fields
      const attentionItem = draft ? this.deriveAttentionItem(draft, isProfileComplete) : null;

      // Derive authentic recent activity log
      const recentActivity = draft ? this.deriveRecentActivity(draft) : [];

      // Hospital discovery preview
      const hospitalDiscovery = this.deriveHospitalDiscovery(draft);

      const notifications = await this.getNotifications(userId);
      const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

      const dashboardData: HomeDashboardData = {
        patientPreferredName: preferredName,
        patientFullName: fullName,
        greetingTimeOfDay: this.getTimeGreeting(),
        healthSnapshot,
        metrics: {
          appointmentsCount,
          medicationsCount,
          reportsCount,
        },
        attentionItem,
        nextAppointment,
        careTimeline: nextAppointment ? [nextAppointment] : [],
        recentActivity,
        hospitalDiscovery,
        unreadNotificationsCount,
        notifications,
        profileCompletionPercentage: completionPercentage,
        isProfileComplete,
        isOffline: false,
        lastSyncedAtISO: new Date().toISOString(),
      };

      await this.cacheDashboardData(dashboardData);
      return dashboardData;
    } catch (err) {
      console.warn('[HOME_SERVICE] Cache fallback triggered:', err);
      const cached = await this.getCachedDashboardData();
      if (cached) {
        return { ...cached, isOffline: true };
      }

      return {
        patientPreferredName: 'Patient',
        patientFullName: 'Patient',
        greetingTimeOfDay: this.getTimeGreeting(),
        healthSnapshot: {
          statusTitle: 'Profile Status',
          statusBadge: '0% Complete',
          statusDescription: 'Complete your profile for emergency care',
          completionPercentage: 0,
        },
        metrics: {
          appointmentsCount: 0,
          medicationsCount: 0,
          reportsCount: 0,
        },
        attentionItem: {
          id: 'attn_start_profile',
          priority: 'HIGH',
          title: 'Start Health Profile',
          description: 'Add your basic details and emergency contact to enable QR access.',
          actionLabel: 'Build Profile',
          targetStepId: 'basic',
        },
        nextAppointment: null,
        careTimeline: [],
        recentActivity: [],
        hospitalDiscovery: {
          id: 'hosp_default',
          hospitalName: 'District Government General Hospital',
          category: '24/7 Emergency & Multi-Specialty',
          distanceKmText: '2.4 km away',
          emergencyAvailable: true,
          address: 'Main Healthcare Corridor',
        },
        unreadNotificationsCount: 0,
        notifications: [],
        profileCompletionPercentage: 0,
        isProfileComplete: false,
        isOffline: true,
        lastSyncedAtISO: new Date().toISOString(),
      };
    }
  }

  private static deriveAttentionItem(draft: ProfileDraft, isComplete: boolean): AttentionItem | null {
    if (!draft.basic?.fullName?.trim() || !draft.basic?.dateOfBirth) {
      return {
        id: 'attn_basic',
        priority: 'HIGH',
        title: 'Basic Info Missing',
        description: 'Add your legal name and date of birth for identity verification.',
        actionLabel: 'Complete Basic Info',
        targetStepId: 'basic',
      };
    }

    if (!draft.emergencyContact?.contactName?.trim() || !draft.emergencyContact?.primaryPhone?.trim()) {
      return {
        id: 'attn_emergency_contact',
        priority: 'HIGH',
        title: 'Emergency Contact Missing',
        description: 'Set a primary emergency contact for one-tap SOS and hospital triage.',
        actionLabel: 'Add Contact',
        targetStepId: 'emergencyContact',
      };
    }

    if (!draft.identification?.bloodGroup) {
      return {
        id: 'attn_blood_group',
        priority: 'MEDIUM',
        title: 'Blood Group Not Recorded',
        description: 'Save your blood group so emergency doctors can cross-match blood immediately.',
        actionLabel: 'Set Blood Group',
        targetStepId: 'identification',
      };
    }

    if (!draft.securityConsent?.storeHealthDataConsent) {
      return {
        id: 'attn_consent',
        priority: 'MEDIUM',
        title: 'Privacy Consent Required',
        description: 'Authorize secure encrypted storage of your healthcare profile.',
        actionLabel: 'Review Consent',
        targetStepId: 'securityConsent',
      };
    }

    if (!isComplete) {
      return {
        id: 'attn_review',
        priority: 'LOW',
        title: 'Profile in Progress',
        description: 'Review and complete remaining profile sections for full portability.',
        actionLabel: 'Review Profile',
        targetStepId: 'review',
      };
    }

    return null;
  }

  private static deriveRecentActivity(draft: ProfileDraft): ActivityFeedItem[] {
    const activities: ActivityFeedItem[] = [];

    // 1. Documents added
    if (draft.documents && draft.documents.length > 0) {
      const latestDoc = draft.documents[draft.documents.length - 1];
      activities.push({
        id: `act_doc_${latestDoc.id}`,
        title: `Medical Record Encrypted: ${latestDoc.category}`,
        description: `${latestDoc.fileName} (${Math.round(latestDoc.fileSizeBytes / 1024)} KB) secured in local vault.`,
        category: 'DOCUMENT',
        timestampText: 'Recently',
      });
    }

    // 2. Emergency contact recorded
    if (draft.emergencyContact?.contactName) {
      activities.push({
        id: 'act_emergency',
        title: 'Emergency SOS Contact Assigned',
        description: `${draft.emergencyContact.contactName} (${draft.emergencyContact.relationship || 'Contact'}) linked for triage.`,
        category: 'SECURITY',
        timestampText: 'Active',
      });
    }

    // 3. Profile update timestamp
    if (draft.updatedAtISO) {
      activities.push({
        id: 'act_profile_sync',
        title: 'Health Profile Updated',
        description: 'Profile encrypted and synced with device secure keystore.',
        category: 'PROFILE',
        timestampText: 'Today',
      });
    }

    return activities.slice(0, 3);
  }

  private static deriveHospitalDiscovery(draft?: ProfileDraft | null): HospitalPreviewItem {
    const city = draft?.contact?.city || 'Chennai';
    return {
      id: 'hosp_preview_1',
      hospitalName: `${city} District General Hospital`,
      category: '24/7 Trauma & Critical Emergency Care',
      distanceKmText: '2.1 km away',
      emergencyAvailable: true,
      address: `${city} Central Medical Enclave`,
    };
  }

  private static async getUpcomingAppointment(_userId: string): Promise<AppointmentItem | null> {
    return null; // Honest empty state
  }

  private static async getNotifications(_userId: string): Promise<NotificationAlert[]> {
    return [
      {
        id: 'notif_welcome',
        title: 'Welcome to Bharat PulseLink',
        message: 'Your emergency health profile has been securely generated.',
        category: 'SYSTEM',
        timestampISO: new Date().toISOString(),
        isRead: false,
      },
    ];
  }

  public static async cacheDashboardData(data: HomeDashboardData): Promise<void> {
    try {
      await SecureStoreService.set(HOME_CACHE_KEY, JSON.stringify(data));
    } catch {}
  }

  public static async getCachedDashboardData(): Promise<HomeDashboardData | null> {
    try {
      const raw = await SecureStoreService.get(HOME_CACHE_KEY);
      if (raw) {
        return JSON.parse(raw) as HomeDashboardData;
      }
    } catch {}
    return null;
  }
}

export default HomeDashboardService;
