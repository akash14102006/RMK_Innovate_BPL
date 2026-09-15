import { useState, useEffect } from 'react';
import AnimatedSplash from './components/AnimatedSplash';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import DashboardLayout from './components/DashboardLayout';
import ApiSetupRequired from './components/ApiSetupRequired';
import { Toaster } from './components/ui/sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { apiSetupService } from './services/apiSetupService';

// Inner App component to use the auth hook
function AppContent() {
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'dashboard' | 'setup'>('landing');
  const { isAuthenticated, loading, user } = useAuth();

  useEffect(() => {
    // If authenticated, check API setup status
    if (!loading && isAuthenticated && user) {
      const setupStatus = apiSetupService.checkSetupStatus();

      if (setupStatus.isConfigured) {
        // User has configured all required APIs → go to dashboard
        setCurrentView('dashboard');
      } else {
        // User needs to configure APIs first
        setCurrentView('setup');
      }
    } else if (!loading && !isAuthenticated) {
      // Not authenticated → show landing page
      setCurrentView('landing');
    }
  }, [isAuthenticated, loading, user]);

  const handleNavigate = (view: 'landing' | 'login' | 'dashboard' | 'setup') => {
    setCurrentView(view);
  };

  const handleNavigateToSettings = () => {
    // When user clicks "Configure API Keys" from setup screen
    // We navigate to dashboard, which will show settings
    setCurrentView('dashboard');
    // After a short delay, trigger settings navigation in DashboardLayout
    setTimeout(() => {
      const settingsLink = document.querySelector('[data-navigation="settings"]') as HTMLElement;
      if (settingsLink) settingsLink.click();
    }, 100);
  };

  if (loading) {
    return <AnimatedSplash minDurationMs={1500} />;
  }

  return (
    <>
      {currentView === 'landing' && <LandingPage onNavigate={handleNavigate} />}
      {currentView === 'login' && <LoginPage onNavigate={handleNavigate} />}
      {currentView === 'setup' && <ApiSetupRequired onNavigateToSettings={handleNavigateToSettings} />}
      {currentView === 'dashboard' && <DashboardLayout onNavigate={handleNavigate} />}

      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
} 

/* updated */
