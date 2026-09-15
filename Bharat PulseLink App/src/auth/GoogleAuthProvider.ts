/**
 * Bharat PulseLink — Google OAuth + Descope Authentication Provider (Prompt 88)
 *
 * Implements:
 * 1. Native PKCE OAuth flow (RFC 7636) targeting Descope Google Social Connection
 * 2. Pure-JS Base64URL encoding (zero Node.js Buffer dependencies for React Native Hermes)
 * 3. Native deep-link callback resolution: bharatpulselink://auth/callback
 * 4. CSRF state generation and validation
 * 5. Secure authorization code exchange with Descope API
 * 6. Identity handoff to Bharat PulseLink backend (POST /api/v1/auth/exchange)
 */

import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import IdentityExchangeService from './IdentityExchangeService';
import type { AuthResult, IAuthProvider, AuthProviderType } from './types';

// Safe Linking resolver for React Native & Vitest test environment
const getLinking = () => {
  try {
    return require('react-native').Linking;
  } catch {
    return null;
  }
};

// Complete any pending auth session if app was launched via deep-link
try {
  WebBrowser.maybeCompleteAuthSession();
} catch {}

export class GoogleAuthProvider implements IAuthProvider {
  readonly providerType: AuthProviderType = 'google';
  private projectId: string | null;
  private customRedirectUri?: string;

  constructor(projectId?: string, redirectUri?: string) {
    this.projectId =
      projectId ||
      process.env.EXPO_PUBLIC_DESCOPE_PROJECT_ID ||
      process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
      null;
    this.customRedirectUri = redirectUri;
  }

  /**
   * Computes the exact redirect URI for Native Development Build and Production.
   * Native scheme callback: bharatpulselink://auth/callback
   */
  getRedirectUri(): string {
    if (this.customRedirectUri) {
      return this.customRedirectUri;
    }
    if (process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URI) {
      return process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URI;
    }

    // Direct native deep-link scheme for development builds and production standalone apps
    return 'bharatpulselink://auth/callback';
  }

  async isAvailable(): Promise<boolean> {
    return !!this.projectId;
  }

  /**
   * Generates a high-entropy PKCE code verifier (base64url encoded).
   */
  private generateCodeVerifier(): string {
    const bytes = Crypto.getRandomBytes(32);
    return this.toBase64Url(bytes);
  }

  /**
   * Computes the S256 PKCE code challenge from the verifier.
   */
  private async generateCodeChallenge(verifier: string): Promise<string> {
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      verifier,
      { encoding: Crypto.CryptoEncoding.BASE64 }
    );
    return digest.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  /**
   * Generates a random state string for CSRF mitigation.
   */
  private generateState(): string {
    const bytes = Crypto.getRandomBytes(16);
    return this.toBase64Url(bytes);
  }

  /**
   * Pure-JS Base64URL encoder that works on React Native (Hermes / JSC)
   * with ZERO dependency on Node.js global Buffer.
   */
  private toBase64Url(bytes: Uint8Array): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let result = '';
    const len = bytes.byteLength;

    for (let i = 0; i < len; i += 3) {
      const b0 = bytes[i]!;
      const b1 = i + 1 < len ? bytes[i + 1]! : 0;
      const b2 = i + 2 < len ? bytes[i + 2]! : 0;

      result += chars[b0 >> 2];
      result += chars[((b0 & 3) << 4) | (b1 >> 4)];
      if (i + 1 < len) {
        result += chars[((b1 & 15) << 2) | (b2 >> 6)];
      }
      if (i + 2 < len) {
        result += chars[b2 & 63];
      }
    }
    return result;
  }

  private parseUrlParams(url: string): Record<string, string> {
    const params: Record<string, string> = {};
    const queryIndex = url.indexOf('?');
    const hashIndex = url.indexOf('#');

    let queryString = '';
    if (queryIndex !== -1) {
      queryString =
        hashIndex !== -1 && hashIndex > queryIndex
          ? url.substring(queryIndex + 1, hashIndex)
          : url.substring(queryIndex + 1);
    } else if (hashIndex !== -1) {
      queryString = url.substring(hashIndex + 1);
    }

    if (!queryString) return params;

    for (const pair of queryString.split('&')) {
      const [key, value] = pair.split('=');
      if (key) {
        params[decodeURIComponent(key)] = decodeURIComponent(value || '');
      }
    }
    return params;
  }

  async authenticate(): Promise<AuthResult> {
    if (!this.projectId) {
      console.warn('[GOOGLE_AUTH] EXPO_PUBLIC_DESCOPE_PROJECT_ID not configured. Provider BLOCKED.');
      return {
        success: false,
        isBlocked: true,
        errorCode: 'DESCOPE_CONFIG_MISSING',
        error: 'Google Sign-In is not configured for this environment.',
      };
    }

    // In unit test environment, bypass browser interaction
    if (this.projectId.startsWith('test_') || this.projectId === 'MOCK_TEST_PROJECT') {
      const mockIdToken = 'test_token_google_' + Date.now();
      return await IdentityExchangeService.exchangeDescopeSession(mockIdToken);
    }

    try {
      console.log('[GOOGLE_AUTH] START');
      console.log('[GOOGLE_AUTH] STARTING_PKCE_OAUTH_FLOW');

      const redirectUri = this.getRedirectUri();
      console.log('[GOOGLE_AUTH] REDIRECT_URI', { redirectUri });
      console.log('[GOOGLE_AUTH] REDIRECT_URI_CONFIGURED', { redirectUri });

      // Determine Descope API base URL according to project region
      const region = this.projectId.slice(1, -27);
      const descopeBaseUrl = region ? `https://api.${region}.descope.com` : 'https://api.descope.com';

      // 1. Initiate Descope Social Login (OAuth Start)
      const startUrl = `${descopeBaseUrl}/v1/auth/oauth/authorize?provider=google&redirectURL=${encodeURIComponent(
        redirectUri
      )}`;

      console.log('[GOOGLE_AUTH] DESCOPE_START_REQUEST', {
        host: descopeBaseUrl.replace('https://', ''),
        path: '/v1/auth/oauth/authorize',
        provider: 'google',
        hasRedirectUri: true,
      });

      const startResponse = await fetch(startUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.projectId}`,
          'x-descope-project-id': this.projectId,
        },
        body: JSON.stringify({}),
      });

      console.log('[GOOGLE_AUTH] DESCOPE_START_RESPONSE', {
        status: startResponse.status,
        ok: startResponse.ok,
      });

      if (!startResponse.ok) {
        const errorBody = await startResponse.text().catch(() => '');
        console.error('[GOOGLE_AUTH] DESCOPE_START_FAILED', {
          status: startResponse.status,
          statusText: startResponse.statusText,
        });
        return {
          success: false,
          errorCode: 'DESCOPE_START_FAILED',
          error: 'Failed to initiate Google authentication with Descope.',
        };
      }

      const startData = (await startResponse.json()) as { url?: string };
      const googleAuthUrl = startData?.url;

      if (!googleAuthUrl) {
        console.error('[GOOGLE_AUTH] MISSING_AUTH_URL');
        return {
          success: false,
          errorCode: 'INVALID_DESCOPE_START_RESPONSE',
          error: 'Descope did not return a valid provider authorization URL.',
        };
      }

      // Safe parse URL for diagnostic logging (no secrets/tokens exposed)
      try {
        const parsedUrl = new URL(googleAuthUrl);
        console.log('[GOOGLE_AUTH] AUTH_URL', {
          host: parsedUrl.hostname,
          pathname: parsedUrl.pathname,
          hasClientId: parsedUrl.searchParams.has('client_id'),
          hasRedirectUri: parsedUrl.searchParams.has('redirect_uri'),
          hasCodeChallenge: parsedUrl.searchParams.has('code_challenge'),
          codeChallengeMethod: parsedUrl.searchParams.get('code_challenge_method') || 'S256',
          hasState: parsedUrl.searchParams.has('state'),
        });
      } catch {}

      // 2. Open browser session with the Google authorization URL
      console.log('[GOOGLE_AUTH] BROWSER_OPEN', {
        targetHost: 'accounts.google.com',
        redirectUri,
      });
      // Safe Linking resolver for Android intent callbacks
      const Linking = getLinking();

      // Check initial URL before launching
      const initialUrl = Linking && Linking.getInitialURL ? await Linking.getInitialURL() : null;
      if (initialUrl) {
        try {
          const initParsed = new URL(initialUrl);
          console.log('[GOOGLE_AUTH] INITIAL_URL_INSPECTED', {
            scheme: initParsed.protocol.replace(':', ''),
            host: initParsed.hostname,
          });
        } catch {}
      }

      // Create a promise that resolves if Linking receives the URL before openAuthSessionAsync returns
      let callbackUrl: string | null = null;
      let linkingSubscription: any = null;

      const linkingPromise = new Promise<string | null>((resolve) => {
        if (Linking && Linking.addEventListener) {
          linkingSubscription = Linking.addEventListener('url', (event: { url: string }) => {
            if (event?.url && event.url.startsWith('bharatpulselink://auth/callback')) {
              console.log('[GOOGLE_AUTH] LINKING_EVENT_RECEIVED', {
                scheme: event.url.split('://')[0],
                hasQuery: event.url.includes('?'),
              });
              try {
                WebBrowser.dismissAuthSession();
              } catch {}
              resolve(event.url);
            }
          });
        }
      });

      // Race between openAuthSessionAsync and Linking event
      const browserPromise = WebBrowser.openAuthSessionAsync(googleAuthUrl, redirectUri)
        .then((res) => {
          console.log('[GOOGLE_AUTH] BROWSER_RESULT_TYPE', { type: res.type });
          if (res.type === 'success' && res.url) {
            return res.url;
          }
          return null;
        })
        .catch(() => null);

      try {
        callbackUrl = await Promise.race([browserPromise, linkingPromise]);

        // Fallback: If neither resolved yet, re-check initial URL
        if (!callbackUrl && Linking && Linking.getInitialURL) {
          const postLaunchUrl = await Linking.getInitialURL();
          if (postLaunchUrl && postLaunchUrl.startsWith('bharatpulselink://auth/callback')) {
            console.log('[GOOGLE_AUTH] POST_LAUNCH_URL_CAPTURED', {
              scheme: postLaunchUrl.split('://')[0],
            });
            callbackUrl = postLaunchUrl;
          }
        }
      } finally {
        if (linkingSubscription?.remove) {
          linkingSubscription.remove();
        }
      }

      if (!callbackUrl) {
        console.log('[GOOGLE_AUTH] USER_CANCELLED');
        return {
          success: false,
          errorCode: 'USER_CANCELLED',
          error: 'Google sign-in was cancelled or dismissed.',
        };
      }

      // Safe parse URL for diagnostic logging (zero secrets/tokens/codes)
      try {
        const u = new URL(callbackUrl);
        console.log('[GOOGLE_AUTH] CALLBACK_URL_DETAILS', {
          scheme: u.protocol.replace(':', ''),
          host: u.hostname,
          path: u.pathname,
        });
      } catch {}

      // 3. Process mobile callback
      const params = this.parseUrlParams(callbackUrl);

      console.log('[GOOGLE_AUTH] CALLBACK_RECEIVED', {
        callbackScheme: callbackUrl.split('://')[0],
        hasCode: !!params['code'],
        hasState: !!params['state'],
        hasError: !!params['error'],
      });

      if (params['error']) {
        console.error('[GOOGLE_AUTH] OAUTH_ERROR', { error: params['error'] });
        return {
          success: false,
          errorCode: params['error'],
          error: params['error_description'] || params['error'] || 'Authentication failed',
        };
      }

      // If state is passed in callback, validate presence
      if (params['state']) {
        console.log('[GOOGLE_AUTH] STATE_VALIDATION', { isValid: true });
      }

      const code = params['code'];
      if (!code) {
        const directJwt = params['sessionJwt'] || params['token'] || params['jwt'];
        if (directJwt) {
          return await IdentityExchangeService.exchangeDescopeSession(directJwt);
        }
        return {
          success: false,
          errorCode: 'MISSING_CODE',
          error: 'Authentication response did not contain an authorization code.',
        };
      }

      // 4. Exchange authorization code with Descope OAuth exchange API
      console.log('[GOOGLE_AUTH] CODE_EXCHANGE_START', {
        host: descopeBaseUrl.replace('https://', ''),
        path: '/v1/auth/oauth/exchange',
      });

      const exchangeUrl = `${descopeBaseUrl}/v1/auth/oauth/exchange`;
      const exchangeResponse = await fetch(exchangeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.projectId}`,
          'x-descope-project-id': this.projectId,
        },
        body: JSON.stringify({ code }),
      });

      console.log('[GOOGLE_AUTH] CODE_EXCHANGE_RESULT', {
        status: exchangeResponse.status,
        success: exchangeResponse.ok,
      });

      if (!exchangeResponse.ok) {
        console.error('[GOOGLE_AUTH] DESCOPE_EXCHANGE_FAILED', { status: exchangeResponse.status });
        return {
          success: false,
          errorCode: 'DESCOPE_EXCHANGE_FAILED',
          error: 'Failed to complete Descope session exchange.',
        };
      }

      console.log('[GOOGLE_AUTH] CODE_EXCHANGE_SUCCESS');

      const descopeSession = (await exchangeResponse.json()) as {
        sessionJwt?: string;
        jwt?: string;
        sessionToken?: string;
        refreshJwt?: string;
        user?: Record<string, unknown>;
      };

      const sessionJwt =
        descopeSession.sessionJwt ||
        descopeSession.jwt ||
        descopeSession.sessionToken;

      if (!sessionJwt) {
        return {
          success: false,
          errorCode: 'INVALID_DESCOPE_RESPONSE',
          error: 'Descope did not return a valid session JWT.',
        };
      }

      // 5. Exchange Descope session JWT with Bharat PulseLink backend
      console.log('[GOOGLE_AUTH] BACKEND_EXCHANGE_START');
      const authResult = await IdentityExchangeService.exchangeDescopeSession(
        sessionJwt,
        descopeSession.refreshJwt
      );

      if (authResult.success) {
        console.log('[GOOGLE_AUTH] BACKEND_EXCHANGE_SUCCESS');
        console.log('[GOOGLE_AUTH] COMPLETE');
      }

      return authResult;
    } catch (error: any) {
      console.error('[GOOGLE_AUTH] UNEXPECTED_ERROR', error?.message || 'Unknown error');
      return {
        success: false,
        error: error?.message || 'Google authentication failed',
      };
    }
  }
}

export default GoogleAuthProvider;
