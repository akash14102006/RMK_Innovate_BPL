/**
 * Bharat PulseLink — Multilingual Hospital Search & NLP Layer
 *
 * Implements Section 30, 31, 32, 33:
 * - Unicode NFC normalization without ASCII stripping
 * - Maps multilingual queries (English, Tamil, Hindi, Telugu, etc.)
 *   to canonical concept IDs (e.g. 'இதயவியல்', 'हृदय रोग' -> 'CARDIOLOGY')
 * - Supports phonetic/transliteration as an additional search aid (e.g. 'idhayaviyal' -> 'CARDIOLOGY')
 * - Searches across hospital names, specialties, facilities, districts, cities
 * - Canonical database values remain untouched
 */

import { SPECIALTY_TAXONOMY, FACILITY_TAXONOMY } from '../taxonomy/hospitalTaxonomy';

// Controlled Multilingual Terminology Dictionary
export const SEARCH_CONCEPT_ALIASES: Record<string, string[]> = {
  CARDIOLOGY: [
    'cardiology',
    'heart',
    'cardiac',
    'cardiologist',
    'हृदय रोग',
    'हृदय',
    'कार्डियोलॉजी',
    'இதயவியல்',
    'இதயம்',
    'கார்டியாலஜி',
    'idhayaviyal',
    'idheyam',
    'కార్డియాలజీ',
    'గుండె',
    'హృద్రోగం',
    'হৃদরোগ',
    'امراض قلب',
    'دل',
  ],
  NEUROLOGY: [
    'neurology',
    'neuro',
    'brain',
    'spine',
    'neurologist',
    'तंत्रिका विज्ञान',
    'मस्तिष्क',
    'नரம்பியல்',
    'மூளை',
    'narambiyal',
    'న్యూరాలజీ',
    'మెదడు',
    'স্নায়ুবিজ্ঞান',
    'علم اعصاب',
    'دماغ',
  ],
  ORTHOPEDICS: [
    'orthopedics',
    'ortho',
    'bone',
    'joint',
    'fracture',
    'अस्थि रोग',
    'हड्डी',
    'எலும்பியல்',
    'எலும்பு',
    'elumbiyal',
    'ఆర్థోపెడిక్స్',
    'ఎముకలు',
    'অর্থোপেডিকস',
    'ہڈیوں کا علاج',
  ],
  PEDIATRICS: [
    'pediatrics',
    'child',
    'baby',
    'pediatrician',
    'बाल रोग',
    'बच्चे',
    'குழந்தை நலம்',
    'குழந்தை',
    'kuzhanthai',
    'పీడియాట్రిక్స్',
    'పిల్లల వైద్యం',
    'শিশুচিকিৎসা',
    'اطفال',
  ],
  ONCOLOGY: [
    'oncology',
    'cancer',
    'tumor',
    'oncologist',
    'कैंसर रोग',
    'कैंसर',
    'புற்றுநோயியல்',
    'புற்றுநோய்',
    'puttrunoi',
    'ఆంకాలజీ',
    'క్యాన్సర్',
    'অনকোলজি',
    'کینسر',
  ],
  GOVERNMENT: [
    'government',
    'govt',
    'public',
    'gh',
    'सरकारी',
    'அரசு',
    'அரசாங்கம்',
    'arasu',
    'ప్రభుత్వ',
    'সরকারি',
    'سرکاری',
  ],
  EMERGENCY_24X7: [
    'emergency',
    'casualty',
    '24x7',
    'trauma',
    'ambulance',
    'आपातकालीन',
    'अस्पताल',
    'அவசர சிகிச்சை',
    'அவசரம்',
    'avasaram',
    'అత్యవసర',
    'জরুরি',
    'ایمرجنسی',
    'ہنگامی',
  ],
};

/**
 * Normalizes Unicode text with NFC and lowercase.
 * DOES NOT strip Indic diacritics or non-ASCII characters.
 */
export const normalizeSearchQuery = (query: string): string => {
  if (!query || typeof query !== 'string') return '';
  return query
    .normalize('NFC')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
};

/**
 * Resolves a multilingual user search term to one or more canonical concept IDs.
 */
export const resolveSearchConcepts = (query: string): string[] => {
  const normalized = normalizeSearchQuery(query);
  if (!normalized) return [];

  const matchedConcepts: string[] = [];

  Object.entries(SEARCH_CONCEPT_ALIASES).forEach(([conceptId, aliases]) => {
    const hasMatch = aliases.some((alias) => {
      const normAlias = normalizeSearchQuery(alias);
      return normalized.includes(normAlias) || normAlias.includes(normalized);
    });

    if (hasMatch) {
      matchedConcepts.push(conceptId);
    }
  });

  return matchedConcepts;
};

/**
 * Tests if a hospital record matches a query across its attributes in any supported language.
 */
export const matchesMultilingualHospital = (
  hospital: {
    name: string;
    services?: string[];
    specialties?: string[];
    city?: string;
    district?: string;
    pincode?: string;
    ownership?: string;
  },
  query: string
): boolean => {
  const normalizedQuery = normalizeSearchQuery(query);
  if (!normalizedQuery) return true;

  // 1. Direct name / city / pincode match
  const nameNorm = normalizeSearchQuery(hospital.name || '');
  const cityNorm = normalizeSearchQuery(hospital.city || '');
  const districtNorm = normalizeSearchQuery(hospital.district || '');
  const pincodeNorm = normalizeSearchQuery(hospital.pincode || '');

  if (
    nameNorm.includes(normalizedQuery) ||
    cityNorm.includes(normalizedQuery) ||
    districtNorm.includes(normalizedQuery) ||
    pincodeNorm.includes(normalizedQuery)
  ) {
    return true;
  }

  // 2. Multilingual Concept Resolution
  const targetConcepts = resolveSearchConcepts(normalizedQuery);
  if (targetConcepts.length === 0) return false;

  // Check hospital specialties / services against matched concepts
  const hospitalSpecialties = [
    ...(hospital.specialties || []),
    ...(hospital.services || []),
    hospital.ownership || '',
  ].map((s) => s.toUpperCase());

  return targetConcepts.some((concept) =>
    hospitalSpecialties.some((spec) => spec.includes(concept) || concept.includes(spec))
  );
};

export default {
  SEARCH_CONCEPT_ALIASES,
  normalizeSearchQuery,
  resolveSearchConcepts,
  matchesMultilingualHospital,
};
