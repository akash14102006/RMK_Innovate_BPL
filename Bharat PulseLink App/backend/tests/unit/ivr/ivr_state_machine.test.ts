import { describe, it, expect } from 'vitest';
import { IVRStateMachine } from '../../../src/modules/ivr/state/IVRStateMachine.js';
import { type IVRSession } from '../../../src/modules/ivr/ivr.types.js';

function createMockSession(overrides: Partial<IVRSession> = {}): IVRSession {
  const now = new Date();
  return {
    sessionId: '018f-test-session',
    callId: 'call-1001',
    channelId: 'PJSIP/1001-000001',
    language: null,
    state: 'CALL_RECEIVED',
    intent: 'NONE',
    attemptCounters: {
      language: 0,
      menu: 0,
      pincode: 0,
    },
    metadata: {},
    createdAt: now,
    updatedAt: now,
    expiresAt: new Date(now.getTime() + 900000),
    ...overrides,
  };
}

describe('IVRStateMachine — State Transitions & Boundaries', () => {
  const sm = new IVRStateMachine();

  it('transitions from CALL_RECEIVED to LANGUAGE_SELECTION on CALL_STARTED', () => {
    const session = createMockSession({ state: 'CALL_RECEIVED' });
    const res = sm.evaluateTransition(session, {
      type: 'CALL_STARTED',
      callId: session.callId,
    });

    expect(res.nextState).toBe('LANGUAGE_SELECTION');
    expect(res.promptKey).toBe('language-select');
    expect(res.action).toBe('PLAY_AND_WAIT');
  });

  it('selects Tamil (ta) when digit 1 received in LANGUAGE_SELECTION', () => {
    const session = createMockSession({ state: 'LANGUAGE_SELECTION' });
    const res = sm.evaluateTransition(session, {
      type: 'DTMF_RECEIVED',
      callId: session.callId,
      digits: '1',
    });

    expect(res.nextState).toBe('MAIN_MENU');
    expect(res.language).toBe('ta');
    expect(res.promptKey).toBe('main-menu');
    expect(res.action).toBe('PLAY_AND_WAIT');
  });

  it('selects English (en) when digit 2 received in LANGUAGE_SELECTION', () => {
    const session = createMockSession({ state: 'LANGUAGE_SELECTION' });
    const res = sm.evaluateTransition(session, {
      type: 'DTMF_RECEIVED',
      callId: session.callId,
      digits: '2',
    });

    expect(res.nextState).toBe('MAIN_MENU');
    expect(res.language).toBe('en');
    expect(res.promptKey).toBe('main-menu');
  });

  it('selects Hindi (hi) when digit 3 received in LANGUAGE_SELECTION', () => {
    const session = createMockSession({ state: 'LANGUAGE_SELECTION' });
    const res = sm.evaluateTransition(session, {
      type: 'DTMF_RECEIVED',
      callId: session.callId,
      digits: '3',
    });

    expect(res.nextState).toBe('MAIN_MENU');
    expect(res.language).toBe('hi');
    expect(res.promptKey).toBe('main-menu');
  });

  it('handles invalid DTMF in LANGUAGE_SELECTION with retry if attempts < 3', () => {
    const session = createMockSession({
      state: 'LANGUAGE_SELECTION',
      attemptCounters: { language: 0, menu: 0, pincode: 0 },
    });
    const res = sm.evaluateTransition(session, {
      type: 'DTMF_RECEIVED',
      callId: session.callId,
      digits: '9',
    });

    expect(res.nextState).toBe('LANGUAGE_SELECTION');
    expect(res.promptKey).toBe('invalid');
    expect(res.action).toBe('PLAY_AND_WAIT');
  });

  it('terminates with goodbye if max language attempts exceeded (3)', () => {
    const session = createMockSession({
      state: 'LANGUAGE_SELECTION',
      attemptCounters: { language: 2, menu: 0, pincode: 0 },
    });
    const res = sm.evaluateTransition(session, {
      type: 'DTMF_RECEIVED',
      callId: session.callId,
      digits: '9',
    });

    expect(res.nextState).toBe('FAILED');
    expect(res.promptKey).toBe('goodbye');
    expect(res.action).toBe('PLAY_AND_HANGUP');
  });

  it('routes Main Menu Option 1 to PIN_INPUT asking for enter-pincode', () => {
    const session = createMockSession({
      state: 'MAIN_MENU',
      language: 'en',
    });
    const res = sm.evaluateTransition(session, {
      type: 'DTMF_RECEIVED',
      callId: session.callId,
      digits: '1',
    });

    expect(res.nextState).toBe('PIN_INPUT');
    expect(res.intent).toBe('FIND_HOSPITAL');
    expect(res.promptKey).toBe('enter-pincode');
    expect(res.action).toBe('PLAY_AND_WAIT');
  });

  it('validates 6-digit PIN in PIN_INPUT and transitions to PIN_VALIDATED', () => {
    const session = createMockSession({
      state: 'PIN_INPUT',
      language: 'ta',
      intent: 'FIND_HOSPITAL',
    });
    const res = sm.evaluateTransition(session, {
      type: 'DTMF_RECEIVED',
      callId: session.callId,
      digits: '600001',
    });

    expect(res.nextState).toBe('PIN_VALIDATED');
    expect(res.pincode).toBe('600001');
    expect(res.promptKey).toBe('pin-success');
    expect(res.action).toBe('CONTINUE');
  });

  it('handles invalid PIN in PIN_INPUT with retry if attempts < 3', () => {
    const session = createMockSession({
      state: 'PIN_INPUT',
      language: 'en',
      attemptCounters: { language: 0, menu: 0, pincode: 0 },
    });
    const res = sm.evaluateTransition(session, {
      type: 'DTMF_RECEIVED',
      callId: session.callId,
      digits: '1234', // Only 4 digits
    });

    expect(res.nextState).toBe('PIN_INPUT');
    expect(res.promptKey).toBe('pin-invalid');
    expect(res.action).toBe('PLAY_AND_WAIT');
  });

  it('terminates with pin-max-attempts if 3 invalid PIN attempts occur', () => {
    const session = createMockSession({
      state: 'PIN_INPUT',
      language: 'en',
      attemptCounters: { language: 0, menu: 0, pincode: 2 },
    });
    const res = sm.evaluateTransition(session, {
      type: 'DTMF_RECEIVED',
      callId: session.callId,
      digits: '12345',
    });

    expect(res.nextState).toBe('FAILED');
    expect(res.promptKey).toBe('pin-max-attempts');
    expect(res.action).toBe('PLAY_AND_HANGUP');
  });

  it('routes Main Menu Option 2 to BOOK_APPOINTMENT', () => {
    const session = createMockSession({
      state: 'MAIN_MENU',
      language: 'ta',
    });
    const res = sm.evaluateTransition(session, {
      type: 'DTMF_RECEIVED',
      callId: session.callId,
      digits: '2',
    });

    expect(res.nextState).toBe('BOOK_APPOINTMENT');
    expect(res.intent).toBe('BOOK_APPOINTMENT');
    expect(res.promptKey).toBe('book-appointment');
    expect(res.language).toBe('ta');
  });

  it('routes Main Menu Option 3 to EXISTING_APPOINTMENT', () => {
    const session = createMockSession({
      state: 'MAIN_MENU',
      language: 'hi',
    });
    const res = sm.evaluateTransition(session, {
      type: 'DTMF_RECEIVED',
      callId: session.callId,
      digits: '3',
    });

    expect(res.nextState).toBe('EXISTING_APPOINTMENT');
    expect(res.intent).toBe('EXISTING_APPOINTMENT');
    expect(res.promptKey).toBe('existing-appointment');
  });

  it('routes Main Menu Option 4 to EMERGENCY', () => {
    const session = createMockSession({
      state: 'MAIN_MENU',
      language: 'en',
    });
    const res = sm.evaluateTransition(session, {
      type: 'DTMF_RECEIVED',
      callId: session.callId,
      digits: '4',
    });

    expect(res.nextState).toBe('EMERGENCY');
    expect(res.intent).toBe('EMERGENCY');
    expect(res.promptKey).toBe('emergency');
  });

  it('handles Main Menu timeout with retry and bounded limit', () => {
    const session = createMockSession({
      state: 'MAIN_MENU',
      language: 'en',
      attemptCounters: { language: 0, menu: 1, pincode: 0 },
    });
    const res = sm.evaluateTransition(session, {
      type: 'TIMEOUT',
      callId: session.callId,
    });

    expect(res.nextState).toBe('MAIN_MENU');
    expect(res.promptKey).toBe('timeout');

    // Third timeout
    const sessionMax = createMockSession({
      state: 'MAIN_MENU',
      language: 'en',
      attemptCounters: { language: 0, menu: 2, pincode: 0 },
    });
    const resMax = sm.evaluateTransition(sessionMax, {
      type: 'TIMEOUT',
      callId: sessionMax.callId,
    });

    expect(resMax.nextState).toBe('FAILED');
    expect(resMax.promptKey).toBe('goodbye');
    expect(resMax.action).toBe('PLAY_AND_HANGUP');
  });

  it('cleans up immediately on CALL_HANGUP at any state', () => {
    const session = createMockSession({
      state: 'MAIN_MENU',
      language: 'en',
    });
    const res = sm.evaluateTransition(session, {
      type: 'CALL_HANGUP',
      callId: session.callId,
    });

    expect(res.nextState).toBe('TERMINATED');
    expect(res.action).toBe('HANGUP');
  });

  it('selects hospital 1 from HOSPITAL_SELECTION and transitions to HOSPITAL_CONFIRMATION', () => {
    const session = createMockSession({
      state: 'HOSPITAL_SELECTION',
      language: 'en',
      nearbyHospitals: [
        {
          id: 'fac-001',
          name: 'Government General Hospital',
          displayName: 'Government General Hospital',
          facilityType: 'GOVERNMENT',
          distanceMeters: 1000,
          distanceKm: 1.0,
        },
        {
          id: 'fac-002',
          name: 'Apollo Hospital',
          displayName: 'Apollo Hospital',
          facilityType: 'PRIVATE',
          distanceMeters: 3200,
          distanceKm: 3.2,
        },
      ],
    });

    const res = sm.evaluateTransition(session, {
      type: 'DTMF_RECEIVED',
      callId: session.callId,
      digits: '1',
    });

    expect(res.nextState).toBe('HOSPITAL_CONFIRMATION');
    expect(res.selectedHospitalId).toBe('fac-001');
    expect(res.promptKey).toBe('hospital-confirm-1');
    expect(res.action).toBe('PLAY_AND_WAIT');
  });

  it('rejects invalid selection index (e.g. 5 when only 2 available) with retry', () => {
    const session = createMockSession({
      state: 'HOSPITAL_SELECTION',
      language: 'en',
      attemptCounters: { language: 0, menu: 0, pincode: 0, hospitalSelection: 0, hospitalConfirmation: 0 },
      nearbyHospitals: [
        {
          id: 'fac-001',
          name: 'Government General Hospital',
          displayName: 'Government General Hospital',
          facilityType: 'GOVERNMENT',
          distanceMeters: 1000,
          distanceKm: 1.0,
        },
      ],
    });

    const res = sm.evaluateTransition(session, {
      type: 'DTMF_RECEIVED',
      callId: session.callId,
      digits: '5',
    });

    expect(res.nextState).toBe('HOSPITAL_SELECTION');
    expect(res.promptKey).toBe('hospital-invalid-choice');
    expect(res.action).toBe('PLAY_AND_WAIT');
  });

  it('confirms hospital on digit 1 in HOSPITAL_CONFIRMATION and transitions to APPOINTMENT_DATE_SELECTION', () => {
    const session = createMockSession({
      state: 'HOSPITAL_CONFIRMATION',
      language: 'ta',
      selectedHospitalId: 'fac-001',
      selectedHospital: {
        id: 'fac-001',
        name: 'Government General Hospital',
        displayName: 'Government General Hospital',
        facilityType: 'GOVERNMENT',
        distanceMeters: 1000,
        distanceKm: 1.0,
      },
    });

    const res = sm.evaluateTransition(session, {
      type: 'DTMF_RECEIVED',
      callId: session.callId,
      digits: '1',
    });

    expect(res.nextState).toBe('APPOINTMENT_DATE_SELECTION');
    expect(res.promptKey).toBe('appointment-dates-menu');
    expect(res.action).toBe('PLAY_AND_WAIT');
  });

  it('returns to HOSPITAL_SELECTION on digit 2 in HOSPITAL_CONFIRMATION to change hospital', () => {
    const session = createMockSession({
      state: 'HOSPITAL_CONFIRMATION',
      language: 'en',
      selectedHospitalId: 'fac-001',
    });

    const res = sm.evaluateTransition(session, {
      type: 'DTMF_RECEIVED',
      callId: session.callId,
      digits: '2',
    });

    expect(res.nextState).toBe('HOSPITAL_SELECTION');
    expect(res.promptKey).toBe('hospital-options-menu');
    expect(res.action).toBe('PLAY_AND_WAIT');
  });

  it('selects date option 1 from APPOINTMENT_DATE_SELECTION and transitions to APPOINTMENT_SLOT_SELECTION', () => {
    const session = createMockSession({
      state: 'APPOINTMENT_DATE_SELECTION',
      language: 'en',
      availableDates: ['2026-09-02', '2026-09-03', '2026-09-04'],
    });

    const res = sm.evaluateTransition(session, {
      type: 'DTMF_RECEIVED',
      callId: session.callId,
      digits: '1',
    });

    expect(res.nextState).toBe('APPOINTMENT_SLOT_SELECTION');
    expect(res.selectedAppointmentDate).toBe('2026-09-02');
    expect(res.promptKey).toBe('appointment-slots-menu');
    expect(res.action).toBe('PLAY_AND_WAIT');
  });

  it('selects slot option 2 from APPOINTMENT_SLOT_SELECTION and transitions to SLOT_CONFIRMATION', () => {
    const session = createMockSession({
      state: 'APPOINTMENT_SLOT_SELECTION',
      language: 'en',
      selectedAppointmentDate: '2026-09-02',
      availableSlots: [
        {
          id: 'slot-01',
          facilityId: 'fac-001',
          slotDate: '2026-09-02',
          startTime: '10:00',
          endTime: '10:30',
          displayTime: '10:00 AM',
          status: 'AVAILABLE',
          timezone: 'Asia/Kolkata',
        },
        {
          id: 'slot-02',
          facilityId: 'fac-001',
          slotDate: '2026-09-02',
          startTime: '11:30',
          endTime: '12:00',
          displayTime: '11:30 AM',
          status: 'AVAILABLE',
          timezone: 'Asia/Kolkata',
        },
      ],
    });

    const res = sm.evaluateTransition(session, {
      type: 'DTMF_RECEIVED',
      callId: session.callId,
      digits: '2',
    });

    expect(res.nextState).toBe('SLOT_CONFIRMATION');
    expect(res.selectedSlotId).toBe('slot-02');
    expect(res.promptKey).toBe('appointment-confirm-slot');
    expect(res.action).toBe('PLAY_AND_WAIT');
  });

  it('confirms slot on digit 1 in SLOT_CONFIRMATION and advances to BOOKING_CONFIRMED', () => {
    const session = createMockSession({
      state: 'SLOT_CONFIRMATION',
      language: 'hi',
      selectedHospitalId: 'fac-001',
      selectedAppointmentDate: '2026-09-02',
      selectedSlotId: 'slot-01',
    });

    const res = sm.evaluateTransition(session, {
      type: 'DTMF_RECEIVED',
      callId: session.callId,
      digits: '1',
    });

    expect(res.nextState).toBe('BOOKING_CONFIRMED');
    expect(res.promptKey).toBe('booking-confirmed-sms-sent');
    expect(res.action).toBe('PLAY_AND_HANGUP');
  });

  it('returns to APPOINTMENT_SLOT_SELECTION on digit 2 in SLOT_CONFIRMATION to change slot', () => {
    const session = createMockSession({
      state: 'SLOT_CONFIRMATION',
      language: 'en',
      selectedAppointmentDate: '2026-09-02',
      selectedSlotId: 'slot-01',
    });

    const res = sm.evaluateTransition(session, {
      type: 'DTMF_RECEIVED',
      callId: session.callId,
      digits: '2',
    });

    expect(res.nextState).toBe('APPOINTMENT_SLOT_SELECTION');
    expect(res.promptKey).toBe('appointment-slots-menu');
    expect(res.action).toBe('PLAY_AND_WAIT');
  });
});
