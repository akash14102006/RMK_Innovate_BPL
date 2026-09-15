/**
 * Bharat PulseLink — SMS Provider Interface & Test Adapter
 *
 * Abstract provider boundary for transactional SMS delivery.
 *
 * Owned by: Notifications Domain (Step 11)
 */

export interface SmsSendParams {
  to: string; // E.164 phone number
  message: string;
  idempotencyKey?: string;
  correlationId?: string;
}

export type SmsDeliveryStatus = 'ACCEPTED' | 'SENT' | 'DELIVERED' | 'FAILED' | 'RATE_LIMITED' | 'TIMEOUT';

export interface SmsSendResult {
  success: boolean;
  providerMessageId: string;
  status: SmsDeliveryStatus;
  sentAt: Date;
  error?: string;
}

export interface ISmsProvider {
  sendSms(params: SmsSendParams): Promise<SmsSendResult>;
}

export class MockSmsProvider implements ISmsProvider {
  private readonly sentMessages: Array<SmsSendParams & { providerMessageId: string; timestamp: Date }> = [];
  public shouldFail = false;
  public shouldTimeout = false;
  public timeoutAttemptsRemaining = 0;
  public shouldRateLimit = false;
  public rateLimitAttemptsRemaining = 0;
  public shouldDeliver = false;

  public async sendSms(params: SmsSendParams): Promise<SmsSendResult> {
    if (this.shouldTimeout || this.timeoutAttemptsRemaining > 0) {
      if (this.timeoutAttemptsRemaining > 0) {
        this.timeoutAttemptsRemaining -= 1;
      }
      throw new Error('SMS Gateway HTTP Request Timeout (504)');
    }

    if (this.shouldRateLimit || this.rateLimitAttemptsRemaining > 0) {
      if (this.rateLimitAttemptsRemaining > 0) {
        this.rateLimitAttemptsRemaining -= 1;
      }
      return {
        success: false,
        providerMessageId: `msg-err-${Date.now()}`,
        status: 'RATE_LIMITED',
        sentAt: new Date(),
        error: 'Rate limit exceeded: 429 Too Many Requests',
      };
    }

    if (this.shouldFail) {
      return {
        success: false,
        providerMessageId: `msg-err-${Date.now()}`,
        status: 'FAILED',
        sentAt: new Date(),
        error: 'Permanent provider error: Invalid recipient carrier',
      };
    }

    const providerMessageId = `msg-mock-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    this.sentMessages.push({
      ...params,
      providerMessageId,
      timestamp: new Date(),
    });

    const status: SmsDeliveryStatus = this.shouldDeliver ? 'DELIVERED' : 'ACCEPTED';

    return {
      success: true,
      providerMessageId,
      status,
      sentAt: new Date(),
    };
  }

  public getSentMessages(): ReadonlyArray<SmsSendParams & { providerMessageId: string; timestamp: Date }> {
    return [...this.sentMessages];
  }

  public clear(): void {
    this.sentMessages.length = 0;
    this.shouldFail = false;
    this.shouldTimeout = false;
    this.timeoutAttemptsRemaining = 0;
    this.shouldRateLimit = false;
    this.rateLimitAttemptsRemaining = 0;
    this.shouldDeliver = false;
  }
}
