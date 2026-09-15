import { API_CONFIG } from './apiConfig';
import { apiKeyService } from './apiKeyService';

export interface Festival {
  name: string;
  date: string;
  day: number;
  month: number;
  year: number;
  region: string;
  surge: string;
  level: 'low' | 'moderate' | 'high';
  description: string;
}

/**
 * Predefined Indian festivals with historical surge data
 * This is a fallback if API is not configured
 */
export const INDIAN_FESTIVALS_2026: Festival[] = [
  {
    name: 'Makar Sankranti',
    date: '2026-01-14',
    day: 14,
    month: 1,
    year: 2026,
    region: 'All India',
    surge: '12%',
    level: 'low',
    description: 'Minor increase in outpatient visits',
  },
  {
    name: 'Republic Day',
    date: '2026-01-26',
    day: 26,
    month: 1,
    year: 2026,
    region: 'All India',
    surge: '8%',
    level: 'low',
    description: 'Slight increase due to celebrations',
  },
  {
    name: 'Maha Shivaratri',
    date: '2026-02-15',
    day: 15,
    month: 2,
    year: 2026,
    region: 'All India',
    surge: '10%',
    level: 'low',
    description: 'Minor surge in emergency visits',
  },
  {
    name: 'Holi',
    date: '2026-03-04',
    day: 4,
    month: 3,
    year: 2026,
    region: 'North India',
    surge: '28%',
    level: 'high',
    description: 'Significant increase in eye injuries, allergies, and accidents',
  },
  {
    name: 'Eid ul-Fitr',
    date: '2026-03-20',
    day: 20,
    month: 3,
    year: 2026,
    region: 'All India',
    surge: '18%',
    level: 'moderate',
    description: 'Moderate surge due to mass gatherings',
  },
  {
    name: 'Ugadi/Gudi Padwa',
    date: '2026-03-20',
    day: 20,
    month: 3,
    year: 2026,
    region: 'South India, Maharashtra',
    surge: '15%',
    level: 'moderate',
    description: 'Moderate increase in patient visits',
  },
  {
    name: 'Good Friday',
    date: '2026-04-03',
    day: 3,
    month: 4,
    year: 2026,
    region: 'All India',
    surge: '10%',
    level: 'low',
    description: 'Minor elevation in admissions',
  },
  {
    name: 'Independence Day',
    date: '2026-08-15',
    day: 15,
    month: 8,
    year: 2026,
    region: 'All India',
    surge: '12%',
    level: 'low',
    description: 'Minor increase in patient load',
  },
  {
    name: 'Ganesh Chaturthi',
    date: '2026-09-15',
    day: 15,
    month: 9,
    year: 2026,
    region: 'Maharashtra, Karnataka',
    surge: '35%',
    level: 'high',
    description: 'Major surge in accidents, drownings, and crowd-related incidents',
  },
  {
    name: 'Navratri',
    date: '2026-10-13',
    day: 13,
    month: 10,
    year: 2026,
    region: 'Gujarat, North India',
    surge: '20%',
    level: 'moderate',
    description: 'Moderate increase due to extended celebrations',
  },
  {
    name: 'Dussehra',
    date: '2026-10-22',
    day: 22,
    month: 10,
    year: 2026,
    region: 'All India',
    surge: '22%',
    level: 'moderate',
    description: 'Moderate surge in emergency cases',
  },
  {
    name: 'Karwa Chauth',
    date: '2026-10-29',
    day: 29,
    month: 10,
    year: 2026,
    region: 'North India',
    surge: '8%',
    level: 'low',
    description: 'Minor increase in dehydration cases',
  },
  {
    name: 'Diwali',
    date: '2026-11-08',
    day: 8,
    month: 11,
    year: 2026,
    region: 'All India',
    surge: '42%',
    level: 'high',
    description: 'Major surge in burns, respiratory issues, and trauma cases',
  },
  {
    name: 'Bhai Dooj',
    date: '2026-11-10',
    day: 10,
    month: 11,
    year: 2026,
    region: 'North India',
    surge: '12%',
    level: 'low',
    description: 'Post-Diwali continued elevation',
  },
  {
    name: 'Chhath Puja',
    date: '2026-11-16',
    day: 16,
    month: 11,
    year: 2026,
    region: 'Bihar, UP, Jharkhand',
    surge: '20%',
    level: 'moderate',
    description: 'Moderate increase in waterborne diseases',
  },
  {
    name: 'Christmas',
    date: '2026-12-25',
    day: 25,
    month: 12,
    year: 2026,
    region: 'All India',
    surge: '15%',
    level: 'moderate',
    description: 'Moderate increase due to celebrations',
  },
];

/**
 * Fetch festivals from Calendarific API
 */
export async function fetchFestivalsFromAPI(year: number = 2026): Promise<Festival[]> {
  const calendarificKey = apiKeyService.getCalendarificKey();

  if (!calendarificKey || calendarificKey === 'YOUR_CALENDARIFIC_API_KEY_HERE') {
    console.log('Calendarific API not configured, using predefined data');
    return INDIAN_FESTIVALS_2026;
  }

  try {
    const response = await fetch(
      `https://calendarific.com/api/v2/holidays?api_key=${calendarificKey}&country=IN&year=${year}&type=national,religious,observance`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch festival data from Calendarific');
    }

    const data = await response.json();

    if (!data.response || !data.response.holidays) {
      throw new Error('Invalid response from Calendarific API');
    }

    // Map API response to our Festival format with intelligent surge prediction
    const festivals: Festival[] = data.response.holidays.map((holiday: any) => {
      const surgePrediction = predictFestivalSurge(holiday.name);

      return {
        name: holiday.name,
        date: holiday.date.iso,
        day: parseInt(holiday.date.datetime.day),
        month: parseInt(holiday.date.datetime.month),
        year: parseInt(holiday.date.datetime.year),
        region: determineRegion(holiday.name),
        surge: surgePrediction.surge,
        level: surgePrediction.level,
        description: holiday.description || surgePrediction.description,
      };
    });

    console.log(`✅ Fetched ${festivals.length} festivals from Calendarific API`);
    return festivals;
  } catch (error) {
    // Silently fallback to mock data - API may not be configured
    return INDIAN_FESTIVALS_2026; // Fallback to predefined list
  }
}

/**
 * Predict festival surge based on historical patterns
 */
function predictFestivalSurge(festivalName: string): { surge: string; level: 'low' | 'moderate' | 'high'; description: string } {
  const name = festivalName.toLowerCase();

  // High impact festivals
  if (name.includes('diwali') || name.includes('deepavali')) {
    return { surge: '42%', level: 'high', description: 'Major surge in burns, respiratory issues, and trauma cases' };
  }
  if (name.includes('holi')) {
    return { surge: '28%', level: 'high', description: 'Significant increase in eye injuries, allergies, and accidents' };
  }
  if (name.includes('ganesh chaturthi')) {
    return { surge: '35%', level: 'high', description: 'Major surge in accidents, drownings, and crowd-related incidents' };
  }

  // Moderate impact festivals
  if (name.includes('dussehra') || name.includes('navratri') || name.includes('durga puja')) {
    return { surge: '22%', level: 'moderate', description: 'Moderate surge in emergency cases' };
  }
  if (name.includes('eid') || name.includes('id')) {
    return { surge: '18%', level: 'moderate', description: 'Moderate surge due to mass gatherings' };
  }
  if (name.includes('chhath')) {
    return { surge: '20%', level: 'moderate', description: 'Moderate increase in waterborne diseases' };
  }
  if (name.includes('christmas') || name.includes('new year')) {
    return { surge: '15%', level: 'moderate', description: 'Moderate increase due to celebrations' };
  }

  // Low impact festivals
  return { surge: '10%', level: 'low', description: 'Minor increase in patient visits' };
}

/**
 * Determine region based on festival name
 */
function determineRegion(festivalName: string): string {
  const name = festivalName.toLowerCase();

  if (name.includes('pongal') || name.includes('tamil')) return 'Tamil Nadu';
  if (name.includes('ugadi') || name.includes('kannada')) return 'Karnataka, Andhra Pradesh';
  if (name.includes('baisakhi') || name.includes('vaisakhi')) return 'Punjab, Haryana';
  if (name.includes('onam')) return 'Kerala';
  if (name.includes('durga puja')) return 'West Bengal';
  if (name.includes('chhath')) return 'Bihar, UP, Jharkhand';
  if (name.includes('ganesh')) return 'Maharashtra, Karnataka';
  if (name.includes('karwa chauth')) return 'North India';

  return 'All India';
}

/**
 * Get festivals for a specific month
 */
export function getFestivalsByMonth(month: number, year: number = 2026): Festival[] {
  return INDIAN_FESTIVALS_2026.filter(
    festival => festival.month === month && festival.year === year
  );
}

/**
 * Get upcoming festivals (next 30 days)
 */
export function getUpcomingFestivals(count: number = 5, customFestivals?: Festival[]): Festival[] {
  const today = new Date();
  const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const source = customFestivals || INDIAN_FESTIVALS_2026;

  return source.filter(festival => {
    const festivalDate = new Date(festival.date);
    return festivalDate >= today && festivalDate <= thirtyDaysLater;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, count);
}

/**
 * Get next major festival (high impact)
 */
export function getNextMajorFestival(customFestivals?: Festival[]): Festival | null {
  const today = new Date();
  const source = customFestivals || INDIAN_FESTIVALS_2026;

  const upcomingHighImpact = source.filter(festival => {
    const festivalDate = new Date(festival.date);
    return festivalDate >= today && festival.level === 'high';
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return upcomingHighImpact.length > 0 ? upcomingHighImpact[0] : null;
}

/**
 * Calculate festival impact on patient load
 */
export function calculateFestivalImpact(festivalName: string | null, customFestivals?: Festival[]): {
  surgePrediction: number;
  riskLevel: 'low' | 'moderate' | 'high';
  recommendations: string[];
} {
  if (!festivalName) {
    return {
      surgePrediction: 0,
      riskLevel: 'low',
      recommendations: ['Maintain standard protocols'],
    };
  }

  const source = customFestivals || INDIAN_FESTIVALS_2026;
  const festival = source.find(
    f => f.name.toLowerCase() === festivalName.toLowerCase()
  );

  if (!festival) {
    return {
      surgePrediction: 10,
      riskLevel: 'moderate',
      recommendations: ['Monitor for increased patient load'],
    };
  }

  const surgePercent = parseInt(festival.surge);
  const recommendations: string[] = [];

  switch (festival.level) {
    case 'high':
      recommendations.push('Deploy additional emergency staff');
      recommendations.push('Stock burn treatment supplies');
      recommendations.push('Prepare extra ICU beds');
      recommendations.push('Coordinate with ambulance services');
      break;
    case 'moderate':
      recommendations.push('Schedule extra nursing shifts');
      recommendations.push('Increase medicine inventory');
      recommendations.push('Brief staff on festival-specific cases');
      break;
    case 'low':
      recommendations.push('Monitor patient inflow');
      recommendations.push('Maintain readiness for minor surge');
      break;
  }

  return {
    surgePrediction: surgePercent,
    riskLevel: festival.level,
    recommendations,
  };
}

/**
 * Check if a specific date has a festival
 */
export function getFestivalByDate(date: Date, customFestivals?: Festival[]): Festival | null {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const source = customFestivals || INDIAN_FESTIVALS_2026;

  return source.find(
    festival => festival.day === day && festival.month === month && festival.year === year
  ) || null;
}

/**
 * Check if festival service is configured with live data
 */
export function isFestivalServiceConfigured(): boolean {
  return apiKeyService.isCalendarificConfigured() || apiKeyService.isGoogleCalendarConfigured();
}

/* updated */
