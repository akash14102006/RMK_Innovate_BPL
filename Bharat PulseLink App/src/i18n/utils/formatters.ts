/**
 * Bharat PulseLink — Locale-Aware Formatting Utilities
 *
 * Implements Section 23 & 24:
 * - Number formatting per locale
 * - Currency formatting (INR / ₹)
 * - Date and Time formatting
 * - Distance formatting preserving underlying numeric meters
 */

import { getLanguageDescriptor } from '../languages';

/**
 * Formats a number according to the active locale.
 */
export const formatNumber = (
  value: number,
  localeCode: string = 'en-IN',
  options?: Intl.NumberFormatOptions
): string => {
  if (typeof value !== 'number' || isNaN(value)) return '0';
  const desc = getLanguageDescriptor(localeCode);
  const targetLocale = desc.code || 'en-IN';

  try {
    return new Intl.NumberFormat(targetLocale, options).format(value);
  } catch (_e) {
    return value.toLocaleString('en-IN', options);
  }
};

/**
 * Formats currency in Indian Rupees (₹) according to the active locale.
 */
export const formatCurrency = (
  amount: number,
  localeCode: string = 'en-IN'
): string => {
  if (typeof amount !== 'number' || isNaN(amount)) return '₹0';
  const desc = getLanguageDescriptor(localeCode);
  const targetLocale = desc.code || 'en-IN';

  try {
    return new Intl.NumberFormat(targetLocale, {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (_e) {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
};

/**
 * Formats date according to the active locale.
 */
export const formatDate = (
  dateInput: Date | string | number,
  localeCode: string = 'en-IN',
  options?: Intl.DateTimeFormatOptions
): string => {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  const desc = getLanguageDescriptor(localeCode);
  const targetLocale = desc.code || 'en-IN';

  const defaultOptions: Intl.DateTimeFormatOptions = options || {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };

  try {
    return new Intl.DateTimeFormat(targetLocale, defaultOptions).format(date);
  } catch (_e) {
    return date.toLocaleDateString('en-IN', defaultOptions);
  }
};

/**
 * Formats time according to the active locale.
 */
export const formatTime = (
  dateInput: Date | string | number,
  localeCode: string = 'en-IN',
  options?: Intl.DateTimeFormatOptions
): string => {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  const desc = getLanguageDescriptor(localeCode);
  const targetLocale = desc.code || 'en-IN';

  const defaultOptions: Intl.DateTimeFormatOptions = options || {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };

  try {
    return new Intl.DateTimeFormat(targetLocale, defaultOptions).format(date);
  } catch (_e) {
    return date.toLocaleTimeString('en-IN', defaultOptions);
  }
};

// Localized units for distance display
const DISTANCE_UNITS: Record<string, { km: string; m: string }> = {
  'en-IN': { km: 'km', m: 'm' },
  'hi-IN': { km: 'किमी', m: 'मी' },
  'ta-IN': { km: 'கி.மீ.', m: 'மீ' },
  'te-IN': { km: 'కి.మీ.', m: 'మీ' },
  'bn-IN': { km: 'কিমি', m: 'মি' },
  'mr-IN': { km: 'किमी', m: 'मी' },
  'gu-IN': { km: 'કિમી', m: 'મી' },
  'kn-IN': { km: 'ಕಿ.ಮೀ', m: 'ಮೀ' },
  'ml-IN': { km: 'കി.മീ.', m: 'മീ' },
  'pa-IN': { km: 'ਕਿ.ਮੀ.', m: 'ਮੀ' },
  'or-IN': { km: 'କି.ମି.', m: 'ମି' },
  'as-IN': { km: 'কিমি', m: 'মি' },
  'ur-IN': { km: 'کلومیٹر', m: 'میٹر' },
  'sd-IN': { km: 'ڪلوميٽر', m: 'ميٽر' },
  'ks-IN': { km: 'کِلومیٖٹر', m: 'میٖٹر' },
};

/**
 * Formats physical distance in meters into localized display (e.g. 2.3 km, 2.3 கி.மீ., 2.3 किमी).
 * Preserves the underlying numeric value without mutating database or state values.
 */
export const formatDistance = (
  meters: number,
  localeCode: string = 'en-IN'
): string => {
  if (typeof meters !== 'number' || isNaN(meters) || meters < 0) return '0 m';

  const desc = getLanguageDescriptor(localeCode);
  const units = DISTANCE_UNITS[desc.code] || DISTANCE_UNITS[desc.languageCode] || DISTANCE_UNITS['en-IN'];

  if (meters < 1000) {
    const formattedNum = formatNumber(Math.round(meters), desc.code);
    return `${formattedNum} ${units.m}`;
  }

  const km = meters / 1000;
  const formattedKm = formatNumber(Math.round(km * 10) / 10, desc.code, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  return `${formattedKm} ${units.km}`;
};

export default {
  formatNumber,
  formatCurrency,
  formatDate,
  formatTime,
  formatDistance,
};
