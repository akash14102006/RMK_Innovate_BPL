/**
 * Bharat PulseLink — Exotel Telephony Integration & Toll Fraud Defense Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TelephonySecurityValidator,
  type TelephonyProviderConfig,
  TelephonyObservabilityService,
  TelephonyHealthService,
} from '../../../src/modules/ivr/telephony/index.js';
import { AppError } from '../../../src/core/errors/AppError.js';
import { IVRApplicationService } from '../../../src/modules/ivr/IVRApplicationService.js';
import { MockAsteriskAdapter } from '../../../src/modules/ivr/asterisk/AsteriskAdapter.js';

describe('Exotel Telephony Integration & Security (Step 12)', () => {
  let config: TelephonyProviderConfig;
  let validator: TelephonySecurityValidator;
  let observability: TelephonyObservabilityService;
  let healthService: TelephonyHealthService;
  let ivrService: IVRApplicationService;
  let mockAdapter: MockAsteriskAdapter;

  beforeEach(() => {
    config = {
      providerName: 'exotel',
      inboundDid: '08040265947',
      allowedSourceIps: ['127.0.0.1', '172.31.0.0/16', '103.120.10.0/24'],
      sipTrunk: {
        host: '52.205.228.23',
        port: 5070,
        transport: 'tcp',
        srtpEnabled: false,
      },
      maxCallDurationSeconds: 600,
      rateLimitPerCaller: {
        windowSeconds: 300,
        maxCalls: 5,
      },
      webhookSecret: 'exotel-test-webhook-secret-key',
      isOutboundAllowed: false, // Strictly inbound only
    };

    validator = new TelephonySecurityValidator(config);
    observability = new TelephonyObservabilityService();
    healthService = new TelephonyHealthService();
    mockAdapter = new MockAsteriskAdapter();
    ivrService = new IVRApplicationService({ asteriskAdapter: mockAdapter });
  });

  // TEST 01: Valid inbound call on ExoPhone 08040265947
  it('TEST 01: accepts inbound call on registered ExoPhone 08040265947', () => {
    const result = validator.validateInboundCall({
      calledDid: '08040265947',
      callerNumber: '9876543210',
      sourceIp: '172.31.27.27',
    });

    expect(result.isValid).toBe(true);
    expect(result.normalizedCaller).toBe('+919876543210');
    expect(result.maskedCaller).toBe('+91******3210');
  });

  // TEST 02: Rejects foreign or unrecognized DID
  it('TEST 02: rejects incoming call to mismatched DID number', () => {
    const result = validator.validateInboundCall({
      calledDid: '08011112222',
      callerNumber: '9876543210',
      sourceIp: '172.31.27.27',
    });

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('does not match configured Bharat PulseLink public DID');
  });

  // TEST 03: Outbound call attempts are blocked
  it('TEST 03: blocks outbound call origination attempts (Toll Fraud Defense)', () => {
    expect(() =>
      validator.validateInboundCall({
        calledDid: '08040265947',
        callerNumber: '9876543210',
        sourceIp: '172.31.27.27',
        isOutboundAttempt: true,
      }),
    ).toThrow(AppError);
  });

  // TEST 04: Public callers blocked from dialing internal extensions
  it('TEST 04: blocks public callers from accessing internal test extensions (1000, 1001, admin)', () => {
    expect(() =>
      validator.validateInboundCall({
        calledDid: '08040265947',
        callerNumber: '9876543210',
        sourceIp: '172.31.27.27',
        dialedExtension: '1001',
      }),
    ).toThrow(AppError);

    expect(() =>
      validator.validateInboundCall({
        calledDid: '08040265947',
        callerNumber: '9876543210',
        sourceIp: '172.31.27.27',
        dialedExtension: 'debug',
      }),
    ).toThrow(AppError);
  });

  // TEST 05: Exotel correlation mapping with zero PII leakage
  it('TEST 05: maps Exotel call correlation with masked caller number and zero PII', () => {
    const trace = observability.recordCallReceived({
      providerCallId: 'exotel-call-sid-99999',
      asteriskCallId: 'PJSIP/exotel-trunk-00001',
      channelId: 'chan-exotel-01',
      sessionId: 'sess-exotel-01',
      correlationId: 'corr-exotel-01',
      callerNumber: '+919876543210',
    });

    expect(trace.providerCallId).toBe('exotel-call-sid-99999');
    expect(trace.maskedCaller).toBe('+91******3210');
    expect(trace.status).toBe('RECEIVED');

    observability.recordCallAnswered('PJSIP/exotel-trunk-00001');
    expect(trace.status).toBe('ANSWERED');

    observability.recordCallCompleted('PJSIP/exotel-trunk-00001', 'en');
    expect(trace.status).toBe('COMPLETED');
    expect(trace.language).toBe('en');
    expect(trace.durationSeconds).toBeGreaterThanOrEqual(0);
  });

  // TEST 06: Full IVR application journey via Asterisk adapter
  it('TEST 06: executes complete IVR journey from call start to hospital confirmation', async () => {
    const startRes = await ivrService.handleCallStart({
      callId: 'call-exotel-e2e-01',
      channelId: 'PJSIP/exotel-trunk-0001',
      callerNumber: '+919876543210',
    });

    expect(startRes.session.state).toBe('LANGUAGE_SELECTION');
    expect(mockAdapter.calls.get('PJSIP/exotel-trunk-0001')?.answered).toBe(true);

    // Select Language: English (digit 2)
    const langRes = await ivrService.handleDtmfInput({
      callId: 'call-exotel-e2e-01',
      digits: '2',
    });
    expect(langRes.session.state).toBe('MAIN_MENU');
    expect(langRes.session.language).toBe('en');

    // Select Menu: Find Hospital (digit 1)
    const menuRes = await ivrService.handleDtmfInput({
      callId: 'call-exotel-e2e-01',
      digits: '1',
    });
    expect(menuRes.session.state).toBe('PIN_INPUT');

    // Submit PIN: 600001
    const pinRes = await ivrService.handleDtmfInput({
      callId: 'call-exotel-e2e-01',
      digits: '600001',
    });
    expect(pinRes.session.state).toBe('HOSPITAL_SELECTION');
    expect(pinRes.session.pincode).toBe('600001');
  });

  // TEST 07: Trunk health reporting
  it('TEST 07: validates TelephonyHealthService reports correct component statuses', async () => {
    const health = await healthService.getHealthStatus({
      inboundDid: config.inboundDid,
      providerName: config.providerName,
      transport: config.sipTrunk.transport,
      srtpEnabled: config.sipTrunk.srtpEnabled,
    });

    expect(health.status).toBe('HEALTHY');
    expect(health.components.sipTrunk.provider).toBe('exotel');
    expect(health.components.sipTrunk.transport).toBe('tcp');
  });
});
