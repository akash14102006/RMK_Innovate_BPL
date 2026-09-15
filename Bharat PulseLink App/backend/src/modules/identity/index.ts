/**
 * Identity Module (Prompt 89)
 *
 * Domain Boundary:
 * - Patient identity resolution & linkage
 * - Canonical user mapping
 * - ABHA / Ayushman Bharat Digital Mission (ABDM) identifier verification
 * - Provider & staff identity verification
 */

export * from './IdentityResolver.js';

export interface IdentityProfile {
  id: string;
  userId: string;
  abhaId?: string;
  isVerified: boolean;
}

