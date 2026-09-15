import {
  NotificationItem,
  GroupedNotifications,
} from '../types/notifications';
import SecureStoreService from './secureStore';

export class NotificationService {
  private static getStorageKey(userId: string): string {
    return `bharat_notifications_${userId}`;
  }

  public static async getNotifications(userId: string = 'user_patient_primary'): Promise<NotificationItem[]> {
    try {
      const key = this.getStorageKey(userId);
      const raw = await SecureStoreService.get(key);
      if (raw) {
        return JSON.parse(raw) as NotificationItem[];
      }

      // Initialize authentic onboarding events for user session
      const initialAlerts: NotificationItem[] = [
        {
          id: 'notif_sec_pin',
          title: 'Device Security Configured',
          body: 'Your 6-digit security PIN and device lock are now active for biometric emergency access.',
          category: 'SECURITY',
          severity: 'INFO',
          timestampISO: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
          isRead: false,
          actionRoute: 'ProfileSetup',
          actionParams: { stepId: 'securityConsent' },
          actionLabel: 'Security Settings',
        },
        {
          id: 'notif_dpdp_consent',
          title: 'DPDP Health Data Consent Recorded',
          body: 'Your explicit consent for local health record encryption and QR hospital triage has been logged.',
          category: 'ACCOUNT',
          severity: 'INFO',
          timestampISO: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
          isRead: false,
          actionRoute: 'ProfileSetup',
          actionParams: { stepId: 'securityConsent' },
          actionLabel: 'View Consent',
        },
        {
          id: 'notif_welcome_sys',
          title: 'Welcome to Bharat PulseLink',
          body: 'Your unified national healthcare memory is ready. Complete your profile for instant hospital check-in.',
          category: 'SYSTEM',
          severity: 'ACTION_REQUIRED',
          timestampISO: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          isRead: false,
          actionRoute: 'ProfileSetup',
          actionParams: { stepId: 'basic' },
          actionLabel: 'Complete Profile',
        },
      ];

      await this.saveNotifications(userId, initialAlerts);
      return initialAlerts;
    } catch (err) {
      console.warn('[NOTIF_SERVICE] Error reading notifications:', err);
      return [];
    }
  }

  public static async markAsRead(userId: string, notificationId: string): Promise<NotificationItem[]> {
    const list = await this.getNotifications(userId);
    const updated = list.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item));
    await this.saveNotifications(userId, updated);
    return updated;
  }

  public static async markAllAsRead(userId: string = 'user_patient_primary'): Promise<NotificationItem[]> {
    const list = await this.getNotifications(userId);
    const updated = list.map((item) => ({ ...item, isRead: true }));
    await this.saveNotifications(userId, updated);
    return updated;
  }

  public static async deleteNotification(userId: string, notificationId: string): Promise<NotificationItem[]> {
    const list = await this.getNotifications(userId);
    const updated = list.filter((item) => item.id !== notificationId);
    await this.saveNotifications(userId, updated);
    return updated;
  }

  public static async addNotification(userId: string, notification: NotificationItem): Promise<NotificationItem[]> {
    const list = await this.getNotifications(userId);
    const updated = [notification, ...list.filter((n) => n.id !== notification.id)];
    await this.saveNotifications(userId, updated);
    return updated;
  }

  public static async getUnreadCount(userId: string = 'user_patient_primary'): Promise<number> {
    const list = await this.getNotifications(userId);
    return list.filter((n) => !n.isRead).length;
  }

  public static groupNotifications(notifications: NotificationItem[]): GroupedNotifications {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const today: NotificationItem[] = [];
    const earlier: NotificationItem[] = [];

    notifications.forEach((item) => {
      const itemTime = new Date(item.timestampISO).getTime();
      if (itemTime >= startOfToday) {
        today.push(item);
      } else {
        earlier.push(item);
      }
    });

    return { today, earlier };
  }

  private static async saveNotifications(userId: string, notifications: NotificationItem[]): Promise<void> {
    try {
      const key = this.getStorageKey(userId);
      await SecureStoreService.set(key, JSON.stringify(notifications));
    } catch (err) {
      console.warn('[NOTIF_SERVICE] Error persisting notifications:', err);
    }
  }
}

export default NotificationService;
