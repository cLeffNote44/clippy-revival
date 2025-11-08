import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import { useAppStore } from '../store/appStore';

function Settings() {
  const navigate = useNavigate();
  const { backendUrl } = useAppStore();
  const [models, setModels] = useState([]);
  const [activeModel, setActiveModel] = useState('');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    autoExecuteTools: false,
    showNotifications: true,
    startOnBoot: false,
    pausedOnStart: false
  });

  useEffect(() => {
    loadModels();
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadModels = async () => {
    try {
      const response = await fetch(`${backendUrl}/ai/models`);
      const data = await response.json();
      setModels(data.models || []);
      setActiveModel(data.active_model || '');
      setLoading(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load models:', error);
      setLoading(false);
    }
  };

  const loadSettings = () => {
    const saved = localStorage.getItem('clippy-settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  };

  const saveSettings = () => {
    localStorage.setItem('clippy-settings', JSON.stringify(settings));
  };

  const handleModelChange = async (event) => {
    const newModel = event.target.value;
    
    try {
      const response = await fetch(`${backendUrl}/ai/model`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_name: newModel })
      });

      if (response.ok) {
        setActiveModel(newModel);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to change model:', error);
    }
  };

  const handleSettingChange = (key) => (event) => {
    const newSettings = {
      ...settings,
      [key]: event.target.checked
    };
    setSettings(newSettings);
    saveSettings();
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Settings
      </Typography>

      {/* AI Model Selection */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          AI Model
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select which Ollama model Clippy should use
        </Typography>

        {loading ? (
          <CircularProgress size={24} />
        ) : (
          <FormControl fullWidth>
            <InputLabel>Active Model</InputLabel>
            <Select
              value={activeModel}
              label="Active Model"
              onChange={handleModelChange}
            >
              {models.map((model) => (
                <MenuItem key={model} value={model}>
                  {model}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {models.length === 0 && !loading && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            No models found. Please pull a model using Ollama first.
            <br />
            Example: <code>ollama pull llama3.2</code>
          </Alert>
        )}
      </Paper>

      {/* Behavior Settings */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Behavior
        </Typography>
        
        <List>
          <ListItem>
            <ListItemText
              primary="Auto-execute safe tools"
              secondary="Automatically execute tools that don't require confirmation"
            />
            <Switch
              checked={settings.autoExecuteTools}
              onChange={handleSettingChange('autoExecuteTools')}
            />
          </ListItem>
          
          <Divider />
          
          <ListItem>
            <ListItemText
              primary="Show notifications"
              secondary="Display desktop notifications for important events"
            />
            <Switch
              checked={settings.showNotifications}
              onChange={handleSettingChange('showNotifications')}
            />
          </ListItem>
          
          <Divider />
          
          <ListItem>
            <ListItemText
              primary="Start on boot"
              secondary="Launch Clippy Revival when Windows starts"
            />
            <Switch
              checked={settings.startOnBoot}
              onChange={handleSettingChange('startOnBoot')}
            />
          </ListItem>
          
          <Divider />
          
          <ListItem>
            <ListItemText
              primary="Start paused"
              secondary="Start with assistant paused (can be resumed from tray)"
            />
            <Switch
              checked={settings.pausedOnStart}
              onChange={handleSettingChange('pausedOnStart')}
            />
          </ListItem>
        </List>
      </Paper>

      {/* Character Settings */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Character
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Customize Clippy&apos;s appearance and behavior
        </Typography>

        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => navigate('/characters')}
        >
          Manage Characters
        </Button>

        <Button
          variant="outlined"
          sx={{ mt: 2, ml: 2 }}
          onClick={() => navigate('/scheduler')}
        >
          Manage Scheduled Tasks
        </Button>
      </Paper>

      {/* Advanced Settings */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Advanced
        </Typography>
        
        <Button
          variant="outlined"
          color="error"
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
          sx={{ mr: 2 }}
        >
          Clear All Data
        </Button>
        
        <Button
          variant="outlined"
          onClick={() => {
            useAppStore.getState().initializeBackend();
          }}
        >
          Reconnect Backend
        </Button>
      </Paper>
    </Box>
  );
}

export default Settings;