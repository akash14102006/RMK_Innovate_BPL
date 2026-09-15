import {
  AuthStep,
  AuthProviderType,
  AuthResult,
  CanonicalIdentity,
  OtpChallenge,
} from './types';
import AuthenticationProviderRegistry from './AuthenticationProviderRegistry';
import WhatsAppOtpProvider from './WhatsAppOtpProvider';

export class AuthenticationService {
  private currentStep: AuthStep = 'IDLE';
  private activeIdentity: CanonicalIdentity | null = null;
  private activeChallenge: OtpChallenge | null = null;

  getStep(): AuthStep {
    return this.currentStep;
  }

  getIdentity(): CanonicalIdentity | null {
    return this.activeIdentity;
  }

  getActiveChallenge(): OtpChallenge | null {
    return this.activeChallenge;
  }

  async authenticateWithProvider(providerType: AuthProviderType): Promise<AuthResult> {
    const provider = AuthenticationProviderRegistry.get(providerType);
    if (!provider) {
      this.currentStep = 'UNAVAILABLE';
      return {
        success: false,
        errorCode: 'PROVIDER_NOT_REGISTERED',
        error: `Provider ${providerType} is not registered.`,
      };
    }

    this.currentStep = 'STARTING';
    const isAvail = await provider.isAvailable();
    if (!isAvail) {
      this.currentStep = 'UNAVAILABLE';
      return {
        success: false,
        isBlocked: true,
        errorCode: 'PROVIDER_UNAVAILABLE',
        error: `Authentication provider ${providerType} is currently unavailable.`,
      };
    }

    this.currentStep = 'AUTHENTICATING';
    const result = await provider.authenticate();

    if (result.success && result.identity) {
      this.currentStep = 'SUCCESS';
      this.activeIdentity = result.identity;
    } else {
      this.currentStep = result.isBlocked ? 'UNAVAILABLE' : 'FAILED';
    }

    return result;
  }

  async requestWhatsAppOtp(phoneInput: string): Promise<{ success: boolean; challenge?: OtpChallenge; error?: string }> {
    const provider = AuthenticationProviderRegistry.get('whatsapp') as WhatsAppOtpProvider;
    if (!provider) {
      return { success: false, error: 'WhatsApp OTP provider not registered' };
    }

    this.currentStep = 'AUTHENTICATING';
    const res = await provider.requestOtp(phoneInput);
    if (res.success && res.challenge) {
      this.activeChallenge = res.challenge;
      this.currentStep = 'AWAITING_VERIFICATION';
    } else {
      this.currentStep = 'FAILED';
    }
    return res;
  }

  async verifyWhatsAppOtp(otp: string): Promise<AuthResult> {
    if (!this.activeChallenge) {
      return { success: false, error: 'No active OTP verification challenge' };
    }

    const provider = AuthenticationProviderRegistry.get('whatsapp') as WhatsAppOtpProvider;
    if (!provider) {
      return { success: false, error: 'WhatsApp OTP provider not registered' };
    }

    this.currentStep = 'EXCHANGING';
    const result = await provider.verifyOtp(this.activeChallenge.challengeId, otp);

    if (result.success && result.identity) {
      this.currentStep = 'SUCCESS';
      this.activeIdentity = result.identity;
      this.activeChallenge = null;
    } else {
      this.currentStep = 'FAILED';
    }

    return result;
  }

  reset(): void {
    this.currentStep = 'IDLE';
    this.activeIdentity = null;
    this.activeChallenge = null;
  }
}

export default new AuthenticationService();
