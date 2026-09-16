/**
 * Development Authentication Bypass Configuration & Utilities
 *
 * Owned by: Authentication & Identity Domain
 *
 * When DEV_AUTH_BYPASS is enabled (development only):
 * - Disables Descope OAuth API calls
 * - Disables MiniMoth WhatsApp/SMS OTP calls
 * - Accepts ONLY code "123456" for WhatsApp OTP verification
 * - Rejects any other verification code
 * - Creates a local development session
 *
 * CRITICAL SAFETY RULES:
 * - Automatically disabled in production builds (process.env.NODE_ENV === 'production')
 * - Default production behavior is strictly FALSE.
 */

export const DEV_OTP_CODE = '123456';

/**
 * Returns true only when development auth bypass is explicitly enabled
 * and the runtime environment is NOT production.
 */
export function isDevAuthBypassEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  return (
    process.env.EXPO_PUBLIC_DEV_AUTH_BYPASS === 'true' ||
    process.env.DEV_AUTH_BYPASS === 'true'
  );
}

export default isDevAuthBypassEnabled;
