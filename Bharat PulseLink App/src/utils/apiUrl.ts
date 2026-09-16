/**
 * Bharat PulseLink - Canonical API Base URL Resolver
 *
 * Centralized, authoritative API endpoint resolver supporting:
 * 1. Physical Android / iOS devices over local Wi-Fi (LAN IP)
 * 2. Android Emulators (10.0.2.2)
 * 3. Web Browsers (localhost / hostname)
 * 4. Production remote deployments (HTTPS only)
 *
 * Owned by: Platform Foundation & API Infrastructure
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

const DEFAULT_PORT = '8085';
const DEFAULT_LAN_IP = '192.168.29.240';

export function resolveApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  // 1. If explicit environment variable is set and NOT localhost
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.endsWith('/api/v1') ? envUrl : `${envUrl.replace(/\/+$/, '')}/api/v1`;
  }

  // 2. Production builds must never use localhost / emulator addresses
  if (process.env.NODE_ENV === 'production' && !__DEV__) {
    if (envUrl) {
      return envUrl.endsWith('/api/v1') ? envUrl : `${envUrl.replace(/\/+$/, '')}/api/v1`;
    }
    return 'https://api.bharatpulselink.in/api/v1';
  }

  // 3. Web platform uses localhost or current origin
  if (Platform.OS === 'web') {
    const webPort = envUrl ? (envUrl.match(/:(\d+)/)?.[1] || DEFAULT_PORT) : DEFAULT_PORT;
    return `http://localhost:${webPort}/api/v1`;
  }

  // 4. Extract host IP from Expo debugger / Metro runtime if available
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost;

  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      const port = envUrl ? (envUrl.match(/:(\d+)/)?.[1] || DEFAULT_PORT) : DEFAULT_PORT;
      return `http://${hostIp}:${port}/api/v1`;
    }
  }

  // 5. If on Android Native development:
  // If EXPO_PUBLIC_API_BASE_URL was set with LAN IP, use it
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.endsWith('/api/v1') ? envUrl : `${envUrl.replace(/\/+$/, '')}/api/v1`;
  }

  // Fallback for physical device development: use the development computer LAN IP
  return `http://${DEFAULT_LAN_IP}:${DEFAULT_PORT}/api/v1`;
}

/**
 * Health check diagnostic against the resolved backend.
 */
export async function checkBackendHealth(): Promise<{
  ok: boolean;
  resolvedUrl: string;
  statusCode?: number;
  latencyMs?: number;
  data?: any;
  error?: string;
}> {
  const base = resolveApiBaseUrl();
  const rootUrl = base.replace(/\/api\/v1\/?$/, '');
  const healthUrl = `${rootUrl}/health`;

  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(healthUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    const latencyMs = Date.now() - start;

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        ok: true,
        resolvedUrl: healthUrl,
        statusCode: res.status,
        latencyMs,
        data,
      };
    }

    return {
      ok: false,
      resolvedUrl: healthUrl,
      statusCode: res.status,
      latencyMs,
      error: `Server returned HTTP ${res.status}`,
    };
  } catch (err: any) {
    return {
      ok: false,
      resolvedUrl: healthUrl,
      latencyMs: Date.now() - start,
      error: err?.message || 'Network request failed',
    };
  }
}

export default resolveApiBaseUrl;
