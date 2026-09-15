/**
 * Consent Module (Prompt 91)
 *
 * Domain Boundary:
 * - ABDM Consent Manager / artifact lifecycle
 * - Dynamic patient-driven granular data sharing permissions
 * - Consent verification, revocation, and time-window evaluation
 * - Authoritative ConsentAuthorizer for downstream Secure Data Exchange (Prompt 108)
 */

export * from './consent.schemas.js';
export * from './ConsentAuthorizer.js';
export * from './ConsentService.js';
export * from './consent.routes.js';
