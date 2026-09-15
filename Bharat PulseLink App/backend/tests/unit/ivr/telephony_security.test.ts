/**
 * Bharat PulseLink — Telephony Security, Toll Fraud Prevention & Integration Tests (Step 12)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createHmac } from 'crypto';
import {
  TelephonySecurityValidator,
  type TelephonyProviderConfig,
  TelephonyObservabilityService,
  TelephonyHealthService,
} from '../../../src/modules/ivr/telephony/index.js';
import { AppError } from '../../../src/core/errors/AppError.js';

describe('Telephony Security & Real Telephony Integration (Step 12)', () => {
  let config: TelephonyProviderConfig;
  let validator: TelephonySecurityValidator;
  let observability: TelephonyObservabilityService;
  let healthService: TelephonyHealthService;

  beforeEach(() => {
    config = {
      providerName: 'mock_telecom',
      inboundDid: '+918045678900',
      allowedSourceIps: ['127.0.0.1', '10.0.0.0/8', '172.16.0.0/12', '103.120.10.0/24'],
      sipTrunk: {
        host: 'sip.inbound.bharatpulselink.internal',
        port: 5061,
        transport: 'tls',
        srtpEnabled: true,
      },
      maxCallDurationSeconds: 600,
      rateLimitPerCaller: {
        windowSeconds: 300,
        maxCalls: 3, // for test purposes: max 3 calls per window
      },
      webhookSecret: 'super-secret-telephony-webhook-key-2026',
      isOutboundAllowed: false, // Inbound only!
    };

    validator = new TelephonySecurityValidator(config);
    observability = new TelephonyObservabilityService();
    healthService = new TelephonyHealthService();
  });

  // TEST 01: Valid inbound call on authorized DID
  it('TEST 01: validates and accepts incoming call on authorized public DID', () => {
    const result = validator.validateInboundCall({
      calledDid: '+918045678900',
      callerNumber: '9876543210',
      sourceIp: '127.0.0.1',
    });

    expect(result.isValid).toBe(true);
    expect(result.normalizedCaller).toBe('+919876543210');
    expect(result.maskedCaller).toBe('+91******3210');
    expect(result.error).toBeUndefined();
  });

  // TEST 02: Inbound call to unconfigured / foreign DID
  it('TEST 02: rejects incoming call to mismatched or unauthorized DID', () => {
    const result = validator.validateInboundCall({
      calledDid: '+919999999999',
      callerNumber: '9876543210',
      sourceIp: '127.0.0.1',
    });

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('does not match configured Bharat PulseLink public DID');
  });

  // TEST 03: Toll fraud defense — outbound call attempt blocked
  it('TEST 03: strictly blocks outbound call origination attempts (Toll Fraud Defense)', () => {
    expect(() =>
      validator.validateInboundCall({
        calledDid: '+918045678900',
        callerNumber: '9876543210',
        sourceIp: '127.0.0.1',
        isOutboundAttempt: true,
      }),
    ).toThrow(AppError);
  });

  // TEST 04: Public caller attempting to dial internal test extensions blocked
  it('TEST 04: strictly forbids public callers from dialing internal/admin extensions', () => {
    expect(() =>
      validator.validateInboundCall({
        calledDid: '+918045678900',
        callerNumber: '9876543210',
        sourceIp: '127.0.0.1',
        dialedExtension: '1001',
      }),
    ).toThrow(AppError);

    expect(() =>
      validator.validateInboundCall({
        calledDid: '+918045678900',
        callerNumber: '9876543210',
        sourceIp: '127.0.0.1',
        dialedExtension: 'admin',
      }),
    ).toThrow(AppError);
  });

  // TEST 05: Provider IP allowlist rejection
  it('TEST 05: rejects incoming SIP traffic from non-allowlisted IP addresses', () => {
    const result = validator.validateInboundCall({
      calledDid: '+918045678900',
      callerNumber: '9876543210',
      sourceIp: '198.51.100.45', // Rogue IP
    });

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('is not authorized by provider allowlist');
  });

  // TEST 06: Webhook HMAC signature validation
  it('TEST 06: validates authentic provider webhook HMAC-SHA256 signatures and rejects forged requests', () => {
    const rawPayload = JSON.stringify({ event: 'CALL_ANSWERED', callId: 'prov-call-123' });
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const payloadToSign = `${timestamp}.${rawPayload}`;
    const validSignature = createHmac('sha256', config.webhookSecret!)
      .update(payloadToSign)
      .digest('hex');

    // Valid signature
    expect(
      validator.validateWebhookSignature({
        signatureHeader: validSignature,
        timestampHeader: timestamp,
        rawPayload,
      }),
    ).toBe(true);

    // Invalid signature
    expect(() =>
      validator.validateWebhookSignature({
        signatureHeader: 'bad-signature-hex-1234567890abcdef1234567890abcdef',
        timestampHeader: timestamp,
        rawPayload,
      }),
    ).toThrow(AppError);

    // Missing signature
    expect(() =>
      validator.validateWebhookSignature({
        rawPayload,
      }),
    ).toThrow(AppError);
  });

  // TEST 07: Webhook replay attack protection
  it('TEST 07: rejects webhook payloads with expired timestamps (Replay Defense)', () => {
    const rawPayload = JSON.stringify({ event: 'CALL_ANSWERED', callId: 'prov-call-123' });
    const oldTimestamp = (Math.floor(Date.now() / 1000) - 600).toString(); // 10 minutes ago
    const payloadToSign = `${oldTimestamp}.${rawPayload}`;
    const validSignature = createHmac('sha256', config.webhookSecret!)
      .update(payloadToSign)
      .digest('hex');

    expect(() =>
      validator.validateWebhookSignature({
        signatureHeader: validSignature,
        timestampHeader: oldTimestamp,
        rawPayload,
        toleranceSeconds: 300, // 5 minutes tolerance
      }),
    ).toThrow(AppError);
  });

  // TEST 08: Rate limiting per caller number
  it('TEST 08: rate-limits flood call attempts per caller number without crashing', () => {
    // 3 calls are allowed
    expect(validator.validateInboundCall({ calledDid: '+918045678900', callerNumber: '9876543210', sourceIp: '127.0.0.1' }).isValid).toBe(true);
    expect(validator.validateInboundCall({ calledDid: '+918045678900', callerNumber: '9876543210', sourceIp: '127.0.0.1' }).isValid).toBe(true);
    expect(validator.validateInboundCall({ calledDid: '+918045678900', callerNumber: '9876543210', sourceIp: '127.0.0.1' }).isValid).toBe(true);

    // 4th call is rate limited
    const res4 = validator.validateInboundCall({ calledDid: '+918045678900', callerNumber: '9876543210', sourceIp: '127.0.0.1' });
    expect(res4.isValid).toBe(false);
    expect(res4.error).toContain('Rate limit exceeded');
  });

  // TEST 09 & 10 & 11: Telephony Observability Service & Zero PII Correlation
  it('TEST 09, 10, 11: maps multi-layer call correlation trace and tracks operational metrics safely', () => {
    const trace = observability.recordCallReceived({
      providerCallId: 'tel-prov-999',
      asteriskCallId: 'PJSIP/1001-ast-01',
      channelId: 'chan-001',
      sessionId: 'sess-ivr-01',
      correlationId: 'corr-01',
      callerNumber: '+919876543210',
    });

    expect(trace.maskedCaller).toBe('+91******3210');
    expect(trace.status).toBe('RECEIVED');
    expect(observability.getMetricCount('inbound_call_received')).toBe(1);

    observability.recordCallAnswered('PJSIP/1001-ast-01');
    expect(trace.status).toBe('ANSWERED');
    expect(observability.getMetricCount('inbound_call_answered')).toBe(1);

    observability.recordCallCompleted('PJSIP/1001-ast-01', 'ta');
    expect(trace.status).toBe('COMPLETED');
    expect(trace.language).toBe('ta');
    expect(trace.durationSeconds).toBeGreaterThanOrEqual(0);
    expect(observability.getMetricCount('ivr_completed')).toBe(1);
  });

  // TEST 12: Telephony Health Service
  it('TEST 12: reports trunk and engine health status accurately', async () => {
    const health1 = await healthService.getHealthStatus({
      inboundDid: config.inboundDid,
      providerName: config.providerName,
      transport: config.sipTrunk.transport,
      srtpEnabled: config.sipTrunk.srtpEnabled,
    });

    expect(health1.status).toBe('HEALTHY');
    expect(health1.components.sipTrunk.status).toBe('UP');
    expect(health1.components.asteriskEngine.status).toBe('UP');

    // Simulate trunk failure
    healthService.setSipTrunkStatus(false);
    const health2 = await healthService.getHealthStatus({
      inboundDid: config.inboundDid,
      providerName: config.providerName,
      transport: config.sipTrunk.transport,
      srtpEnabled: config.sipTrunk.srtpEnabled,
    });

    expect(health2.status).toBe('UNHEALTHY');
    expect(health2.components.sipTrunk.status).toBe('DOWN');
  });
});
