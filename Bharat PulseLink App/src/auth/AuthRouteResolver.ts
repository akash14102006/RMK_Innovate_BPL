import { CanonicalIdentity } from './types';
import ConsentService from '../services/ConsentService';
import DeviceSecurityService from '../services/DeviceSecurityService';
import ProfileDraftService from '../services/ProfileDraftService';

export type ResolvedRoute =
  | 'TermsConditions'
  | 'PrivacyPolicy'
  | 'BiometricSetup'
  | 'SecurityPinSetup'
  | 'ProfileSetup'
  | 'LocalLock'
  | 'AppStack';

export class AuthRouteResolver {
  static async resolveNextRouteAsync(identity?: CanonicalIdentity | null): Promise<ResolvedRoute> {
    const termsAccepted = await ConsentService.hasAcceptedLatestTerms();
    if (!termsAccepted) {
      return 'TermsConditions';
    }

    const privacyAccepted = await ConsentService.hasAcceptedLatestPrivacy();
    if (!privacyAccepted) {
      return 'PrivacyPolicy';
    }

    const secConfig = await DeviceSecurityService.getConfig();
    if (!secConfig.biometricEnabled && !secConfig.pinConfigured) {
      return 'BiometricSetup';
    }

    const draft = await ProfileDraftService.loadDraft(identity?.id || 'user_patient_primary');
    if (!draft || !draft.isComplete) {
      return 'ProfileSetup';
    }

    if (DeviceSecurityService.isAppLocked()) {
      return 'LocalLock';
    }

    return 'AppStack';
  }

  /** Sync fallback resolver for quick navigation decisions */
  static resolveNextRoute(identity?: CanonicalIdentity | null): ResolvedRoute {
    if (identity && !identity.termsAccepted) {
      return 'TermsConditions';
    }
    return 'AppStack';
  }
}

export default AuthRouteResolver;
