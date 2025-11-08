import React, { useEffect, useState, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

// Import critical pages directly (for initial load)
import BuddyWindow from './pages/BuddyWindow';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const Characters = lazy(() => import('./pages/Characters'));
const Scheduler = lazy(() => import('./pages/Scheduler'));
const PluginManager = lazy(() => import('./pages/PluginManager'));
const ShortcutsManager = lazy(() => import('./pages/ShortcutsManager'));
const ClipboardManager = lazy(() => import('./pages/ClipboardManager'));
const Conversations = lazy(() => import('./pages/Conversations'));
const WorkflowBuilder = lazy(() => import('./pages/WorkflowBuilder'));
const QuickActions = lazy(() => import('./components/QuickActions'));

// Import store
import { useAppStore } from './store/appStore';

// Loading fallback component
const LoadingFallback = () => (
  <Box sx={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#f5f5f5'
  }}>
    <CircularProgress />
  </Box>
);

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { initializeBackend } = useAppStore();
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);

  useEffect(() => {
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

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K for quick actions
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        setQuickActionsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Check if we're in buddy window mode
  const isBuddyWindow = location.pathname === '/buddy';

  if (isBuddyWindow) {
    return (
      <ErrorBoundary>
        <Box sx={{ width: '100%', height: '100%', overflow: 'hidden' }}>
          <BuddyWindow />
        </Box>
      </ErrorBoundary>
    );
  }

  const backendUrl = useAppStore((state) => state.backendUrl);

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/characters" element={<Characters />} />
          <Route path="/scheduler" element={<Scheduler backendUrl={backendUrl} />} />
          <Route path="/plugins" element={<PluginManager />} />
          <Route path="/shortcuts" element={<ShortcutsManager />} />
          <Route path="/clipboard" element={<ClipboardManager />} />
          <Route path="/conversations" element={<Conversations />} />
          <Route path="/workflows" element={<WorkflowBuilder />} />
          <Route path="/tasks" element={<Dashboard activeTab="tasks" />} />
          <Route path="/monitoring" element={<Dashboard activeTab="monitoring" />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>

        {/* Quick Actions Palette */}
        <QuickActions
          open={quickActionsOpen}
          onClose={() => setQuickActionsOpen(false)}
        />
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;