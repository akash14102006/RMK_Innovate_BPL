/**
 * Bharat PulseLink — Central Language Registry & Metadata
 *
 * Authoritative registry supporting English (en-IN) and all 22 official
 * Eighth Schedule Indian Languages.
 *
 * Specifications:
 * - BCP-47 locale code ('en-IN', 'ta-IN', etc.)
 * - ISO language code ('en', 'ta', etc.)
 * - Native display name in authentic script
 * - English display name
 * - Script name
 * - Direction ('ltr' | 'rtl')
 * - Deterministic fallback ('en-IN')
 * - Translation versioning
 * - Non-duplicative central architecture
 */

export interface LanguageDescriptor {
  id: string;
  code: string; // BCP-47 locale (e.g., 'ta-IN')
  languageCode: string; // ISO 639 code (e.g., 'ta')
  name: string; // English name (e.g., 'Tamil')
  englishName: string; // English name
  nativeName: string; // Native script name (e.g., 'தமிழ்')
  script: string;
  direction: 'ltr' | 'rtl';
  enabled: boolean;
  fallback: string;
  translationVersion: string;
  fontFamily?: string;
  order: number;
}

export const ALL_SCHEDULED_LANGUAGES: LanguageDescriptor[] = [
  {
    id: 'en-IN',
    code: 'en-IN',
    languageCode: 'en',
    name: 'English',
    englishName: 'English',
    nativeName: 'English',
    script: 'Latin',
    direction: 'ltr',
    enabled: true,
    fallback: 'en-IN',
    translationVersion: '1.0.0',
    order: 1,
  },
  {
    id: 'hi-IN',
    code: 'hi-IN',
    languageCode: 'hi',
    name: 'Hindi',
    englishName: 'Hindi',
    nativeName: 'हिंदी',
    script: 'Devanagari',
    direction: 'ltr',
    enabled: true,
    fallback: 'en-IN',
    translationVersion: '1.0.0',
    order: 2,
  },
  {
    id: 'ta-IN',
    code: 'ta-IN',
    languageCode: 'ta',
    name: 'Tamil',
    englishName: 'Tamil',
    nativeName: 'தமிழ்',
    script: 'Tamil',
    direction: 'ltr',
    enabled: true,
    fallback: 'en-IN',
    translationVersion: '1.0.0',
    order: 3,
  },
  {
    id: 'te-IN',
    code: 'te-IN',
    languageCode: 'te',
    name: 'Telugu',
    englishName: 'Telugu',
    nativeName: 'తెలుగు',
    script: 'Telugu',
    direction: 'ltr',
    enabled: true,
    fallback: 'en-IN',
    translationVersion: '1.0.0',
    order: 4,
  },
  {
    id: 'bn-IN',
    code: 'bn-IN',
    languageCode: 'bn',
    name: 'Bengali',
    englishName: 'Bengali',
    nativeName: 'বাংলা',
    script: 'Bengali',
    direction: 'ltr',
    enabled: true,
    fallback: 'en-IN',
    translationVersion: '1.0.0',
    order: 5,
  },
  {
    id: 'mr-IN',
    code: 'mr-IN',
    languageCode: 'mr',
    name: 'Marathi',
    englishName: 'Marathi',
    nativeName: 'मराठी',
    script: 'Devanagari',
    direction: 'ltr',
    enabled: true,
    fallback: 'en-IN',
    translationVersion: '1.0.0',
    order: 6,
  },
  {
    id: 'gu-IN',
    code: 'gu-IN',
    languageCode: 'gu',
    name: 'Gujarati',
    englishName: 'Gujarati',
    nativeName: 'ગુજરાતી',
    script: 'Gujarati',
    direction: 'ltr',
    enabled: true,
    fallback: 'en-IN',
    translationVersion: '1.0.0',
    order: 7,
  },
  {
    id: 'kn-IN',
    code: 'kn-IN',
    languageCode: 'kn',
    name: 'Kannada',
    englishName: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    script: 'Kannada',
    direction: 'ltr',
    enabled: true,
    fallback: 'en-IN',
    translationVersion: '1.0.0',
    order: 8,
  },
  {
    id: 'ml-IN',
    code: 'ml-IN',
    languageCode: 'ml',
    name: 'Malayalam',
    englishName: 'Malayalam',
    nativeName: 'മലയാളം',
    script: 'Malayalam',
    direction: 'ltr',
    enabled: true,
    fallback: 'en-IN',
    translationVersion: '1.0.0',
    order: 9,
  },
  {
    id: 'pa-IN',
    code: 'pa-IN',
    languageCode: 'pa',
    name: 'Punjabi',
    englishName: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    script: 'Gurmukhi',
    direction: 'ltr',
    enabled: true,
    fallback: 'en-IN',
    translationVersion: '1.0.0',
    order: 10,
  },
  {
    id: 'or-IN',
    code: 'or-IN',
    languageCode: 'or',
    name: 'Odia',
    englishName: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    script: 'Odia',
    direction: 'ltr',
    enabled: true,
    fallback: 'en-IN',
    translationVersion: '1.0.0',
    order: 11,
  },
  {
    id: 'as-IN',
    code: 'as-IN',
    languageCode: 'as',
    name: 'Assamese',
    englishName: 'Assamese',
    nativeName: 'অসমীয়া',
    script: 'Bengali-Assamese',
    direction: 'ltr',
    enabled: true,
    fallback: 'en-IN',
    translationVersion: '1.0.0',
    order: 12,
  },
  {
    id: 'brx-IN',
    code: 'brx-IN',
    languageCode: 'brx',
    name: 'Bodo',
    englishName: 'Bodo',
    nativeName: 'बड़ो',
    script: 'Devanagari',
    direction: 'ltr',
    enabled: true,
    fallback: 'en-IN',
    translationVersion: '1.0.0',
    order: 13,
  },
  {
    id: 'doi-IN',
    code: 'doi-IN',
    languageCode: 'doi',
    name: 'Dogri',
    englishName: 'Dogri',
    nativeName: 'डोगरी',
    script: 'Devanagari',
    direction: 'ltr',
    enabled: true,
    fallback: 'en-IN',
    translationVersion: '1.0.0',
    order: 14,
  },
  {
    id: 'ks-IN',
    code: 'ks-IN',
    languageCode: 'ks',
    name: 'Kashmiri',
    englishName: 'Kashmiri',
    nativeName: 'کٲشُر',
    script: 'Perso-Arabic',
    direction: 'rtl',
    enabled: true,
    fallback: 'en-IN',
    translationVersion: '1.0.0',
    order: 15,
  },
  {
    id: 'kok-IN',
    code: 'kok-IN',
    languageCode: 'kok',
    name: 'Konkani',
    englishName: 'Konkani',
    nativeName: 'कोंकणी',
    script: 'Devanagari',
    direction: 'ltr',
    enabled: true,
    fallback: 'en-IN',
    translationVersion: '1.0.0',
    order: 16,
  },
  {
    id: 'mai-IN',
    code: 'mai-IN',
    languageCode: 'mai',
    name: 'Maithili',
    englishName: 'Maithili',
    nativeName: 'मैथिली',
    script: 'Devanagari',
    direction: 'ltr',
    enabled: true,
    fallback: 'en-IN',
    translationVersion: '1.0.0',
    order: 17,
  },
  {
    id: 'mni-IN',
    code: 'mni-IN',
    languageCode: 'mni',
    name: 'Manipuri',
    englishName: 'Manipuri',
    nativeName: 'মৈতৈলোন্',
    script: 'Meitei',
    direction: 'ltr',
    enabled: true,
    fallback: 'en-IN',
    translationVersion: '1.0.0',
    order: 18,
  },
  {
    id: 'ne-IN',
    code: 'ne-IN',
    languageCode: 'ne',
    name: 'Nepali',
    englishName: 'Nepali',
    nativeName: 'नेपाली',
    script: 'Devanagari',
    direction: 'ltr',
    enabled: true,
    fallback: 'en-IN',
    translationVersion: '1.0.0',
    order: 19,
  },
  {
    id: 'sa-IN',
    code: 'sa-IN',
    languageCode: 'sa',
    name: 'Sanskrit',
    englishName: 'Sanskrit',
    nativeName: 'संस्कृतम्',
    script: 'Devanagari',
    direction: 'ltr',
    enabled: true,
    fallback: 'en-IN',
    translationVersion: '1.0.0',
    order: 20,
  },
  {
    id: 'sat-IN',
    code: 'sat-IN',
    languageCode: 'sat',
    name: 'Santali',
    englishName: 'Santali',
    nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ',
    script: 'Ol Chiki',
    direction: 'ltr',
    enabled: true,
    fallback: 'en-IN',
    translationVersion: '1.0.0',
    order: 21,
  },
  {
    id: 'sd-IN',
    code: 'sd-IN',
    languageCode: 'sd',
    name: 'Sindhi',
    englishName: 'Sindhi',
    nativeName: 'سنڌي',
    script: 'Perso-Arabic',
    direction: 'rtl',
    enabled: true,
    fallback: 'en-IN',
    translationVersion: '1.0.0',
    order: 22,
  },
  {
    id: 'ur-IN',
    code: 'ur-IN',
    languageCode: 'ur',
    name: 'Urdu',
    englishName: 'Urdu',
    nativeName: 'اُردُو',
    script: 'Perso-Arabic',
    direction: 'rtl',
    enabled: true,
    fallback: 'en-IN',
    translationVersion: '1.0.0',
    order: 23,
  },
];

export const SUPPORTED_LANGUAGES: LanguageDescriptor[] = [...ALL_SCHEDULED_LANGUAGES].sort(
  (a, b) => a.order - b.order
);

/**
 * Normalizes an arbitrary locale string into canonical BCP-47 tag (e.g. 'ta' or 'ta_IN' -> 'ta-IN').
 */
export const normalizeLocaleCode = (rawCode?: string): string => {
  if (!rawCode || typeof rawCode !== 'string') return 'en-IN';
  const clean = rawCode.trim().replace('_', '-').toLowerCase();

  // 1. Direct match on code (e.g. "ta-in")
  const directMatch = ALL_SCHEDULED_LANGUAGES.find(
    (l) => l.code.toLowerCase() === clean
  );
  if (directMatch) return directMatch.code;

  // 2. Match on base language code (e.g. "ta" -> "ta-IN")
  const baseCode = clean.split('-')[0];
  const baseMatch = ALL_SCHEDULED_LANGUAGES.find(
    (l) => l.languageCode.toLowerCase() === baseCode
  );
  if (baseMatch) return baseMatch.code;

  return 'en-IN';
};

/**
 * Retrieves a LanguageDescriptor matching the given code, languageCode, or id.
 */
export const getLanguageDescriptor = (code?: string): LanguageDescriptor => {
  if (!code || typeof code !== 'string') return SUPPORTED_LANGUAGES[0];
  const clean = code.trim().replace('_', '-').toLowerCase();

  const found = SUPPORTED_LANGUAGES.find(
    (lang) =>
      lang.code.toLowerCase() === clean ||
      lang.languageCode.toLowerCase() === clean ||
      lang.id.toLowerCase() === clean ||
      lang.code.toLowerCase().startsWith(clean)
  );

  return found || SUPPORTED_LANGUAGES[0];
};

/**
 * Returns whether a given language/locale code is Right-to-Left (RTL).
 */
export const isRTL = (code?: string): boolean => {
  const desc = getLanguageDescriptor(code);
  return desc.direction === 'rtl';
};

export default {
  ALL_SCHEDULED_LANGUAGES,
  SUPPORTED_LANGUAGES,
  getLanguageDescriptor,
  normalizeLocaleCode,
  isRTL,
};
