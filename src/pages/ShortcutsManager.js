import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  TextField,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Restore as RestoreIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const backendUrl = 'http://127.0.0.1:43110';

const ShortcutsManager = () => {
  const [shortcuts, setShortcuts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState(null);
  const [recordingKey, setRecordingKey] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortcut: '',
    action: '',
    global: false,
    enabled: true
  });

  useEffect(() => {
    loadShortcuts();
  }, []);

  const loadShortcuts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${backendUrl}/shortcuts/`);
      const shortcutsArray = Object.entries(response.data.shortcuts).map(([id, data]) => ({
        id,
        ...data
      }));
      setShortcuts(shortcutsArray);
    } catch (err) {
      console.error('Failed to load shortcuts:', err);
      setError('Failed to load shortcuts');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (shortcut) => {
    setEditingShortcut(shortcut);
    setFormData({
      name: shortcut.name,
      description: shortcut.description || '',
      shortcut: shortcut.shortcut,
      action: shortcut.action,
      global: shortcut.global || false,
      enabled: shortcut.enabled !== false
    });
    setEditDialog(true);
  };

  const handleCreate = () => {
    setFormData({
      name: '',
      description: '',
      shortcut: '',
      action: '',
      global: false,
      enabled: true
    });
    setCreateDialog(true);
  };

  const handleSaveEdit = async () => {
    try {
      await axios.put(`${backendUrl}/shortcuts/${editingShortcut.id}`, {
        name: formData.name,
        description: formData.description,
        shortcut: formData.shortcut,
        action: formData.action,
        global_: formData.global,
        enabled: formData.enabled
      });
      setEditDialog(false);
      setEditingShortcut(null);
      await loadShortcuts();
    } catch (err) {
      console.error('Failed to update shortcut:', err);
      setError(err.response?.data?.detail || 'Failed to update shortcut');
    }
  };

  const handleCreateShortcut = async () => {
    try {
      await axios.post(`${backendUrl}/shortcuts/`, {
        name: formData.name,
        description: formData.description,
        shortcut: formData.shortcut,
        action: formData.action,
        global_: formData.global,
        enabled: formData.enabled
      });
      setCreateDialog(false);
      await loadShortcuts();
    } catch (err) {
      console.error('Failed to create shortcut:', err);
      setError(err.response?.data?.detail || 'Failed to create shortcut');
    }
  };

  const handleDelete = async (shortcutId) => {
    if (!window.confirm('Are you sure you want to delete this shortcut?')) {
      return;
    }

    try {
      await axios.delete(`${backendUrl}/shortcuts/${shortcutId}`);
      await loadShortcuts();
    } catch (err) {
      console.error('Failed to delete shortcut:', err);
      setError(err.response?.data?.detail || 'Failed to delete shortcut');
    }
  };

  const handleToggle = async (shortcut) => {
    try {
      await axios.put(`${backendUrl}/shortcuts/${shortcut.id}`, {
        enabled: !shortcut.enabled
      });
      await loadShortcuts();
    } catch (err) {
      console.error('Failed to toggle shortcut:', err);
      setError('Failed to toggle shortcut');
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all shortcuts to defaults? This will remove custom shortcuts.')) {
      return;
    }

    try {
      await axios.post(`${backendUrl}/shortcuts/reset`);
      await loadShortcuts();
    } catch (err) {
      console.error('Failed to reset shortcuts:', err);
      setError('Failed to reset shortcuts');
    }
  };

  const handleKeyRecord = (e) => {
    if (!recordingKey) return;

    e.preventDefault();

    const modifiers = [];
    if (e.ctrlKey) modifiers.push('Ctrl');
    if (e.altKey) modifiers.push('Alt');
    if (e.shiftKey) modifiers.push('Shift');
    if (e.metaKey) modifiers.push('Meta');

    const key = e.key === ' ' ? 'Space' : e.key.toUpperCase();

    if (modifiers.length > 0 && key !== 'CONTROL' && key !== 'ALT' && key !== 'SHIFT' && key !== 'META') {
      const shortcut = [...modifiers, key].join('+');
      setFormData({ ...formData, shortcut });
      setRecordingKey(false);
    }
  };

  useEffect(() => {
    if (recordingKey) {
      document.addEventListener('keydown', handleKeyRecord);
      return () => document.removeEventListener('keydown', handleKeyRecord);
    }
  }, [recordingKey]);

  const renderShortcutDialog = (isCreate = false) => (
    <Dialog
      open={isCreate ? createDialog : editDialog}
      onClose={() => isCreate ? setCreateDialog(false) : setEditDialog(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {isCreate ? 'Create Custom Shortcut' : 'Edit Shortcut'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
          />
          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            fullWidth
            multiline
            rows={2}
          />
          <Box>
            <TextField
              label="Shortcut"
              value={formData.shortcut}
              onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
              fullWidth
              InputProps={{
                endAdornment: (
                  <Button
                    size="small"
                    onClick={() => setRecordingKey(true)}
                    variant={recordingKey ? 'contained' : 'outlined'}
                  >
                    {recordingKey ? 'Press keys...' : 'Record'}
                  </Button>
                )
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Example: Ctrl+Alt+C or Ctrl+Shift+S
            </Typography>
          </Box>
          <TextField
            label="Action ID"
            value={formData.action}
            onChange={(e) => setFormData({ ...formData, action: e.target.value })}
            fullWidth
            helperText="Internal action identifier"
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.global}
                onChange={(e) => setFormData({ ...formData, global: e.target.checked })}
              />
            }
            label="Global (works anywhere)"
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              />
            }
            label="Enabled"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => isCreate ? setCreateDialog(false) : setEditDialog(false)}>
          Cancel
        </Button>
        <Button
          onClick={isCreate ? handleCreateShortcut : handleSaveEdit}
          variant="contained"
          disabled={!formData.name || !formData.shortcut || !formData.action}
        >
          {isCreate ? 'Create' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Keyboard Shortcuts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Customize keyboard shortcuts for quick actions
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RestoreIcon />}
            onClick={handleReset}
          >
            Reset to Defaults
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
          >
            Create Custom
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Shortcuts List */}
      <Paper>
        <List>
          {shortcuts.map((shortcut, index) => (
            <React.Fragment key={shortcut.id}>
              {index > 0 && <Divider />}
              <ListItem>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1">
                        {shortcut.name}
                      </Typography>
                      {shortcut.global && (
                        <Chip label="Global" size="small" color="primary" variant="outlined" />
                      )}
                      {shortcut.custom && (
                        <Chip label="Custom" size="small" color="secondary" variant="outlined" />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        {shortcut.description}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <Chip
                          label={shortcut.shortcut}
                          size="small"
                          sx={{ fontFamily: 'monospace' }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          → {shortcut.action}
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
                <ListItemSecondaryAction sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Switch
                    checked={shortcut.enabled !== false}
                    onChange={() => handleToggle(shortcut)}
                    edge="end"
                  />
                  <Tooltip title="Edit">
                    <IconButton
                      edge="end"
                      onClick={() => handleEdit(shortcut)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  {shortcut.custom && (
                    <Tooltip title="Delete">
                      <IconButton
                        edge="end"
                        onClick={() => handleDelete(shortcut.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </Paper>

      {/* Dialogs */}
      {renderShortcutDialog(false)}
      {renderShortcutDialog(true)}
    </Box>
  );
};

export default ShortcutsManager;
