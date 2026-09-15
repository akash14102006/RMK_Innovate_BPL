import { CanonicalIdentity } from './types';
import ConsentService from '../services/ConsentService';
import DeviceSecurityService from '../services/DeviceSecurityService';

export type ResolvedRoute =
  | 'TermsConditions'
  | 'PrivacyPolicy'
  | 'BiometricSetup'
  | 'SecurityPinSetup'
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
