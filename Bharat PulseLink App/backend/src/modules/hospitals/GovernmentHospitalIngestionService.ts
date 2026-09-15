/**
 * Government Hospital Ingestion Service
 *
 * Implements the production-grade pipeline orchestrator for Government CSV data:
 * Receive -> Checksum -> Verify Schema -> Stream Raw -> Clean/Normalize ->
 * Coordinate Quality -> Validate -> Identity Mapping -> Canonical Upsert -> Quality Report
 *
 * Owned by: Hospital Ingestion Domain (Prompt 95)
 */

import { createHash } from 'node:crypto';
import { createReadStream, promises as fs } from 'node:fs';
import { Readable } from 'node:stream';
import { parse } from 'csv-parse';
import type { Knex } from 'knex';
import type { Logger } from '../../infrastructure/logger/logger.js';
import type { IngestionRepository } from '../../infrastructure/database/repositories/IngestionRepository.js';
import type { HospitalRepository } from '../../infrastructure/database/repositories/HospitalRepository.js';
import type { IngestionBatchRow } from '../../core/types/database.types.js';

export interface IngestionOptions {
  batchId?: string;
  sourceSystem?: string;
  sourceType?: string;
  chunkSize?: number;
  dryRun?: boolean;
  maxRows?: number;
}

export type CoordinateStatus = 'VALID' | 'MISSING' | 'OUT_OF_RANGE' | 'SUSPICIOUS';

export interface ParsedCoordinates {
  latitude: number | null;
  longitude: number | null;
  status: CoordinateStatus;
  raw: string | null;
}

export interface IngestionReport {
  batchId: string;
  sourceSystem: string;
  sourceFileHash: string;
  dryRun: boolean;
  durationMs: number;
  totalRows: number;
  acceptedRows: number;
  warningRows: number;
  rejectedRows: number;
  coordinateValidRows: number;
  coordinateMissingRows: number;
  coordinateInvalidRows: number;
  duplicateCandidateRows: number;
  canonicalCreated: number;
  canonicalUpdated: number;
  canonicalUnchanged: number;
  status: 'COMPLETED' | 'COMPLETED_WITH_WARNINGS' | 'FAILED' | 'PARTIAL';
  schemaErrors?: string[];
}

export interface NormalizedHospitalRecord {
  sourceRowNumber: number;
  sourceRecordId: string;
  officialName: string;
  displayName: string;
  category: string;
  careType: string;
  medicineSystem: string;
  addressLine1: string;
  locationRaw: string | null;
  state: string;
  district: string;
  subdistrict: string | null;
  pincode: string;
  telephone: string | null;
  mobile: string | null;
  emergencyPhone: string | null;
  ambulancePhone: string | null;
  bloodBankPhone: string | null;
  tollFreePhone: string | null;
  helplinePhone: string | null;
  fax: string | null;
  primaryEmail: string | null;
  secondaryEmail: string | null;
  website: string | null;
  specialtiesRaw: string | null;
  facilitiesRaw: string | null;
  accreditation: string | null;
  registrationNumber: string | null;
  establishedYear: number | null;
  totalBeds: number | null;
  totalDoctors: number | null;
  emergencyAvailable: boolean;
  coordinates: ParsedCoordinates;
  rawPayload: Record<string, unknown>;
  rowHash: string;
}

// 48 Canonical Government Source Columns Contract
export const EXPECTED_GOVERNMENT_CSV_COLUMNS: readonly string[] = [
  'Sr_No',
  'Location_Coordinates',
  'Location',
  'Hospital_Name',
  'Hospital_Category',
  'Hospital_Care_Type',
  'Discipline_Systems_of_Medicine',
  'Address_Original_First_Line',
  'State',
  'District',
  'Subdistrict',
  'Pincode',
  'Telephone',
  'Mobile_Number',
  'Emergency_Num',
  'Ambulance_Phone_No',
  'Bloodbank_Phone_No',
  'Foreign_pcare',
  'Tollfree',
  'Helpline',
  'Hospital_Fax',
  'Hospital_Primary_Email_Id',
  'Hospital_Secondary_Email_Id',
  'Website',
  'Specialties',
  'Facilities',
  'Accreditation',
  'Hospital_Regis_Number',
  'Registeration_Number_Scan',
  'Nodal_Person_Info',
  'Nodal_Person_Tele',
  'Nodal_Person_Email_Id',
  'Town',
  'Subtown',
  'Village',
  'Establised_Year',
  'Ayush',
  'Miscellaneous_Facilities',
  'Number_Doctor',
  'Num_Mediconsultant_or_Expert',
  'Total_Num_Beds',
  'Number_Private_Wards',
  'Num_Bed_for_Eco_Weaker_Sec',
  'Empanelment_or_Collaboration_with',
  'Emergency_Services',
  'Tariff_Range',
  'State_ID',
  'District_ID',
] as const;

export class GovernmentHospitalIngestionService {
  constructor(
    private readonly _knex: Knex,
    private readonly _ingestionRepo: IngestionRepository,
    private readonly _hospitalRepo: HospitalRepository,
    private readonly _logger: Logger,
  ) {}

  /**
   * Calculates cryptographic SHA-256 checksum for source file or buffer
   */
  async computeChecksum(source: string | Buffer): Promise<string> {
    if (typeof source === 'string') {
      const fileBuffer = await fs.readFile(source);
      return createHash('sha256').update(fileBuffer).digest('hex');
    }
    return createHash('sha256').update(source).digest('hex');
  }

  /**
   * Parses and classifies coordinate strings.
   * Order in source CSV is "latitude, longitude".
   * Validates bounds and Indian geographic bounding box (approx lat 6°–38° N, lon 68°–98° E).
   */
  parseCoordinates(coordinateStr: unknown): ParsedCoordinates {
    if (!coordinateStr || typeof coordinateStr !== 'string') {
      return { latitude: null, longitude: null, status: 'MISSING', raw: null };
    }

    const trimmed = coordinateStr.trim();
    if (!trimmed || trimmed === '0' || trimmed === 'NA' || trimmed === 'N/A' || trimmed === '-') {
      return { latitude: null, longitude: null, status: 'MISSING', raw: trimmed };
    }

    const parts = trimmed.split(',').map((p) => p.trim());
    if (parts.length !== 2) {
      return { latitude: null, longitude: null, status: 'MISSING', raw: trimmed };
    }

    const lat = Number.parseFloat(parts[0]);
    const lon = Number.parseFloat(parts[1]);

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return { latitude: null, longitude: null, status: 'MISSING', raw: trimmed };
    }

    // Absolute WGS84 range check
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return { latitude: lat, longitude: lon, status: 'OUT_OF_RANGE', raw: trimmed };
    }

    // Plausibility check for Indian subcontinent envelope (including islands)
    // Approx Lat: 6.0° to 37.5°, Lon: 68.0° to 98.0°
    if (lat < 6.0 || lat > 38.0 || lon < 68.0 || lon > 98.5) {
      return { latitude: lat, longitude: lon, status: 'SUSPICIOUS', raw: trimmed };
    }

    return { latitude: lat, longitude: lon, status: 'VALID', raw: trimmed };
  }

  /**
   * Field-specific placeholder cleanup.
   * Non-numeric fields with "0", "NA", "N/A", "-" are normalized to null.
   */
  private _cleanString(val: unknown): string | null {
    if (val === undefined || val === null) return null;
    const str = String(val).trim();
    if (!str || str === '0' || str === 'NA' || str === 'N/A' || str === '-' || str === '.') {
      return null;
    }
    return str;
  }

  /**
   * Clean and normalize pincode: must be string, handles leading zero.
   */
  private _cleanPincode(val: unknown): string {
    const raw = this._cleanString(val);
    if (!raw) return '000000';
    const digitsOnly = raw.replace(/\D/g, '');
    if (digitsOnly.length === 6) return digitsOnly;
    return raw.substring(0, 10);
  }

  /**
   * Normalize hospital name: removes excess whitespace while preserving official casing.
   */
  private _cleanHospitalName(val: unknown): string {
    const raw = String(val || '').trim();
    if (!raw || raw === '0') return 'Unknown Hospital';
    return raw.replace(/\s+/g, ' ');
  }

  /**
   * Parse numeric fields safely without converting errors to 0.
   */
  private _cleanInteger(val: unknown): number | null {
    if (val === undefined || val === null) return null;
    const str = String(val).trim();
    if (!str || str === 'NA' || str === 'N/A' || str === '-') return null;
    const num = Number.parseInt(str, 10);
    return Number.isNaN(num) ? null : num;
  }

  /**
   * Map emergency services flag.
   */
  private _mapEmergencyAvailable(val: unknown): boolean {
    if (!val) return false;
    const str = String(val).trim().toUpperCase();
    if (str === 'YES' || str === '1' || str === 'TRUE' || str === 'AVAILABLE' || str === '24X7') {
      return true;
    }
    return false;
  }

  /**
   * Normalizes a raw CSV record dictionary into a canonical staging structure.
   */
  normalizeRecord(raw: Record<string, string>, sourceRowNumber: number): NormalizedHospitalRecord {
    const rowHash = createHash('sha256').update(JSON.stringify(raw)).digest('hex');
    const srNo = this._cleanString(raw.Sr_No) ?? String(sourceRowNumber);
    const officialName = this._cleanHospitalName(raw.Hospital_Name);
    const coordinates = this.parseCoordinates(raw.Location_Coordinates);

    return {
      sourceRowNumber,
      sourceRecordId: srNo,
      officialName,
      displayName: officialName,
      category: this._cleanString(raw.Hospital_Category) ?? 'GENERAL',
      careType: this._cleanString(raw.Hospital_Care_Type) ?? 'HOSPITAL',
      medicineSystem: this._cleanString(raw.Discipline_Systems_of_Medicine) ?? 'ALLOPATHIC',
      addressLine1: this._cleanString(raw.Address_Original_First_Line) ?? this._cleanString(raw.Location) ?? 'Address Not Provided',
      locationRaw: this._cleanString(raw.Location),
      state: this._cleanString(raw.State) ?? 'Unknown State',
      district: this._cleanString(raw.District) ?? 'Unknown District',
      subdistrict: this._cleanString(raw.Subdistrict),
      pincode: this._cleanPincode(raw.Pincode),
      telephone: this._cleanString(raw.Telephone),
      mobile: this._cleanString(raw.Mobile_Number),
      emergencyPhone: this._cleanString(raw.Emergency_Num),
      ambulancePhone: this._cleanString(raw.Ambulance_Phone_No),
      bloodBankPhone: this._cleanString(raw.Bloodbank_Phone_No),
      tollFreePhone: this._cleanString(raw.Tollfree),
      helplinePhone: this._cleanString(raw.Helpline),
      fax: this._cleanString(raw.Hospital_Fax),
      primaryEmail: this._cleanString(raw.Hospital_Primary_Email_Id),
      secondaryEmail: this._cleanString(raw.Hospital_Secondary_Email_Id),
      website: this._cleanString(raw.Website),
      specialtiesRaw: this._cleanString(raw.Specialties),
      facilitiesRaw: this._cleanString(raw.Facilities),
      accreditation: this._cleanString(raw.Accreditation),
      registrationNumber: this._cleanString(raw.Hospital_Regis_Number),
      establishedYear: this._cleanInteger(raw.Establised_Year),
      totalBeds: this._cleanInteger(raw.Total_Num_Beds),
      totalDoctors: this._cleanInteger(raw.Number_Doctor),
      emergencyAvailable: this._mapEmergencyAvailable(raw.Emergency_Services),
      coordinates,
      rawPayload: raw,
      rowHash,
    };
  }

  /**
   * Main Ingestion Execution Orchestrator
   */
  async ingest(
    sourceInput: string | Buffer | Readable,
    options: IngestionOptions = {},
  ): Promise<IngestionReport> {
    const startTime = Date.now();
    const sourceSystem = options.sourceSystem ?? 'NIN_GOVT_REGISTRY';
    const sourceType = options.sourceType ?? 'CSV_UPLOAD';
    const chunkSize = options.chunkSize ?? 250;
    const dryRun = options.dryRun ?? false;
    const maxRows = options.maxRows ?? Number.POSITIVE_INFINITY;

    // Compute Checksum if string path or Buffer
    let fileHash = '';
    let readStream: Readable;

    if (typeof sourceInput === 'string') {
      fileHash = await this.computeChecksum(sourceInput);
      readStream = createReadStream(sourceInput, { encoding: 'utf8' });
    } else if (Buffer.isBuffer(sourceInput)) {
      fileHash = await this.computeChecksum(sourceInput);
      readStream = Readable.from(sourceInput.toString('utf8'));
    } else {
      fileHash = createHash('sha256').update(Date.now().toString()).digest('hex');
      readStream = sourceInput;
    }

    // Check Idempotency
    if (!dryRun) {
      const existingBatch = await this._ingestionRepo.findBatchByHash(fileHash);
      if (existingBatch) {
        this._logger.info('Duplicate source detected by SHA-256 hash — returning prior batch', {
          batchId: existingBatch.id,
          fileHash,
        });
      }
    }

    // Create Ingestion Batch
    const batch = await this._ingestionRepo.createBatch({
      source_system: sourceSystem,
      source_type: sourceType,
      file_hash: fileHash,
      status: 'PROCESSING',
    });

    const batchId = batch.id;
    this._logger.info('Starting Government Hospital Ingestion Batch', {
      batchId,
      sourceSystem,
      dryRun,
      fileHash,
    });

    let totalRows = 0;
    let acceptedRows = 0;
    let warningRows = 0;
    let rejectedRows = 0;
    let coordinateValidRows = 0;
    let coordinateMissingRows = 0;
    let coordinateInvalidRows = 0;
    let duplicateCandidateRows = 0;
    let canonicalCreated = 0;
    let canonicalUpdated = 0;
    let canonicalUnchanged = 0;

    const seenNames = new Set<string>();
    const schemaErrors: string[] = [];

    // Stream Setup
    const csvParser = readStream.pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
        trim: true,
      }),
    );

    let rawBuffer: any[] = [];
    let normalizedBuffer: NormalizedHospitalRecord[] = [];
    let validationBuffer: any[] = [];
    let firstRowChecked = false;

    try {
      for await (const row of csvParser) {
        if (totalRows >= maxRows) break;
        totalRows++;

        // Verify Schema on first row
        if (!firstRowChecked) {
          firstRowChecked = true;
          const headers = Object.keys(row);
          const missingRequired = ['Hospital_Name', 'State', 'District'].filter(
            (col) => !headers.includes(col),
          );

          if (missingRequired.length > 0) {
            const errorMsg = `Critical columns missing from source header: ${missingRequired.join(', ')}`;
            schemaErrors.push(errorMsg);
            throw new Error(errorMsg);
          }
        }

        const normalized = this.normalizeRecord(row, totalRows);

        // Validation & Quality checks
        let hasWarning = false;
        let isRejected = false;

        if (normalized.officialName === 'Unknown Hospital') {
          isRejected = true;
          validationBuffer.push({
            batch_id: batchId,
            field_name: 'Hospital_Name',
            issue_code: 'MISSING_HOSPITAL_NAME',
            severity: 'FATAL_ROW',
            message: `Row ${totalRows} missing valid Hospital_Name`,
          });
        }

        // Coordinate quality tracking
        if (normalized.coordinates.status === 'VALID') {
          coordinateValidRows++;
        } else if (normalized.coordinates.status === 'MISSING') {
          coordinateMissingRows++;
          hasWarning = true;
          validationBuffer.push({
            batch_id: batchId,
            field_name: 'Location_Coordinates',
            issue_code: 'COORDINATE_MISSING',
            severity: 'WARNING',
            message: `Row ${totalRows} (${normalized.officialName}) has missing coordinates`,
          });
        } else {
          coordinateInvalidRows++;
          hasWarning = true;
          validationBuffer.push({
            batch_id: batchId,
            field_name: 'Location_Coordinates',
            issue_code: 'INVALID_COORDINATES',
            severity: 'WARNING',
            message: `Row ${totalRows} coordinates out of range or suspicious: ${normalized.coordinates.raw}`,
          });
        }

        // Check for duplicate names (quality signal, not automatic rejection)
        if (seenNames.has(normalized.officialName)) {
          duplicateCandidateRows++;
        } else {
          seenNames.add(normalized.officialName);
        }

        if (isRejected) {
          rejectedRows++;
        } else {
          acceptedRows++;
          if (hasWarning) warningRows++;
        }

        rawBuffer.push({
          batch_id: batchId,
          source_row_number: totalRows,
          source_record_id: normalized.sourceRecordId,
          raw_payload: row,
          row_hash: normalized.rowHash,
        });

        normalizedBuffer.push(normalized);

        // Process Chunk
        if (normalizedBuffer.length >= chunkSize) {
          await this._flushChunk({
            batchId,
            dryRun,
            sourceSystem,
            rawBuffer,
            normalizedBuffer,
            validationBuffer,
            onCounts: (created, updated, unchanged) => {
              canonicalCreated += created;
              canonicalUpdated += updated;
              canonicalUnchanged += unchanged;
            },
          });
          rawBuffer = [];
          normalizedBuffer = [];
          validationBuffer = [];
        }
      }

      // Flush remainder
      if (normalizedBuffer.length > 0) {
        await this._flushChunk({
          batchId,
          dryRun,
          sourceSystem,
          rawBuffer,
          normalizedBuffer,
          validationBuffer,
          onCounts: (created, updated, unchanged) => {
            canonicalCreated += created;
            canonicalUpdated += updated;
            canonicalUnchanged += unchanged;
          },
        });
      }

      const status = rejectedRows > 0 ? 'PARTIALLY_ACCEPTED' : 'COMPLETED';

      // Update Batch Status
      if (!dryRun) {
        await this._ingestionRepo.updateBatch(batchId, {
          status,
          completed_at: new Date(),
          total_records: totalRows,
          accepted_records: acceptedRows,
          rejected_records: rejectedRows,
          warning_records: warningRows,
        });
      }

      const durationMs = Date.now() - startTime;
      const report: IngestionReport = {
        batchId,
        sourceSystem,
        sourceFileHash: fileHash,
        dryRun,
        durationMs,
        totalRows,
        acceptedRows,
        warningRows,
        rejectedRows,
        coordinateValidRows,
        coordinateMissingRows,
        coordinateInvalidRows,
        duplicateCandidateRows,
        canonicalCreated,
        canonicalUpdated,
        canonicalUnchanged,
        status: warningRows > 0 ? 'COMPLETED_WITH_WARNINGS' : 'COMPLETED',
      };

      this._logger.info('Government Hospital Ingestion Completed', report as any);
      return report;
    } catch (err: any) {
      this._logger.error('Government Hospital Ingestion Failed', {
        batchId,
        error: err.message,
        totalRows,
      });

      if (!dryRun) {
        await this._ingestionRepo.updateBatch(batchId, {
          status: 'FAILED',
          completed_at: new Date(),
          total_records: totalRows,
          rejected_records: totalRows,
        });
      }

      return {
        batchId,
        sourceSystem,
        sourceFileHash: fileHash,
        dryRun,
        durationMs: Date.now() - startTime,
        totalRows,
        acceptedRows,
        warningRows,
        rejectedRows: totalRows,
        coordinateValidRows,
        coordinateMissingRows,
        coordinateInvalidRows,
        duplicateCandidateRows,
        canonicalCreated: 0,
        canonicalUpdated: 0,
        canonicalUnchanged: 0,
        status: 'FAILED',
        schemaErrors: [err.message],
      };
    }
  }

  /**
   * Flushes a chunk of raw records, validation issues, and canonical facilities in a transaction.
   */
  private async _flushChunk(params: {
    batchId: string;
    dryRun: boolean;
    sourceSystem: string;
    rawBuffer: any[];
    normalizedBuffer: NormalizedHospitalRecord[];
    validationBuffer: any[];
    onCounts: (created: number, updated: number, unchanged: number) => void;
  }): Promise<void> {
    const { batchId, dryRun, sourceSystem, rawBuffer, normalizedBuffer, validationBuffer, onCounts } = params;

    // Staging and validation issues write
    if (!dryRun) {
      await this._ingestionRepo.insertRawRecordsChunk(rawBuffer);
      await this._ingestionRepo.insertValidationIssuesChunk(validationBuffer);
    }

    if (dryRun) {
      onCounts(normalizedBuffer.length, 0, 0);
      return;
    }

    let created = 0;
    let updated = 0;
    let unchanged = 0;

    await this._knex.transaction(async (trx) => {
      for (const rec of normalizedBuffer) {
        // Find existing mapping
        const existingMapping = await this._ingestionRepo.findIdentityMapping(
          sourceSystem,
          rec.sourceRecordId,
          trx,
        );

        let facilityId: string;

        const hasValidCoords = rec.coordinates.status === 'VALID' && rec.coordinates.latitude !== null && rec.coordinates.longitude !== null;
        const lat = hasValidCoords ? rec.coordinates.latitude! : 0;
        const lon = hasValidCoords ? rec.coordinates.longitude! : 0;

        if (existingMapping) {
          facilityId = existingMapping.facility_id;
          updated++;

          // Update canonical facility
          await trx('facilities')
            .where({ id: facilityId })
            .update({
              name: rec.officialName,
              display_name: rec.displayName,
              facility_type: rec.careType === 'Hospital' ? 'GENERAL_HOSPITAL' : 'CLINIC',
              address_line_1: rec.addressLine1,
              locality: rec.locationRaw,
              pincode: rec.pincode,
              latitude: lat,
              longitude: lon,
              emergency_available: rec.emergencyAvailable,
              updated_at: new Date(),
            });

          // PostGIS Point Update (ST_SetSRID with longitude first, latitude second)
          if (hasValidCoords) {
            await trx.raw(
              'UPDATE facilities SET location = ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography WHERE id = ?',
              [lon, lat, facilityId],
            );
          } else {
            await trx.raw('UPDATE facilities SET location = NULL WHERE id = ?', [facilityId]);
          }
        } else {
          created++;

          // Insert canonical facility
          const [inserted] = await trx('facilities')
            .insert({
              name: rec.officialName,
              display_name: rec.displayName,
              facility_type: rec.careType === 'Hospital' ? 'GENERAL_HOSPITAL' : 'CLINIC',
              ownership_type: 'GOVERNMENT',
              status: 'ACTIVE',
              publication_status: 'PUBLISHED',
              verification_status: 'VERIFIED',
              address_line_1: rec.addressLine1,
              locality: rec.locationRaw,
              pincode: rec.pincode,
              latitude: lat,
              longitude: lon,
              coordinate_source: hasValidCoords ? 'GOVT_REGISTRY' : 'NONE',
              emergency_available: rec.emergencyAvailable,
            })
            .returning('id');

          facilityId = inserted.id ?? inserted;

          // PostGIS Point Creation (ST_SetSRID with longitude first, latitude second)
          if (hasValidCoords) {
            await trx.raw(
              'UPDATE facilities SET location = ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography WHERE id = ?',
              [lon, lat, facilityId],
            );
          }

          // Register identity mapping
          await this._ingestionRepo.upsertIdentityMapping(
            {
              source_system: sourceSystem,
              source_record_id: rec.sourceRecordId,
              facility_id: facilityId,
              mapping_status: 'CANONICAL',
              confidence_score: 1.0,
            },
            trx,
          );
        }

        // Insert primary contact if telephone or mobile exists
        const contactPhone = rec.telephone ?? rec.mobile ?? rec.emergencyPhone;
        if (contactPhone) {
          await trx('facility_contacts')
            .insert({
              facility_id: facilityId,
              contact_type: rec.emergencyPhone ? 'EMERGENCY' : 'GENERAL',
              phone: contactPhone.substring(0, 30),
              email: rec.primaryEmail ? rec.primaryEmail.substring(0, 150) : null,
              is_primary: true,
            })
            .onConflict(['facility_id', 'contact_type'])
            .ignore();
        }
      }
    });

    onCounts(created, updated, unchanged);
  }
}
