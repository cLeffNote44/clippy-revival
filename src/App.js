import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';

// Import pages
import Dashboard from './pages/Dashboard';
import BuddyWindow from './pages/BuddyWindow';
import Settings from './pages/Settings';
import Characters from './pages/Characters';

// Import store
import { useAppStore } from './store/appStore';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { initializeBackend } = useAppStore();

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
  }, []);

  // Check if we're in buddy window mode
  const isBuddyWindow = location.pathname === '/buddy';

  if (isBuddyWindow) {
    return (
      <Box sx={{ width: '100%', height: '100%', overflow: 'hidden' }}>
        <BuddyWindow />
      </Box>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/characters" element={<Characters />} />
      <Route path="/tasks" element={<Dashboard activeTab="tasks" />} />
      <Route path="/monitoring" element={<Dashboard activeTab="monitoring" />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
}

export default App;