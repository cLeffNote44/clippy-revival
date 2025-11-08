import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Switch,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
  FormControlLabel
} from '@mui/material';
import {
  Extension as PluginIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
  CheckCircle as EnabledIcon,
  Cancel as DisabledIcon,
  Delete as UnloadIcon
} from '@mui/icons-material';

const backendUrl = 'http://127.0.0.1:43110';

const PluginManager = () => {
  const [plugins, setPlugins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlugin, setSelectedPlugin] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsValues, setSettingsValues] = useState({});

  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = async () => {
    try {
      setLoading(true);
      setError(null);

      // First discover available plugins
      const discoverRes = await axios.get(`${backendUrl}/plugins/discover`);
      const availablePlugins = discoverRes.data.plugins;

      // Load all discovered plugins
      for (const pluginId of availablePlugins) {
        try {
          await axios.post(`${backendUrl}/plugins/${pluginId}/load`);
        } catch (e) {
          console.warn(`Failed to load plugin ${pluginId}:`, e);
        }
      }

      // Get list of all loaded plugins
      const response = await axios.get(`${backendUrl}/plugins/list`);
      setPlugins(response.data);
    } catch (err) {
      console.error('Failed to load plugins:', err);
      setError('Failed to load plugins. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePlugin = async (pluginId, currentlyEnabled) => {
    try {
      if (currentlyEnabled) {
        await axios.post(`${backendUrl}/plugins/${pluginId}/disable`);
      } else {
        await axios.post(`${backendUrl}/plugins/${pluginId}/enable`);
      }

      // Reload plugins list
      await loadPlugins();
    } catch (err) {
      console.error(`Failed to ${currentlyEnabled ? 'disable' : 'enable'} plugin:`, err);
      setError(`Failed to ${currentlyEnabled ? 'disable' : 'enable'} plugin: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleReloadPlugin = async (pluginId) => {
    try {
      await axios.post(`${backendUrl}/plugins/${pluginId}/reload`);
      await loadPlugins();
    } catch (err) {
      console.error('Failed to reload plugin:', err);
      setError(`Failed to reload plugin: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleUnloadPlugin = async (pluginId) => {
    try {
      await axios.post(`${backendUrl}/plugins/${pluginId}/unload`);
      await loadPlugins();
    } catch (err) {
      console.error('Failed to unload plugin:', err);
      setError(`Failed to unload plugin: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleShowDetails = (plugin) => {
    setSelectedPlugin(plugin);
    setDetailsOpen(true);
  };

  const handleShowSettings = (plugin) => {
    setSelectedPlugin(plugin);
    setSettingsValues(plugin.settings || {});
    setSettingsOpen(true);
  };

  const handleSaveSetting = async (key, value) => {
    try {
      await axios.put(`${backendUrl}/plugins/${selectedPlugin.id}/settings`, {
        key,
        value
      });

      setSettingsValues(prev => ({
        ...prev,
        [key]: value
      }));

      // Update local plugin data
      setPlugins(prev => prev.map(p =>
        p.id === selectedPlugin.id
          ? { ...p, settings: { ...p.settings, [key]: value } }
          : p
      ));
    } catch (err) {
      console.error('Failed to save setting:', err);
      setError(`Failed to save setting: ${err.response?.data?.detail || err.message}`);
    }
  };

  const getPermissionLevelColor = (level) => {
    switch (level) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getPermissionLevelLabel = (level) => {
    switch (level) {
      case 'high':
        return 'High Risk';
      case 'medium':
        return 'Medium Risk';
      case 'low':
        return 'Low Risk';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Plugin Manager
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and configure Clippy plugins
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadPlugins}
        >
          Refresh
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Info Alert */}
      {plugins.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>No Plugins Found</AlertTitle>
          No plugins are currently installed. Place plugin folders in the <code>plugins/</code> directory to get started.
        </Alert>
      )}

      {/* Plugins Grid */}
      <Grid container spacing={3}>
        {plugins.map((plugin) => (
          <Grid item xs={12} md={6} lg={4} key={plugin.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: plugin.enabled ? '2px solid' : '1px solid',
                borderColor: plugin.enabled ? 'primary.main' : 'divider'
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                {/* Plugin Header */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <PluginIcon sx={{ mr: 1, mt: 0.5, color: plugin.enabled ? 'primary.main' : 'text.disabled' }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="div">
                      {plugin.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      v{plugin.version} • {plugin.author.name}
                    </Typography>
                  </Box>
                  <Tooltip title={plugin.enabled ? 'Enabled' : 'Disabled'}>
                    {plugin.enabled ? (
                      <EnabledIcon color="success" />
                    ) : (
                      <DisabledIcon color="disabled" />
                    )}
                  </Tooltip>
                </Box>

                {/* Description */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {plugin.description || 'No description available'}
                </Typography>

                {/* Permission Level Badge */}
                <Box sx={{ mb: 2 }}>
                  <Chip
                    icon={<SecurityIcon />}
                    label={getPermissionLevelLabel(plugin.permission_level)}
                    color={getPermissionLevelColor(plugin.permission_level)}
                    size="small"
                  />
                  <Chip
                    label={`${plugin.permissions.length} permissions`}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Box>
              </CardContent>

              <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={plugin.enabled}
                      onChange={() => handleTogglePlugin(plugin.id, plugin.enabled)}
                      color="primary"
                    />
                  }
                  label={plugin.enabled ? 'Enabled' : 'Disabled'}
                />
                <Box>
                  <Tooltip title="Details">
                    <IconButton size="small" onClick={() => handleShowDetails(plugin)}>
                      <InfoIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Settings">
                    <IconButton size="small" onClick={() => handleShowSettings(plugin)}>
                      <SettingsIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Reload">
                    <IconButton size="small" onClick={() => handleReloadPlugin(plugin.id)}>
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Unload">
                    <IconButton size="small" onClick={() => handleUnloadPlugin(plugin.id)} color="error">
                      <UnloadIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Plugin Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedPlugin && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PluginIcon sx={{ mr: 1 }} />
                {selectedPlugin.name}
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="h6" gutterBottom>
                Plugin Information
              </Typography>
              <List>
                <ListItem>
                  <ListItemText primary="ID" secondary={selectedPlugin.id} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Version" secondary={selectedPlugin.version} />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Author"
                    secondary={
                      <>
                        {selectedPlugin.author.name}
                        {selectedPlugin.author.email && ` (${selectedPlugin.author.email})`}
                        {selectedPlugin.author.url && (
                          <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                            <a href={selectedPlugin.author.url} target="_blank" rel="noopener noreferrer">
                              {selectedPlugin.author.url}
                            </a>
                          </Box>
                        )}
                      </>
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Status"
                    secondary={selectedPlugin.enabled ? 'Enabled' : 'Disabled'}
                  />
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Permissions ({selectedPlugin.permissions.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedPlugin.permissions.map((perm) => (
                  <Chip key={perm} label={perm} size="small" variant="outlined" />
                ))}
              </Box>
              {selectedPlugin.permissions.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  This plugin does not request any permissions.
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Plugin Settings Dialog */}
      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedPlugin && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SettingsIcon sx={{ mr: 1 }} />
                {selectedPlugin.name} Settings
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              {Object.keys(settingsValues).length === 0 ? (
                <Alert severity="info">
                  This plugin has no configurable settings.
                </Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {Object.entries(settingsValues).map(([key, value]) => (
                    <TextField
                      key={key}
                      label={key}
                      value={value}
                      onChange={(e) => handleSaveSetting(key, e.target.value)}
                      fullWidth
                      variant="outlined"
                    />
                  ))}
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSettingsOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default PluginManager;
