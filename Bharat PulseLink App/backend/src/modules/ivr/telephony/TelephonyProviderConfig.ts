/**
 * Bharat PulseLink — Telephony Provider Configuration & Environment Contracts
 *
 * Defines strictly-validated configuration schema for Indian SIP trunk integration,
 * public inbound DIDs, provider IP allowlists, webhook signing secrets, and rate limits.
 *
 * Owned by: IVR Subsystem (Step 12)
 */

export interface SIPTrunkCredentials {
  username?: string;
  secret?: string;
  authRealm?: string;
  host: string;
  port: number;
  transport: 'tls' | 'udp' | 'tcp';
  srtpEnabled: boolean;
}

export interface TelephonyProviderConfig {
  providerName: 'exotel' | 'airtel' | 'tata' | 'twilio' | 'msg91' | 'mock_telecom';
  inboundDid: string; // e.g. "+918012345678" or "1800XXXXXXX"
  allowedSourceIps: string[]; // CIDR or exact IPs of provider SBC / SIP gateways
  sipTrunk: SIPTrunkCredentials;
  maxCallDurationSeconds: number; // default e.g. 600 (10 minutes)
  rateLimitPerCaller: {
    windowSeconds: number;
    maxCalls: number;
  };
  webhookSecret?: string;
  isOutboundAllowed: boolean; // MUST always be false for Step 12 (inbound only)
}

export const DEFAULT_TELEPHONY_CONFIG: TelephonyProviderConfig = {
  providerName: 'mock_telecom',
  inboundDid: process.env.BPL_INBOUND_DID ?? '+918045678900',
  allowedSourceIps: (process.env.BPL_SIP_ALLOWED_IPS ?? '127.0.0.1,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16').split(',').map(s => s.trim()),
  sipTrunk: {
    host: process.env.BPL_SIP_TRUNK_HOST ?? 'sip.inbound.bharatpulselink.internal',
    port: parseInt(process.env.BPL_SIP_TRUNK_PORT ?? '5061', 10),
    transport: 'tls',
    srtpEnabled: true,
  },
  maxCallDurationSeconds: 600, // 10 minutes maximum duration
  rateLimitPerCaller: {
    windowSeconds: 300, // 5 minutes
    maxCalls: 5, // max 5 calls per 5 minutes per number
  },
  webhookSecret: process.env.BPL_TELEPHONY_WEBHOOK_SECRET,
  isOutboundAllowed: false, // Inbound-only enforcement for toll fraud protection
};
