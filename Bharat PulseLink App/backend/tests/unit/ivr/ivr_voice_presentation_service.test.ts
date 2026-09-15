import { describe, it, expect } from 'vitest';
import { IVRVoicePresentationService } from '../../../src/modules/ivr/voice/IVRVoicePresentationService.js';
import { type IVRNearbyHospitalSummary } from '../../../src/modules/ivr/ivr.types.js';

describe('IVRVoicePresentationService — Voice UX Presentation & Sanitization', () => {
  const service = new IVRVoicePresentationService();

  const mockHospitals: IVRNearbyHospitalSummary[] = [
    {
      id: 'fac-001',
      name: 'Government General Hospital',
      displayName: 'Government General Hospital, George Town',
      facilityType: 'GOVERNMENT',
      distanceMeters: 1000,
      distanceKm: 1.0,
      city: 'Chennai',
      district: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600001',
    },
    {
      id: 'fac-002',
      name: 'Apollo Hospital',
      displayName: 'Apollo Hospital, Greams Road',
      facilityType: 'PRIVATE',
      distanceMeters: 3200,
      distanceKm: 3.2,
      city: 'Chennai',
      district: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600006',
    },
  ];

  it('sanitizes malicious shell characters and long names safely', () => {
    expect(IVRVoicePresentationService.sanitizeHospitalName('City Hospital; rm -rf /; `whoami`')).toBe('City Hospital rm -rf / whoami');
    expect(IVRVoicePresentationService.sanitizeHospitalName('')).toBe('Hospital Facility');
    expect(IVRVoicePresentationService.sanitizeHospitalName(null)).toBe('Hospital Facility');
  });

  it('builds localized English presentation options', () => {
    const res = service.buildPresentation(mockHospitals, 'en');
    expect(res.totalFound).toBe(2);
    expect(res.headerText).toBe('We found 2 nearby hospitals.');
    expect(res.options[0].index).toBe(1);
    expect(res.options[0].hospitalId).toBe('fac-001');
    expect(res.options[0].spokenDistance).toBe('approximately 1 kilometer');
    expect(res.options[0].promptText).toContain('Press 1 for');
  });

  it('builds localized Tamil presentation options', () => {
    const res = service.buildPresentation(mockHospitals, 'ta');
    expect(res.totalFound).toBe(2);
    expect(res.headerText).toBe('2 மருத்துவமனைகள் கண்டறியப்பட்டன.');
    expect(res.options[0].promptText).toContain('1ஐ அழுத்தவும்');
  });

  it('bounds maximum presented options to configured limit', () => {
    const manyHospitals = Array.from({ length: 10 }, (_, i) => ({
      ...mockHospitals[0],
      id: `fac-00${i}`,
      name: `Hospital ${i + 1}`,
    }));
    const res = service.buildPresentation(manyHospitals, 'en', 3);
    expect(res.totalFound).toBe(3);
    expect(res.options.length).toBe(3);
  });
});
