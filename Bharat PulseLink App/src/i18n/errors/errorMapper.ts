/**
 * Bharat PulseLink — API Error Code Localization Mapper
 *
 * Implements Section 18 & 19:
 * - Maps backend ErrorCode values (from backend/src/core/errors/AppError.ts)
 *   to localized client messages.
 * - Never translates arbitrary server error strings directly.
 * - Key-driven error resolution.
 */

import i18n from '../i18n';

// Mapping from server ErrorCode to i18n semantic key
export const BACKEND_ERROR_CODE_MAP: Record<string, string> = {
  // Platform
  INTERNAL_ERROR: 'errors.internalError',
  NOT_FOUND: 'errors.generic',
  VALIDATION_ERROR: 'errors.validationError',
  RATE_LIMITED: 'errors.rateLimited',
  TIMEOUT: 'errors.networkUnavailable',

  // Auth / Session
  UNAUTHORIZED: 'errors.unauthorized',
  FORBIDDEN: 'errors.forbidden',
  TOKEN_EXPIRED: 'errors.tokenExpired',
  TOKEN_INVALID: 'errors.unauthorized',
  SESSION_REVOKED: 'errors.sessionExpired',
  SESSION_NOT_FOUND: 'errors.sessionExpired',
  SESSION_EXPIRED: 'errors.sessionExpired',
  AUTH_REQUIRED: 'errors.authRequired',

  // Hospital / Healthcare
  HOSPITAL_NOT_FOUND: 'errors.hospitalNotFound',
  HOSPITAL_NOT_ACTIVE: 'errors.hospitalNotActive',
  FACILITY_NOT_FOUND: 'errors.facilityNotFound',
  SERVICE_NOT_AVAILABLE: 'errors.serviceNotAvailable',
  SLOT_NOT_AVAILABLE: 'errors.slotNotAvailable',
  SLOT_ALREADY_BOOKED: 'errors.slotAlreadyBooked',
  APPOINTMENT_NOT_FOUND: 'errors.appointmentNotFound',

  // QR / Checkin
  QR_SESSION_NOT_FOUND: 'errors.qrSessionNotFound',
  QR_SESSION_EXPIRED: 'errors.qrSessionExpired',
  QR_SESSION_ALREADY_USED: 'errors.qrAlreadyUsed',
  QR_SCAN_UNAUTHORIZED: 'errors.qrScanUnauthorized',
  CHECKIN_NOT_FOUND: 'errors.checkinNotFound',
  CHECKIN_ALREADY_ACTIVE: 'errors.checkinAlreadyActive',

  // Records / Sync
  RECORD_NOT_FOUND: 'errors.recordNotFound',
  REPORT_NOT_FOUND: 'errors.reportNotFound',
  LOCATION_PERMISSION_DENIED: 'errors.locationPermissionDenied',
  NETWORK_UNAVAILABLE: 'errors.networkUnavailable',
  ROUTE_UNAVAILABLE: 'errors.routeUnavailable',
};

/**
 * Resolves a machine-readable backend error code to a localized user message.
 */
export const translateErrorCode = (
  errorCode?: string,
  fallbackMessage?: string
): string => {
  if (!errorCode || typeof errorCode !== 'string') {
    return fallbackMessage || i18n.t('errors.generic');
  }

  const normalizedCode = errorCode.trim().toUpperCase();
  const translationKey = BACKEND_ERROR_CODE_MAP[normalizedCode];

  if (translationKey) {
    return i18n.t(translationKey);
  }

  // Fallback cleanly
  return fallbackMessage || i18n.t('errors.generic');
};

export default {
  BACKEND_ERROR_CODE_MAP,
  translateErrorCode,
};
