/**
 * Patient Module (Prompt 90)
 *
 * Domain Boundary:
 * - Patient master record & profile aggregate
 * - Conditions, allergies, surgical history, lifestyle
 * - Emergency contact & insurance linkages
 * - Optimistic versioning, completion engine, and real-time events
 */

export * from './patient.schemas.js';
export * from './PatientCompletionEngine.js';
export * from './PatientProfileService.js';
export * from './patient.routes.js';

