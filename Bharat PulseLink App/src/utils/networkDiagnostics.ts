/**
 * Bharat PulseLink - Internal Network & Auth Diagnostics
 *
 * Development diagnostic utility to verify connectivity,
 * backend health, and deep-link readiness from physical devices.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { resolveApiBaseUrl, checkBackendHealth } from './apiUrl';
import AuthenticationService from '../auth/AuthenticationService';

export interface NetworkDiagnosticReport {
  timestamp: string;
  appVersion: string;
  expoVersion: string;
  platform: string;
  isDev: boolean;
  resolvedApiBaseUrl: string;
  backendHealth: {
    ok: boolean;
    statusCode?: number;
    latencyMs?: number;
    error?: string;
  };
  deepLinkScheme: string;
  currentAuthStep: string;
  hostUri?: string;
}

export async function runNetworkDiagnostics(): Promise<NetworkDiagnosticReport> {
  const backendHealth = await checkBackendHealth();

  return {
    timestamp: new Date().toISOString(),
    appVersion: Constants.expoConfig?.version || '0.1.0',
    expoVersion: Constants.expoConfig?.sdkVersion || '57.0.0',
    platform: Platform.OS,
    isDev: __DEV__,
    resolvedApiBaseUrl: resolveApiBaseUrl(),
    backendHealth: {
      ok: backendHealth.ok,
      statusCode: backendHealth.statusCode,
      latencyMs: backendHealth.latencyMs,
      error: backendHealth.error,
    },
    deepLinkScheme: Constants.expoConfig?.scheme?.toString() || 'bharatpulselink',
    currentAuthStep: AuthenticationService.getStep(),
    hostUri: Constants.expoConfig?.hostUri,
  };
}

export default runNetworkDiagnostics;
