/**
 * Log Redaction
 *
 * Centralized strategy for redacting sensitive fields before they appear in
 * structured logs, error payloads, or observability pipelines.
 *
 * Rules:
 * - Credentials, tokens, PHI field names are defined here centrally
 * - No manual redaction scattered through domain code
 * - Pino uses the redact paths directly
 * - Utilities for runtime redaction of arbitrary objects
 *
 * Owned by: Platform Foundation (Prompt 87)
 */

// ---------------------------------------------------------------------------
// Pino redact paths — used in logger configuration
// ---------------------------------------------------------------------------

/**
 * Pino `redact.paths` configuration.
 * These paths are redacted to '[REDACTED]' in all log output.
 * Uses dot-notation and wildcard patterns.
 */
export const PINO_REDACT_PATHS: string[] = [
  // Authentication / Sessions
  'authorization',
  'req.headers.authorization',
  'req.headers.cookie',
  '*.accessToken',
  '*.refreshToken',
  '*.idToken',
  '*.sessionToken',
  '*.token',
  '*.secret',
  '*.apiKey',
  '*.api_key',

  // Credentials
  '*.password',
  '*.passwordHash',
  '*.otp',
  '*.pin',
  '*.pinHash',
  '*.privateKey',
  '*.walletKey',
  '*.encryptionKey',

  // PII / PHI — contact
  '*.phoneNumber',
  '*.phone',
  '*.email',
  '*.aadhaarNumber',
  '*.aadhaar',

  // PHI — medical (never in logs)
  '*.medicalHistory',
  '*.allergies',
  '*.medications',
  '*.prescriptions',
  '*.reports',
  '*.insurance',
  '*.emergencyContact',
  '*.healthSummary',
  '*.bloodGroup',
  '*.diagnoses',

  // Storage
  '*.storageKey',
  '*.bucketKey',
  '*.signedUrl',
];

// ---------------------------------------------------------------------------
// Runtime redaction of arbitrary objects
// ---------------------------------------------------------------------------

const SENSITIVE_KEY_PATTERNS: RegExp[] = [
  /password/i,
  /secret/i,
  /token/i,
  /apiKey/i,
  /api_key/i,
  /authorization/i,
  /otp/i,
  /\bpin\b/i,       // PIN specifically (not "principal", "spinning", etc.)
  /privateKey/i,
  /walletKey/i,
  /encryptionKey/i,
  /aadhaar/i,
  /phone/i,         // Matches phoneNumber, phone, mobilePhone
];

const REDACTED = '[REDACTED]';

/**
 * Recursively redacts sensitive fields from an object for safe logging.
 * Does NOT mutate the original object.
 */
export function redactObject(obj: unknown, depth = 0): unknown {
  if (depth > 5) return '[DEEP]'; // Prevent infinite recursion on circular structures
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => redactObject(item, depth + 1));
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEY_PATTERNS.some((p) => p.test(key))) {
      result[key] = REDACTED;
    } else {
      result[key] = redactObject(value, depth + 1);
    }
  }
  return result;
}

/**
 * Redacts sensitive values from request headers for safe logging.
 */
export function redactHeaders(headers: Record<string, string | string[] | undefined>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(headers)) {
    const lk = key.toLowerCase();
    if (lk === 'authorization' || lk === 'cookie' || lk === 'x-api-key') {
      safe[key] = REDACTED;
    } else {
      safe[key] = value;
    }
  }
  return safe;
}
