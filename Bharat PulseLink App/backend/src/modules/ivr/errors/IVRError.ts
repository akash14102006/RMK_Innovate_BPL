/**
 * Bharat PulseLink — IVR Error Taxonomy
 *
 * Categorized, safe error types for IVR call sessions.
 * Never leaks internal stack traces or secrets to callers.
 */

export enum IVRErrorCode {
  INVALID_DTMF = 'INVALID_DTMF',
  TIMEOUT = 'TIMEOUT',
  INVALID_STATE = 'INVALID_STATE',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  MAX_ATTEMPTS_EXCEEDED = 'MAX_ATTEMPTS_EXCEEDED',
  ASTERISK_CONNECTION_ERROR = 'ASTERISK_CONNECTION_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export class IVRError extends Error {
  public readonly code: IVRErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(params: {
    code: IVRErrorCode;
    message: string;
    statusCode?: number;
    details?: Record<string, unknown>;
  }) {
    super(params.message);
    this.name = 'IVRError';
    this.code = params.code;
    this.statusCode = params.statusCode ?? 400;
    this.details = params.details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
