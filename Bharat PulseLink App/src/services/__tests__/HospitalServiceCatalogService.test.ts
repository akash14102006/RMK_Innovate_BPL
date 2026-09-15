import { describe, it, expect } from 'vitest';
import HospitalServiceCatalogService from '../HospitalServiceCatalogService';

describe('Prompt 50 — HospitalServiceCatalogService & Taxonomy', () => {
  it('retrieves clinical services for Rajiv Gandhi Govt General Hospital', async () => {
    const services = await HospitalServiceCatalogService.getServicesForHospital('hosp_chennai_01');
    expect(services.length).toBeGreaterThan(0);
    expect(services[0].hospitalId).toBe('hosp_chennai_01');
  });

  it('filters services strictly by department (e.g. "Emergency Medicine")', async () => {
    const services = await HospitalServiceCatalogService.getServicesForHospital('hosp_chennai_01', 'Emergency Medicine');
    expect(services.length).toBeGreaterThan(0);
    services.forEach((s) => {
      expect(s.department.toLowerCase()).toBe('emergency medicine');
    });
  });

  it('searches services by query text (e.g. "Cardiology")', async () => {
    const results = await HospitalServiceCatalogService.searchServices('hosp_chennai_02', 'Cardiology');
    expect(results.length).toBeGreaterThan(0);
    results.forEach((s) => {
      const match =
        s.name.toLowerCase().includes('cardiology') ||
        s.department.toLowerCase().includes('cardiology') ||
        s.specialty.toLowerCase().includes('cardiology');
      expect(match).toBe(true);
    });
  });

  it('correctly differentiates between 24x7 emergency service vs scheduled OPD consultation hours', async () => {
    const services = await HospitalServiceCatalogService.getServicesForHospital('hosp_chennai_01');
    const emergencySvc = services.find((s) => s.category === 'EMERGENCY');
    const opdSvc = services.find((s) => s.category === 'CONSULTATION');

    expect(emergencySvc?.is24x7).toBe(true);
    expect(emergencySvc?.appointmentSupported).toBe(false);

    expect(opdSvc?.is24x7).toBe(false);
    expect(opdSvc?.appointmentSupported).toBe(true);
  });
});
