import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Chip,
  Tabs,
  Tab,
  Drawer,
  Fab
} from '@mui/material';
import { useAppStore } from '../store/appStore';
import { 
  Memory as MemoryIcon, 
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Wifi as WifiIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import ChatInterface from '../components/ChatInterface';

function Dashboard({ activeTab = 'dashboard' }) {
  const { systemMetrics, isConnected, assistantPaused } = useAppStore();
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <Box sx={{ p: 3, height: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Clippy Revival Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip 
            label={isConnected ? 'Connected' : 'Disconnected'} 
            color={isConnected ? 'success' : 'error'}
            size="small"
          />
          {assistantPaused && (
            <Chip label="Paused" color="warning" size="small" />
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* System Metrics */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SpeedIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">CPU Usage</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {systemMetrics.cpu.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MemoryIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Memory</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {systemMetrics.memory.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StorageIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Disk Usage</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {systemMetrics.disk.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WifiIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Network</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                ↑ {systemMetrics.network.upload.toFixed(1)} KB/s
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ↓ {systemMetrics.network.download.toFixed(1)} KB/s
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Quick Actions
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Welcome to Clippy Revival! Your AI assistant is ready to help you with:
            </Typography>
            <Box sx={{ mt: 2 }}>
              <ul>
                <li>System monitoring and optimization</li>
                <li>File management and organization</li>
                <li>Software installation and updates</li>
                <li>Web automation tasks</li>
                <li>General assistance powered by local AI</li>
              </ul>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Floating Action Button for Chat */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24
        }}
        onClick={() => setChatOpen(true)}
      >
        <ChatIcon />
      </Fab>

      {/* Chat Drawer */}
      <Drawer
        anchor="right"
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 500 } }
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">Chat with Clippy</Typography>
          </Box>
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <ChatInterface />
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
}

export default Dashboard;