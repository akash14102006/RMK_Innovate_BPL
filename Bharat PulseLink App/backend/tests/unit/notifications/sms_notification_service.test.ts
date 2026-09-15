import { describe, it, expect, beforeEach } from 'vitest';
import {
  SMSNotificationService,
  type AppointmentBookingConfirmedEvent,
} from '../../../src/modules/notifications/SMSNotificationService.js';
import { MockSmsProvider } from '../../../src/modules/notifications/SmsProvider.js';
import { AppError } from '../../../src/core/errors/AppError.js';

describe('SMSNotificationService — Reliable, Idempotent, Multilingual SMS Confirmation (Step 11)', () => {
  let mockProvider: MockSmsProvider;
  let service: SMSNotificationService;

  beforeEach(() => {
    mockProvider = new MockSmsProvider();
    service = new SMSNotificationService({ smsProvider: mockProvider });
  });

  const baseEvent: AppointmentBookingConfirmedEvent = {
    eventId: 'evt-001',
    bookingId: 'book-001',
    bookingReference: 'BP-600001-1001',
    facilityId: 'fac-sample-01',
    hospitalName: 'Government General Hospital',
    appointmentDate: 'Monday, September 2nd',
    appointmentTime: '10:00 AM',
    recipientPhoneNumber: '9876543210',
    language: 'en',
  };

  // TEST 01: Valid appointment confirmation template (English)
  it('TEST 01: delivers English SMS successfully and tracks ACCEPTED state', async () => {
    const record = await service.handleBookingConfirmed(baseEvent);
    expect(record.status).toBe('ACCEPTED');
    expect(record.bookingReference).toBe('BP-600001-1001');
    expect(record.templateKey).toBe('sms.appointment-confirmed.en');
    expect(record.templateVersion).toBe('1.0.0');
    expect(record.attemptCount).toBe(1);
    expect(record.providerMessageId).toBeDefined();

    const sent = mockProvider.getSentMessages();
    expect(sent.length).toBe(1);
    expect(sent[0].to).toBe('+919876543210');
    expect(sent[0].message).toContain('Bharat PulseLink: Your appointment is confirmed at Government General Hospital');
    expect(sent[0].message).toContain('BP-600001-1001');
  });

  // TEST 02: Tamil template
  it('TEST 02: renders and delivers Tamil SMS confirmation correctly', async () => {
    const tamilEvent: AppointmentBookingConfirmedEvent = {
      ...baseEvent,
      bookingId: 'book-tamil-01',
      bookingReference: 'BP-600001-2002',
      language: 'ta',
      hospitalName: 'அரசு பொது மருத்துவமனை',
    };

    const record = await service.handleBookingConfirmed(tamilEvent);
    expect(record.status).toBe('ACCEPTED');
    expect(record.templateKey).toBe('sms.appointment-confirmed.ta');

    const sent = mockProvider.getSentMessages();
    expect(sent.length).toBe(1);
    expect(sent[0].message).toContain('பாரத் பல்ஸ்லிங்க்: அரசு பொது மருத்துவமனை');
    expect(sent[0].message).toContain('BP-600001-2002');
  });

  // TEST 03: Hindi template
  it('TEST 03: renders and delivers Hindi SMS confirmation correctly', async () => {
    const hindiEvent: AppointmentBookingConfirmedEvent = {
      ...baseEvent,
      bookingId: 'book-hindi-01',
      bookingReference: 'BP-110001-3003',
      language: 'hi',
      hospitalName: 'सरकारी अस्पताल',
    };

    const record = await service.handleBookingConfirmed(hindiEvent);
    expect(record.status).toBe('ACCEPTED');
    expect(record.templateKey).toBe('sms.appointment-confirmed.hi');

    const sent = mockProvider.getSentMessages();
    expect(sent.length).toBe(1);
    expect(sent[0].message).toContain('भारत पल्सलिंक: सरकारी अस्पताल');
    expect(sent[0].message).toContain('BP-110001-3003');
  });

  // TEST 04: Missing booking reference
  it('TEST 04: throws validation error when booking reference is missing', async () => {
    const badEvent: AppointmentBookingConfirmedEvent = {
      ...baseEvent,
      bookingReference: '',
    };

    await expect(service.handleBookingConfirmed(badEvent)).rejects.toThrow(AppError);
  });

  // TEST 05: Missing hospital name
  it('TEST 05: throws validation error when hospital name is missing', async () => {
    const badEvent: AppointmentBookingConfirmedEvent = {
      ...baseEvent,
      hospitalName: '',
    };

    await expect(service.handleBookingConfirmed(badEvent)).rejects.toThrow(AppError);
  });

  // TEST 06: Invalid phone number
  it('TEST 06: handles invalid phone number safely, marks FAILED without throwing', async () => {
    const badEvent: AppointmentBookingConfirmedEvent = {
      ...baseEvent,
      bookingId: 'book-bad-phone',
      recipientPhoneNumber: 'invalid_number',
    };

    const record = await service.handleBookingConfirmed(badEvent);
    expect(record.status).toBe('FAILED');
    expect(record.error).toContain('Invalid Indian mobile number');
    expect(mockProvider.getSentMessages().length).toBe(0);
  });

  // TEST 07: Provider accepts SMS
  it('TEST 07: tracks provider acceptance with providerMessageId', async () => {
    const record = await service.handleBookingConfirmed(baseEvent);
    expect(record.status).toBe('ACCEPTED');
    expect(record.providerMessageId).toMatch(/^msg-mock-/);
  });

  // TEST 08: Provider rejects SMS
  it('TEST 08: handles permanent provider rejection immediately without retry loop', async () => {
    mockProvider.shouldFail = true;

    const record = await service.handleBookingConfirmed(baseEvent);
    expect(record.status).toBe('FAILED');
    expect(record.attemptCount).toBe(1);
    expect(record.error).toContain('Permanent provider error');
  });

  // TEST 09: Provider timeout
  it('TEST 09: retries bounded transient provider timeouts and exhausts retries cleanly', async () => {
    mockProvider.shouldTimeout = true;

    const record = await service.handleBookingConfirmed(baseEvent);
    expect(record.status).toBe('FAILED');
    expect(record.attemptCount).toBe(3);
    expect(record.error).toContain('SMS Gateway HTTP Request Timeout');
  });

  // TEST 10: Provider rate limited
  it('TEST 10: retries bounded transient rate limits and exhausts retries cleanly', async () => {
    mockProvider.shouldRateLimit = true;

    const record = await service.handleBookingConfirmed(baseEvent);
    expect(record.status).toBe('FAILED');
    expect(record.attemptCount).toBe(3);
    expect(record.error).toContain('Rate limit exceeded');
  });

  // TEST 11 & TEST 12: Idempotency test
  it('TEST 11 & 12: guarantees idempotency on duplicate booking confirmation events', async () => {
    const record1 = await service.handleBookingConfirmed(baseEvent);
    const record2 = await service.handleBookingConfirmed(baseEvent);

    expect(record1.status).toBe('ACCEPTED');
    expect(record2.status).toBe('ACCEPTED');
    expect(record2.providerMessageId).toBe(record1.providerMessageId);

    // Only 1 SMS transmitted despite 2 duplicate events
    expect(mockProvider.getSentMessages().length).toBe(1);
  });

  // TEST 13: Different bookings
  it('TEST 13: processes different bookings as separate independent notifications', async () => {
    const eventA: AppointmentBookingConfirmedEvent = {
      ...baseEvent,
      bookingId: 'book-A',
      bookingReference: 'BP-600001-AAAA',
    };
    const eventB: AppointmentBookingConfirmedEvent = {
      ...baseEvent,
      bookingId: 'book-B',
      bookingReference: 'BP-600001-BBBB',
    };

    const recordA = await service.handleBookingConfirmed(eventA);
    const recordB = await service.handleBookingConfirmed(eventB);

    expect(recordA.bookingReference).toBe('BP-600001-AAAA');
    expect(recordB.bookingReference).toBe('BP-600001-BBBB');
    expect(recordA.providerMessageId).not.toBe(recordB.providerMessageId);
    expect(mockProvider.getSentMessages().length).toBe(2);
  });

  // TEST 14: Disallowed marketing/clinical content attempt
  it('TEST 14: rejects attempts to inject marketing or clinical content into notification', async () => {
    const clinicalEvent: AppointmentBookingConfirmedEvent = {
      ...baseEvent,
      hospitalName: 'City Hospital - Prescription for Diabetes blood test',
    };

    await expect(service.handleBookingConfirmed(clinicalEvent)).rejects.toThrow(AppError);
  });

  // Transient retry recovery
  it('recovers from transient failures if provider succeeds on 2nd attempt', async () => {
    mockProvider.timeoutAttemptsRemaining = 1; // Fails once, then succeeds

    const record = await service.handleBookingConfirmed(baseEvent);
    expect(record.status).toBe('ACCEPTED');
    expect(record.attemptCount).toBe(2);
    expect(mockProvider.getSentMessages().length).toBe(1);
  });

  // Handset delivered status
  it('tracks DELIVERED status when provider supports handset delivery confirmation', async () => {
    mockProvider.shouldDeliver = true;

    const record = await service.handleBookingConfirmed(baseEvent);
    expect(record.status).toBe('DELIVERED');
  });

  // Concurrent booking notifications
  it('processes multiple concurrent booking notifications in parallel without interference', async () => {
    const events: AppointmentBookingConfirmedEvent[] = Array.from({ length: 10 }, (_, i) => ({
      ...baseEvent,
      eventId: `evt-concurrent-${i}`,
      bookingId: `book-concurrent-${i}`,
      bookingReference: `BP-600001-000${i}`,
      recipientPhoneNumber: `987654321${i}`,
    }));

    const results = await Promise.all(events.map(ev => service.handleBookingConfirmed(ev)));
    expect(results.length).toBe(10);
    results.forEach((rec, idx) => {
      expect(rec.status).toBe('ACCEPTED');
      expect(rec.bookingReference).toBe(`BP-600001-000${idx}`);
    });

    expect(mockProvider.getSentMessages().length).toBe(10);
  });
});
