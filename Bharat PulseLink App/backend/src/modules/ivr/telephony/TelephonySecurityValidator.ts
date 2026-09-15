/**
 * Bharat PulseLink — Telephony Security & Toll Fraud Prevention Validator
 *
 * Implements strict inbound-only validation, provider IP allowlisting, caller rate limiting,
 * webhook HMAC signature validation, and internal extension shielding.
 *
 * Owned by: IVR Subsystem (Step 12)
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { AppError, ErrorCode } from '../../../core/errors/AppError.js';
import { type TelephonyProviderConfig } from './TelephonyProviderConfig.js';
import { PhoneNormalizer } from '../../notifications/PhoneNormalizer.js';

export interface InboundCallValidationParams {
  calledDid: string;
  callerNumber: string;
  sourceIp: string;
  isOutboundAttempt?: boolean;
  dialedExtension?: string;
}

export interface WebhookValidationParams {
  signatureHeader?: string;
  timestampHeader?: string;
  rawPayload: string;
  toleranceSeconds?: number;
}

export class TelephonySecurityValidator {
  private readonly config: TelephonyProviderConfig;
  private readonly callerCallTimestamps: Map<string, number[]> = new Map();
  private static readonly BLOCKED_INTERNAL_EXTENSIONS = new Set([
    '1000',
    '1001',
    '1002',
    'admin',
    'debug',
    'test',
    '0',
    '9999',
  ]);

  constructor(config: TelephonyProviderConfig) {
    this.config = config;
  }

  /**
   * Validates an incoming telephony call against security policies.
   */
  public validateInboundCall(params: InboundCallValidationParams): {
    isValid: boolean;
    normalizedCaller: string;
    maskedCaller: string;
    error?: string;
  } {
    // 1. Toll Fraud Defense: strictly block outbound call origination attempts
    if (params.isOutboundAttempt || this.config.isOutboundAllowed) {
      if (!this.config.isOutboundAllowed && params.isOutboundAttempt) {
        throw new AppError({
          code: ErrorCode.FORBIDDEN,
          message: 'Outbound call attempts are strictly prohibited on public telephony trunk (Toll Fraud Defense)',
        });
      }
    }

    // 2. Internal Extension Shielding: public callers cannot dial internal/admin extensions
    if (params.dialedExtension) {
      const extClean = params.dialedExtension.trim().toLowerCase();
      if (TelephonySecurityValidator.BLOCKED_INTERNAL_EXTENSIONS.has(extClean)) {
        throw new AppError({
          code: ErrorCode.FORBIDDEN,
          message: `Dialing internal extension '${extClean}' from public telephony trunk is forbidden`,
        });
      }
    }

    // 3. Destination DID Validation
    const normalizedCalled = params.calledDid.trim();
    if (normalizedCalled !== this.config.inboundDid && !this.config.inboundDid.includes(normalizedCalled)) {
      return {
        isValid: false,
        normalizedCaller: params.callerNumber,
        maskedCaller: PhoneNormalizer.redactForLogs(params.callerNumber),
        error: `Inbound DID '${normalizedCalled}' does not match configured Bharat PulseLink public DID`,
      };
    }

    // 4. Source IP Allowlisting
    if (!this.isIpAllowed(params.sourceIp)) {
      return {
        isValid: false,
        normalizedCaller: params.callerNumber,
        maskedCaller: PhoneNormalizer.redactForLogs(params.callerNumber),
        error: `SIP source IP '${params.sourceIp}' is not authorized by provider allowlist`,
      };
    }

    // 5. Caller Phone Normalization
    const phoneResult = PhoneNormalizer.normalize(params.callerNumber);
    const normalizedCaller = phoneResult.normalized ?? params.callerNumber;
    const maskedCaller = PhoneNormalizer.redactForLogs(normalizedCaller);

    // 6. Rate Limiting per Caller Number (Flood Protection)
    const isRateLimitExceeded = this.checkRateLimit(normalizedCaller);
    if (isRateLimitExceeded) {
      return {
        isValid: false,
        normalizedCaller,
        maskedCaller,
        error: `Rate limit exceeded for caller ${maskedCaller}. Too many calls within window.`,
      };
    }

    return {
      isValid: true,
      normalizedCaller,
      maskedCaller,
    };
  }

  /**
   * Validates provider webhook signature with HMAC-SHA256 and replay protection.
   */
  public validateWebhookSignature(params: WebhookValidationParams): boolean {
    if (!this.config.webhookSecret) {
      // If no secret configured in development/mock mode, allow
      return true;
    }

    if (!params.signatureHeader) {
      throw new AppError({
        code: ErrorCode.UNAUTHORIZED,
        message: 'Missing telephony webhook signature header',
      });
    }

    // Check timestamp replay tolerance
    const tolerance = params.toleranceSeconds ?? 300; // 5 minutes
    if (params.timestampHeader) {
      const timestampMs = parseInt(params.timestampHeader, 10) * 1000;
      const ageSeconds = Math.abs(Date.now() - timestampMs) / 1000;
      if (ageSeconds > tolerance) {
        throw new AppError({
          code: ErrorCode.UNAUTHORIZED,
          message: 'Webhook timestamp expired or clock skew exceeded tolerance (Replay Defense)',
        });
      }
    }

    const payloadToSign = params.timestampHeader
      ? `${params.timestampHeader}.${params.rawPayload}`
      : params.rawPayload;

    const expectedHmac = createHmac('sha256', this.config.webhookSecret)
      .update(payloadToSign)
      .digest('hex');

    const signatureBuffer = Buffer.from(params.signatureHeader);
    const expectedBuffer = Buffer.from(expectedHmac);

    if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
      throw new AppError({
        code: ErrorCode.UNAUTHORIZED,
        message: 'Invalid webhook HMAC signature',
      });
    }

    return true;
  }

  /**
   * Checks if an IP is in the allowlist.
   */
  public isIpAllowed(ip: string): boolean {
    const cleanIp = ip.trim();
    for (const allowed of this.config.allowedSourceIps) {
      if (allowed === '0.0.0.0/0') return true;
      if (allowed === cleanIp) return true;
      // Basic CIDR prefix check for /8, /16, /24, /12
      if (allowed.includes('/')) {
        const [subnet, prefixStr] = allowed.split('/');
        const prefix = parseInt(prefixStr, 10);
        if (this.matchSubnet(cleanIp, subnet, prefix)) {
          return true;
        }
      }
    }
    return false;
  }

  private matchSubnet(ip: string, subnet: string, prefix: number): boolean {
    if (prefix === 8 && ip.startsWith(subnet.split('.')[0] + '.')) return true;
    if (prefix === 16 && ip.startsWith(subnet.split('.').slice(0, 2).join('.') + '.')) return true;
    if (prefix === 24 && ip.startsWith(subnet.split('.').slice(0, 3).join('.') + '.')) return true;
    if (prefix === 12 && (ip.startsWith('172.16.') || ip.startsWith('172.17.') || ip.startsWith('172.18.') || ip.startsWith('172.19.') || ip.startsWith('172.20.') || ip.startsWith('172.31.'))) return true;
    return false;
  }

  private checkRateLimit(caller: string): boolean {
    const now = Date.now();
    const windowMs = this.config.rateLimitPerCaller.windowSeconds * 1000;
    const maxCalls = this.config.rateLimitPerCaller.maxCalls;

    const timestamps = this.callerCallTimestamps.get(caller) ?? [];
    const validTimestamps = timestamps.filter(t => now - t < windowMs);

    if (validTimestamps.length >= maxCalls) {
      return true; // Rate limit exceeded
    }

    validTimestamps.push(now);
    this.callerCallTimestamps.set(caller, validTimestamps);
    return false;
  }

  public clearRateLimits(): void {
    this.callerCallTimestamps.clear();
  }
}
