export type NotificationCategory =
  | 'APPOINTMENT'
  | 'HEALTH_RECORD'
  | 'MEDICATION'
  | 'CARE_REMINDER'
  | 'SECURITY'
  | 'ACCOUNT'
  | 'HOSPITAL'
  | 'SYSTEM';

export type NotificationSeverity = 'INFO' | 'ACTION_REQUIRED' | 'WARNING' | 'URGENT';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  timestampISO: string;
  isRead: boolean;
  actionRoute?: string;
  actionParams?: Record<string, any>;
  actionLabel?: string;
}

export type NotificationFilter = 'ALL' | 'UNREAD' | NotificationCategory;

export interface GroupedNotifications {
  today: NotificationItem[];
  earlier: NotificationItem[];
}
