import {
  HealthSummaryData,
  HealthSummaryItem,
  DataProvenance,
} from '../types/healthSummary';
import ProfileDraftService from './ProfileDraftService';
import AppointmentService from './AppointmentService';
import SecureStoreService from './secureStore';

export class HealthSummaryService {
  private static getStorageKey(userId: string): string {
    return `bharat_health_summary_${userId}`;
  }

  public static calculateBMI(weightKg?: number, heightCm?: number): number | null {
    if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) {
      return null;
    }
    const heightM = heightCm / 100;
    const rawBmi = weightKg / (heightM * heightM);
    return Math.round(rawBmi * 10) / 10;
  }

  public static async getHealthSummary(userId: string = 'user_patient_primary'): Promise<HealthSummaryData> {
    try {
      const draft = await ProfileDraftService.loadDraft(userId);
      const { completed } = await AppointmentService.getAppointments(userId);

      const bloodGroupVal = draft?.identification?.bloodGroup || null;
      const heightVal = draft?.medicalBasics?.heightCm || null;
      const weightVal = draft?.medicalBasics?.weightKg || null;
      const bmiVal = this.calculateBMI(weightVal ?? undefined, heightVal ?? undefined);

      // Allergies extraction
      const allergiesList: string[] = [];
      if (draft?.allergies) {
        if (draft.allergies.hasDust) allergiesList.push('Dust');
        if (draft.allergies.hasPeanuts) allergiesList.push('Peanuts');
        if (draft.allergies.hasPollen) allergiesList.push('Pollen');
        if (draft.allergies.hasMedications) allergiesList.push('Medications');
        if (draft.allergies.hasSeafood) allergiesList.push('Seafood');
        if (draft.allergies.otherAllergyEnabled && draft.allergies.otherAllergyDetails) {
          allergiesList.push(draft.allergies.otherAllergyDetails);
        }
      }

      // Chronic conditions extraction
      const conditionsList: string[] = [];
      if (draft?.conditions) {
        if (draft.conditions.hasDiabetes) conditionsList.push('Diabetes');
        if (draft.conditions.hasHypertension) conditionsList.push('Hypertension');
        if (draft.conditions.hasAsthma) conditionsList.push('Asthma');
        if (draft.conditions.hasThyroid) conditionsList.push('Thyroid');
        if (draft.conditions.hasHeartDisease) conditionsList.push('Heart Disease');
        if (draft.conditions.otherConditionEnabled && draft.conditions.otherConditionDetails) {
          conditionsList.push(draft.conditions.otherConditionDetails);
        }
      }

      // Last Checkup extraction from completed clinical appointments
      let lastCheckupVal: string | null = null;
      if (completed.length > 0) {
        const latestCompleted = completed[0];
        lastCheckupVal = `${latestCompleted.displayDate} (${latestCompleted.hospitalName})`;
      }

      const isComplete = Boolean(draft?.isComplete);
      const provenance: DataProvenance = isComplete ? 'CLINICALLY_VERIFIED' : 'PATIENT_PROVIDED';
      const sourceLabel = isComplete ? 'Clinically Verified' : 'Provided by you';
      const lastUpdatedISO = draft?.updatedAtISO || new Date().toISOString();

      const healthSummary: HealthSummaryData = {
        bloodGroup: {
          value: bloodGroupVal,
          provenance: bloodGroupVal ? provenance : 'UNKNOWN',
          sourceLabel: bloodGroupVal ? sourceLabel : 'Not provided',
          lastUpdatedISO,
        },
        heightCm: {
          value: heightVal,
          provenance: heightVal ? provenance : 'UNKNOWN',
          sourceLabel: heightVal ? sourceLabel : 'Not provided',
          lastUpdatedISO,
        },
        weightKg: {
          value: weightVal,
          provenance: weightVal ? provenance : 'UNKNOWN',
          sourceLabel: weightVal ? sourceLabel : 'Not provided',
          lastUpdatedISO,
        },
        bmi: {
          value: bmiVal,
          provenance: bmiVal ? 'SYSTEM_DERIVED' : 'UNKNOWN',
          sourceLabel: bmiVal ? 'Calculated' : 'Awaiting height/weight',
          lastUpdatedISO,
        },
        allergies: {
          value: allergiesList,
          provenance: allergiesList.length > 0 ? provenance : 'UNKNOWN',
          sourceLabel: allergiesList.length > 0 ? sourceLabel : 'No allergies reported',
          lastUpdatedISO,
        },
        chronicConditions: {
          value: conditionsList,
          provenance: conditionsList.length > 0 ? provenance : 'UNKNOWN',
          sourceLabel: conditionsList.length > 0 ? sourceLabel : 'No chronic conditions reported',
          lastUpdatedISO,
        },
        lastCheckup: {
          value: lastCheckupVal,
          provenance: lastCheckupVal ? 'HOSPITAL_IMPORTED' : 'UNKNOWN',
          sourceLabel: lastCheckupVal ? 'Hospital Encounters' : 'No checkup recorded yet',
          lastUpdatedISO,
        },
        isProfileComplete: isComplete,
        lastSyncedISO: new Date().toISOString(),
        isOffline: false,
      };

      await this.saveCache(userId, healthSummary);
      return healthSummary;
    } catch (err) {
      console.warn('[HEALTH_SUMMARY_SERVICE] Fallback to cache triggered:', err);
      const cached = await this.getCache(userId);
      if (cached) {
        return { ...cached, isOffline: true };
      }

      return {
        bloodGroup: { value: null, provenance: 'UNKNOWN', sourceLabel: 'Not provided' },
        heightCm: { value: null, provenance: 'UNKNOWN', sourceLabel: 'Not provided' },
        weightKg: { value: null, provenance: 'UNKNOWN', sourceLabel: 'Not provided' },
        bmi: { value: null, provenance: 'UNKNOWN', sourceLabel: 'Not provided' },
        allergies: { value: [], provenance: 'UNKNOWN', sourceLabel: 'No allergies reported' },
        chronicConditions: { value: [], provenance: 'UNKNOWN', sourceLabel: 'No chronic conditions reported' },
        lastCheckup: { value: null, provenance: 'UNKNOWN', sourceLabel: 'No checkup recorded yet' },
        isProfileComplete: false,
        lastSyncedISO: new Date().toISOString(),
        isOffline: true,
      };
    }
  }

  private static async saveCache(userId: string, data: HealthSummaryData): Promise<void> {
    try {
      const key = this.getStorageKey(userId);
      await SecureStoreService.set(key, JSON.stringify(data));
    } catch {}
  }

  private static async getCache(userId: string): Promise<HealthSummaryData | null> {
    try {
      const key = this.getStorageKey(userId);
      const raw = await SecureStoreService.get(key);
      if (raw) {
        return JSON.parse(raw) as HealthSummaryData;
      }
    } catch {}
    return null;
  }
}

export default HealthSummaryService;
