/**
 * Bharat PulseLink — Auth Stack Navigator
 *
 * Owns the pre-authentication and device-security flow only.
 * Does NOT include any AppStack destinations (Home, Alerts, etc.).
 * ProfileSetup is included here for the first-time onboarding flow.
 * To navigate from ProfileSetup → Home, use CommonActions.reset (see ProfileStepScreen).
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import AuthEntryScreen from '../screens/AuthEntryScreen';
import OTPVerificationScreen from '../screens/OTPVerificationScreen';
import TermsConditionsScreen from '../screens/TermsConditionsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import BiometricSetupScreen from '../screens/BiometricSetupScreen';
import SecurityPinSetupScreen from '../screens/SecurityPinSetupScreen';
import LocalLockScreen from '../screens/LocalLockScreen';
import ProfileStepScreen from '../screens/profile/ProfileStepScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="AuthEntry" component={AuthEntryScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="BiometricSetup" component={BiometricSetupScreen} />
      <Stack.Screen name="SecurityPinSetup" component={SecurityPinSetupScreen} />
      <Stack.Screen name="LocalLock" component={LocalLockScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileStepScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
