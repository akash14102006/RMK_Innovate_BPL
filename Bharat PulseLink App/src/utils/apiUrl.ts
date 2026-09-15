/**
 * Bharat PulseLink — Canonical API Base URL Resolver
 *
 * Automatically resolves the backend API host across:
 * 1. Web Browsers (localhost:8085)
 * 2. Physical Android / iOS devices over local Wi-Fi (dynamically resolved from Expo host IP)
 * 3. Android Emulators (10.0.2.2:8085)
 * 4. Production remote deployments (HTTPS)
 *
 * Owned by: Platform Foundation & API Infrastructure
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

export function resolveApiBaseUrl(): string {
  const configured =
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    (globalThis as any)?.API_BASE ||
    'http://localhost:8085/api/v1';

  // If on Web or already an explicit remote IP / production domain, return directly
  if (
    Platform.OS === 'web' ||
    (!configured.includes('localhost') && !configured.includes('127.0.0.1'))
  ) {
    return configured.endsWith('/api/v1') ? configured : `${configured}/api/v1`;
  }

  // If on Native mobile, attempt to extract development computer host IP from Expo runtime (Expo Go / Dev Client)
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost;

  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      const portMatch = configured.match(/:(\d+)/);
      const port = portMatch ? portMatch[1] : '8085';
      return `http://${hostIp}:${port}/api/v1`;
    }
  }

  // If in development mode on Android emulator, use 10.0.2.2; otherwise in production standalone APK preserve configured URL
  if (Platform.OS === 'android' && typeof __DEV__ !== 'undefined' && __DEV__) {
    return configured.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
  }

  return configured.endsWith('/api/v1') ? configured : `${configured}/api/v1`;
}

export default resolveApiBaseUrl;
