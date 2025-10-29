import React, { useEffect, useState, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';

// Import components (not lazy - needed immediately)
import ErrorBoundary from './components/ErrorBoundary';
import Toast from './components/Toast';
import LoadingSpinner from './components/LoadingSpinner';

// Import store
import { useAppStore } from './store/appStore';

// Import keyboard shortcuts
import {
  initKeyboardShortcuts,
  cleanupKeyboardShortcuts,
  registerShortcut
} from './utils/keyboardShortcuts';

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const BuddyWindow = lazy(() => import('./pages/BuddyWindow'));
const Settings = lazy(() => import('./pages/Settings'));
const Characters = lazy(() => import('./pages/Characters'));
const Onboarding = lazy(() => import('./pages/Onboarding'));

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

    // Initialize keyboard shortcuts
    initKeyboardShortcuts();

    // Register application shortcuts
    registerShortcut('SHOW_DASHBOARD', () => {
      if (window.electronAPI) {
        window.electronAPI.showDashboard();
      }
    });

    registerShortcut('SHOW_SETTINGS', () => {
      navigate('/settings');
    });

    registerShortcut('CLOSE_WINDOW', () => {
      // Close dialogs or navigate back
      if (location.pathname !== '/dashboard' && location.pathname !== '/') {
        navigate('/dashboard');
      }
    });

    // Listen for navigation from Electron
    if (window.electronAPI) {
      window.electronAPI.onNavigate((path) => {
        navigate(path);
      });

      window.electronAPI.onAssistantPaused((isPaused) => {
        useAppStore.setState({ assistantPaused: isPaused });
      });
    }

    // Cleanup on unmount
    return () => {
      cleanupKeyboardShortcuts();
    };
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
        <Suspense fallback={<LoadingSpinner fullScreen message="Loading buddy..." />}>
          <Box sx={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <BuddyWindow />
          </Box>
        </Suspense>
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
        <Suspense fallback={<LoadingSpinner fullScreen message="Loading setup..." />}>
          <Onboarding onComplete={handleOnboardingComplete} />
        </Suspense>
        <Toast />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary
      errorMessage="The dashboard encountered an error. Please try again or restart the application."
      showReload={true}
    >
      <Suspense fallback={<LoadingSpinner fullScreen message="Loading..." />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/characters" element={<Characters />} />
          <Route path="/tasks" element={<Dashboard activeTab="tasks" />} />
          <Route path="/monitoring" element={<Dashboard activeTab="monitoring" />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
      <Toast />
    </ErrorBoundary>
  );
}

export default App;
