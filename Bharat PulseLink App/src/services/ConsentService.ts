import * as SecureStore from './secureStore';

export interface ConsentRecord {
  termsVersion: string;
  privacyVersion: string;
  healthcareDataConsent: boolean;
  analyticsConsent: boolean;
  acceptedAt: string;
}

export const CURRENT_TERMS_VERSION = '1.0';
export const CURRENT_PRIVACY_VERSION = '1.0';

const CONSENT_STORE_KEY = 'bharat_pulselink_consent_v1';

function withTimeout<T>(promise: Promise<T>, ms: number, fallbackValue: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallbackValue), ms)),
  ]);
}

export class ConsentService {
  private static cachedRecord: ConsentRecord | null = null;

  static async getConsentRecord(): Promise<ConsentRecord | null> {
    if (this.cachedRecord) return this.cachedRecord;

    try {
      const raw = await withTimeout(SecureStore.get(CONSENT_STORE_KEY), 2000, null);
      if (raw) {
        this.cachedRecord = JSON.parse(raw) as ConsentRecord;
        return this.cachedRecord;
      }
    } catch (err) {
      console.warn('[CONSENT_SERVICE] Failed to read consent record from storage', err);
    }
    return null;
  }

  static async recordConsent(params: {
    healthcareDataConsent: boolean;
    analyticsConsent?: boolean;
    termsVersion?: string;
    privacyVersion?: string;
  }): Promise<ConsentRecord> {
    const record: ConsentRecord = {
      termsVersion: params.termsVersion || CURRENT_TERMS_VERSION,
      privacyVersion: params.privacyVersion || CURRENT_PRIVACY_VERSION,
      healthcareDataConsent: params.healthcareDataConsent,
      analyticsConsent: params.analyticsConsent ?? false,
      acceptedAt: new Date().toISOString(),
    };

    try {
      await SecureStore.set(CONSENT_STORE_KEY, JSON.stringify(record));
      this.cachedRecord = record;
      console.log('[CONSENT_SERVICE] CONSENT_RECORDED', { terms: record.termsVersion, privacy: record.privacyVersion });
    } catch (err) {
      console.error('[CONSENT_SERVICE] Failed to save consent record', err);
    }

    return record;
  }

  static async hasAcceptedLatestTerms(): Promise<boolean> {
    const record = await this.getConsentRecord();
    return !!record && record.termsVersion === CURRENT_TERMS_VERSION;
  }

  static async hasAcceptedLatestPrivacy(): Promise<boolean> {
    const record = await this.getConsentRecord();
    return !!record && record.privacyVersion === CURRENT_PRIVACY_VERSION && record.healthcareDataConsent;
  }

  static async clearConsent(): Promise<void> {
    this.cachedRecord = null;
    try {
      await SecureStore.remove(CONSENT_STORE_KEY);
    } catch {
      // Ignore cleanup error
    }
  }
}

export default ConsentService;
