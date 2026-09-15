import { apiKeyService } from './apiKeyService';
import { API_CONFIG } from './apiConfig';
import { indianCities, CityData, getAQIColor, getAQILevel } from '../data/indianCities';

export interface LiveAQIUpdate {
  city: string;
  aqi: number;
  level: string;
  color: string;
  timestamp: string;
}

/**
 * Fetch live AQI data for all cities in database
 * This updates the static city data with real-time AQI values
 */
export async function fetchLiveAQIForAllCities(): Promise<CityData[]> {
  const apiKey = apiKeyService.getWAQIKey();
  
  // If no API key, return original data
  if (!apiKey || !apiKeyService.isWAQIConfigured()) {
    return indianCities;
  }

  // Create a copy of cities to update
  const updatedCities: CityData[] = [...indianCities];
  
  // Fetch AQI for top cities (to avoid rate limits)
  const priorityCities = ['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 
                          'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur',
                          'Indore', 'Bhopal', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana',
                          'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Varanasi'];

  const fetchPromises = updatedCities
    .filter(city => priorityCities.includes(city.name))
    .map(async (city) => {
      try {
        const response = await fetch(
          `${API_CONFIG.WAQI_BASE_URL}/feed/${city.name.toLowerCase()}/?token=${apiKey}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'ok' && data.data.aqi) {
            const liveAQI = data.data.aqi;
            // Update city AQI
            city.aqi = liveAQI;
            city.level = getAQILevel(liveAQI);
            city.color = getAQIColor(liveAQI);
          }
        }
      } catch (error) {
        // Silently fail - keep original data
      }
    });

  // Wait for all fetches with a timeout
  await Promise.race([
    Promise.all(fetchPromises),
    new Promise(resolve => setTimeout(resolve, 5000)) // 5 second timeout
  ]);

  return updatedCities;
}

/**
 * Fetch live AQI for a specific city
 */
export async function fetchLiveAQIForCity(cityName: string): Promise<LiveAQIUpdate | null> {
  const apiKey = apiKeyService.getWAQIKey();
  
  if (!apiKey || !apiKeyService.isWAQIConfigured()) {
    return null;
  }

  try {
    const response = await fetch(
      `${API_CONFIG.WAQI_BASE_URL}/feed/${cityName.toLowerCase()}/?token=${apiKey}`
    );
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (data.status !== 'ok' || !data.data.aqi) {
      return null;
    }

    const aqi = data.data.aqi;
    
    return {
      city: data.data.city.name,
      aqi: aqi,
      level: getAQILevel(aqi),
      color: getAQIColor(aqi),
      timestamp: new Date().toLocaleString()
    };
  } catch (error) {
    return null;
  }
}

/**
 * Get cities with live data priority
 * Returns cities sorted by whether they have WAQI monitoring stations
 */
export function getCitiesWithLivePriority(): string[] {
  // Major cities that usually have WAQI monitoring stations
  return [
    'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad',
    'Pune', 'Ahmedabad', 'Surat', 'Jaipur', 'Lucknow', 'Kanpur',
    'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad',
    'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik',
    'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivali', 'Vasai-Virar', 'Varanasi',
    'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Navi Mumbai', 'Allahabad',
    'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur', 'Gwalior', 'Vijayawada',
    'Jodhpur', 'Madurai', 'Raipur', 'Kota', 'Guwahati', 'Chandigarh',
    'Solapur', 'Hubli-Dharwad', 'Bareilly', 'Moradabad', 'Mysore', 'Gurgaon',
    'Aligarh', 'Jalandhar', 'Tiruchirappalli', 'Bhubaneswar', 'Salem',
    'Mira-Bhayandar', 'Thiruvananthapuram', 'Bhiwandi', 'Saharanpur', 'Guntur',
    'Amravati', 'Bikaner', 'Noida', 'Jamshedpur', 'Bhilai', 'Cuttack',
    'Firozabad', 'Kochi', 'Nellore', 'Bhavnagar', 'Dehradun', 'Durgapur',
    'Asansol', 'Rourkela', 'Nanded', 'Kolhapur', 'Ajmer', 'Akola',
    'Gulbarga', 'Jamnagar', 'Ujjain', 'Loni', 'Siliguri', 'Jhansi',
    'Ulhasnagar', 'Jammu', 'Sangli-Miraj & Kupwad', 'Mangalore', 'Erode',
    'Belgaum', 'Ambattur', 'Tirunelveli', 'Malegaon', 'Gaya', 'Jalgaon',
    'Udaipur', 'Maheshtala'
  ];
}

/* updated */
