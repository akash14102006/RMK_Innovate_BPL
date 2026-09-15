// Comprehensive list of Indian cities and districts for pollution monitoring

export interface CityData {
  name: string;
  state: string;
  district: string;
  aqi: number;
  level: string;
  color: string;
  lat: number;
  lng: number;
  population?: string;
}

export const indianCities: CityData[] = [
  // Delhi NCR
  { name: 'Delhi', state: 'Delhi', district: 'Central Delhi', aqi: 218, level: 'Poor', color: 'bg-orange-500', lat: 28.6, lng: 77.2, population: '16.8M' },
  { name: 'Noida', state: 'Uttar Pradesh', district: 'Gautam Buddha Nagar', aqi: 225, level: 'Poor', color: 'bg-orange-500', lat: 28.5, lng: 77.3 },
  { name: 'Gurgaon', state: 'Haryana', district: 'Gurugram', aqi: 212, level: 'Poor', color: 'bg-orange-500', lat: 28.4, lng: 77.0 },
  { name: 'Faridabad', state: 'Haryana', district: 'Faridabad', aqi: 208, level: 'Poor', color: 'bg-orange-500', lat: 28.4, lng: 77.3 },
  { name: 'Ghaziabad', state: 'Uttar Pradesh', district: 'Ghaziabad', aqi: 232, level: 'Poor', color: 'bg-orange-500', lat: 28.6, lng: 77.4 },

  // Maharashtra
  { name: 'Mumbai', state: 'Maharashtra', district: 'Mumbai City', aqi: 156, level: 'Moderate', color: 'bg-yellow-500', lat: 19.0, lng: 72.8, population: '12.4M' },
  { name: 'Pune', state: 'Maharashtra', district: 'Pune', aqi: 124, level: 'Moderate', color: 'bg-yellow-500', lat: 18.5, lng: 73.8, population: '3.1M' },
  { name: 'Nagpur', state: 'Maharashtra', district: 'Nagpur', aqi: 142, level: 'Moderate', color: 'bg-yellow-500', lat: 21.1, lng: 79.0 },
  { name: 'Thane', state: 'Maharashtra', district: 'Thane', aqi: 148, level: 'Moderate', color: 'bg-yellow-500', lat: 19.2, lng: 72.9 },
  { name: 'Nashik', state: 'Maharashtra', district: 'Nashik', aqi: 118, level: 'Moderate', color: 'bg-yellow-500', lat: 19.9, lng: 73.7 },
  { name: 'Aurangabad', state: 'Maharashtra', district: 'Aurangabad', aqi: 135, level: 'Moderate', color: 'bg-yellow-500', lat: 19.8, lng: 75.3 },

  // Karnataka
  { name: 'Bangalore', state: 'Karnataka', district: 'Bangalore Urban', aqi: 87, level: 'Moderate', color: 'bg-yellow-500', lat: 12.9, lng: 77.5, population: '8.4M' },
  { name: 'Mysore', state: 'Karnataka', district: 'Mysore', aqi: 72, level: 'Satisfactory', color: 'bg-yellow-400', lat: 12.2, lng: 76.6 },
  { name: 'Hubli', state: 'Karnataka', district: 'Dharwad', aqi: 94, level: 'Moderate', color: 'bg-yellow-500', lat: 15.3, lng: 75.1 },
  { name: 'Mangalore', state: 'Karnataka', district: 'Dakshina Kannada', aqi: 68, level: 'Satisfactory', color: 'bg-yellow-400', lat: 12.9, lng: 74.8 },
  { name: 'Belgaum', state: 'Karnataka', district: 'Belgaum', aqi: 88, level: 'Moderate', color: 'bg-yellow-500', lat: 15.8, lng: 74.4 },

  // Tamil Nadu
  { name: 'Chennai', state: 'Tamil Nadu', district: 'Chennai', aqi: 98, level: 'Moderate', color: 'bg-yellow-500', lat: 13.0, lng: 80.2, population: '4.6M' },
  { name: 'Coimbatore', state: 'Tamil Nadu', district: 'Coimbatore', aqi: 82, level: 'Moderate', color: 'bg-yellow-500', lat: 11.0, lng: 76.9 },
  { name: 'Madurai', state: 'Tamil Nadu', district: 'Madurai', aqi: 91, level: 'Moderate', color: 'bg-yellow-500', lat: 9.9, lng: 78.1 },
  { name: 'Tiruchirappalli', state: 'Tamil Nadu', district: 'Tiruchirappalli', aqi: 86, level: 'Moderate', color: 'bg-yellow-500', lat: 10.8, lng: 78.6 },
  { name: 'Salem', state: 'Tamil Nadu', district: 'Salem', aqi: 93, level: 'Moderate', color: 'bg-yellow-500', lat: 11.6, lng: 78.1 },

  // West Bengal
  { name: 'Kolkata', state: 'West Bengal', district: 'Kolkata', aqi: 187, level: 'Moderate', color: 'bg-yellow-500', lat: 22.5, lng: 88.3, population: '4.5M' },
  { name: 'Howrah', state: 'West Bengal', district: 'Howrah', aqi: 192, level: 'Moderate', color: 'bg-yellow-500', lat: 22.5, lng: 88.2 },
  { name: 'Durgapur', state: 'West Bengal', district: 'Paschim Bardhaman', aqi: 178, level: 'Moderate', color: 'bg-yellow-500', lat: 23.5, lng: 87.3 },
  { name: 'Siliguri', state: 'West Bengal', district: 'Darjeeling', aqi: 145, level: 'Moderate', color: 'bg-yellow-500', lat: 26.7, lng: 88.4 },

  // Telangana
  { name: 'Hyderabad', state: 'Telangana', district: 'Hyderabad', aqi: 102, level: 'Moderate', color: 'bg-yellow-500', lat: 17.3, lng: 78.4, population: '6.9M' },
  { name: 'Warangal', state: 'Telangana', district: 'Warangal Urban', aqi: 96, level: 'Moderate', color: 'bg-yellow-500', lat: 17.9, lng: 79.5 },
  { name: 'Nizamabad', state: 'Telangana', district: 'Nizamabad', aqi: 88, level: 'Moderate', color: 'bg-yellow-500', lat: 18.6, lng: 78.0 },

  // Gujarat
  { name: 'Ahmedabad', state: 'Gujarat', district: 'Ahmedabad', aqi: 165, level: 'Moderate', color: 'bg-yellow-500', lat: 23.0, lng: 72.5, population: '5.5M' },
  { name: 'Surat', state: 'Gujarat', district: 'Surat', aqi: 152, level: 'Moderate', color: 'bg-yellow-500', lat: 21.1, lng: 72.8 },
  { name: 'Vadodara', state: 'Gujarat', district: 'Vadodara', aqi: 147, level: 'Moderate', color: 'bg-yellow-500', lat: 22.3, lng: 73.1 },
  { name: 'Rajkot', state: 'Gujarat', district: 'Rajkot', aqi: 138, level: 'Moderate', color: 'bg-yellow-500', lat: 22.3, lng: 70.7 },
  { name: 'Bhavnagar', state: 'Gujarat', district: 'Bhavnagar', aqi: 132, level: 'Moderate', color: 'bg-yellow-500', lat: 21.7, lng: 72.1 },

  // Rajasthan
  { name: 'Jaipur', state: 'Rajasthan', district: 'Jaipur', aqi: 192, level: 'Moderate', color: 'bg-yellow-500', lat: 26.9, lng: 75.7, population: '3.0M' },
  { name: 'Jodhpur', state: 'Rajasthan', district: 'Jodhpur', aqi: 185, level: 'Moderate', color: 'bg-yellow-500', lat: 26.2, lng: 73.0 },
  { name: 'Udaipur', state: 'Rajasthan', district: 'Udaipur', aqi: 162, level: 'Moderate', color: 'bg-yellow-500', lat: 24.5, lng: 73.6 },
  { name: 'Kota', state: 'Rajasthan', district: 'Kota', aqi: 176, level: 'Moderate', color: 'bg-yellow-500', lat: 25.1, lng: 75.8 },
  { name: 'Ajmer', state: 'Rajasthan', district: 'Ajmer', aqi: 168, level: 'Moderate', color: 'bg-yellow-500', lat: 26.4, lng: 74.6 },

  // Uttar Pradesh
  { name: 'Lucknow', state: 'Uttar Pradesh', district: 'Lucknow', aqi: 203, level: 'Poor', color: 'bg-orange-500', lat: 26.8, lng: 80.9, population: '2.8M' },
  { name: 'Kanpur', state: 'Uttar Pradesh', district: 'Kanpur Nagar', aqi: 215, level: 'Poor', color: 'bg-orange-500', lat: 26.4, lng: 80.3 },
  { name: 'Varanasi', state: 'Uttar Pradesh', district: 'Varanasi', aqi: 198, level: 'Moderate', color: 'bg-yellow-500', lat: 25.3, lng: 82.9 },
  { name: 'Agra', state: 'Uttar Pradesh', district: 'Agra', aqi: 206, level: 'Poor', color: 'bg-orange-500', lat: 27.1, lng: 78.0 },
  { name: 'Meerut', state: 'Uttar Pradesh', district: 'Meerut', aqi: 219, level: 'Poor', color: 'bg-orange-500', lat: 28.9, lng: 77.7 },
  { name: 'Allahabad', state: 'Uttar Pradesh', district: 'Prayagraj', aqi: 195, level: 'Moderate', color: 'bg-yellow-500', lat: 25.4, lng: 81.8 },

  // Madhya Pradesh
  { name: 'Indore', state: 'Madhya Pradesh', district: 'Indore', aqi: 158, level: 'Moderate', color: 'bg-yellow-500', lat: 22.7, lng: 75.8 },
  { name: 'Bhopal', state: 'Madhya Pradesh', district: 'Bhopal', aqi: 164, level: 'Moderate', color: 'bg-yellow-500', lat: 23.2, lng: 77.4 },
  { name: 'Jabalpur', state: 'Madhya Pradesh', district: 'Jabalpur', aqi: 142, level: 'Moderate', color: 'bg-yellow-500', lat: 23.1, lng: 79.9 },
  { name: 'Gwalior', state: 'Madhya Pradesh', district: 'Gwalior', aqi: 172, level: 'Moderate', color: 'bg-yellow-500', lat: 26.2, lng: 78.1 },

  // Punjab
  { name: 'Ludhiana', state: 'Punjab', district: 'Ludhiana', aqi: 196, level: 'Moderate', color: 'bg-yellow-500', lat: 30.9, lng: 75.8 },
  { name: 'Amritsar', state: 'Punjab', district: 'Amritsar', aqi: 188, level: 'Moderate', color: 'bg-yellow-500', lat: 31.6, lng: 74.8 },
  { name: 'Jalandhar', state: 'Punjab', district: 'Jalandhar', aqi: 182, level: 'Moderate', color: 'bg-yellow-500', lat: 31.3, lng: 75.5 },
  { name: 'Patiala', state: 'Punjab', district: 'Patiala', aqi: 176, level: 'Moderate', color: 'bg-yellow-500', lat: 30.3, lng: 76.3 },

  // Haryana
  { name: 'Panipat', state: 'Haryana', district: 'Panipat', aqi: 205, level: 'Poor', color: 'bg-orange-500', lat: 29.3, lng: 76.9 },
  { name: 'Ambala', state: 'Haryana', district: 'Ambala', aqi: 194, level: 'Moderate', color: 'bg-yellow-500', lat: 30.3, lng: 76.7 },
  { name: 'Karnal', state: 'Haryana', district: 'Karnal', aqi: 198, level: 'Moderate', color: 'bg-yellow-500', lat: 29.6, lng: 76.9 },

  // Bihar
  { name: 'Patna', state: 'Bihar', district: 'Patna', aqi: 201, level: 'Poor', color: 'bg-orange-500', lat: 25.5, lng: 85.1 },
  { name: 'Gaya', state: 'Bihar', district: 'Gaya', aqi: 186, level: 'Moderate', color: 'bg-yellow-500', lat: 24.7, lng: 84.9 },
  { name: 'Bhagalpur', state: 'Bihar', district: 'Bhagalpur', aqi: 178, level: 'Moderate', color: 'bg-yellow-500', lat: 25.2, lng: 86.9 },

  // Odisha
  { name: 'Bhubaneswar', state: 'Odisha', district: 'Khordha', aqi: 112, level: 'Moderate', color: 'bg-yellow-500', lat: 20.2, lng: 85.8 },
  { name: 'Cuttack', state: 'Odisha', district: 'Cuttack', aqi: 118, level: 'Moderate', color: 'bg-yellow-500', lat: 20.4, lng: 85.8 },
  { name: 'Rourkela', state: 'Odisha', district: 'Sundargarh', aqi: 136, level: 'Moderate', color: 'bg-yellow-500', lat: 22.2, lng: 84.8 },

  // Kerala
  { name: 'Kochi', state: 'Kerala', district: 'Ernakulam', aqi: 58, level: 'Satisfactory', color: 'bg-yellow-400', lat: 9.9, lng: 76.2 },
  { name: 'Thiruvananthapuram', state: 'Kerala', district: 'Thiruvananthapuram', aqi: 52, level: 'Satisfactory', color: 'bg-yellow-400', lat: 8.5, lng: 76.9 },
  { name: 'Kozhikode', state: 'Kerala', district: 'Kozhikode', aqi: 64, level: 'Satisfactory', color: 'bg-yellow-400', lat: 11.2, lng: 75.7 },
  { name: 'Thrissur', state: 'Kerala', district: 'Thrissur', aqi: 61, level: 'Satisfactory', color: 'bg-yellow-400', lat: 10.5, lng: 76.2 },

  // Assam
  { name: 'Guwahati', state: 'Assam', district: 'Kamrup Metropolitan', aqi: 128, level: 'Moderate', color: 'bg-yellow-500', lat: 26.1, lng: 91.7 },
  { name: 'Dibrugarh', state: 'Assam', district: 'Dibrugarh', aqi: 115, level: 'Moderate', color: 'bg-yellow-500', lat: 27.4, lng: 94.9 },
  { name: 'Silchar', state: 'Assam', district: 'Cachar', aqi: 122, level: 'Moderate', color: 'bg-yellow-500', lat: 24.8, lng: 92.7 },

  // Jharkhand
  { name: 'Ranchi', state: 'Jharkhand', district: 'Ranchi', aqi: 152, level: 'Moderate', color: 'bg-yellow-500', lat: 23.3, lng: 85.3 },
  { name: 'Jamshedpur', state: 'Jharkhand', district: 'East Singhbhum', aqi: 168, level: 'Moderate', color: 'bg-yellow-500', lat: 22.8, lng: 86.1 },
  { name: 'Dhanbad', state: 'Jharkhand', district: 'Dhanbad', aqi: 174, level: 'Moderate', color: 'bg-yellow-500', lat: 23.7, lng: 86.4 },

  // Chhattisgarh
  { name: 'Raipur', state: 'Chhattisgarh', district: 'Raipur', aqi: 146, level: 'Moderate', color: 'bg-yellow-500', lat: 21.2, lng: 81.6 },
  { name: 'Bhilai', state: 'Chhattisgarh', district: 'Durg', aqi: 158, level: 'Moderate', color: 'bg-yellow-500', lat: 21.2, lng: 81.3 },

  // Uttarakhand
  { name: 'Dehradun', state: 'Uttarakhand', district: 'Dehradun', aqi: 132, level: 'Moderate', color: 'bg-yellow-500', lat: 30.3, lng: 78.0 },
  { name: 'Haridwar', state: 'Uttarakhand', district: 'Haridwar', aqi: 148, level: 'Moderate', color: 'bg-yellow-500', lat: 29.9, lng: 78.1 },

  // Chandigarh
  { name: 'Chandigarh', state: 'Chandigarh', district: 'Chandigarh', aqi: 175, level: 'Moderate', color: 'bg-yellow-500', lat: 30.7, lng: 76.7 },

  // Goa
  { name: 'Panaji', state: 'Goa', district: 'North Goa', aqi: 45, level: 'Good', color: 'bg-green-500', lat: 15.4, lng: 73.8 },
  { name: 'Margao', state: 'Goa', district: 'South Goa', aqi: 48, level: 'Good', color: 'bg-green-500', lat: 15.2, lng: 73.9 },

  // Himachal Pradesh
  { name: 'Shimla', state: 'Himachal Pradesh', district: 'Shimla', aqi: 78, level: 'Satisfactory', color: 'bg-yellow-400', lat: 31.1, lng: 77.1 },
  { name: 'Dharamshala', state: 'Himachal Pradesh', district: 'Kangra', aqi: 68, level: 'Satisfactory', color: 'bg-yellow-400', lat: 32.2, lng: 76.3 },

  // Jammu & Kashmir
  { name: 'Srinagar', state: 'Jammu & Kashmir', district: 'Srinagar', aqi: 95, level: 'Moderate', color: 'bg-yellow-500', lat: 34.0, lng: 74.7 },
  { name: 'Jammu', state: 'Jammu & Kashmir', district: 'Jammu', aqi: 118, level: 'Moderate', color: 'bg-yellow-500', lat: 32.7, lng: 74.8 },

  // Andhra Pradesh
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', district: 'Visakhapatnam', aqi: 92, level: 'Moderate', color: 'bg-yellow-500', lat: 17.6, lng: 83.2 },
  { name: 'Vijayawada', state: 'Andhra Pradesh', district: 'Krishna', aqi: 104, level: 'Moderate', color: 'bg-yellow-500', lat: 16.5, lng: 80.6 },
  { name: 'Tirupati', state: 'Andhra Pradesh', district: 'Chittoor', aqi: 88, level: 'Moderate', color: 'bg-yellow-500', lat: 13.6, lng: 79.4 },
  { name: 'Guntur', state: 'Andhra Pradesh', district: 'Guntur', aqi: 98, level: 'Moderate', color: 'bg-yellow-500', lat: 16.3, lng: 80.4 },
  { name: 'Nellore', state: 'Andhra Pradesh', district: 'Nellore', aqi: 85, level: 'Moderate', color: 'bg-yellow-500', lat: 14.4, lng: 79.9 },
  { name: 'Kakinada', state: 'Andhra Pradesh', district: 'East Godavari', aqi: 91, level: 'Moderate', color: 'bg-yellow-500', lat: 16.9, lng: 82.2 },
  { name: 'Rajahmundry', state: 'Andhra Pradesh', district: 'East Godavari', aqi: 89, level: 'Moderate', color: 'bg-yellow-500', lat: 17.0, lng: 81.7 },

  // Tripura
  { name: 'Agartala', state: 'Tripura', district: 'West Tripura', aqi: 105, level: 'Moderate', color: 'bg-yellow-500', lat: 23.8, lng: 91.2 },

  // Meghalaya
  { name: 'Shillong', state: 'Meghalaya', district: 'East Khasi Hills', aqi: 42, level: 'Good', color: 'bg-green-500', lat: 25.5, lng: 91.8 },

  // Manipur
  { name: 'Imphal', state: 'Manipur', district: 'Imphal West', aqi: 78, level: 'Satisfactory', color: 'bg-yellow-400', lat: 24.8, lng: 93.9 },

  // Nagaland
  { name: 'Kohima', state: 'Nagaland', district: 'Kohima', aqi: 55, level: 'Satisfactory', color: 'bg-yellow-400', lat: 25.6, lng: 94.1 },
  { name: 'Dimapur', state: 'Nagaland', district: 'Dimapur', aqi: 68, level: 'Satisfactory', color: 'bg-yellow-400', lat: 25.9, lng: 93.7 },

  // Mizoram
  { name: 'Aizawl', state: 'Mizoram', district: 'Aizawl', aqi: 38, level: 'Good', color: 'bg-green-500', lat: 23.7, lng: 92.7 },

  // Arunachal Pradesh
  { name: 'Itanagar', state: 'Arunachal Pradesh', district: 'Papum Pare', aqi: 48, level: 'Good', color: 'bg-green-500', lat: 27.0, lng: 93.6 },

  // Sikkim
  { name: 'Gangtok', state: 'Sikkim', district: 'East Sikkim', aqi: 35, level: 'Good', color: 'bg-green-500', lat: 27.3, lng: 88.6 },

  // Puducherry
  { name: 'Puducherry', state: 'Puducherry', district: 'Puducherry', aqi: 72, level: 'Satisfactory', color: 'bg-yellow-400', lat: 11.9, lng: 79.8 },

  // Andaman & Nicobar
  { name: 'Port Blair', state: 'Andaman & Nicobar', district: 'South Andaman', aqi: 28, level: 'Good', color: 'bg-green-500', lat: 11.6, lng: 92.7 },

  // Dadra & Nagar Haveli
  { name: 'Silvassa', state: 'Dadra & Nagar Haveli', district: 'Dadra & Nagar Haveli', aqi: 95, level: 'Moderate', color: 'bg-yellow-500', lat: 20.2, lng: 73.0 },

  // Daman & Diu
  { name: 'Daman', state: 'Daman & Diu', district: 'Daman', aqi: 88, level: 'Moderate', color: 'bg-yellow-500', lat: 20.4, lng: 72.8 },

  // Lakshadweep
  { name: 'Kavaratti', state: 'Lakshadweep', district: 'Lakshadweep', aqi: 18, level: 'Good', color: 'bg-green-500', lat: 10.5, lng: 72.6 },

  // Additional major districts - UP
  { name: 'Bareilly', state: 'Uttar Pradesh', district: 'Bareilly', aqi: 195, level: 'Moderate', color: 'bg-yellow-500', lat: 28.3, lng: 79.4 },
  { name: 'Aligarh', state: 'Uttar Pradesh', district: 'Aligarh', aqi: 208, level: 'Poor', color: 'bg-orange-500', lat: 27.8, lng: 78.0 },
  { name: 'Moradabad', state: 'Uttar Pradesh', district: 'Moradabad', aqi: 202, level: 'Poor', color: 'bg-orange-500', lat: 28.8, lng: 78.7 },
  { name: 'Saharanpur', state: 'Uttar Pradesh', district: 'Saharanpur', aqi: 198, level: 'Moderate', color: 'bg-yellow-500', lat: 29.9, lng: 77.5 },
  { name: 'Gorakhpur', state: 'Uttar Pradesh', district: 'Gorakhpur', aqi: 185, level: 'Moderate', color: 'bg-yellow-500', lat: 26.7, lng: 83.3 },
  { name: 'Mathura', state: 'Uttar Pradesh', district: 'Mathura', aqi: 210, level: 'Poor', color: 'bg-orange-500', lat: 27.4, lng: 77.6 },
  { name: 'Firozabad', state: 'Uttar Pradesh', district: 'Firozabad', aqi: 215, level: 'Poor', color: 'bg-orange-500', lat: 27.1, lng: 78.3 },
  { name: 'Jhansi', state: 'Uttar Pradesh', district: 'Jhansi', aqi: 178, level: 'Moderate', color: 'bg-yellow-500', lat: 25.4, lng: 78.5 },
  
  // Additional cities - Maharashtra
  { name: 'Kolhapur', state: 'Maharashtra', district: 'Kolhapur', aqi: 112, level: 'Moderate', color: 'bg-yellow-500', lat: 16.7, lng: 74.2 },
  { name: 'Amravati', state: 'Maharashtra', district: 'Amravati', aqi: 128, level: 'Moderate', color: 'bg-yellow-500', lat: 20.9, lng: 77.7 },
  { name: 'Navi Mumbai', state: 'Maharashtra', district: 'Thane', aqi: 145, level: 'Moderate', color: 'bg-yellow-500', lat: 19.0, lng: 73.0 },
  { name: 'Solapur', state: 'Maharashtra', district: 'Solapur', aqi: 132, level: 'Moderate', color: 'bg-yellow-500', lat: 17.6, lng: 75.9 },
  { name: 'Akola', state: 'Maharashtra', district: 'Akola', aqi: 138, level: 'Moderate', color: 'bg-yellow-500', lat: 20.7, lng: 77.0 },
  { name: 'Ahmednagar', state: 'Maharashtra', district: 'Ahmednagar', aqi: 125, level: 'Moderate', color: 'bg-yellow-500', lat: 19.0, lng: 74.7 },

  // Additional cities - Tamil Nadu
  { name: 'Vellore', state: 'Tamil Nadu', district: 'Vellore', aqi: 88, level: 'Moderate', color: 'bg-yellow-500', lat: 12.9, lng: 79.1 },
  { name: 'Tirunelveli', state: 'Tamil Nadu', district: 'Tirunelveli', aqi: 76, level: 'Satisfactory', color: 'bg-yellow-400', lat: 8.7, lng: 77.6 },
  { name: 'Erode', state: 'Tamil Nadu', district: 'Erode', aqi: 85, level: 'Moderate', color: 'bg-yellow-500', lat: 11.3, lng: 77.7 },
  { name: 'Thanjavur', state: 'Tamil Nadu', district: 'Thanjavur', aqi: 78, level: 'Satisfactory', color: 'bg-yellow-400', lat: 10.7, lng: 79.1 },
  { name: 'Thoothukudi', state: 'Tamil Nadu', district: 'Thoothukudi', aqi: 71, level: 'Satisfactory', color: 'bg-yellow-400', lat: 8.7, lng: 78.1 },

  // Additional cities - Karnataka
  { name: 'Gulbarga', state: 'Karnataka', district: 'Gulbarga', aqi: 102, level: 'Moderate', color: 'bg-yellow-500', lat: 17.3, lng: 76.8 },
  { name: 'Shimoga', state: 'Karnataka', district: 'Shimoga', aqi: 65, level: 'Satisfactory', color: 'bg-yellow-400', lat: 13.9, lng: 75.5 },
  { name: 'Tumakuru', state: 'Karnataka', district: 'Tumakuru', aqi: 82, level: 'Moderate', color: 'bg-yellow-500', lat: 13.3, lng: 77.1 },
  { name: 'Bellary', state: 'Karnataka', district: 'Bellary', aqi: 96, level: 'Moderate', color: 'bg-yellow-500', lat: 15.1, lng: 76.9 },

  // Additional cities - Rajasthan
  { name: 'Bikaner', state: 'Rajasthan', district: 'Bikaner', aqi: 172, level: 'Moderate', color: 'bg-yellow-500', lat: 28.0, lng: 73.3 },
  { name: 'Alwar', state: 'Rajasthan', district: 'Alwar', aqi: 188, level: 'Moderate', color: 'bg-yellow-500', lat: 27.5, lng: 76.6 },
  { name: 'Bharatpur', state: 'Rajasthan', district: 'Bharatpur', aqi: 192, level: 'Moderate', color: 'bg-yellow-500', lat: 27.2, lng: 77.4 },
  { name: 'Sikar', state: 'Rajasthan', district: 'Sikar', aqi: 178, level: 'Moderate', color: 'bg-yellow-500', lat: 27.6, lng: 75.1 },

  // Additional cities - Gujarat
  { name: 'Jamnagar', state: 'Gujarat', district: 'Jamnagar', aqi: 122, level: 'Moderate', color: 'bg-yellow-500', lat: 22.4, lng: 70.0 },
  { name: 'Junagadh', state: 'Gujarat', district: 'Junagadh', aqi: 118, level: 'Moderate', color: 'bg-yellow-500', lat: 21.5, lng: 70.4 },
  { name: 'Gandhinagar', state: 'Gujarat', district: 'Gandhinagar', aqi: 158, level: 'Moderate', color: 'bg-yellow-500', lat: 23.2, lng: 72.6 },
  { name: 'Anand', state: 'Gujarat', district: 'Anand', aqi: 135, level: 'Moderate', color: 'bg-yellow-500', lat: 22.5, lng: 72.9 },

  // Additional cities - Madhya Pradesh
  { name: 'Ujjain', state: 'Madhya Pradesh', district: 'Ujjain', aqi: 155, level: 'Moderate', color: 'bg-yellow-500', lat: 23.1, lng: 75.7 },
  { name: 'Sagar', state: 'Madhya Pradesh', district: 'Sagar', aqi: 148, level: 'Moderate', color: 'bg-yellow-500', lat: 23.8, lng: 78.7 },
  { name: 'Ratlam', state: 'Madhya Pradesh', district: 'Ratlam', aqi: 162, level: 'Moderate', color: 'bg-yellow-500', lat: 23.3, lng: 75.0 },
  { name: 'Satna', state: 'Madhya Pradesh', district: 'Satna', aqi: 152, level: 'Moderate', color: 'bg-yellow-500', lat: 24.5, lng: 80.8 },

  // Additional cities - West Bengal
  { name: 'Asansol', state: 'West Bengal', district: 'Paschim Bardhaman', aqi: 185, level: 'Moderate', color: 'bg-yellow-500', lat: 23.6, lng: 86.9 },
  { name: 'Kharagpur', state: 'West Bengal', district: 'Paschim Medinipur', aqi: 165, level: 'Moderate', color: 'bg-yellow-500', lat: 22.3, lng: 87.3 },
  { name: 'Darjeeling', state: 'West Bengal', district: 'Darjeeling', aqi: 45, level: 'Good', color: 'bg-green-500', lat: 27.0, lng: 88.2 },
  { name: 'Jalpaiguri', state: 'West Bengal', district: 'Jalpaiguri', aqi: 125, level: 'Moderate', color: 'bg-yellow-500', lat: 26.5, lng: 88.7 },
];

export const getAQIColor = (aqi: number): string => {
  if (aqi <= 50) return 'bg-green-500';
  if (aqi <= 100) return 'bg-yellow-400';
  if (aqi <= 150) return 'bg-yellow-500';
  if (aqi <= 200) return 'bg-orange-500';
  if (aqi <= 300) return 'bg-red-500';
  return 'bg-purple-500';
};

export const getAQILevel = (aqi: number): string => {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 150) return 'Moderate';
  if (aqi <= 200) return 'Poor';
  if (aqi <= 300) return 'Very Poor';
  return 'Severe';
};

/* updated */
