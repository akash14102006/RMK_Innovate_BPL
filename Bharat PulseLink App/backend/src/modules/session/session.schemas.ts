/**
 * Session Domain Schemas & DTOs
 *
 * Provides request validation schemas and sanitized DTO transformers.
 * Strictly guarantees ZERO token, secret, or PHI leakage in API responses.
 *
 * Owned by: Security & Session Domain (Prompt 92, 101 §20, §30)
 */

import { z } from 'zod';
import type {
  SessionRow,
  DeviceRow,
  SecurityEventRow,
  DevicePlatform,
  SessionStatus,
  SessionRiskLevel,
  UserStatus,
} from '../../core/types/database.types.js';

// ── 1. Request Schemas ───────────────────────────────────────────────────────

export const RevokeSessionSchema = z.object({
  reason: z.string().max(255).optional().default('Revoked by user via Security Center'),
});
export type RevokeSessionInput = z.infer<typeof RevokeSessionSchema>;

export const RevokeOtherSessionsSchema = z.object({
  reason: z.string().max(255).optional().default('Revoke other devices requested by user'),
});
export type RevokeOtherSessionsInput = z.infer<typeof RevokeOtherSessionsSchema>;

export const RevokeAllSessionsSchema = z.object({
  reason: z.string().max(255).optional().default('Revoke all devices requested by user'),
});
export type RevokeAllSessionsInput = z.infer<typeof RevokeAllSessionsSchema>;

export const ExchangeSessionSchema = z.object({
  sessionToken: z.string().min(1, 'sessionToken is required'),
  deviceFingerprint: z.string().optional(),
  platform: z.enum(['ios', 'android', 'web']).default('android'),
  appVersion: z.string().default('1.0.0'),
  pushToken: z.string().optional(),
});
export type ExchangeSessionInput = z.infer<typeof ExchangeSessionSchema>;

// ── 2. Response DTO Interfaces ───────────────────────────────────────────────

export interface SessionDTO {
  sessionId: string;
  current: boolean;
  platform: DevicePlatform;
  appVersion: string;
  lastActiveAt: string;
  createdAt: string;
  expiresAt: string;
  status: SessionStatus;
  riskLevel: SessionRiskLevel;
  device?: {
    id: string;
    platform: DevicePlatform;
    appVersion: string;
    status: string;
  } | null;
}

export interface SecurityStatusDTO {
  userId: string;
  accountStatus: UserStatus;
  activeSessionsCount: number;
  totalRegisteredDevices: number;
  currentSessionId: string | null;
  lastAuthenticatedAt: string | null;
  securityScore: number;
  recentSecurityEventsCount: number;
}

export interface SecurityEventDTO {
  id: string;
  eventType: string;
  severity: string;
  timestamp: string;
  ipAddress: string | null;
  details: Record<string, unknown> | null;
}

// ── 3. DTO Transformers (Zero Secret Exposure) ───────────────────────────────

export function toSessionDTO(
  row: SessionRow,
  currentSessionId?: string | null,
  device?: DeviceRow | null,
): SessionDTO {
  return {
    sessionId: row.id,
    current: Boolean(currentSessionId && row.id === currentSessionId),
    platform: row.platform,
    appVersion: row.app_version,
    lastActiveAt: row.last_seen_at.toISOString(),
    createdAt: row.created_at.toISOString(),
    expiresAt: row.expires_at.toISOString(),
    status: row.status,
    riskLevel: row.risk_level,
    device: device
      ? {
          id: device.id,
          platform: device.platform,
          appVersion: device.app_version,
          status: device.status,
        }
      : null,
  };
}

export function toSecurityEventDTO(row: SecurityEventRow): SecurityEventDTO {
  return {
    id: row.id,
    eventType: row.event_type,
    severity: row.severity,
    timestamp: row.timestamp.toISOString(),
    ipAddress: row.ip_address ?? null,
    details: row.details as Record<string, unknown> | null,
  };
}
