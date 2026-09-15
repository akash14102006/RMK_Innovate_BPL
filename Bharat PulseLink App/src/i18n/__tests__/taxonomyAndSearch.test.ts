import { describe, it, expect } from 'vitest';
import { getLocalizedTaxonomyLabel } from '../taxonomy/hospitalTaxonomy';
import {
  normalizeSearchQuery,
  resolveSearchConcepts,
  matchesMultilingualHospital,
} from '../search/multilingualSearch';

describe('Healthcare Taxonomy and Multilingual Search', () => {
  it('resolves localized labels for stable semantic codes without database mutation', () => {
    expect(getLocalizedTaxonomyLabel('CARDIOLOGY', 'en-IN')).toBe('Cardiology');
    expect(getLocalizedTaxonomyLabel('CARDIOLOGY', 'ta-IN')).toBe('இதயவியல்');
    expect(getLocalizedTaxonomyLabel('CARDIOLOGY', 'hi-IN')).toBe('हृदय रोग विशेषज्ञता');
    expect(getLocalizedTaxonomyLabel('CARDIOLOGY', 'te-IN')).toBe('కార్డియాలజీ');

    expect(getLocalizedTaxonomyLabel('GOVERNMENT', 'en-IN')).toBe('Government Hospital');
    expect(getLocalizedTaxonomyLabel('GOVERNMENT', 'hi-IN')).toBe('सरकारी अस्पताल');
    expect(getLocalizedTaxonomyLabel('GOVERNMENT', 'ta-IN')).toBe('அரசு மருத்துவமனை');

    expect(getLocalizedTaxonomyLabel('EMERGENCY_24X7', 'ta-IN')).toBe('24x7 அவசர சிகிச்சை');
  });

  it('normalizes queries using Unicode NFC without ASCII stripping', () => {
    const tamilQuery = '  இதயவியல்  ';
    const normalized = normalizeSearchQuery(tamilQuery);
    expect(normalized).toBe('இதயவியல்');

    const hindiQuery = 'हृदय रोग';
    expect(normalizeSearchQuery(hindiQuery)).toBe('हृदय रोग');
  });

  it('maps multilingual queries and transliteration to canonical concept IDs', () => {
    // English
    expect(resolveSearchConcepts('cardiology')).toContain('CARDIOLOGY');

    // Tamil native script
    expect(resolveSearchConcepts('இதயவியல்')).toContain('CARDIOLOGY');

    // Tamil phonetic transliteration
    expect(resolveSearchConcepts('idhayaviyal')).toContain('CARDIOLOGY');

    // Hindi native script
    expect(resolveSearchConcepts('हृदय रोग')).toContain('CARDIOLOGY');

    // Telugu native script
    expect(resolveSearchConcepts('కార్డియాలజీ')).toContain('CARDIOLOGY');

    // Urdu
    expect(resolveSearchConcepts('امراض قلب')).toContain('CARDIOLOGY');

    // Government hospital
    expect(resolveSearchConcepts('அரசு')).toContain('GOVERNMENT');
    expect(resolveSearchConcepts('सरकारी')).toContain('GOVERNMENT');
  });

  it('correctly matches hospital records against multilingual queries', () => {
    const sampleHospital = {
      name: 'Rajiv Gandhi Government General Hospital',
      city: 'Chennai',
      specialties: ['CARDIOLOGY', 'NEUROLOGY', 'TRAUMA_CARE'],
      services: ['24x7 Emergency', 'ICU', 'Blood Bank'],
      ownership: 'GOVERNMENT',
    };

    // English direct match
    expect(matchesMultilingualHospital(sampleHospital, 'Chennai')).toBe(true);
    expect(matchesMultilingualHospital(sampleHospital, 'Cardiology')).toBe(true);

    // Tamil query matching specialty
    expect(matchesMultilingualHospital(sampleHospital, 'இதயவியல்')).toBe(true);

    // Tamil transliteration
    expect(matchesMultilingualHospital(sampleHospital, 'idhayaviyal')).toBe(true);

    // Hindi query matching ownership
    expect(matchesMultilingualHospital(sampleHospital, 'सरकारी')).toBe(true);

    // Non-matching query
    expect(matchesMultilingualHospital(sampleHospital, 'Oncology')).toBe(false);
  });
});
