import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';

// Import pages
import Dashboard from './pages/Dashboard';
import BuddyWindow from './pages/BuddyWindow';
import Settings from './pages/Settings';
import Characters from './pages/Characters';
import Scheduler from './pages/Scheduler';
import PluginManager from './pages/PluginManager';
import ShortcutsManager from './pages/ShortcutsManager';
import ClipboardManager from './pages/ClipboardManager';
import Conversations from './pages/Conversations';
import WorkflowBuilder from './pages/WorkflowBuilder';

// Import components
import ErrorBoundary from './components/ErrorBoundary';
import QuickActions from './components/QuickActions';

// Import store
import { useAppStore } from './store/appStore';

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
    </ErrorBoundary>
  );
}

export default App;