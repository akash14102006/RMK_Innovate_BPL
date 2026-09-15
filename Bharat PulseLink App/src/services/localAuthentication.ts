import * as LocalAuth from 'expo-local-authentication';

export interface LocalAuthResult {
  success: boolean;
  error?: string;
}

export class LocalAuthenticationAdapter {
  static async hasHardwareAsync(): Promise<boolean> {
    try {
      return await LocalAuth.hasHardwareAsync();
    } catch {
      return false;
    }
  }

  static async isEnrolledAsync(): Promise<boolean> {
    try {
      return await LocalAuth.isEnrolledAsync();
    } catch {
      return false;
    }
  }

  static async supportedAuthenticationTypesAsync(): Promise<LocalAuth.AuthenticationType[]> {
    try {
      return await LocalAuth.supportedAuthenticationTypesAsync();
    } catch {
      return [];
    }
  }

  static async authenticateAsync(options: {
    promptMessage: string;
    cancelLabel?: string;
    fallbackLabel?: string;
  }): Promise<LocalAuthResult> {
    try {
      const res = await LocalAuth.authenticateAsync({
        promptMessage: options.promptMessage,
        cancelLabel: options.cancelLabel || 'Cancel',
        fallbackLabel: options.fallbackLabel || 'Use PIN',
        disableDeviceFallback: false,
      });

      return {
        success: res.success,
        error: res.error,
      };
    } catch (err: any) {
      console.warn('[LOCAL_AUTH] Native biometric call error', err);
      return { success: false, error: err?.message || 'Biometric authentication failed' };
    }
  }
}

export default LocalAuthenticationAdapter;
