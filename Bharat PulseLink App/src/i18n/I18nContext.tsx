import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import i18n, { SupportedLanguage } from './i18n';

interface I18nContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (path: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
  isReady: boolean;
}

const I18nContext = createContext<I18nContextType>({
  language: 'en',
  setLanguage: async () => {},
  t: (path) => path,
  isRTL: false,
  isReady: false,
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

  // t function bound to current reactive language state
  const t = useCallback(
    (path: string, params?: Record<string, string | number>) => {
      return i18n.t(path, params);
    },
    // Dependency on language ensures fresh re-render binding
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language]
  );

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      isRTL: i18n.isRTL(language),
      isReady,
    }),
    [language, setLanguage, t, isReady]
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);

export default I18nContext;
