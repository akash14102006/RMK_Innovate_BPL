export interface CountryItem {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  dialCode: string;
}

export const WORLD_COUNTRIES: CountryItem[] = [
  { code: 'IN', name: 'India', dialCode: '+91' },
  { code: 'US', name: 'United States', dialCode: '+1' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971' },
  { code: 'CA', name: 'Canada', dialCode: '+1' },
  { code: 'AU', name: 'Australia', dialCode: '+61' },
  { code: 'SG', name: 'Singapore', dialCode: '+65' },
  { code: 'DE', name: 'Germany', dialCode: '+49' },
  { code: 'FR', name: 'France', dialCode: '+33' },
  { code: 'JP', name: 'Japan', dialCode: '+81' },
  { code: 'CN', name: 'China', dialCode: '+86' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966' },
  { code: 'QAT', name: 'Qatar', dialCode: '+974' },
  { code: 'OM', name: 'Oman', dialCode: '+968' },
  { code: 'KW', name: 'Kuwait', dialCode: '+965' },
  { code: 'BH', name: 'Bahrain', dialCode: '+973' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62' },
  { code: 'TH', name: 'Thailand', dialCode: '+66' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84' },
  { code: 'PH', name: 'Philippines', dialCode: '+63' },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94' },
  { code: 'NP', name: 'Nepal', dialCode: '+977' },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92' },
  { code: 'MV', name: 'Maldives', dialCode: '+960' },
  { code: 'BT', name: 'Bhutan', dialCode: '+975' },
  { code: 'AF', name: 'Afghanistan', dialCode: '+93' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234' },
  { code: 'EG', name: 'Egypt', dialCode: '+20' },
  { code: 'KE', name: 'Kenya', dialCode: '+254' },
  { code: 'GH', name: 'Ghana', dialCode: '+233' },
  { code: 'BR', name: 'Brazil', dialCode: '+55' },
  { code: 'MX', name: 'Mexico', dialCode: '+52' },
  { code: 'AR', name: 'Argentina', dialCode: '+54' },
  { code: 'CL', name: 'Chile', dialCode: '+56' },
  { code: 'CO', name: 'Colombia', dialCode: '+57' },
  { code: 'PE', name: 'Peru', dialCode: '+51' },
  { code: 'RU', name: 'Russia', dialCode: '+7' },
  { code: 'IT', name: 'Italy', dialCode: '+39' },
  { code: 'ES', name: 'Spain', dialCode: '+34' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41' },
  { code: 'SE', name: 'Sweden', dialCode: '+46' },
  { code: 'NO', name: 'Norway', dialCode: '+47' },
  { code: 'DK', name: 'Denmark', dialCode: '+45' },
  { code: 'FI', name: 'Finland', dialCode: '+358' },
  { code: 'IE', name: 'Ireland', dialCode: '+353' },
  { code: 'BE', name: 'Belgium', dialCode: '+32' },
  { code: 'AT', name: 'Austria', dialCode: '+43' },
  { code: 'PT', name: 'Portugal', dialCode: '+351' },
  { code: 'GR', name: 'Greece', dialCode: '+30' },
  { code: 'PL', name: 'Poland', dialCode: '+48' },
  { code: 'CZ', name: 'Czech Republic', dialCode: '+420' },
  { code: 'HU', name: 'Hungary', dialCode: '+36' },
  { code: 'RO', name: 'Romania', dialCode: '+40' },
  { code: 'UA', name: 'Ukraine', dialCode: '+380' },
  { code: 'IL', name: 'Israel', dialCode: '+972' },
  { code: 'TR', name: 'Turkey', dialCode: '+90' },
  { code: 'KR', name: 'South Korea', dialCode: '+82' },
  { code: 'TW', name: 'Taiwan', dialCode: '+886' },
  { code: 'HK', name: 'Hong Kong', dialCode: '+852' },
];

export function searchCountries(query: string): CountryItem[] {
  if (!query || !query.trim()) return WORLD_COUNTRIES;
  const q = query.trim().toLowerCase();
  return WORLD_COUNTRIES.filter(
    (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.dialCode.includes(q)
  );
}
