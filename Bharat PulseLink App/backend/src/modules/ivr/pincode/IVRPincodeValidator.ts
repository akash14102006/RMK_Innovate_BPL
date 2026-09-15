/**
 * Bharat PulseLink — IVR PIN Code Validator
 *
 * Validates geographic PIN code format.
 * Strictly treats PIN as a 6-digit numeric string to preserve leading zeros.
 * Does not perform parseInt conversions.
 */

export interface PincodeValidationResult {
  isValid: boolean;
  normalized?: string;
  error?: string;
}

export class IVRPincodeValidator {
  private static readonly PINCODE_REGEX = /^[0-9]{6}$/;

  /**
   * Validates if the input is a valid 6-digit Indian PIN code format.
   */
  public static validate(input?: string | null): PincodeValidationResult {
    if (!input || typeof input !== 'string') {
      return {
        isValid: false,
        error: 'PIN code must be a non-empty string of digits',
      };
    }

    const trimmed = input.trim();
    if (trimmed.length !== 6) {
      return {
        isValid: false,
        error: `PIN code must be exactly 6 digits (received length: ${trimmed.length})`,
      };
    }

    if (!IVRPincodeValidator.PINCODE_REGEX.test(trimmed)) {
      return {
        isValid: false,
        error: 'PIN code must contain only numeric digits (0-9)',
      };
    }

    return {
      isValid: true,
      normalized: trimmed,
    };
  }

  /**
   * Helper returning boolean validity.
   */
  public static isValid(input?: string | null): boolean {
    return IVRPincodeValidator.validate(input).isValid;
  }
}
