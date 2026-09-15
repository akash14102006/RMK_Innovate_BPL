/**
 * Auth Module (Prompt 88)
 *
 * Domain Boundary:
 * - Descope JWT verification & exchange
 * - Session token validation & revocation
 * - Multi-device session coordination
 * - Biometric credential binding verification
 * - Security context propagation
 */

export * from './auth.routes.js';

export interface AuthUser {
  userId: string;
  roles: string[];
  permissions: string[];
}
