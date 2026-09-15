import { describe, it, expect, vi, beforeEach } from 'vitest';
import NotificationService from '../NotificationService';
import { NotificationItem } from '../../types/notifications';

vi.mock('../secureStore', () => {
  const store = new Map<string, string>();
  return {
    set: vi.fn(async (k: string, v: string) => { store.set(k, v); }),
    get: vi.fn(async (k: string) => store.get(k) || null),
    remove: vi.fn(async (k: string) => { store.delete(k); }),
    default: {
      set: vi.fn(async (k: string, v: string) => { store.set(k, v); }),
      get: vi.fn(async (k: string) => store.get(k) || null),
      remove: vi.fn(async (k: string) => { store.delete(k); }),
    },
  };
});

describe('Prompt 39 — NotificationService & Alerts Center', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes authentic onboarding alerts for new user session', async () => {
    const alerts = await NotificationService.getNotifications('user_test_1');
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts.some((a) => a.category === 'SECURITY')).toBe(true);
    expect(alerts.some((a) => a.category === 'ACCOUNT')).toBe(true);
    expect(alerts.some((a) => a.category === 'SYSTEM')).toBe(true);
  });

  it('marks specific notification as read and updates unread count', async () => {
    const alerts = await NotificationService.getNotifications('user_test_read');
    const firstUnread = alerts.find((a) => !a.isRead);
    expect(firstUnread).toBeDefined();

    const initialUnreadCount = await NotificationService.getUnreadCount('user_test_read');

    await NotificationService.markAsRead('user_test_read', firstUnread!.id);

    const updated = await NotificationService.getNotifications('user_test_read');
    const updatedTarget = updated.find((a) => a.id === firstUnread!.id);
    expect(updatedTarget?.isRead).toBe(true);

    const newUnreadCount = await NotificationService.getUnreadCount('user_test_read');
    expect(newUnreadCount).toBe(initialUnreadCount - 1);
  });

  it('marks all notifications as read', async () => {
    await NotificationService.getNotifications('user_test_all');
    await NotificationService.markAllAsRead('user_test_all');

    const updated = await NotificationService.getNotifications('user_test_all');
    expect(updated.every((a) => a.isRead)).toBe(true);

    const unreadCount = await NotificationService.getUnreadCount('user_test_all');
    expect(unreadCount).toBe(0);
  });

  it('groups notifications correctly into Today and Earlier', () => {
    const now = new Date();
    const todayAlert: NotificationItem = {
      id: 'alert_today',
      title: 'Today Visit',
      body: 'Check-in details',
      category: 'APPOINTMENT',
      severity: 'INFO',
      timestampISO: now.toISOString(),
      isRead: false,
    };

    const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 48); // 2 days ago
    const earlierAlert: NotificationItem = {
      id: 'alert_earlier',
      title: 'Past Record',
      body: 'Record synced',
      category: 'HEALTH_RECORD',
      severity: 'INFO',
      timestampISO: pastDate.toISOString(),
      isRead: true,
    };

    const grouped = NotificationService.groupNotifications([todayAlert, earlierAlert]);
    expect(grouped.today.length).toBe(1);
    expect(grouped.today[0].id).toBe('alert_today');
    expect(grouped.earlier.length).toBe(1);
    expect(grouped.earlier[0].id).toBe('alert_earlier');
  });

  it('isolates notification storage per user identity', async () => {
    await NotificationService.getNotifications('user_alice');
    await NotificationService.markAllAsRead('user_alice');

    const bobAlerts = await NotificationService.getNotifications('user_bob');
    // Bob should have his own initial unread alerts, not affected by Alice's markAllAsRead
    expect(bobAlerts.some((a) => !a.isRead)).toBe(true);
  });
});
