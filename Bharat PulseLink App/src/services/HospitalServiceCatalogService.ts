/**
 * Bharat PulseLink — Hospital Service Catalog & Availability Service (Prompt 50)
 *
 * Provides normalized services directory for hospitals:
 * 1. Strict Department vs Specialty vs Service separation
 * 2. Operational statuses (AVAILABLE, APPOINTMENT_REQUIRED, TEMPORARILY_CLOSED)
 * 3. Service hours separate from hospital 24x7 flag
 * 4. Booking capability indicators.
 */

import { HospitalServiceItem } from '../types/hospitalServices';

export const NATIONAL_SERVICES_DIRECTORY: HospitalServiceItem[] = [
  // Rajiv Gandhi Govt General Hospital (hosp_chennai_01)
  {
    id: 'svc_rggh_01',
    hospitalId: 'hosp_chennai_01',
    name: '24x7 Emergency & Trauma Triage',
    department: 'Emergency Medicine',
    specialty: 'Trauma Care',
    category: 'EMERGENCY',
    description: 'Immediate critical trauma evaluation, acute resuscitation, and emergency admission.',
    operationalStatus: 'AVAILABLE',
    appointmentSupported: false,
    hoursText: 'Open 24x7',
    is24x7: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'svc_rggh_02',
    hospitalId: 'hosp_chennai_01',
    name: 'General Outpatient (OPD) Consultation',
    department: 'Outpatient Department',
    specialty: 'General Medicine',
    category: 'CONSULTATION',
    description: 'Daily primary and specialist physician outpatient consultations.',
    operationalStatus: 'AVAILABLE',
    appointmentSupported: true,
    hoursText: '8:00 AM – 2:00 PM',
    is24x7: false,
    nextAvailableText: 'Today at 09:30 AM',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'svc_rggh_03',
    hospitalId: 'hosp_chennai_01',
    name: 'Intensive Cardiac Care (ICCU)',
    department: 'Cardiovascular Surgery',
    specialty: 'Cardiology',
    category: 'PROCEDURE',
    description: 'Specialized round-the-clock cardiac monitoring and acute coronary management.',
    operationalStatus: 'LIMITED',
    appointmentSupported: false,
    hoursText: 'Open 24x7',
    is24x7: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'svc_rggh_04',
    hospitalId: 'hosp_chennai_01',
    name: '24x7 Essential Drug Pharmacy',
    department: 'Pharmacy Services',
    specialty: 'Pharmacy',
    category: 'PHARMACY',
    description: 'Government subsidized and emergency medication distribution counter.',
    operationalStatus: 'AVAILABLE',
    appointmentSupported: false,
    hoursText: 'Open 24x7',
    is24x7: true,
    updatedAt: new Date().toISOString(),
  },

  // Apollo Specialty Hospital (hosp_chennai_02)
  {
    id: 'svc_apollo_01',
    hospitalId: 'hosp_chennai_02',
    name: 'Interventional Cardiology Consultation',
    department: 'Cardiovascular Medicine',
    specialty: 'Cardiology',
    category: 'CONSULTATION',
    description: 'Consultation with senior cardiologists, ECG, and echocardiography review.',
    operationalStatus: 'AVAILABLE',
    appointmentSupported: true,
    hoursText: '9:00 AM – 6:00 PM',
    is24x7: false,
    nextAvailableText: 'Today at 02:30 PM',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'svc_apollo_02',
    hospitalId: 'hosp_chennai_02',
    name: 'Comprehensive Oncology Screening',
    department: 'Oncology Sciences',
    specialty: 'Oncology',
    category: 'DIAGNOSTIC',
    description: 'Advanced tumor markers, biopsy coordination, and PET/CT imaging consultations.',
    operationalStatus: 'APPOINTMENT_REQUIRED',
    appointmentSupported: true,
    hoursText: '8:30 AM – 4:30 PM',
    is24x7: false,
    nextAvailableText: 'Tomorrow at 09:30 AM',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'svc_apollo_03',
    hospitalId: 'hosp_chennai_02',
    name: '24x7 Emergency Care & Ambulance Desk',
    department: 'Emergency & Trauma',
    specialty: 'Emergency Medicine',
    category: 'EMERGENCY',
    description: 'Advanced life support ambulances and emergency triage.',
    operationalStatus: 'AVAILABLE',
    appointmentSupported: false,
    hoursText: 'Open 24x7',
    is24x7: true,
    updatedAt: new Date().toISOString(),
  },
];

export class HospitalServiceCatalogService {
  /**
   * Retrieve all services for a specific hospital, optionally filtered by department.
   */
  public static async getServicesForHospital(
    hospitalId: string,
    department?: string
  ): Promise<HospitalServiceItem[]> {
    let list = NATIONAL_SERVICES_DIRECTORY.filter((s) => s.hospitalId === hospitalId);

    if (department && department !== 'ALL') {
      list = list.filter((s) => s.department.toLowerCase() === department.toLowerCase());
    }

    // If hospital has no registered mock services in directory, provide general service fallback
    if (list.length === 0) {
      return [
        {
          id: `svc_gen_${hospitalId}_01`,
          hospitalId,
          name: 'General Outpatient & Consultation',
          department: 'Outpatient Department',
          specialty: 'General Medicine',
          category: 'CONSULTATION',
          description: 'Physician consultation and health evaluation.',
          operationalStatus: 'AVAILABLE',
          appointmentSupported: true,
          hoursText: '8:00 AM – 5:00 PM',
          is24x7: false,
          nextAvailableText: 'Today at 10:00 AM',
          updatedAt: new Date().toISOString(),
        },
        {
          id: `svc_gen_${hospitalId}_02`,
          hospitalId,
          name: '24x7 Emergency Care',
          department: 'Emergency Medicine',
          specialty: 'Emergency Care',
          category: 'EMERGENCY',
          description: 'Emergency evaluation and urgent care triage.',
          operationalStatus: 'AVAILABLE',
          appointmentSupported: false,
          hoursText: 'Open 24x7',
          is24x7: true,
          updatedAt: new Date().toISOString(),
        },
      ];
    }

    return list;
  }

  /**
   * Search hospital services by query text.
   */
  public static async searchServices(
    hospitalId: string,
    query: string
  ): Promise<HospitalServiceItem[]> {
    const clean = query.trim().toLowerCase();
    const services = await this.getServicesForHospital(hospitalId);
    if (!clean) return services;

    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(clean) ||
        s.department.toLowerCase().includes(clean) ||
        s.specialty.toLowerCase().includes(clean) ||
        s.description.toLowerCase().includes(clean)
    );
  }
}

export default HospitalServiceCatalogService;
