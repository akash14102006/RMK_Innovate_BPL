import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import SplashScreen from '../screens/SplashScreen';
import OnboardingNavigator from './OnboardingNavigator';
import LanguageSelectionScreen from '../screens/LanguageSelectionScreen';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import OnboardingManager from '../services/onboardingManager';
import ConsentService from '../services/ConsentService';
import DeviceSecurityService from '../services/DeviceSecurityService';
import SessionManager from '../services/sessionManager';

import ProfileDraftService from '../services/ProfileDraftService';

const Stack = createNativeStackNavigator<RootStackParamList>();

export type AuthState =
  | 'BOOTING'
  | 'ONBOARDING'
  | 'LANGUAGE_SELECTION'
  | 'UNAUTHENTICATED'
  | 'AUTHENTICATED';

export const RootNavigator: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>('BOOTING');

  useEffect(() => {
    // Listen for real-time authentication changes (login / logout / token expiry)
    const unsubscribe = SessionManager.subscribe(async (isAuthenticated) => {
      console.log(`[NAVIGATOR] AUTH_STATE_SYNC { isAuthenticated: ${isAuthenticated} }`);
      if (!isAuthenticated) {
        setAuthState('LANGUAGE_SELECTION');
        return;
      }

      // Authoritative onboarding completion verification
      try {
        const termsAccepted = await ConsentService.hasAcceptedLatestTerms();
        const privacyAccepted = await ConsentService.hasAcceptedLatestPrivacy();
        const draft = ProfileDraftService.getActiveMemoryDraft();
        const isProfileDone = Boolean(draft?.isComplete);

        if (termsAccepted && privacyAccepted && isProfileDone) {
          setAuthState('AUTHENTICATED');
        } else {
          // Keep in pre-app state with AuthStack mounted for onboarding
          setAuthState('LANGUAGE_SELECTION');
        }
      } catch {
        setAuthState('LANGUAGE_SELECTION');
      }
    });

    return unsubscribe;
  }, []);

  const handleBootComplete = async (isAuthenticated: boolean) => {
    try {
      console.log('[BOOT] JS_MOUNTED');
      console.log('[BOOT] NAVIGATOR_MOUNTED');

      // 1. If user is already authenticated, check if all onboarding steps are complete
      if (isAuthenticated) {
        const termsAccepted = await ConsentService.hasAcceptedLatestTerms();
        const privacyAccepted = await ConsentService.hasAcceptedLatestPrivacy();
        const draft = await ProfileDraftService.loadDraft('user_patient_primary');
        const isProfileDone = Boolean(draft?.isComplete);

        if (termsAccepted && privacyAccepted && isProfileDone) {
          console.log('[BOOT] ONBOARDING_COMPLETED=true');
          console.log('[BOOT] ROUTE_RESOLVED=AppStack');
          setAuthState('AUTHENTICATED');
          return;
        }
      }

      // Guarantee fresh user onboarding flow (Onboarding 1-4) on unauthenticated launch
      await OnboardingManager.resetOnboarding();

      // 2. Check if onboarding was completed before login
      const isOnboardingDone = await OnboardingManager.isOnboardingCompleted();
      console.log(`[BOOT] ONBOARDING_COMPLETED=${isOnboardingDone}`);

      if (!isOnboardingDone) {
        console.log('[BOOT] ROUTE_RESOLVED=OnboardingStack');
        setAuthState('ONBOARDING');
        return;
      }

      console.log('[BOOT] CONSENT_CHECK_START');
      const termsAccepted = await ConsentService.hasAcceptedLatestTerms();
      const privacyAccepted = await ConsentService.hasAcceptedLatestPrivacy();
      console.log('[BOOT] CONSENT_CHECK_DONE', { termsAccepted, privacyAccepted });

      console.log('[BOOT] SECURITY_CHECK_START');
      const secConfig = await DeviceSecurityService.getConfig();
      const isLocked = DeviceSecurityService.isAppLocked();
      console.log('[BOOT] SECURITY_CHECK_DONE', { secConfig, isLocked });

      console.log('[BOOT] ROOT_ROUTE=LanguageSelection');
      setAuthState('LANGUAGE_SELECTION');
    } catch (_err) {
      console.log('[BOOT] ONBOARDING_COMPLETED=false');
      console.log('[BOOT] ROOT_ROUTE=OnboardingStack');
      setAuthState('ONBOARDING');
    }
  };

  if (authState === 'BOOTING') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="Splash">
          {() => <SplashScreen onBootComplete={handleBootComplete} />}
        </Stack.Screen>
      </Stack.Navigator>
    );
  }

  if (authState === 'LANGUAGE_SELECTION') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
        <Stack.Screen name="AuthStack" component={AuthNavigator} />
        <Stack.Screen name="AppStack" component={AppNavigator} />
      </Stack.Navigator>
    );
  }

  if (authState === 'AUTHENTICATED') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="AppStack" component={AppNavigator} />
      </Stack.Navigator>
    );
  }

  if (authState === 'UNAUTHENTICATED') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="AuthStack" component={AuthNavigator} />
      </Stack.Navigator>
    );
  }

  // Default: ONBOARDING state
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="OnboardingStack" component={OnboardingNavigator} />
      <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
      <Stack.Screen name="AuthStack" component={AuthNavigator} />
      <Stack.Screen name="AppStack" component={AppNavigator} />
    </Stack.Navigator>
  );
};

export default RootNavigator;
