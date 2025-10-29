import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';

// Import pages
import Dashboard from './pages/Dashboard';
import BuddyWindow from './pages/BuddyWindow';
import Settings from './pages/Settings';
import Characters from './pages/Characters';
import Onboarding from './pages/Onboarding';

// Import components
import ErrorBoundary from './components/ErrorBoundary';
import Toast from './components/Toast';

// Import store
import { useAppStore } from './store/appStore';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { initializeBackend } = useAppStore();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Check if onboarding is completed
    const onboardingCompleted = localStorage.getItem('onboardingCompleted');
    if (!onboardingCompleted && location.pathname !== '/buddy') {
      setShowOnboarding(true);
    }

    // Initialize connection to backend
    initializeBackend();

    // Listen for navigation from Electron
    if (window.electronAPI) {
      window.electronAPI.onNavigate((path) => {
        navigate(path);
      });

      window.electronAPI.onAssistantPaused((isPaused) => {
        useAppStore.setState({ assistantPaused: isPaused });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    navigate('/dashboard');
  };

  // Check if we're in buddy window mode
  const isBuddyWindow = location.pathname === '/buddy';

  if (isBuddyWindow) {
    return (
      <ErrorBoundary
        errorMessage="The buddy window encountered an error. Please restart the application."
        showReload={true}
      >
        <Box sx={{ width: '100%', height: '100%', overflow: 'hidden' }}>
          <BuddyWindow />
        </Box>
        <Toast />
      </ErrorBoundary>
    );
  }

  // Show onboarding if not completed
  if (showOnboarding) {
    return (
      <ErrorBoundary
        errorMessage="The onboarding process encountered an error. You can skip it and continue."
        showReload={false}
      >
        <Onboarding onComplete={handleOnboardingComplete} />
        <Toast />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary
      errorMessage="The dashboard encountered an error. Please try again or restart the application."
      showReload={true}
    >
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/characters" element={<Characters />} />
        <Route path="/tasks" element={<Dashboard activeTab="tasks" />} />
        <Route path="/monitoring" element={<Dashboard activeTab="monitoring" />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      <Toast />
    </ErrorBoundary>
  );
}

export default App;