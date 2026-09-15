import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import i18n, { SupportedLanguage } from './i18n';
import { LanguageDescriptor, getLanguageDescriptor } from './languages';
import {
  formatNumber,
  formatCurrency,
  formatDate,
  formatTime,
  formatDistance,
} from './utils/formatters';
import { translateErrorCode } from './errors/errorMapper';
import { getLocalizedTaxonomyLabel } from './taxonomy/hospitalTaxonomy';

export interface I18nContextType {
  language: SupportedLanguage;
  descriptor: LanguageDescriptor;
  direction: 'ltr' | 'rtl';
  isRTL: boolean;
  isReady: boolean;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (path: string, params?: Record<string, string | number>) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatDistance: (meters: number) => string;
  translateError: (errorCode?: string, fallbackMessage?: string) => string;
  getTaxonomyLabel: (code: string) => string;
}

const defaultDescriptor = getLanguageDescriptor('en-IN');

const I18nContext = createContext<I18nContextType>({
  language: 'en-IN',
  descriptor: defaultDescriptor,
  direction: 'ltr',
  isRTL: false,
  isReady: false,
  setLanguage: async () => {},
  t: (path) => path,
  formatNumber: (val) => String(val),
  formatCurrency: (amount) => `₹${amount}`,
  formatDate: (d) => String(d),
  formatTime: (d) => String(d),
  formatDistance: (m) => `${m} m`,
  translateError: (c, fallback) => fallback || 'An unexpected error occurred.',
  getTaxonomyLabel: (code) => code,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(i18n.getLanguage());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    i18n.init().then((lang) => {
      if (isMounted) {
        setLanguageState(lang);
        setIsReady(true);
      }
    });

    const unsubscribe = i18n.subscribe((newLang) => {
      if (isMounted) {
        setLanguageState(newLang);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const setLanguage = useCallback(async (lang: SupportedLanguage) => {
    await i18n.setLanguage(lang);
  }, []);

  const descriptor = useMemo(() => getLanguageDescriptor(language), [language]);
  const isRTL = descriptor.direction === 'rtl';

  // Translation function bound to current reactive state
  const t = useCallback(
    (path: string, params?: Record<string, string | number>) => {
      return i18n.t(path, params);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language]
  );

  const formatNumberBound = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) => {
      return formatNumber(value, language, options);
    },
    [language]
  );

  const formatCurrencyBound = useCallback(
    (amount: number) => {
      return formatCurrency(amount, language);
    },
    [language]
  );

  const formatDateBound = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
      return formatDate(date, language, options);
    },
    [language]
  );

  const formatTimeBound = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
      return formatTime(date, language, options);
    },
    [language]
  );

  const formatDistanceBound = useCallback(
    (meters: number) => {
      return formatDistance(meters, language);
    },
    [language]
  );

  const translateErrorBound = useCallback(
    (errorCode?: string, fallbackMessage?: string) => {
      return translateErrorCode(errorCode, fallbackMessage);
    },
    []
  );

  const getTaxonomyLabelBound = useCallback(
    (code: string) => {
      return getLocalizedTaxonomyLabel(code, language);
    },
    [language]
  );

  const contextValue = useMemo(
    () => ({
      language,
      descriptor,
      direction: descriptor.direction,
      isRTL,
      isReady,
      setLanguage,
      t,
      formatNumber: formatNumberBound,
      formatCurrency: formatCurrencyBound,
      formatDate: formatDateBound,
      formatTime: formatTimeBound,
      formatDistance: formatDistanceBound,
      translateError: translateErrorBound,
      getTaxonomyLabel: getTaxonomyLabelBound,
    }),
    [
      language,
      descriptor,
      isRTL,
      isReady,
      setLanguage,
      t,
      formatNumberBound,
      formatCurrencyBound,
      formatDateBound,
      formatTimeBound,
      formatDistanceBound,
      translateErrorBound,
      getTaxonomyLabelBound,
    ]
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);

export default I18nContext;
