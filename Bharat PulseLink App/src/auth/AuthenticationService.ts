import {
  AuthStep,
  AuthProviderType,
  AuthResult,
  CanonicalIdentity,
  OtpChallenge,
} from './types';
import AuthenticationProviderRegistry from './AuthenticationProviderRegistry';
import WhatsAppOtpProvider from './WhatsAppOtpProvider';

/**
 * Maps system/backend error codes to clear, friendly user-facing messages.
 */
export function mapAuthErrorMessage(errorCode?: string, fallbackMessage?: string): string {
  switch (errorCode) {
    case 'RATE_LIMITED':
    case 'MAX_ATTEMPTS_EXCEEDED':
      return 'Too many attempts. Please wait a few minutes before trying again.';
    case 'OTP_EXPIRED':
      return 'The verification code has expired. Please request a new code.';
    case 'INVALID_OTP':
    case 'INVALID_OTP_FORMAT':
      return 'Incorrect verification code. Please check and try again.';
    case 'INVALID_PHONE':
      return 'Please enter a valid 10-digit Indian mobile number.';
    case 'NETWORK_ERROR':
    case 'TIMEOUT':
      return 'Unable to reach the server. Please check your internet connection.';
    case 'PROVIDER_UNAVAILABLE':
    case 'PROVIDER_NOT_REGISTERED':
      return 'Authentication service is temporarily unavailable. Please try again later.';
    case 'ACCOUNT_SUSPENDED':
    case 'FORBIDDEN':
      return 'Your account is currently suspended. Please contact support.';
    default:
      return fallbackMessage || 'Authentication failed. Please try again.';
  }
}

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
      this.currentStep = result.isBlocked ? 'UNAVAILABLE' : (result.errorCode === 'RATE_LIMITED' ? 'RATE_LIMITED' : 'FAILED');
      if (result.error) {
        result.error = mapAuthErrorMessage(result.errorCode, result.error);
      }
    }

    return result;
  }

  async requestWhatsAppOtp(
    phoneInput: string
  ): Promise<{ success: boolean; challenge?: OtpChallenge; error?: string; errorCode?: string }> {
    const provider = AuthenticationProviderRegistry.get('whatsapp') as WhatsAppOtpProvider;
    if (!provider) {
      this.currentStep = 'UNAVAILABLE';
      return {
        success: false,
        errorCode: 'PROVIDER_NOT_REGISTERED',
        error: 'WhatsApp OTP provider not registered',
      };
    }

    this.currentStep = 'AUTHENTICATING';
    const res = await provider.requestOtp(phoneInput);
    if (res.success && res.challenge) {
      this.activeChallenge = res.challenge;
      this.currentStep = 'AWAITING_VERIFICATION';
    } else {
      this.currentStep = res.errorCode === 'RATE_LIMITED' ? 'RATE_LIMITED' : 'FAILED';
      if (res.error) {
        res.error = mapAuthErrorMessage(res.errorCode, res.error);
      }
    }
    return res;
  }

  async verifyWhatsAppOtp(otp: string): Promise<AuthResult> {
    if (!this.activeChallenge) {
      return {
        success: false,
        errorCode: 'NO_ACTIVE_CHALLENGE',
        error: 'No active OTP verification session. Please request a new code.',
      };
    }

    const provider = AuthenticationProviderRegistry.get('whatsapp') as WhatsAppOtpProvider;
    if (!provider) {
      return {
        success: false,
        errorCode: 'PROVIDER_NOT_REGISTERED',
        error: 'WhatsApp OTP provider not registered',
      };
    }

    this.currentStep = 'EXCHANGING';
    const result = await provider.verifyOtp(
      this.activeChallenge.challengeId,
      otp,
      this.activeChallenge.phoneE164
    );

    if (result.success && result.identity) {
      this.currentStep = 'SUCCESS';
      this.activeIdentity = result.identity;
      this.activeChallenge = null;
    } else {
      this.currentStep = result.errorCode === 'RATE_LIMITED' ? 'RATE_LIMITED' : 'FAILED';
      if (result.error) {
        result.error = mapAuthErrorMessage(result.errorCode, result.error);
      }
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
