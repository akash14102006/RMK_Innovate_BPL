/**
 * Health Records Repository
 *
 * Implements persistent data access for patient visits, lab/diagnostic reports,
 * prescriptions, active medications, and uploaded health documents.
 *
 * Owned by: Health Records Infrastructure Domain (Prompts 63–73, 110–113)
 */

import type { Knex } from 'knex';
import type {
  VisitRow,
  ReportRow,
  DocumentRow,
  PrescriptionRow,
  PatientMedicationRow,
} from '../../../core/types/database.types.js';

export class HealthRecordsRepository {
  constructor(private readonly _knex: Knex) {}

  // ── Visits ───────────────────────────────────────────────────────────────

  async getPatientVisits(patientId: string, trx?: Knex.Transaction): Promise<VisitRow[]> {
    return (trx ?? this._knex)<VisitRow>('visits')
      .where({ patient_id: patientId })
      .orderBy('visit_date', 'desc');
  }

  async createVisit(
    data: Omit<VisitRow, 'id' | 'created_at' | 'updated_at'>,
    trx?: Knex.Transaction,
  ): Promise<VisitRow> {
    const [visit] = await (trx ?? this._knex)<VisitRow>('visits')
      .insert({
        ...data,
      })
      .returning('*');
    return visit!;
  }

  // ── Reports ──────────────────────────────────────────────────────────────

  async getPatientReports(
    patientId: string,
    reportType?: 'BLOOD_TEST' | 'IMAGING' | 'PATHOLOGY' | 'ECG' | 'GENERAL_REPORT',
    trx?: Knex.Transaction,
  ): Promise<ReportRow[]> {
    let q = (trx ?? this._knex)<ReportRow>('reports')
      .where({ patient_id: patientId })
      .orderBy('report_date', 'desc');

    if (reportType) {
      q = q.andWhere({ report_type: reportType });
    }

    return q;
  }

  async createReport(
    data: Omit<ReportRow, 'id' | 'created_at' | 'updated_at'>,
    trx?: Knex.Transaction,
  ): Promise<ReportRow> {
    const [report] = await (trx ?? this._knex)<ReportRow>('reports')
      .insert({
        ...data,
      })
      .returning('*');
    return report!;
  }

  // ── Documents ────────────────────────────────────────────────────────────

  async getPatientDocuments(patientId: string, trx?: Knex.Transaction): Promise<DocumentRow[]> {
    return (trx ?? this._knex)<DocumentRow>('documents')
      .where({ patient_id: patientId })
      .orderBy('created_at', 'desc');
  }

  async createDocument(
    data: Omit<DocumentRow, 'id' | 'created_at' | 'updated_at'>,
    trx?: Knex.Transaction,
  ): Promise<DocumentRow> {
    const [doc] = await (trx ?? this._knex)<DocumentRow>('documents')
      .insert({
        ...data,
      })
      .returning('*');
    return doc!;
  }

  // ── Prescriptions & Medications ──────────────────────────────────────────

  async getPatientPrescriptions(patientId: string, trx?: Knex.Transaction): Promise<PrescriptionRow[]> {
    return (trx ?? this._knex)<PrescriptionRow>('prescriptions')
      .where({ patient_id: patientId })
      .orderBy('issued_date', 'desc');
  }

  async getActiveMedications(patientId: string, trx?: Knex.Transaction): Promise<PatientMedicationRow[]> {
    return (trx ?? this._knex)<PatientMedicationRow>('patient_medications')
      .where({ patient_id: patientId, is_active: true })
      .orderBy('start_date', 'desc');
  }

  async addMedication(
    data: Omit<PatientMedicationRow, 'id' | 'created_at' | 'updated_at'>,
    trx?: Knex.Transaction,
  ): Promise<PatientMedicationRow> {
    const [med] = await (trx ?? this._knex)<PatientMedicationRow>('patient_medications')
      .insert({
        ...data,
      })
      .returning('*');
    return med!;
  }
}
