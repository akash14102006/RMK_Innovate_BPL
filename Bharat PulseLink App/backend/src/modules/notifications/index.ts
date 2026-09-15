/**
 * Bharat PulseLink — Notifications Module
 *
 * Domain Boundary:
 * - Multi-channel delivery engine (SMS, Push, In-App)
 * - Idempotent, privacy-compliant transactional booking notifications
 * - Template rendering & provider adapters
 */

export * from './PhoneNormalizer.js';
export * from './NotificationTemplateService.js';
export * from './SmsProvider.js';
export * from './SMSNotificationService.js';

export interface NotificationPayload {
  id: string;
  userId: string;
  channel: 'PUSH' | 'SMS' | 'EMAIL' | 'IN_APP';
  title: string;
  body: string;
  category: 'APPOINTMENT' | 'CHECKIN' | 'REPORT' | 'SECURITY' | 'EMERGENCY';
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED';
  scheduledAt?: string;
}
