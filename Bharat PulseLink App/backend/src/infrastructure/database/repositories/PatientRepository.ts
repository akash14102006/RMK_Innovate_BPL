/**
 * Patient Repository
 *
 * Manages patient profiles, health conditions, allergies, surgeries,
 * emergency contacts, and insurance data in PostgreSQL.
 *
 * Owned by: Patient Domain Infrastructure (Prompt 90, 101)
 */

import type { Knex } from 'knex';
import { uuidv7 } from 'uuidv7';
import type {
  PatientProfileRow,
  PatientConditionRow,
  PatientAllergyRow,
  PatientSurgeryRow,
  EmergencyContactRow,
  PatientInsuranceRow,
  PatientProfileStatus,
} from '../../../core/types/database.types.js';

export interface CreatePatientProfileData {
  id?: string;
  user_id: string;
  version?: number;
  status?: PatientProfileStatus;
  full_name: string;
  preferred_name?: string | null;
  gender: PatientProfileRow['gender'];
  date_of_birth: Date | string;
  blood_group?: PatientProfileRow['blood_group'];
  marital_status?: string | null;
  occupation?: string | null;
  primary_phone?: string | null;
  primary_email?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  locality?: string | null;
  city_id?: string | null;
  district_id?: string | null;
  state_id?: string | null;
  pincode?: string | null;
  abha_id?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  smoking_status?: PatientProfileRow['smoking_status'];
  alcohol_status?: PatientProfileRow['alcohol_status'];
  activity_level?: PatientProfileRow['activity_level'];
  sleep_pattern?: string | null;
  completed_at?: Date | null;
  last_synced_at?: Date | null;
}

export interface UpdatePatientProfileData extends Partial<Omit<PatientProfileRow, 'id' | 'user_id' | 'created_at'>> {
  expectedVersion?: number;
}

export class PatientRepository {
  constructor(private readonly _knex: Knex) {}

  async findById(id: string, trx?: Knex.Transaction): Promise<PatientProfileRow | null> {
    const q = (trx ?? this._knex)<PatientProfileRow>('patient_profiles').where({ id }).first();
    return (await q) ?? null;
  }

  async findByUserId(userId: string, trx?: Knex.Transaction): Promise<PatientProfileRow | null> {
    const q = (trx ?? this._knex)<PatientProfileRow>('patient_profiles').where({ user_id: userId }).first();
    return (await q) ?? null;
  }

  async findByAbhaId(abhaId: string, trx?: Knex.Transaction): Promise<PatientProfileRow | null> {
    const q = (trx ?? this._knex)<PatientProfileRow>('patient_profiles').where({ abha_id: abhaId }).first();
    return (await q) ?? null;
  }

  async createProfile(data: CreatePatientProfileData, trx?: Knex.Transaction): Promise<PatientProfileRow> {
    const payload: Partial<PatientProfileRow> = {
      id: data.id ?? uuidv7(),
      user_id: data.user_id,
      version: data.version ?? 1,
      status: data.status ?? 'INCOMPLETE',
      full_name: data.full_name,
      preferred_name: data.preferred_name ?? null,
      gender: data.gender,
      date_of_birth: typeof data.date_of_birth === 'string' ? new Date(data.date_of_birth) : data.date_of_birth,
      blood_group: data.blood_group ?? null,
      marital_status: data.marital_status ?? null,
      occupation: data.occupation ?? null,
      primary_phone: data.primary_phone ?? null,
      primary_email: data.primary_email ?? null,
      address_line_1: data.address_line_1 ?? null,
      address_line_2: data.address_line_2 ?? null,
      locality: data.locality ?? null,
      city_id: data.city_id ?? null,
      district_id: data.district_id ?? null,
      state_id: data.state_id ?? null,
      pincode: data.pincode ?? null,
      abha_id: data.abha_id ?? null,
      height_cm: data.height_cm ?? null,
      weight_kg: data.weight_kg ?? null,
      smoking_status: data.smoking_status ?? null,
      alcohol_status: data.alcohol_status ?? null,
      activity_level: data.activity_level ?? null,
      sleep_pattern: data.sleep_pattern ?? null,
      completed_at: data.completed_at ?? null,
      last_synced_at: data.last_synced_at ?? new Date(),
    };

    const [profile] = await (trx ?? this._knex)<PatientProfileRow>('patient_profiles')
      .insert(payload)
      .returning('*');
    return profile!;
  }

  async updateProfile(
    id: string,
    data: UpdatePatientProfileData,
    trx?: Knex.Transaction,
  ): Promise<PatientProfileRow | null> {
    const { expectedVersion, ...fieldsToUpdate } = data;
    const query = (trx ?? this._knex)<PatientProfileRow>('patient_profiles').where({ id });

    if (expectedVersion !== undefined) {
      query.andWhere({ version: expectedVersion });
    }

    const updatePayload: Record<string, unknown> = {
      ...fieldsToUpdate,
      version: (trx ?? this._knex).raw('version + 1'),
      updated_at: new Date(),
      last_synced_at: new Date(),
    };

    const [updated] = await query.update(updatePayload).returning('*');
    return updated ?? null;
  }

  async updateStatus(
    id: string,
    status: PatientProfileStatus,
    completedAt?: Date | null,
    trx?: Knex.Transaction,
  ): Promise<PatientProfileRow | null> {
    const updatePayload: Record<string, unknown> = {
      status,
      version: (trx ?? this._knex).raw('version + 1'),
      updated_at: new Date(),
      last_synced_at: new Date(),
    };
    if (completedAt !== undefined) {
      updatePayload['completed_at'] = completedAt;
    }

    const [updated] = await (trx ?? this._knex)<PatientProfileRow>('patient_profiles')
      .where({ id })
      .update(updatePayload)
      .returning('*');
    return updated ?? null;
  }

  async deleteProfile(id: string, trx?: Knex.Transaction): Promise<boolean> {
    const count = await (trx ?? this._knex)('patient_profiles').where({ id }).del();
    return count > 0;
  }

  // ── Health Conditions ─────────────────────────────────────────────────────

  async getConditions(patientId: string, trx?: Knex.Transaction): Promise<PatientConditionRow[]> {
    return (trx ?? this._knex)<PatientConditionRow>('patient_conditions')
      .where({ patient_id: patientId })
      .orderBy('created_at', 'asc');
  }

  async addCondition(
    data: Omit<PatientConditionRow, 'id' | 'created_at' | 'updated_at'> & { id?: string },
    trx?: Knex.Transaction,
  ): Promise<PatientConditionRow> {
    const [row] = await (trx ?? this._knex)<PatientConditionRow>('patient_conditions')
      .insert({
        id: data.id ?? uuidv7(),
        patient_id: data.patient_id,
        condition_name: data.condition_name,
        diagnosed_year: data.diagnosed_year ?? null,
        status: data.status ?? 'ACTIVE',
        source_type: data.source_type ?? 'PATIENT',
        notes: data.notes ?? null,
      })
      .returning('*');
    return row!;
  }

  async replaceConditions(
    patientId: string,
    conditions: Array<{ condition_name: string; diagnosed_year?: number | null; status?: 'ACTIVE' | 'MANAGED' | 'RESOLVED'; notes?: string | null }>,
    trx?: Knex.Transaction,
  ): Promise<PatientConditionRow[]> {
    const executor = trx ?? this._knex;
    await executor('patient_conditions').where({ patient_id: patientId }).del();
    if (conditions.length === 0) return [];

    const rows = conditions.map((c) => ({
      id: uuidv7(),
      patient_id: patientId,
      condition_name: c.condition_name,
      diagnosed_year: c.diagnosed_year ?? null,
      status: c.status ?? 'ACTIVE',
      source_type: 'PATIENT' as const,
      notes: c.notes ?? null,
    }));

    return executor<PatientConditionRow>('patient_conditions').insert(rows).returning('*');
  }

  // ── Allergies ─────────────────────────────────────────────────────────────

  async getAllergies(patientId: string, trx?: Knex.Transaction): Promise<PatientAllergyRow[]> {
    return (trx ?? this._knex)<PatientAllergyRow>('patient_allergies')
      .where({ patient_id: patientId })
      .orderBy('created_at', 'asc');
  }

  async addAllergy(
    data: Omit<PatientAllergyRow, 'id' | 'created_at' | 'updated_at'> & { id?: string },
    trx?: Knex.Transaction,
  ): Promise<PatientAllergyRow> {
    const [row] = await (trx ?? this._knex)<PatientAllergyRow>('patient_allergies')
      .insert({
        id: data.id ?? uuidv7(),
        patient_id: data.patient_id,
        substance: data.substance,
        reaction: data.reaction ?? null,
        severity: data.severity ?? 'UNKNOWN',
        status: data.status ?? 'ACTIVE',
        source_type: data.source_type ?? 'PATIENT',
      })
      .returning('*');
    return row!;
  }

  async replaceAllergies(
    patientId: string,
    allergies: Array<{ substance: string; reaction?: string | null; severity?: PatientAllergyRow['severity']; status?: PatientAllergyRow['status'] }>,
    trx?: Knex.Transaction,
  ): Promise<PatientAllergyRow[]> {
    const executor = trx ?? this._knex;
    await executor('patient_allergies').where({ patient_id: patientId }).del();
    if (allergies.length === 0) return [];

    const rows = allergies.map((a) => ({
      id: uuidv7(),
      patient_id: patientId,
      substance: a.substance,
      reaction: a.reaction ?? null,
      severity: a.severity ?? 'UNKNOWN',
      status: a.status ?? 'ACTIVE',
      source_type: 'PATIENT' as const,
    }));

    return executor<PatientAllergyRow>('patient_allergies').insert(rows).returning('*');
  }

  // ── Surgeries ─────────────────────────────────────────────────────────────

  async getSurgeries(patientId: string, trx?: Knex.Transaction): Promise<PatientSurgeryRow[]> {
    return (trx ?? this._knex)<PatientSurgeryRow>('patient_surgeries')
      .where({ patient_id: patientId })
      .orderBy('created_at', 'asc');
  }

  async addSurgery(
    data: Omit<PatientSurgeryRow, 'id' | 'created_at' | 'updated_at'> & { id?: string },
    trx?: Knex.Transaction,
  ): Promise<PatientSurgeryRow> {
    const [row] = await (trx ?? this._knex)<PatientSurgeryRow>('patient_surgeries')
      .insert({
        id: data.id ?? uuidv7(),
        patient_id: data.patient_id,
        procedure_name: data.procedure_name,
        approximate_year: data.approximate_year ?? null,
        hospital_name: data.hospital_name ?? null,
        notes: data.notes ?? null,
        source_type: data.source_type ?? 'PATIENT',
      })
      .returning('*');
    return row!;
  }

  async replaceSurgeries(
    patientId: string,
    surgeries: Array<{ procedure_name: string; approximate_year?: number | null; hospital_name?: string | null; notes?: string | null }>,
    trx?: Knex.Transaction,
  ): Promise<PatientSurgeryRow[]> {
    const executor = trx ?? this._knex;
    await executor('patient_surgeries').where({ patient_id: patientId }).del();
    if (surgeries.length === 0) return [];

    const rows = surgeries.map((s) => ({
      id: uuidv7(),
      patient_id: patientId,
      procedure_name: s.procedure_name,
      approximate_year: s.approximate_year ?? null,
      hospital_name: s.hospital_name ?? null,
      notes: s.notes ?? null,
      source_type: 'PATIENT' as const,
    }));

    return executor<PatientSurgeryRow>('patient_surgeries').insert(rows).returning('*');
  }

  // ── Emergency Contacts ───────────────────────────────────────────────────

  async getEmergencyContacts(patientId: string, trx?: Knex.Transaction): Promise<EmergencyContactRow[]> {
    return (trx ?? this._knex)<EmergencyContactRow>('emergency_contacts')
      .where({ patient_id: patientId })
      .orderBy('priority_order', 'asc');
  }

  async addEmergencyContact(
    data: Omit<EmergencyContactRow, 'id' | 'created_at' | 'updated_at'> & { id?: string },
    trx?: Knex.Transaction,
  ): Promise<EmergencyContactRow> {
    const [contact] = await (trx ?? this._knex)<EmergencyContactRow>('emergency_contacts')
      .insert({
        id: data.id ?? uuidv7(),
        patient_id: data.patient_id,
        name: data.name,
        relationship: data.relationship,
        phone_hash: data.phone_hash,
        is_primary: data.is_primary ?? false,
        priority_order: data.priority_order ?? 1,
      })
      .returning('*');
    return contact!;
  }

  async deleteEmergencyContact(id: string, patientId: string, trx?: Knex.Transaction): Promise<boolean> {
    const deleted = await (trx ?? this._knex)('emergency_contacts')
      .where({ id, patient_id: patientId })
      .del();
    return deleted > 0;
  }

  // ── Insurance ────────────────────────────────────────────────────────────

  async getInsuranceProfiles(patientId: string, trx?: Knex.Transaction): Promise<PatientInsuranceRow[]> {
    return (trx ?? this._knex)<PatientInsuranceRow>('patient_insurance')
      .where({ patient_id: patientId, status: 'ACTIVE' })
      .orderBy('created_at', 'desc');
  }

  async addInsuranceProfile(
    data: Omit<PatientInsuranceRow, 'id' | 'created_at' | 'updated_at'> & { id?: string },
    trx?: Knex.Transaction,
  ): Promise<PatientInsuranceRow> {
    const [insurance] = await (trx ?? this._knex)<PatientInsuranceRow>('patient_insurance')
      .insert({
        id: data.id ?? uuidv7(),
        patient_id: data.patient_id,
        provider_name: data.provider_name,
        policy_number_hash: data.policy_number_hash,
        policy_type: data.policy_type ?? 'COMPREHENSIVE',
        valid_from: data.valid_from ?? null,
        valid_to: data.valid_to ?? null,
        status: data.status ?? 'ACTIVE',
      })
      .returning('*');
    return insurance!;
  }
}
