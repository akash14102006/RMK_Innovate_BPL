import { describe, it, expect, beforeEach } from 'vitest';
import { IVRApplicationService } from '../../../src/modules/ivr/IVRApplicationService.js';
import { MockAsteriskAdapter } from '../../../src/modules/ivr/asterisk/AsteriskAdapter.js';
import { SMSNotificationService } from '../../../src/modules/notifications/SMSNotificationService.js';
import { MockSmsProvider } from '../../../src/modules/notifications/SmsProvider.js';

describe('IVRApplicationService — End-to-End Booking & SMS Confirmation (Step 11)', () => {
  let mockAdapter: MockAsteriskAdapter;
  let mockSmsProvider: MockSmsProvider;
  let smsService: SMSNotificationService;
  let ivrApp: IVRApplicationService;

  beforeEach(() => {
    mockAdapter = new MockAsteriskAdapter();
    mockSmsProvider = new MockSmsProvider();
    smsService = new SMSNotificationService({ smsProvider: mockSmsProvider });
    ivrApp = new IVRApplicationService({
      asteriskAdapter: mockAdapter,
      smsNotificationService: smsService,
    });
  });

  it('orchestrates complete call -> Tamil -> PIN 600001 -> Hospital 1 -> Date 1 -> Slot 1 -> Booking Confirmed -> SMS Dispatched', async () => {
    const callId = 'call-test-step11-full';
    const channelId = 'PJSIP/1001-001';

    // 1. Call Starts
    const start = await ivrApp.handleCallStart({ callId, channelId, callerNumber: '+919876543210' });
    expect(start.session.state).toBe('LANGUAGE_SELECTION');

    // 2. User presses 1 (Tamil)
    const dtmfLang = await ivrApp.handleDtmfInput({ callId, digits: '1' });
    expect(dtmfLang.session.state).toBe('MAIN_MENU');
    expect(dtmfLang.session.language).toBe('ta');

    // 3. User presses 1 (Find Hospital) -> Prompted for PIN
    const dtmfMenu = await ivrApp.handleDtmfInput({ callId, digits: '1' });
    expect(dtmfMenu.session.state).toBe('PIN_INPUT');

    // 4. User enters 6-digit PIN "600001" -> Discovers hospitals -> Enters HOSPITAL_SELECTION
    const dtmfPin = await ivrApp.handleDtmfInput({ callId, digits: '600001' });
    expect(dtmfPin.session.state).toBe('HOSPITAL_SELECTION');

    // 5. User selects Option 1 (Government General Hospital) -> Enters HOSPITAL_CONFIRMATION
    const dtmfSelectHosp = await ivrApp.handleDtmfInput({ callId, digits: '1' });
    expect(dtmfSelectHosp.session.state).toBe('HOSPITAL_CONFIRMATION');

    // 6. User confirms Hospital Selection (Press 1) -> Enters APPOINTMENT_DATE_SELECTION
    const dtmfConfirmHosp = await ivrApp.handleDtmfInput({ callId, digits: '1' });
    expect(dtmfConfirmHosp.session.state).toBe('APPOINTMENT_DATE_SELECTION');

    // 7. User selects Date 1 (Press 1) -> Enters APPOINTMENT_SLOT_SELECTION
    const dtmfSelectDate = await ivrApp.handleDtmfInput({ callId, digits: '1' });
    expect(dtmfSelectDate.session.state).toBe('APPOINTMENT_SLOT_SELECTION');

    // 8. User selects Slot 1 (10:00 AM) -> Enters SLOT_CONFIRMATION
    const dtmfSelectSlot = await ivrApp.handleDtmfInput({ callId, digits: '1' });
    expect(dtmfSelectSlot.session.state).toBe('SLOT_CONFIRMATION');

    // 9. User confirms Slot Choice (Press 1) -> Booking Confirmed & SMS Dispatched (Step 11)
    const dtmfConfirmBooking = await ivrApp.handleDtmfInput({ callId, digits: '1' });
    expect(dtmfConfirmBooking.session.state).toBe('BOOKING_CONFIRMED');
    expect(dtmfConfirmBooking.session.bookingReference).toBeDefined();
    expect(dtmfConfirmBooking.session.bookingReference).toContain('BP-600001');
    expect(dtmfConfirmBooking.session.notificationStatus).toBe('ACCEPTED');

    const callRecord = mockAdapter.getCallHistory(channelId);
    expect(callRecord?.playedPrompts).toContain('bharat-pulselink/ta/booking-confirmed-sms-sent');
    expect(callRecord?.hungup).toBe(true);

    const sentSms = mockSmsProvider.getSentMessages();
    expect(sentSms.length).toBe(1);
    expect(sentSms[0].to).toBe('+919876543210');
    expect(sentSms[0].message).toContain('பாரத் பல்ஸ்லிங்க்');
  });

  it('preserves Booking Success even if SMS provider fails (Booking Independence)', async () => {
    mockSmsProvider.shouldFail = true;

    const callId = 'call-test-booking-independence';
    const channelId = 'PJSIP/1001-002';

    await ivrApp.handleCallStart({ callId, channelId, callerNumber: '+919876543210' });
    await ivrApp.handleDtmfInput({ callId, digits: '2' }); // English
    await ivrApp.handleDtmfInput({ callId, digits: '1' }); // Find Hospital
    await ivrApp.handleDtmfInput({ callId, digits: '600001' }); // PIN
    await ivrApp.handleDtmfInput({ callId, digits: '1' }); // Hospital 1
    await ivrApp.handleDtmfInput({ callId, digits: '1' }); // Confirm Hospital
    await ivrApp.handleDtmfInput({ callId, digits: '1' }); // Date 1
    await ivrApp.handleDtmfInput({ callId, digits: '1' }); // Slot 1

    // Confirm booking
    const res = await ivrApp.handleDtmfInput({ callId, digits: '1' });

    // Booking MUST remain CONFIRMED
    expect(res.session.state).toBe('BOOKING_CONFIRMED');
    expect(res.session.bookingReference).toBeDefined();
    expect(res.session.notificationStatus).toBe('FAILED');

    const callRecord = mockAdapter.getCallHistory(channelId);
    expect(callRecord?.playedPrompts).toContain('bharat-pulselink/en/booking-confirmed-sms-queued');
    expect(callRecord?.hungup).toBe(true);
  });

  it('preserves complete session and notification isolation across concurrent callers', async () => {
    const callIdA = 'call-step11-iso-a';
    const channelIdA = 'PJSIP/1001-003';
    const callIdB = 'call-step11-iso-b';
    const channelIdB = 'PJSIP/1001-004';

    await ivrApp.handleCallStart({ callId: callIdA, channelId: channelIdA, callerNumber: '+919876511111' });
    await ivrApp.handleCallStart({ callId: callIdB, channelId: channelIdB, callerNumber: '+919876522222' });

    // Caller A: Tamil -> PIN 600001 -> Hospital 1 -> Date 1 -> Slot 1 -> Confirm
    await ivrApp.handleDtmfInput({ callId: callIdA, digits: '1' });
    await ivrApp.handleDtmfInput({ callId: callIdA, digits: '1' });
    await ivrApp.handleDtmfInput({ callId: callIdA, digits: '600001' });
    await ivrApp.handleDtmfInput({ callId: callIdA, digits: '1' });
    await ivrApp.handleDtmfInput({ callId: callIdA, digits: '1' });
    await ivrApp.handleDtmfInput({ callId: callIdA, digits: '1' });
    await ivrApp.handleDtmfInput({ callId: callIdA, digits: '1' });
    await ivrApp.handleDtmfInput({ callId: callIdA, digits: '1' });

    // Caller B: English -> PIN 600001 -> Hospital 2 -> Date 2 -> Slot 2 -> Confirm
    await ivrApp.handleDtmfInput({ callId: callIdB, digits: '2' });
    await ivrApp.handleDtmfInput({ callId: callIdB, digits: '1' });
    await ivrApp.handleDtmfInput({ callId: callIdB, digits: '600001' });
    await ivrApp.handleDtmfInput({ callId: callIdB, digits: '2' });
    await ivrApp.handleDtmfInput({ callId: callIdB, digits: '1' });
    await ivrApp.handleDtmfInput({ callId: callIdB, digits: '2' });
    await ivrApp.handleDtmfInput({ callId: callIdB, digits: '2' });
    await ivrApp.handleDtmfInput({ callId: callIdB, digits: '1' });

    const sessionA = await ivrApp.getSessionStatus(callIdA);
    const sessionB = await ivrApp.getSessionStatus(callIdB);

    expect(sessionA.state).toBe('BOOKING_CONFIRMED');
    expect(sessionA.selectedHospitalId).toBe('fac-sample-01');
    expect(sessionA.notificationStatus).toBe('ACCEPTED');

    expect(sessionB.state).toBe('BOOKING_CONFIRMED');
    expect(sessionB.selectedHospitalId).toBe('fac-sample-02');
    expect(sessionB.notificationStatus).toBe('ACCEPTED');

    const sent = mockSmsProvider.getSentMessages();
    expect(sent.length).toBe(2);
    expect(sent[0].to).toBe('+919876511111');
    expect(sent[1].to).toBe('+919876522222');
  });
});
