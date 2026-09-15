import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from './types';
import OnboardingScreen1 from '../screens/OnboardingScreen1';
import OnboardingScreen2 from '../screens/OnboardingScreen2';
import OnboardingScreen3 from '../screens/OnboardingScreen3';
import OnboardingScreen4 from '../screens/OnboardingScreen4';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator: React.FC = () => {
  useEffect(() => {
    console.log('[BOOT] ONBOARDING_STACK_MOUNTED');
  }, []);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="OnboardingScreen1" component={OnboardingScreen1} />
      <Stack.Screen name="OnboardingScreen2" component={OnboardingScreen2} />
      <Stack.Screen name="OnboardingScreen3" component={OnboardingScreen3} />
      <Stack.Screen name="OnboardingScreen4" component={OnboardingScreen4} />
    </Stack.Navigator>
  );
};

export default OnboardingNavigator;
