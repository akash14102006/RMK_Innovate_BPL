import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AccessibilityProvider } from './accessibility/AccessibilityContext';
import { ThemeProvider } from './theme/ThemeProvider';
import { QueryProvider } from './lib/queryClient';
import { I18nProvider } from './i18n/I18nContext';
import RootNavigator from './navigation/RootNavigator';

import { AccessibilityAlertBanner } from './accessibility/AccessibilityAlertManager';
import { AccessibilityQuickPanel } from './components/accessibility/AccessibilityQuickPanel';

console.log('[BOOT] APP_START');

export default function App() {
  useEffect(() => {
    console.log('[BOOT] APP_ROOT_MOUNTED');
    console.log('[BOOT] ACCESSIBILITY_READY');
    console.log('[BOOT] I18N_READY');
    console.log('[BOOT] QUERY_READY');
  }, []);

  return (
    <SafeAreaProvider>
      <AccessibilityProvider>
        <ThemeProvider>
          <I18nProvider>
            <QueryProvider>
              <NavigationContainer>
                <RootNavigator />
                <AccessibilityAlertBanner />
                <AccessibilityQuickPanel />
              </NavigationContainer>
            </QueryProvider>
          </I18nProvider>
        </ThemeProvider>
      </AccessibilityProvider>
    </SafeAreaProvider>
  );
}
