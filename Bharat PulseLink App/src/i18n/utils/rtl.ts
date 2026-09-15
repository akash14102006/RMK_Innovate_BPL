/**
 * Bharat PulseLink — RTL Support Infrastructure
 *
 * Implements Section 27:
 * - Direction detection for Urdu (ur-IN), Sindhi (sd-IN), Kashmiri (ks-IN)
 * - Safe layout direction without breaking semantically directional icons (back arrow, route directions)
 * - Text alignment helpers
 */

import { TextStyle, ViewStyle } from 'react-native';
import { isRTL as checkIsRTL } from '../languages';

export const isRTL = (localeCode?: string): boolean => {
  return checkIsRTL(localeCode);
};

export const getWritingDirection = (localeCode?: string): 'ltr' | 'rtl' => {
  return checkIsRTL(localeCode) ? 'rtl' : 'ltr';
};

/**
 * Returns text style aligned appropriately for the locale
 */
export const getLocalizedTextAlign = (
  localeCode?: string,
  defaultAlign: 'left' | 'center' | 'right' = 'left'
): TextStyle => {
  if (defaultAlign === 'center') return { textAlign: 'center' };
  const rtl = checkIsRTL(localeCode);
  if (rtl) {
    return {
      textAlign: defaultAlign === 'left' ? 'right' : 'left',
      writingDirection: 'rtl',
    };
  }
  return {
    textAlign: defaultAlign,
    writingDirection: 'ltr',
  };
};

/**
 * Directional padding/margin helper
 */
export const getLocalizedFlexDirection = (
  localeCode?: string,
  defaultDirection: 'row' | 'row-reverse' = 'row'
): ViewStyle => {
  const rtl = checkIsRTL(localeCode);
  if (defaultDirection === 'row') {
    return { flexDirection: rtl ? 'row-reverse' : 'row' };
  }
  return { flexDirection: rtl ? 'row' : 'row-reverse' };
};

export default {
  isRTL,
  getWritingDirection,
  getLocalizedTextAlign,
  getLocalizedFlexDirection,
};
