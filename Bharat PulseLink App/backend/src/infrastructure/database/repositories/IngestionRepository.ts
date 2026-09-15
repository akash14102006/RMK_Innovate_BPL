/**
 * Ingestion Repository
 *
 * Implements persistent operations for:
 * - ingestion_batches (lifecycle, status, row counters, idempotency hashes)
 * - ingestion_raw_records (immutable raw payload staging)
 * - data_validation_issues (structured data quality logging)
 * - facility_identity_mappings (source-to-canonical facility lineage)
 *
 * Owned by: Ingestion & Quality Infrastructure Domain (Prompt 95, 101)
 */

import type { Knex } from 'knex';
import type {
  IngestionBatchRow,
  IngestionRawRecordRow,
  DataValidationIssueRow,
  FacilityIdentityMappingRow,
} from '../../../core/types/database.types.js';

export interface CreateBatchParams {
  id?: string;
  source_system: string;
  source_type: string;
  file_hash?: string | null;
  status?: IngestionBatchRow['status'];
  total_records?: number;
}

export interface UpdateBatchProgressParams {
  status?: IngestionBatchRow['status'];
  completed_at?: Date | null;
  total_records?: number;
  accepted_records?: number;
  rejected_records?: number;
  warning_records?: number;
}

export interface RawRecordInsertParams {
  id?: string;
  batch_id: string;
  source_row_number: number;
  source_record_id: string | null;
  raw_payload: Record<string, unknown>;
  row_hash: string;
}

export interface ValidationIssueInsertParams {
  id?: string;
  batch_id: string;
  raw_record_id?: string | null;
  field_name?: string | null;
  issue_code: string;
  severity: 'WARNING' | 'FATAL_ROW' | 'FATAL_BATCH';
  message: string;
}

export class IngestionRepository {
  constructor(private readonly _knex: Knex) {}

  async createBatch(params: CreateBatchParams, trx?: Knex.Transaction): Promise<IngestionBatchRow> {
    const db = trx ?? this._knex;
    const [row] = await db<IngestionBatchRow>('ingestion_batches')
      .insert({
        source_system: params.source_system,
        source_type: params.source_type,
        file_hash: params.file_hash ?? null,
        status: params.status ?? 'PROCESSING',
        total_records: params.total_records ?? 0,
        accepted_records: 0,
        rejected_records: 0,
        warning_records: 0,
        started_at: new Date(),
      })
      .returning('*');

    return row;
  }

  async getBatchById(id: string, trx?: Knex.Transaction): Promise<IngestionBatchRow | null> {
    const db = trx ?? this._knex;
    const row = await db<IngestionBatchRow>('ingestion_batches').where({ id }).first();
    return row ?? null;
  }

  async findBatchByHash(fileHash: string, trx?: Knex.Transaction): Promise<IngestionBatchRow | null> {
    const db = trx ?? this._knex;
    const row = await db<IngestionBatchRow>('ingestion_batches')
      .where({ file_hash: fileHash, status: 'COMPLETED' })
      .orderBy('completed_at', 'desc')
      .first();
    return row ?? null;
  }

  async updateBatch(
    id: string,
    params: UpdateBatchProgressParams,
    trx?: Knex.Transaction,
  ): Promise<IngestionBatchRow> {
    const db = trx ?? this._knex;
    const [row] = await db<IngestionBatchRow>('ingestion_batches')
      .where({ id })
      .update({
        ...params,
      })
      .returning('*');

    return row;
  }

  async insertRawRecordsChunk(
    records: RawRecordInsertParams[],
    trx?: Knex.Transaction,
  ): Promise<void> {
    if (records.length === 0) return;
    const db = trx ?? this._knex;
    await db('ingestion_raw_records').insert(
      records.map((r) => ({
        batch_id: r.batch_id,
        source_row_number: r.source_row_number,
        source_record_id: r.source_record_id,
        raw_payload: JSON.stringify(r.raw_payload),
        row_hash: r.row_hash,
      })),
    );
  }

  async insertValidationIssuesChunk(
    issues: ValidationIssueInsertParams[],
    trx?: Knex.Transaction,
  ): Promise<void> {
    if (issues.length === 0) return;
    const db = trx ?? this._knex;
    await db('data_validation_issues').insert(
      issues.map((i) => ({
        batch_id: i.batch_id,
        raw_record_id: i.raw_record_id ?? null,
        field_name: i.field_name ?? null,
        issue_code: i.issue_code,
        severity: i.severity,
        message: i.message,
      })),
    );
  }

  async findIdentityMapping(
    sourceSystem: string,
    sourceRecordId: string,
    trx?: Knex.Transaction,
  ): Promise<FacilityIdentityMappingRow | null> {
    const db = trx ?? this._knex;
    const row = await db<FacilityIdentityMappingRow>('facility_identity_mappings')
      .where({
        source_system: sourceSystem,
        source_record_id: sourceRecordId,
      })
      .first();
    return row ?? null;
  }

  async upsertIdentityMapping(
    mapping: {
      source_system: string;
      source_record_id: string;
      facility_id: string;
      mapping_status?: 'CANONICAL' | 'MERGED' | 'DISPUTED';
      confidence_score?: number;
    },
    trx?: Knex.Transaction,
  ): Promise<void> {
    const db = trx ?? this._knex;
    await db('facility_identity_mappings')
      .insert({
        source_system: mapping.source_system,
        source_record_id: mapping.source_record_id,
        facility_id: mapping.facility_id,
        mapping_status: mapping.mapping_status ?? 'CANONICAL',
        confidence_score: mapping.confidence_score ?? 1.0,
      })
      .onConflict(['source_system', 'source_record_id'])
      .merge({
        facility_id: mapping.facility_id,
        mapping_status: mapping.mapping_status ?? 'CANONICAL',
        confidence_score: mapping.confidence_score ?? 1.0,
        mapped_at: new Date(),
      });
  }

  async listBatches(
    limit: number = 20,
    offset: number = 0,
    trx?: Knex.Transaction,
  ): Promise<IngestionBatchRow[]> {
    const db = trx ?? this._knex;
    return db<IngestionBatchRow>('ingestion_batches')
      .orderBy('started_at', 'desc')
      .limit(limit)
      .offset(offset);
  }

  async getValidationIssuesByBatch(
    batchId: string,
    limit: number = 100,
    offset: number = 0,
    trx?: Knex.Transaction,
  ): Promise<DataValidationIssueRow[]> {
    const db = trx ?? this._knex;
    return db<DataValidationIssueRow>('data_validation_issues')
      .where({ batch_id: batchId })
      .orderBy('created_at', 'asc')
      .limit(limit)
      .offset(offset);
  }
}
