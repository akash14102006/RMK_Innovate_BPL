/**
 * Error Taxonomy
 *
 * Centralized error model for Bharat PulseLink backend.
 * All application errors derive from AppError.
 * The central error handler maps these to safe HTTP responses.
 *
 * Owned by: Platform Foundation (Prompt 87)
 * Extended by: Domain modules (Prompts 88–120)
 */

// ---------------------------------------------------------------------------
// Error codes (extensible by domain modules)
// ---------------------------------------------------------------------------

export const ErrorCode = {
  // ── Platform ──────────────────────────────────────────────────────────────
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  REQUEST_TOO_LARGE: 'REQUEST_TOO_LARGE',
  TIMEOUT: 'TIMEOUT',

  // ── Authentication / Authorization ────────────────────────────────────────
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  SESSION_REVOKED: 'SESSION_REVOKED',
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  DEVICE_NOT_REGISTERED: 'DEVICE_NOT_REGISTERED',
  DEVICE_REVOKED: 'DEVICE_REVOKED',

  // ── Identity / Patient ────────────────────────────────────────────────────
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  PATIENT_NOT_FOUND: 'PATIENT_NOT_FOUND',
  PROFILE_INCOMPLETE: 'PROFILE_INCOMPLETE',
  IDENTITY_LINK_CONFLICT: 'IDENTITY_LINK_CONFLICT',

  // ── Consent ───────────────────────────────────────────────────────────────
  CONSENT_NOT_FOUND: 'CONSENT_NOT_FOUND',
  CONSENT_REVOKED: 'CONSENT_REVOKED',
  CONSENT_EXPIRED: 'CONSENT_EXPIRED',
  CONSENT_SCOPE_INSUFFICIENT: 'CONSENT_SCOPE_INSUFFICIENT',
  CONSENT_ALREADY_EXISTS: 'CONSENT_ALREADY_EXISTS',

  // ── Hospital / Provider ───────────────────────────────────────────────────
  HOSPITAL_NOT_FOUND: 'HOSPITAL_NOT_FOUND',
  HOSPITAL_NOT_ACTIVE: 'HOSPITAL_NOT_ACTIVE',
  FACILITY_NOT_FOUND: 'FACILITY_NOT_FOUND',
  DEPARTMENT_NOT_FOUND: 'DEPARTMENT_NOT_FOUND',
  SERVICE_NOT_AVAILABLE: 'SERVICE_NOT_AVAILABLE',

  // ── Appointments ──────────────────────────────────────────────────────────
  SLOT_NOT_AVAILABLE: 'SLOT_NOT_AVAILABLE',
  SLOT_ALREADY_BOOKED: 'SLOT_ALREADY_BOOKED',
  APPOINTMENT_NOT_FOUND: 'APPOINTMENT_NOT_FOUND',
  APPOINTMENT_CANNOT_CANCEL: 'APPOINTMENT_CANNOT_CANCEL',
  BOOKING_IDEMPOTENCY_CONFLICT: 'BOOKING_IDEMPOTENCY_CONFLICT',

  // ── QR / Secure Exchange ──────────────────────────────────────────────────
  QR_SESSION_NOT_FOUND: 'QR_SESSION_NOT_FOUND',
  QR_SESSION_EXPIRED: 'QR_SESSION_EXPIRED',
  QR_SESSION_ALREADY_USED: 'QR_SESSION_ALREADY_USED',
  QR_SCAN_UNAUTHORIZED: 'QR_SCAN_UNAUTHORIZED',
  EXCHANGE_SCOPE_DENIED: 'EXCHANGE_SCOPE_DENIED',

  // ── Check-in ──────────────────────────────────────────────────────────────
  CHECKIN_NOT_FOUND: 'CHECKIN_NOT_FOUND',
  CHECKIN_ALREADY_ACTIVE: 'CHECKIN_ALREADY_ACTIVE',
  CHECKIN_INVALID_STATE: 'CHECKIN_INVALID_STATE',

  // ── Records / Reports ─────────────────────────────────────────────────────
  RECORD_NOT_FOUND: 'RECORD_NOT_FOUND',
  REPORT_NOT_FOUND: 'REPORT_NOT_FOUND',
  REPORT_ACCESS_DENIED: 'REPORT_ACCESS_DENIED',
  REPORT_INTEGRITY_FAILED: 'REPORT_INTEGRITY_FAILED',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  FILE_TYPE_NOT_ALLOWED: 'FILE_TYPE_NOT_ALLOWED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',

  // ── Sync ──────────────────────────────────────────────────────────────────
  SYNC_CONFLICT: 'SYNC_CONFLICT',
  SYNC_VERSION_MISMATCH: 'SYNC_VERSION_MISMATCH',
  SYNC_CURSOR_INVALID: 'SYNC_CURSOR_INVALID',

  // ── Dependency / External ────────────────────────────────────────────────
  DEPENDENCY_UNAVAILABLE: 'DEPENDENCY_UNAVAILABLE',
  DEPENDENCY_TIMEOUT: 'DEPENDENCY_TIMEOUT',
  DEPENDENCY_AUTH_FAILURE: 'DEPENDENCY_AUTH_FAILURE',
  DEPENDENCY_RATE_LIMITED: 'DEPENDENCY_RATE_LIMITED',
  DEPENDENCY_INVALID_RESPONSE: 'DEPENDENCY_INVALID_RESPONSE',

  // ── Resource state ────────────────────────────────────────────────────────
  CONFLICT: 'CONFLICT',
  GONE: 'GONE',
  PRECONDITION_FAILED: 'PRECONDITION_FAILED',
  IDEMPOTENCY_CONFLICT: 'IDEMPOTENCY_CONFLICT',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// ---------------------------------------------------------------------------
// HTTP status mapping
// ---------------------------------------------------------------------------

const errorCodeToStatus: Record<ErrorCode, number> = {
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.METHOD_NOT_ALLOWED]: 405,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.RATE_LIMITED]: 429,
  [ErrorCode.REQUEST_TOO_LARGE]: 413,
  [ErrorCode.TIMEOUT]: 504,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.TOKEN_INVALID]: 401,
  [ErrorCode.SESSION_REVOKED]: 401,
  [ErrorCode.SESSION_NOT_FOUND]: 401,
  [ErrorCode.DEVICE_NOT_REGISTERED]: 401,
  [ErrorCode.DEVICE_REVOKED]: 401,
  [ErrorCode.USER_NOT_FOUND]: 404,
  [ErrorCode.USER_ALREADY_EXISTS]: 409,
  [ErrorCode.PATIENT_NOT_FOUND]: 404,
  [ErrorCode.PROFILE_INCOMPLETE]: 422,
  [ErrorCode.IDENTITY_LINK_CONFLICT]: 409,
  [ErrorCode.CONSENT_NOT_FOUND]: 404,
  [ErrorCode.CONSENT_REVOKED]: 403,
  [ErrorCode.CONSENT_EXPIRED]: 403,
  [ErrorCode.CONSENT_SCOPE_INSUFFICIENT]: 403,
  [ErrorCode.CONSENT_ALREADY_EXISTS]: 409,
  [ErrorCode.HOSPITAL_NOT_FOUND]: 404,
  [ErrorCode.HOSPITAL_NOT_ACTIVE]: 422,
  [ErrorCode.FACILITY_NOT_FOUND]: 404,
  [ErrorCode.DEPARTMENT_NOT_FOUND]: 404,
  [ErrorCode.SERVICE_NOT_AVAILABLE]: 422,
  [ErrorCode.SLOT_NOT_AVAILABLE]: 422,
  [ErrorCode.SLOT_ALREADY_BOOKED]: 409,
  [ErrorCode.APPOINTMENT_NOT_FOUND]: 404,
  [ErrorCode.APPOINTMENT_CANNOT_CANCEL]: 422,
  [ErrorCode.BOOKING_IDEMPOTENCY_CONFLICT]: 409,
  [ErrorCode.QR_SESSION_NOT_FOUND]: 404,
  [ErrorCode.QR_SESSION_EXPIRED]: 410,
  [ErrorCode.QR_SESSION_ALREADY_USED]: 410,
  [ErrorCode.QR_SCAN_UNAUTHORIZED]: 403,
  [ErrorCode.EXCHANGE_SCOPE_DENIED]: 403,
  [ErrorCode.CHECKIN_NOT_FOUND]: 404,
  [ErrorCode.CHECKIN_ALREADY_ACTIVE]: 409,
  [ErrorCode.CHECKIN_INVALID_STATE]: 422,
  [ErrorCode.RECORD_NOT_FOUND]: 404,
  [ErrorCode.REPORT_NOT_FOUND]: 404,
  [ErrorCode.REPORT_ACCESS_DENIED]: 403,
  [ErrorCode.REPORT_INTEGRITY_FAILED]: 422,
  [ErrorCode.UPLOAD_FAILED]: 500,
  [ErrorCode.FILE_TYPE_NOT_ALLOWED]: 415,
  [ErrorCode.FILE_TOO_LARGE]: 413,
  [ErrorCode.SYNC_CONFLICT]: 409,
  [ErrorCode.SYNC_VERSION_MISMATCH]: 409,
  [ErrorCode.SYNC_CURSOR_INVALID]: 400,
  [ErrorCode.DEPENDENCY_UNAVAILABLE]: 503,
  [ErrorCode.DEPENDENCY_TIMEOUT]: 504,
  [ErrorCode.DEPENDENCY_AUTH_FAILURE]: 502,
  [ErrorCode.DEPENDENCY_RATE_LIMITED]: 429,
  [ErrorCode.DEPENDENCY_INVALID_RESPONSE]: 502,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.GONE]: 410,
  [ErrorCode.PRECONDITION_FAILED]: 412,
  [ErrorCode.IDEMPOTENCY_CONFLICT]: 409,
};

export function getHttpStatus(code: ErrorCode): number {
  return errorCodeToStatus[code] ?? 500;
}

// ---------------------------------------------------------------------------
// Base application error
// ---------------------------------------------------------------------------

export interface AppErrorOptions {
  code: ErrorCode;
  message: string;
  /** Safe detail to surface to client (never internal state) */
  detail?: string;
  /** Structured validation issues for VALIDATION_ERROR */
  issues?: ValidationIssue[];
  /** Original cause for internal logging (never sent to client) */
  cause?: unknown;
  /** HTTP status override (defaults from errorCodeToStatus) */
  statusOverride?: number;
}

export interface ValidationIssue {
  field: string;
  message: string;
  code?: string;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly detail?: string;
  readonly issues?: ValidationIssue[];
  readonly cause?: unknown;
  readonly statusCode: number;
  readonly isAppError = true as const;

  constructor(options: AppErrorOptions) {
    super(options.message);
    this.name = 'AppError';
    this.code = options.code;
    this.detail = options.detail;
    this.issues = options.issues;
    this.cause = options.cause;
    this.statusCode = options.statusOverride ?? getHttpStatus(options.code);

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// ---------------------------------------------------------------------------
// Convenience factory functions
// ---------------------------------------------------------------------------

export const Errors = {
  notFound: (resource: string, id?: string) =>
    new AppError({
      code: ErrorCode.NOT_FOUND,
      message: id ? `${resource} '${id}' not found` : `${resource} not found`,
    }),

  unauthorized: (detail?: string) =>
    new AppError({
      code: ErrorCode.UNAUTHORIZED,
      message: 'Authentication required',
      detail,
    }),

  forbidden: (detail?: string) =>
    new AppError({
      code: ErrorCode.FORBIDDEN,
      message: 'Access denied',
      detail,
    }),

  validation: (issues: ValidationIssue[]) =>
    new AppError({
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Request validation failed',
      issues,
    }),

  conflict: (message: string) =>
    new AppError({
      code: ErrorCode.CONFLICT,
      message,
    }),

  internal: (cause?: unknown) =>
    new AppError({
      code: ErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
      cause,
    }),

  dependencyUnavailable: (dependency: string, cause?: unknown) =>
    new AppError({
      code: ErrorCode.DEPENDENCY_UNAVAILABLE,
      message: `Dependency unavailable: ${dependency}`,
      cause,
    }),
};

// ---------------------------------------------------------------------------
// Type guard
// ---------------------------------------------------------------------------

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError && err.isAppError === true;
}
