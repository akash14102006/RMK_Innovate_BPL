/**
 * Seed 002 — Controlled Test Patient
 *
 * Populates real test patient record in PostgreSQL for E2E integration verification:
 * - User & auth identity
 * - Patient profile
 * - Emergency contact
 * - Conditions & Allergies
 * - Consent records
 */

import type { Knex } from 'knex';
import { createHash } from 'crypto';

export async function seed(knex: Knex): Promise<void> {
  const userId = '018f0000-0000-7000-8000-000000000001';
  const profileId = '018f0000-0000-7000-8000-000000000002';
  const sessionId = '018f0000-0000-7000-8000-000000000003';

  // 1. Clean existing test patient records
  await knex('patient_allergies').where({ patient_id: profileId }).del();
  await knex('patient_conditions').where({ patient_id: profileId }).del();
  await knex('emergency_contacts').where({ patient_id: profileId }).del();
  await knex('consents').where({ patient_id: profileId }).del();
  await knex('qr_sessions').where({ patient_id: profileId }).del();
  await knex('sessions').where({ user_id: userId }).del();
  await knex('user_auth_identities').where({ user_id: userId }).del();
  await knex('patient_profiles').where({ id: profileId }).del();
  await knex('users').where({ id: userId }).del();

  // 2. Insert User
  await knex('users').insert({
    id: userId,
    status: 'ACTIVE',
    last_authenticated_at: new Date(),
  });

  // 3. Insert Auth Identity
  await knex('user_auth_identities').insert({
    user_id: userId,
    provider: 'DESCOPE',
    provider_subject: 'descope_akash_001',
    phone: '+919876543210',
    email: 'akash.sharma@bharatpulselink.in',
    phone_verified_at: new Date(),
    email_verified_at: new Date(),
  });

  // 4. Insert Session
  const futureExp = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  await knex('sessions').insert({
    id: sessionId,
    user_id: userId,
    session_token_hash: createHash('sha256').update('dev_token_hash_018f0000000070008000000000000003').digest('hex'),
    status: 'ACTIVE',
    expires_at: futureExp,
    absolute_expires_at: futureExp,
  });

  // 5. Insert Patient Profile
  await knex('patient_profiles').insert({
    id: profileId,
    user_id: userId,
    status: 'COMPLETE',
    full_name: 'Akash Sharma',
    date_of_birth: '1990-05-15',
    gender: 'MALE',
    blood_group: 'O+',
    primary_phone: '+919876543210',
    primary_email: 'akash.sharma@bharatpulselink.in',
    address_line_1: '42 Ring Road, South Extension',
    locality: 'South Extension',
    pincode: '110049',
    abha_id: '12-3456-7890-1234',
  });

  // 6. Insert Emergency Contact
  await knex('emergency_contacts').insert({
    patient_id: profileId,
    name: 'Priya Sharma',
    relationship: 'SPOUSE',
    phone_hash: createHash('sha256').update('+919876543211').digest('hex'),
    is_primary: true,
    priority_order: 1,
  });

  // 7. Insert Conditions
  await knex('patient_conditions').insert([
    {
      patient_id: profileId,
      condition_name: 'Type-2 Diabetes Mellitus',
      diagnosed_year: 2021,
      status: 'ACTIVE',
      source_type: 'PATIENT',
      notes: 'Controlled on diet and oral medications',
    },
    {
      patient_id: profileId,
      condition_name: 'Hypertension Stage 2',
      diagnosed_year: 2022,
      status: 'ACTIVE',
      source_type: 'PATIENT',
      notes: 'Monitored routinely',
    },
  ]);

  // 8. Insert Allergies
  await knex('patient_allergies').insert([
    {
      patient_id: profileId,
      substance: 'Penicillin',
      reaction: 'Anaphylaxis',
      severity: 'SEVERE',
      status: 'ACTIVE',
      source_type: 'PATIENT',
    },
  ]);

  // 9. Insert Active Consent
  const now = new Date();
  const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  await knex('consents').insert({
    patient_id: profileId,
    purpose: 'HOSPITAL_CHECKIN',
    recipient_type: 'HOSPITAL',
    recipient_id: 'hosp_smart_triage_01',
    scopes: JSON.stringify([
      'BASIC_PROFILE',
      'EMERGENCY_CONTACT',
      'ALLERGIES',
      'CONDITIONS',
    ]),
    status: 'GRANTED',
    valid_from: now,
    valid_to: future,
  });

  console.log('[SEED 002] Real controlled patient created in PostgreSQL successfully.');
}
