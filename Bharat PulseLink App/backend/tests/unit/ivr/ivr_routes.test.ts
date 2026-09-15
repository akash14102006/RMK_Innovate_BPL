import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from '../../helpers/createTestApp.js';

describe('IVR Fastify Internal API Routes (/api/v1/internal/ivr)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/internal/ivr/health returns 200 UP', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/internal/ivr/health',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('UP');
    expect(body.service).toBe('bharat-pulselink-ivr-service');
  });

  it('POST /session/start initializes new session and returns 200', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/internal/ivr/session/start',
      payload: {
        callId: 'call-route-test-01',
        channelId: 'PJSIP/1001-route01',
        callerNumber: '+919876543210',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.sessionId).toBeDefined();
    expect(body.state).toBe('LANGUAGE_SELECTION');
    expect(body.nextPrompt).toBe('language-select');
  });

  it('POST /event/dtmf processes Language and Main Menu -> PIN_INPUT', async () => {
    // Select Language: 2 (English)
    const resLang = await app.inject({
      method: 'POST',
      url: '/api/v1/internal/ivr/event/dtmf',
      payload: {
        callId: 'call-route-test-01',
        digits: '2',
      },
    });

    expect(resLang.statusCode).toBe(200);
    const bodyLang = JSON.parse(resLang.body);
    expect(bodyLang.state).toBe('MAIN_MENU');
    expect(bodyLang.language).toBe('en');

    // Select Menu: 1 (Find Hospital) -> prompts for PIN
    const resMenu = await app.inject({
      method: 'POST',
      url: '/api/v1/internal/ivr/event/dtmf',
      payload: {
        callId: 'call-route-test-01',
        digits: '1',
      },
    });

    expect(resMenu.statusCode).toBe(200);
    const bodyMenu = JSON.parse(resMenu.body);
    expect(bodyMenu.state).toBe('PIN_INPUT');
    expect(bodyMenu.nextPrompt).toBe('enter-pincode');
    expect(bodyMenu.action).toBe('PLAY_AND_WAIT');

    // Submit valid 6-digit PIN "600001"
    const resPin = await app.inject({
      method: 'POST',
      url: '/api/v1/internal/ivr/event/dtmf',
      payload: {
        callId: 'call-route-test-01',
        digits: '600001',
      },
    });

    expect(resPin.statusCode).toBe(200);
    const bodyPin = JSON.parse(resPin.body);
    expect(bodyPin.state).toBe('HOSPITAL_SELECTION');
    expect(bodyPin.intent).toBe('FIND_HOSPITAL');
    expect(bodyPin.nextPrompt).toBe('hospital-options-menu');
    expect(bodyPin.action).toBe('PLAY_AND_WAIT');

    // Select Hospital Option 1
    const resSelect = await app.inject({
      method: 'POST',
      url: '/api/v1/internal/ivr/event/dtmf',
      payload: {
        callId: 'call-route-test-01',
        digits: '1',
      },
    });
    expect(resSelect.statusCode).toBe(200);
    const bodySelect = JSON.parse(resSelect.body);
    expect(bodySelect.state).toBe('HOSPITAL_CONFIRMATION');
    expect(bodySelect.nextPrompt).toBe('hospital-confirm-1');

    // Confirm Hospital Selection with digit 1 -> Advances to APPOINTMENT_DATE_SELECTION
    const resConfirmHosp = await app.inject({
      method: 'POST',
      url: '/api/v1/internal/ivr/event/dtmf',
      payload: {
        callId: 'call-route-test-01',
        digits: '1',
      },
    });
    expect(resConfirmHosp.statusCode).toBe(200);
    const bodyConfirmHosp = JSON.parse(resConfirmHosp.body);
    expect(bodyConfirmHosp.state).toBe('APPOINTMENT_DATE_SELECTION');
    expect(bodyConfirmHosp.nextPrompt).toBe('appointment-dates-menu');

    // Select Date 1 (digit 1) -> Advances to APPOINTMENT_SLOT_SELECTION
    const resSelectDate = await app.inject({
      method: 'POST',
      url: '/api/v1/internal/ivr/event/dtmf',
      payload: {
        callId: 'call-route-test-01',
        digits: '1',
      },
    });
    expect(resSelectDate.statusCode).toBe(200);
    const bodySelectDate = JSON.parse(resSelectDate.body);
    expect(bodySelectDate.state).toBe('APPOINTMENT_SLOT_SELECTION');
    expect(bodySelectDate.nextPrompt).toBe('appointment-slots-menu');

    // Select Slot 1 (digit 1) -> Advances to SLOT_CONFIRMATION
    const resSelectSlot = await app.inject({
      method: 'POST',
      url: '/api/v1/internal/ivr/event/dtmf',
      payload: {
        callId: 'call-route-test-01',
        digits: '1',
      },
    });
    expect(resSelectSlot.statusCode).toBe(200);
    const bodySelectSlot = JSON.parse(resSelectSlot.body);
    expect(bodySelectSlot.state).toBe('SLOT_CONFIRMATION');
    expect(bodySelectSlot.nextPrompt).toBe('appointment-confirm-slot');

    // Confirm Slot Choice with digit 1 -> Advances to BOOKING_CONFIRMED & Dispatches SMS
    const resConfirmSlot = await app.inject({
      method: 'POST',
      url: '/api/v1/internal/ivr/event/dtmf',
      payload: {
        callId: 'call-route-test-01',
        digits: '1',
      },
    });
    expect(resConfirmSlot.statusCode).toBe(200);
    const bodyConfirmSlot = JSON.parse(resConfirmSlot.body);
    expect(bodyConfirmSlot.state).toBe('BOOKING_CONFIRMED');
    expect(bodyConfirmSlot.bookingReference).toBeDefined();
    expect(bodyConfirmSlot.notificationStatus).toBe('ACCEPTED');
  });

  it('GET /session/:callId returns active session with confirmed appointment booking and reference', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/internal/ivr/session/call-route-test-01',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.session.callId).toBe('call-route-test-01');
    expect(body.session.pincode).toBe('600001');
    expect(body.session.state).toBe('BOOKING_CONFIRMED');
    expect(body.session.selectedHospitalId).toBeDefined();
    expect(body.session.selectedAppointmentDate).toBeDefined();
    expect(body.session.bookingReference).toBeDefined();
    expect(body.session.notificationStatus).toBe('ACCEPTED');
  });

  it('POST /event/hangup terminates session cleanly', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/internal/ivr/event/hangup',
      payload: {
        callId: 'call-route-test-01',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.terminatedState).toBe('TERMINATED');
  });
});
