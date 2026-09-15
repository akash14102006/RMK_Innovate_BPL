/**
 * Seed 001 — Initial Reference Data (Geography, Services, Departments, Medications, Initial Facilities)
 *
 * Populates:
 * - geo_countries, geo_states, geo_districts, geo_cities
 * - services catalog
 * - departments catalog
 * - medications_catalog
 * - sample reference government & private hospital facilities
 */

import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // ── 1. Geography ──────────────────────────────────────────────────────────
  await knex('geo_cities').del();
  await knex('geo_districts').del();
  await knex('geo_states').del();
  await knex('geo_countries').del();

  const [india] = await knex('geo_countries')
    .insert({
      iso_code: 'IN',
      name: 'India',
      dial_code: '+91',
    })
    .returning(['id', 'iso_code']);

  const countryId = india?.id;

  const [delhiState, maharashtraState, karnatakaState, tamilNaduState] = await knex('geo_states')
    .insert([
      { country_id: countryId, code: 'DL', name: 'Delhi' },
      { country_id: countryId, code: 'MH', name: 'Maharashtra' },
      { country_id: countryId, code: 'KA', name: 'Karnataka' },
      { country_id: countryId, code: 'TN', name: 'Tamil Nadu' },
    ])
    .returning(['id', 'code', 'name']);

  const [newDelhiDistrict, mumbaiDistrict, bangaloreUrbanDistrict, chennaiDistrict] = await knex('geo_districts')
    .insert([
      { state_id: delhiState?.id, name: 'New Delhi' },
      { state_id: maharashtraState?.id, name: 'Mumbai City' },
      { state_id: karnatakaState?.id, name: 'Bengaluru Urban' },
      { state_id: tamilNaduState?.id, name: 'Chennai' },
    ])
    .returning(['id', 'name']);

  await knex('geo_cities').insert([
    { district_id: newDelhiDistrict?.id, name: 'Connaught Place', pincode_prefix: '110001' },
    { district_id: newDelhiDistrict?.id, name: 'Ansari Nagar', pincode_prefix: '110029' },
    { district_id: mumbaiDistrict?.id, name: 'Colaba', pincode_prefix: '400005' },
    { district_id: bangaloreUrbanDistrict?.id, name: 'Koramangala', pincode_prefix: '560034' },
    { district_id: chennaiDistrict?.id, name: 'Greams Road', pincode_prefix: '600006' },
  ]);

  // ── 0. Clean Child Facility Tables ───────────────────────────────────────
  await knex('facility_services').del();
  await knex('facility_departments').del();
  await knex('facility_contacts').del();
  await knex('facility_operating_hours').del();
  await knex('facilities').del();
  await knex('hospital_organizations').del();

  // ── 2. Services Catalog ───────────────────────────────────────────────────
  await knex('services').del();
  const services = await knex('services')
    .insert([
      { code: 'OPD', name: 'Outpatient Department', category: 'OUTPATIENT', description: 'General consultation and outpatient clinic' },
      { code: 'EMERGENCY_24X7', name: '24x7 Emergency Care', category: 'EMERGENCY', description: 'Round-the-clock emergency and trauma resuscitation' },
      { code: 'ICU', name: 'Intensive Care Unit', category: 'INPATIENT', description: 'Critical care and multi-parameter monitoring' },
      { code: 'NICU', name: 'Neonatal Intensive Care', category: 'INPATIENT', description: 'Advanced infant intensive care' },
      { code: 'DIALYSIS', name: 'Hemodialysis', category: 'DIAGNOSTIC', description: 'Kidney hemodialysis units' },
      { code: 'BLOOD_BANK', name: '24x7 Blood Bank', category: 'EMERGENCY', description: 'Component separation and cross-matching blood bank' },
      { code: 'MRI_SCAN', name: 'MRI (1.5T / 3.0T)', category: 'DIAGNOSTIC', description: 'High-resolution magnetic resonance imaging' },
      { code: 'CT_SCAN', name: 'Multi-slice CT Scan', category: 'DIAGNOSTIC', description: '128-slice computed tomography scanning' },
      { code: 'PATHOLOGY_LAB', name: 'NABL Accredited Pathology', category: 'DIAGNOSTIC', description: 'Automated blood, biochemistry, and microbiology lab' },
    ])
    .returning(['id', 'code']);

  // ── 3. Departments Catalog ────────────────────────────────────────────────
  await knex('departments').del();
  const departments = await knex('departments')
    .insert([
      { code: 'CARDIOLOGY', name: 'Cardiology & Cardiac Surgery', description: 'Heart and vascular diseases' },
      { code: 'NEUROLOGY', name: 'Neurology & Neurosurgery', description: 'Brain, spine, and nervous system disorders' },
      { code: 'ORTHOPEDICS', name: 'Orthopedics & Joint Replacement', description: 'Bones, joints, and musculoskeletal trauma' },
      { code: 'GENERAL_MEDICINE', name: 'General & Internal Medicine', description: 'Comprehensive adult health and infectious diseases' },
      { code: 'PEDIATRICS', name: 'Pediatrics & Neonatology', description: 'Child healthcare and infant development' },
      { code: 'EMERGENCY_TRAUMA', name: 'Emergency & Trauma Medicine', description: 'Acute trauma and emergency resuscitation' },
      { code: 'ONCOLOGY', name: 'Medical & Surgical Oncology', description: 'Cancer care and chemotherapy' },
      { code: 'GYNECOLOGY', name: 'Obstetrics & Gynecology', description: 'Women health and maternity care' },
    ])
    .returning(['id', 'code']);

  // ── 4. Medications Catalog ────────────────────────────────────────────────
  await knex('medications_catalog').del();
  await knex('medications_catalog').insert([
    { name: 'Dolo 650', generic_name: 'Paracetamol', brand_name: 'Dolo', dosage_form: 'TABLET', strength: '650mg' },
    { name: 'Augmentin 625 Duo', generic_name: 'Amoxicillin + Clavulanate Potassium', brand_name: 'Augmentin', dosage_form: 'TABLET', strength: '625mg' },
    { name: 'Glycomet 500', generic_name: 'Metformin Hydrochloride', brand_name: 'Glycomet', dosage_form: 'TABLET', strength: '500mg' },
    { name: 'Atorva 10', generic_name: 'Atorvastatin', brand_name: 'Atorva', dosage_form: 'TABLET', strength: '10mg' },
    { name: 'Pantocid 40', generic_name: 'Pantoprazole', brand_name: 'Pantocid', dosage_form: 'TABLET', strength: '40mg' },
    { name: 'Azithral 500', generic_name: 'Azithromycin', brand_name: 'Azithral', dosage_form: 'TABLET', strength: '500mg' },
    { name: 'Amlong 5', generic_name: 'Amlodipine Besylate', brand_name: 'Amlong', dosage_form: 'TABLET', strength: '5mg' },
    { name: 'Telma 40', generic_name: 'Telmisartan', brand_name: 'Telma', dosage_form: 'TABLET', strength: '40mg' },
  ]);

  // ── 5. Reference Hospitals ────────────────────────────────────────────────
  await knex('facilities').del();
  await knex('hospital_organizations').del();

  const [aiimsOrg] = await knex('hospital_organizations')
    .insert({
      name: 'All India Institute of Medical Sciences (AIIMS)',
      code: 'AIIMS_CENTRAL',
      status: 'ACTIVE',
    })
    .returning(['id']);

  const [aiimsDelhi] = await knex('facilities')
    .insert({
      organization_id: aiimsOrg?.id,
      name: 'AIIMS New Delhi',
      display_name: 'All India Institute of Medical Sciences (AIIMS), New Delhi',
      facility_type: 'GOVERNMENT',
      ownership_type: 'CENTRAL_GOVT',
      status: 'ACTIVE',
      publication_status: 'PUBLISHED',
      verification_status: 'VERIFIED',
      address_line_1: 'Sri Aurobindo Marg, Ansari Nagar',
      address_line_2: 'Ansari Nagar East',
      locality: 'Ansari Nagar',
      landmark: 'Near Safdarjung Hospital',
      state_id: delhiState?.id,
      district_id: newDelhiDistrict?.id,
      pincode: '110029',
      latitude: 28.5672,
      longitude: 77.2100,
      coordinate_source: 'GOVT_REGISTRY',
      emergency_available: true,
    })
    .returning(['id']);

  // Update PostGIS location for AIIMS
  await knex.raw(
    `UPDATE facilities SET location = ST_SetSRID(ST_MakePoint(77.2100, 28.5672), 4326)::geography WHERE id = ?`,
    [aiimsDelhi?.id],
  );

  // AIIMS Contacts
  await knex('facility_contacts').insert([
    {
      facility_id: aiimsDelhi?.id,
      contact_type: 'EMERGENCY',
      phone: '+91 11 2658 8700',
      email: 'emergency@aiims.edu',
      is_toll_free: false,
      is_primary: true,
      operating_hours_note: '24x7 Emergency Control Room',
    },
    {
      facility_id: aiimsDelhi?.id,
      contact_type: 'AMBULANCE',
      phone: '102',
      is_toll_free: true,
      is_primary: false,
      operating_hours_note: '24x7 Govt Ambulance Service',
    },
  ]);

  // AIIMS Operating Hours (24x7)
  for (let day = 0; day <= 6; day++) {
    await knex('facility_operating_hours').insert({
      facility_id: aiimsDelhi?.id,
      day_of_week: day,
      is_24x7: true,
      is_closed: false,
    });
  }

  // Link Services to AIIMS
  for (const s of services) {
    await knex('facility_services').insert({
      facility_id: aiimsDelhi?.id,
      service_id: s.id,
      status: 'AVAILABLE',
      price_inr: 0, // Free / subsidized
    });
  }

  // Link Departments to AIIMS
  for (const d of departments) {
    await knex('facility_departments').insert({
      facility_id: aiimsDelhi?.id,
      department_id: d.id,
      floor_location: 'Main Hospital Block',
      status: 'ACTIVE',
    });
  }
}
