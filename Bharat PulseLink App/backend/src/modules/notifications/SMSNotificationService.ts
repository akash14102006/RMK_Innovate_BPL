/**
 * Bharat PulseLink — SMS Notification Service
 *
 * Dispatches reliable, idempotent, multilingual appointment confirmation SMS messages.
 * Guarantees booking independence and privacy protection.
 *
 * Owned by: Notifications Domain (Step 11)
 */

import { type Logger } from '../../infrastructure/logger/logger.js';
import { type LanguageCode } from '../ivr/ivr.types.js';
import { PhoneNormalizer } from './PhoneNormalizer.js';
import { NotificationTemplateService } from './NotificationTemplateService.js';
import { type ISmsProvider, MockSmsProvider, type SmsDeliveryStatus } from './SmsProvider.js';

export interface AppointmentBookingConfirmedEvent {
  eventId: string;
  bookingId: string;
  bookingReference: string;
  facilityId: string;
  hospitalName: string;
  appointmentDate: string;
  appointmentTime: string;
  recipientPhoneNumber: string;
  language: LanguageCode | null;
  correlationId?: string;
}

export interface NotificationRecord {
  id: string;
  eventId: string;
  bookingId: string;
  bookingReference: string;
  status: SmsDeliveryStatus | 'QUEUED' | 'UNKNOWN';
  templateKey: string;
  templateVersion: string;
  providerMessageId?: string;
  attemptCount: number;
  recipientRedacted: string;
  language: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class SMSNotificationService {
  private readonly smsProvider: ISmsProvider;
  private readonly templateService: NotificationTemplateService;
  private readonly notificationStore: Map<string, NotificationRecord> = new Map();
  private readonly logger?: Logger;
  private static readonly MAX_RETRIES = 3;

  constructor(config: {
    smsProvider?: ISmsProvider;
    templateService?: NotificationTemplateService;
    logger?: Logger;
  } = {}) {
    this.smsProvider = config.smsProvider ?? new MockSmsProvider();
    this.templateService = config.templateService ?? new NotificationTemplateService();
    this.logger = config.logger;
  }

  /**
   * Dispatches appointment confirmation SMS idempotently.
   * Will not throw or roll back booking if SMS delivery encounters issues.
   */
  public async handleBookingConfirmed(
    event: AppointmentBookingConfirmedEvent,
  ): Promise<NotificationRecord> {
    const correlationId = event.correlationId ?? `corr-sms-${Date.now()}`;
    const idempotencyKey = `sms-booking-confirm-${event.bookingId}`;

    // 1. Idempotency Check: return existing notification if already processed
    const existing = this.notificationStore.get(idempotencyKey);
    if (existing && (existing.status === 'ACCEPTED' || existing.status === 'SENT' || existing.status === 'DELIVERED')) {
      this.logInfo('handleBookingConfirmed: duplicate notification event ignored (idempotent)', {
        eventId: event.eventId,
        bookingId: event.bookingId,
        status: existing.status,
        correlationId,
      });
      return existing;
    }

    // 2. Validate and normalize recipient phone number
    const phoneResult = PhoneNormalizer.normalize(event.recipientPhoneNumber);
    const recipientRedacted = PhoneNormalizer.redactForLogs(event.recipientPhoneNumber);

    if (!phoneResult.isValid || !phoneResult.normalized) {
      this.logInfo('handleBookingConfirmed: invalid phone number; notification marked FAILED', {
        eventId: event.eventId,
        bookingId: event.bookingId,
        recipientRedacted,
        error: phoneResult.error,
        correlationId,
      });

      const failedRecord: NotificationRecord = {
        id: `notif-${Date.now()}`,
        eventId: event.eventId,
        bookingId: event.bookingId,
        bookingReference: event.bookingReference,
        status: 'FAILED',
        templateKey: `${NotificationTemplateService.TEMPLATE_KEY}.${event.language ?? 'en'}`,
        templateVersion: NotificationTemplateService.TEMPLATE_VERSION,
        attemptCount: 1,
        recipientRedacted,
        language: event.language ?? 'en',
        error: phoneResult.error,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.notificationStore.set(idempotencyKey, failedRecord);
      return failedRecord;
    }

    // 3. Render safe multilingual message template
    const rendered = this.templateService.renderWithMetadata({
      language: event.language,
      hospitalName: event.hospitalName,
      date: event.appointmentDate,
      time: event.appointmentTime,
      bookingReference: event.bookingReference,
    });

    // 4. Create initial QUEUED notification record
    const record: NotificationRecord = {
      id: `notif-${Date.now()}`,
      eventId: event.eventId,
      bookingId: event.bookingId,
      bookingReference: event.bookingReference,
      status: 'QUEUED',
      templateKey: rendered.templateKey,
      templateVersion: rendered.templateVersion,
      attemptCount: 0,
      recipientRedacted,
      language: rendered.language,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 5. Send with bounded retries
    let lastError: string | undefined;
    for (let attempt = 1; attempt <= SMSNotificationService.MAX_RETRIES; attempt++) {
      record.attemptCount = attempt;
      record.updatedAt = new Date();

      try {
        this.logInfo('handleBookingConfirmed: sending SMS via provider adapter', {
          bookingId: event.bookingId,
          recipientRedacted,
          attempt,
          correlationId,
        });

        const sendResult = await this.smsProvider.sendSms({
          to: phoneResult.normalized,
          message: rendered.text,
          idempotencyKey,
          correlationId,
        });

        if (sendResult.success) {
          record.status = sendResult.status;
          record.providerMessageId = sendResult.providerMessageId;
          this.notificationStore.set(idempotencyKey, record);

          this.logInfo('handleBookingConfirmed: SMS accepted by provider', {
            bookingId: event.bookingId,
            providerMessageId: sendResult.providerMessageId,
            status: sendResult.status,
            correlationId,
          });

          return record;
        }

        lastError = sendResult.error;
        if (sendResult.status === 'FAILED') {
          // Permanent failure, do not retry
          break;
        }
        // RATE_LIMITED or transient error will continue to next retry attempt
      } catch (err: any) {
        lastError = err?.message ?? 'SMS provider timeout/network failure';
        this.logInfo('handleBookingConfirmed: SMS transmission attempt error', {
          attempt,
          error: lastError,
          correlationId,
        });
      }
    }

    // Mark as FAILED after retry exhaustion or permanent failure
    record.status = 'FAILED';
    record.error = lastError;
    record.updatedAt = new Date();
    this.notificationStore.set(idempotencyKey, record);

    return record;
  }

  /**
   * Retrieves notification status for a specific booking.
   */
  public getNotificationStatus(bookingId: string): NotificationRecord | undefined {
    return this.notificationStore.get(`sms-booking-confirm-${bookingId}`);
  }

  /**
   * Clears internal notification store (useful in test teardown).
   */
  public clearStore(): void {
    this.notificationStore.clear();
  }

  private logInfo(message: string, context: Record<string, unknown>): void {
    if (this.logger) {
      this.logger.info(message, context);
    }
  }
}
