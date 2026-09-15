export const AUTH_TYPES_VERSION = '1.0';

export type AuthProviderType = 'google' | 'whatsapp' | 'sms';

export type AuthStep =
  | 'IDLE'
  | 'STARTING'
  | 'AUTHENTICATING'
  | 'AWAITING_VERIFICATION'
  | 'EXCHANGING'
  | 'SESSION_CREATING'
  | 'SUCCESS'
  | 'CANCELLED'
  | 'FAILED'
  | 'RATE_LIMITED'
  | 'UNAVAILABLE';

export type OtpStep =
  | 'IDLE'
  | 'INPUTTING'
  | 'READY'
  | 'VERIFYING'
  | 'VERIFIED'
  | 'INVALID'
  | 'EXPIRED'
  | 'RATE_LIMITED'
  | 'FAILED';

export interface CanonicalIdentity {
  id: string;
  authProvider: AuthProviderType;
  phone?: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  isNewUser: boolean;
  termsAccepted: boolean;
  profileCompleted: boolean;
  createdAt: string;
}

export interface OtpChallenge {
  challengeId: string;
  phoneE164: string;
  maskedPhone: string;
  expiresAt: number;
  resendAvailableAt: number;
  attemptsRemaining: number;
}

export interface AuthResult {
  success: boolean;
  identity?: CanonicalIdentity;
  error?: string;
  errorCode?: string;
  isBlocked?: boolean;
}

export interface IAuthProvider {
  readonly providerType: AuthProviderType;
  isAvailable(): Promise<boolean>;
  authenticate(): Promise<AuthResult>;
}

export interface IOtpAuthProvider extends IAuthProvider {
  requestOtp(phoneE164: string): Promise<{ success: boolean; challenge?: OtpChallenge; error?: string }>;
  verifyOtp(challengeId: string, otp: string): Promise<AuthResult>;
}
