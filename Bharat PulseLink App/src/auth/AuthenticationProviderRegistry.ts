import { IAuthProvider, AuthProviderType } from './types';
import GoogleAuthProvider from './GoogleAuthProvider';
import WhatsAppOtpProvider from './WhatsAppOtpProvider';

export class AuthenticationProviderRegistry {
  private static providers: Map<AuthProviderType, IAuthProvider> = new Map();

  static register(provider: IAuthProvider): void {
    this.providers.set(provider.providerType, provider);
  }

  static get(type: AuthProviderType): IAuthProvider | undefined {
    return this.providers.get(type);
  }

  static initializeDefaults(): void {
    if (!this.providers.has('google')) {
      this.register(new GoogleAuthProvider());
    }
    if (!this.providers.has('whatsapp')) {
      this.register(new WhatsAppOtpProvider());
    }
  }
}

// Auto-initialize defaults on module import
AuthenticationProviderRegistry.initializeDefaults();

export default AuthenticationProviderRegistry;
