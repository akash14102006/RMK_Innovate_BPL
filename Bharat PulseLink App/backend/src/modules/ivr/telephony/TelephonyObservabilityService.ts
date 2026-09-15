/**
 * Bharat PulseLink — Telephony Observability & Multi-Layer Call Correlation Service
 *
 * Tracks call setup, DTMF, media quality, failures, and end-to-end correlation across
 * Provider Call ID -> Asterisk Channel ID -> Session ID -> Correlation ID.
 *
 * Owned by: IVR Subsystem (Step 12)
 */

import { type Logger } from '../../../infrastructure/logger/logger.js';
import { PhoneNormalizer } from '../../notifications/PhoneNormalizer.js';

export interface TelephonyCallCorrelation {
  providerCallId?: string;
  asteriskCallId: string;
  channelId: string;
  sessionId: string;
  correlationId: string;
  maskedCaller: string;
  language?: string;
  startTime: Date;
  answeredTime?: Date;
  endTime?: Date;
  durationSeconds?: number;
  status: 'RECEIVED' | 'ANSWERED' | 'COMPLETED' | 'REJECTED' | 'ABANDONED' | 'FAILED';
  failureReason?: string;
}

export type TelephonyMetricEvent =
  | 'inbound_call_received'
  | 'inbound_call_answered'
  | 'inbound_call_rejected'
  | 'ivr_started'
  | 'ivr_completed'
  | 'dtmf_received'
  | 'call_duration'
  | 'call_abandoned'
  | 'sip_auth_failure'
  | 'provider_failure'
  | 'media_failure';

export class TelephonyObservabilityService {
  private readonly callTraces: Map<string, TelephonyCallCorrelation> = new Map();
  private readonly metricCounts: Map<TelephonyMetricEvent, number> = new Map();
  private readonly logger?: Logger;

  constructor(logger?: Logger) {
    this.logger = logger;
  }

  /**
   * Records initial inbound call reception and sets up correlation trace.
   */
  public recordCallReceived(params: {
    providerCallId?: string;
    asteriskCallId: string;
    channelId: string;
    sessionId: string;
    correlationId: string;
    callerNumber: string;
  }): TelephonyCallCorrelation {
    this.incrementMetric('inbound_call_received');
    const maskedCaller = PhoneNormalizer.redactForLogs(params.callerNumber);

    const trace: TelephonyCallCorrelation = {
      providerCallId: params.providerCallId,
      asteriskCallId: params.asteriskCallId,
      channelId: params.channelId,
      sessionId: params.sessionId,
      correlationId: params.correlationId,
      maskedCaller,
      startTime: new Date(),
      status: 'RECEIVED',
    };

    this.callTraces.set(params.asteriskCallId, trace);
    this.logInfo('telephony: inbound call received at SIP edge', {
      asteriskCallId: params.asteriskCallId,
      channelId: params.channelId,
      providerCallId: params.providerCallId,
      maskedCaller,
      correlationId: params.correlationId,
    });

    return trace;
  }

  /**
   * Records call answered state.
   */
  public recordCallAnswered(asteriskCallId: string): void {
    this.incrementMetric('inbound_call_answered');
    const trace = this.callTraces.get(asteriskCallId);
    if (trace) {
      trace.status = 'ANSWERED';
      trace.answeredTime = new Date();
      this.logInfo('telephony: inbound call answered by Asterisk IVR engine', {
        asteriskCallId,
        channelId: trace.channelId,
        correlationId: trace.correlationId,
      });
    }
  }

  /**
   * Records call completion with duration calculation.
   */
  public recordCallCompleted(asteriskCallId: string, language?: string): void {
    this.incrementMetric('ivr_completed');
    const trace = this.callTraces.get(asteriskCallId);
    if (trace) {
      trace.status = 'COMPLETED';
      trace.endTime = new Date();
      trace.language = language;
      const durationMs = trace.endTime.getTime() - trace.startTime.getTime();
      trace.durationSeconds = Math.round(durationMs / 1000);

      this.logInfo('telephony: call completed successfully through IVR journey', {
        asteriskCallId,
        channelId: trace.channelId,
        durationSeconds: trace.durationSeconds,
        language: trace.language,
        correlationId: trace.correlationId,
      });
    }
  }

  /**
   * Records rejected call attempt (e.g. rate limit, bad DID, forbidden extension).
   */
  public recordCallRejected(asteriskCallId: string, reason: string): void {
    this.incrementMetric('inbound_call_rejected');
    const trace = this.callTraces.get(asteriskCallId);
    if (trace) {
      trace.status = 'REJECTED';
      trace.failureReason = reason;
      trace.endTime = new Date();
    }

    this.logInfo('telephony: call rejected by security validator', {
      asteriskCallId,
      reason,
    });
  }

  /**
   * Records provider or media failure.
   */
  public recordFailure(event: 'provider_failure' | 'media_failure' | 'sip_auth_failure', details: Record<string, unknown>): void {
    this.incrementMetric(event);
    this.logInfo(`telephony: ${event} detected`, details);
  }

  /**
   * Retrieves active trace for correlation lookup.
   */
  public getCallTrace(asteriskCallId: string): TelephonyCallCorrelation | undefined {
    return this.callTraces.get(asteriskCallId);
  }

  /**
   * Returns current metric counters.
   */
  public getMetricCount(event: TelephonyMetricEvent): number {
    return this.metricCounts.get(event) ?? 0;
  }

  public clear(): void {
    this.callTraces.clear();
    this.metricCounts.clear();
  }

  private incrementMetric(event: TelephonyMetricEvent): void {
    const current = this.metricCounts.get(event) ?? 0;
    this.metricCounts.set(event, current + 1);
  }

  private logInfo(message: string, context: Record<string, unknown>): void {
    if (this.logger) {
      this.logger.info(context, message);
    }
  }
}
