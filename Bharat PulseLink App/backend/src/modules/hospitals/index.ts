export * from './GovernmentHospitalIngestionService.js';
export * from './hospital.routes.js';
export * from './hospital.schemas.js';

export interface HospitalFacility {
  id: string;
  name: string;
  category: 'GOVERNMENT' | 'PRIVATE' | 'SPECIALTY' | 'CLINIC';
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  contactNumber: string;
  emergencyAvailable: boolean;
  isActive: boolean;
}

