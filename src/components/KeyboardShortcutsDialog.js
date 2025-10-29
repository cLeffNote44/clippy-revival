import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Chip
} from '@mui/material';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import { SHORTCUTS, formatShortcut } from '../utils/keyboardShortcuts';

/**
 * Dialog showing all available keyboard shortcuts
 */
const KeyboardShortcutsDialog = ({ open, onClose }) => {
  const shortcutGroups = {
    Navigation: ['SHOW_DASHBOARD', 'SHOW_BUDDY', 'SHOW_SETTINGS'],
    Actions: ['SEND_MESSAGE', 'CLOSE_WINDOW', 'REFRESH'],
    Search: ['SEARCH'],
    Help: ['SHOW_HELP']
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <KeyboardIcon />
          <Typography variant="h6">Keyboard Shortcuts</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {Object.entries(shortcutGroups).map(([groupName, shortcuts], index) => (
          <Box key={groupName} sx={{ mb: index < Object.keys(shortcutGroups).length - 1 ? 3 : 0 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              {groupName}
            </Typography>
            {shortcuts.map((shortcutName) => {
              const shortcut = SHORTCUTS[shortcutName];
              if (!shortcut) return null;

              return (
                <Box
                  key={shortcutName}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Typography variant="body2">{shortcut.description}</Typography>
                  <Chip
                    label={formatShortcut(shortcut)}
                    size="small"
                    variant="outlined"
                    sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                  />
                </Box>
              );
            })}
          </Box>
        ))}

        <Divider sx={{ my: 2 }} />

        <Typography variant="caption" color="text.secondary">
          <strong>Global Shortcuts</strong> (work even when app is minimized):
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: 1
            }}
          >
            <Typography variant="body2">Show Dashboard</Typography>
            <Chip
              label="Ctrl + Shift + D"
              size="small"
              variant="outlined"
              color="primary"
              sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
            />
          </Box>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: 1
            }}
          >
            <Typography variant="body2">Toggle Buddy Window</Typography>
            <Chip
              label="Ctrl + Shift + B"
              size="small"
              variant="outlined"
              color="primary"
              sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default KeyboardShortcutsDialog;
