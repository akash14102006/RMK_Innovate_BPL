/**
 * Appointment Repository
 *
 * Manages appointment booking with double-booking prevention, slot locks, and live check-in updates.
 *
 * Owned by: Appointments & Check-in Infrastructure Domain (Prompt 106, 109)
 */

import type { Knex } from 'knex';
import type {
  AppointmentRow,
  AppointmentSlotRow,
  LiveCheckInRow,
} from '../../../core/types/database.types.js';

export class AppointmentRepository {
  constructor(private readonly _knex: Knex) {}

  async findById(id: string, trx?: Knex.Transaction): Promise<AppointmentRow | null> {
    const q = (trx ?? this._knex)<AppointmentRow>('appointments').where({ id }).first();
    return (await q) ?? null;
  }

  async getPatientAppointments(patientId: string, trx?: Knex.Transaction): Promise<AppointmentRow[]> {
    return (trx ?? this._knex)<AppointmentRow>('appointments')
      .where({ patient_id: patientId })
      .orderBy('appointment_date', 'desc')
      .orderBy('start_time', 'desc');
  }

  /**
   * Atomic Appointment Booking:
   * 1. Checks and locks the slot (SELECT ... FOR UPDATE in transaction)
   * 2. Verifies booked_count < max_capacity
   * 3. Increments booked_count
   * 4. Creates appointment with idempotency_key safeguard
   */
  async bookAppointment(
    data: {
      patient_id: string;
      facility_id: string;
      department_id: string;
      slot_id: string;
      appointment_date: Date;
      start_time: string;
      token_number: string;
      idempotency_key?: string;
      facility_name_snapshot: string;
      service_name_snapshot?: string;
    },
    trx: Knex.Transaction,
  ): Promise<AppointmentRow> {
    // 1. Lock slot row for concurrency protection
    const slot = await trx<AppointmentSlotRow>('appointment_slots')
      .where({ id: data.slot_id })
      .forUpdate()
      .first();

    if (!slot || slot.status !== 'AVAILABLE' || slot.booked_count >= slot.max_capacity) {
      throw new Error('Appointment slot is no longer available');
    }

    // 2. Increment slot booking count
    const nextCount = slot.booked_count + 1;
    await trx('appointment_slots')
      .where({ id: data.slot_id })
      .update({
        booked_count: nextCount,
        status: nextCount >= slot.max_capacity ? 'BOOKED' : 'AVAILABLE',
        updated_at: new Date(),
      });

    // 3. Insert confirmed appointment
    const [appointment] = await trx<AppointmentRow>('appointments')
      .insert({
        patient_id: data.patient_id,
        facility_id: data.facility_id,
        department_id: data.department_id,
        slot_id: data.slot_id,
        appointment_date: data.appointment_date,
        start_time: data.start_time,
        status: 'CONFIRMED',
        token_number: data.token_number,
        idempotency_key: data.idempotency_key ?? null,
        facility_name_snapshot: data.facility_name_snapshot,
        service_name_snapshot: data.service_name_snapshot ?? null,
      })
      .returning('*');

    return appointment!;
  }

  // ── Live Check-In methods ────────────────────────────────────────────────

  async createCheckIn(
    data: {
      patient_id: string;
      facility_id: string;
      appointment_id?: string;
      exchange_session_id?: string;
      token_number: string;
      counter_number?: string;
      queue_position?: number;
      estimated_wait_minutes?: number;
    },
    trx?: Knex.Transaction,
  ): Promise<LiveCheckInRow> {
    const [checkIn] = await (trx ?? this._knex)<LiveCheckInRow>('live_check_ins')
      .insert({
        patient_id: data.patient_id,
        facility_id: data.facility_id,
        appointment_id: data.appointment_id ?? null,
        exchange_session_id: data.exchange_session_id ?? null,
        token_number: data.token_number,
        counter_number: data.counter_number ?? '1',
        queue_position: data.queue_position ?? 1,
        estimated_wait_minutes: data.estimated_wait_minutes ?? 15,
        status: 'QUEUED',
      })
      .returning('*');
    return checkIn!;
  }

  async getActiveCheckIn(patientId: string, trx?: Knex.Transaction): Promise<LiveCheckInRow | null> {
    const q = (trx ?? this._knex)<LiveCheckInRow>('live_check_ins')
      .where({ patient_id: patientId })
      .whereIn('status', ['QUEUED', 'CALLED', 'IN_CONSULTATION'])
      .orderBy('checked_in_at', 'desc')
      .first();
    return (await q) ?? null;
  }
}
