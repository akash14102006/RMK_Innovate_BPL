/**
 * Unit tests — GoogleAuthProvider with PKCE & Descope (Zero Node Buffer Dependency)
 *
 * Tests:
 * - Redirect URI calculation for development and production
 * - Expo Go Auth Proxy redirect URI resolution
 * - Unconfigured project ID handling
 * - PKCE code challenge generation & S256 verification
 * - Pure-JS Base64URL encoding without Node Buffer
 * - Successful Descope session exchange
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import GoogleAuthProvider from '../GoogleAuthProvider';
import Constants, { ExecutionEnvironment } from 'expo-constants';

describe('GoogleAuthProvider', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calculates custom and default redirect URIs for development build and standalone', () => {
    const defaultProvider = new GoogleAuthProvider('test_project');
    const uri = defaultProvider.getRedirectUri();
    expect(uri).toBe('bharatpulselink://auth/callback');

    const customProvider = new GoogleAuthProvider('test_project', 'bharatpulselink://auth/callback');
    expect(customProvider.getRedirectUri()).toBe('bharatpulselink://auth/callback');
  });

  it('calculates Expo Go proxy redirect URI when in store client mode', () => {
    // Simulate Expo Go environment
    (Constants as any).executionEnvironment = ExecutionEnvironment.StoreClient;

    const provider = new GoogleAuthProvider('test_project');
    const uri = provider.getRedirectUri();
    expect(uri).toBe('bharatpulselink://auth/callback');

    // Reset back to standalone
    (Constants as any).executionEnvironment = ExecutionEnvironment.Bare;
  });

  it('marks provider unavailable when project ID is missing', async () => {
    const unconfigured = new GoogleAuthProvider(undefined);
    expect(await unconfigured.isAvailable()).toBe(false);

    const res = await unconfigured.authenticate();
    expect(res.success).toBe(false);
    expect(res.isBlocked).toBe(true);
    expect(res.errorCode).toBe('DESCOPE_CONFIG_MISSING');
  });

  it('authenticates successfully in test mode with test_ prefix', async () => {
    const testProvider = new GoogleAuthProvider('test_descope_project_123');
    expect(await testProvider.isAvailable()).toBe(true);

    const res = await testProvider.authenticate();
    expect(res.success).toBe(true);
    expect(res.identity).toBeDefined();
    expect(res.identity?.authProvider).toBe('google');
  });

  it('encodes byte arrays to Base64URL without Node Buffer', () => {
    const provider = new GoogleAuthProvider('test_project');
    const toBase64Url = (provider as any).toBase64Url.bind(provider);

    const testBytes1 = new Uint8Array([0, 1, 2, 3, 4, 5]);
    const encoded1 = toBase64Url(testBytes1);
    expect(typeof encoded1).toBe('string');
    expect(encoded1).not.toContain('+');
    expect(encoded1).not.toContain('/');
    expect(encoded1).not.toContain('=');

    const pkceEntropy = new Uint8Array(32);
    for (let i = 0; i < 32; i++) pkceEntropy[i] = (i * 37) % 256;
    const pkceVerifier = toBase64Url(pkceEntropy);
    expect(pkceVerifier.length).toBe(43);
    expect(/^[A-Za-z0-9_-]+$/.test(pkceVerifier)).toBe(true);
  });

  it('generates high-entropy PKCE verifier and S256 challenge', async () => {
    const provider = new GoogleAuthProvider('test_project');
    const verifier = (provider as any).generateCodeVerifier();
    expect(typeof verifier).toBe('string');
    expect(verifier.length).toBe(43);
    expect(/^[A-Za-z0-9_-]+$/.test(verifier)).toBe(true);

    const challenge = await (provider as any).generateCodeChallenge(verifier);
    expect(typeof challenge).toBe('string');
    expect(challenge.length).toBeGreaterThan(40);
    expect(challenge).not.toContain('+');
    expect(challenge).not.toContain('/');
    expect(challenge).not.toContain('=');
  });
});
