export type DataProvenance =
  | 'PATIENT_PROVIDED'
  | 'CLINICALLY_VERIFIED'
  | 'HOSPITAL_IMPORTED'
  | 'LAB_IMPORTED'
  | 'SYSTEM_DERIVED'
  | 'UNKNOWN';

export interface HealthSummaryItem<T> {
  value: T | null;
  provenance: DataProvenance;
  sourceLabel: string;
  lastUpdatedISO?: string;
}

export interface HealthSummaryData {
  bloodGroup: HealthSummaryItem<string>;
  heightCm: HealthSummaryItem<number>;
  weightKg: HealthSummaryItem<number>;
  bmi: HealthSummaryItem<number>;
  allergies: HealthSummaryItem<string[]>;
  chronicConditions: HealthSummaryItem<string[]>;
  lastCheckup: HealthSummaryItem<string>;
  isProfileComplete: boolean;
  lastSyncedISO: string;
  isOffline: boolean;
}

export interface BMICalculationResult {
  bmi: number | null;
  formattedText: string;
}
