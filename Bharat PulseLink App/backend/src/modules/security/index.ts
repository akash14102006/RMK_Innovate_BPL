/**
 * Security Module (Prompt 92 Extension Point)
 *
 * Domain Boundary:
 * - Threat detection, anomaly scoring & step-up authentication
 * - Rate limiting policy enforcement
 * - Session revocation propagation
 */

export interface SecurityContext {
  deviceId: string;
  ipAddress: string;
  userAgent?: string;
  isStepUpVerified: boolean;
}
