import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Chip,
  Paper
} from '@mui/material';
import {
  Search as SearchIcon,
  Chat as ChatIcon,
  Settings as SettingsIcon,
  Extension as PluginIcon,
  Schedule as ScheduleIcon,
  Face as CharacterIcon,
  ContentPaste as ClipboardIcon,
  Mic as MicIcon,
  Screenshot as ScreenshotIcon,
  History as HistoryIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const QuickActions = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredActions, setFilteredActions] = useState([]);

  const actions = [
    {
      id: 'new-chat',
      title: 'New Conversation',
      description: 'Start a new AI conversation',
      icon: <ChatIcon />,
      shortcut: 'Ctrl+N',
      action: () => {
        navigate('/dashboard');
        onClose();
      },
      keywords: ['chat', 'conversation', 'new', 'talk']
    },
    {
      id: 'search-conversations',
      title: 'Search Conversations',
      description: 'Search through conversation history',
      icon: <SearchIcon />,
      shortcut: 'Ctrl+Shift+F',
      action: () => {
        navigate('/conversations');
        onClose();
      },
      keywords: ['search', 'find', 'history', 'conversations']
    },
    {
      id: 'clipboard-history',
      title: 'Clipboard History',
      description: 'View and search clipboard history',
      icon: <ClipboardIcon />,
      shortcut: 'Ctrl+Shift+V',
      action: () => {
        navigate('/clipboard');
        onClose();
      },
      keywords: ['clipboard', 'paste', 'copy', 'history']
    },
    {
      id: 'voice-input',
      title: 'Voice Input',
      description: 'Start voice input',
      icon: <MicIcon />,
      shortcut: 'Ctrl+Shift+Space',
      action: () => {
        // Voice input action
        onClose();
      },
      keywords: ['voice', 'speech', 'talk', 'microphone']
    },
    {
      id: 'screenshot',
      title: 'Take Screenshot',
      description: 'Take screenshot and ask about it',
      icon: <ScreenshotIcon />,
      shortcut: 'Ctrl+Shift+S',
      action: () => {
        // Screenshot action
        onClose();
      },
      keywords: ['screenshot', 'capture', 'screen', 'image']
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Open Clippy settings',
      icon: <SettingsIcon />,
      shortcut: 'Ctrl+,',
      action: () => {
        navigate('/settings');
        onClose();
      },
      keywords: ['settings', 'preferences', 'config', 'options']
    },
    {
      id: 'plugins',
      title: 'Plugin Manager',
      description: 'Manage Clippy plugins',
      icon: <PluginIcon />,
      shortcut: 'Ctrl+Shift+E',
      action: () => {
        navigate('/plugins');
        onClose();
      },
      keywords: ['plugins', 'extensions', 'addons']
    },
    {
      id: 'scheduler',
      title: 'Scheduled Tasks',
      description: 'View and manage scheduled tasks',
      icon: <ScheduleIcon />,
      action: () => {
        navigate('/scheduler');
        onClose();
      },
      keywords: ['schedule', 'tasks', 'automation', 'cron']
    },
    {
      id: 'characters',
      title: 'Character Manager',
      description: 'Change Clippy\'s character',
      icon: <CharacterIcon />,
      action: () => {
        navigate('/characters');
        onClose();
      },
      keywords: ['character', 'avatar', 'appearance']
    },
    {
      id: 'toggle-pause',
      title: 'Toggle Pause',
      description: 'Pause or resume assistant',
      icon: <PauseIcon />,
      shortcut: 'Ctrl+Shift+P',
      action: () => {
        // Toggle pause action
        onClose();
      },
      keywords: ['pause', 'resume', 'stop', 'start']
    },
    {
      id: 'reload',
      title: 'Reload',
      description: 'Reload Clippy',
      icon: <RefreshIcon />,
      action: () => {
        window.location.reload();
      },
      keywords: ['reload', 'refresh', 'restart']
    }
  ];

  // Filter actions based on query
  useEffect(() => {
    if (!query.trim()) {
      setFilteredActions(actions);
      setSelectedIndex(0);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = actions.filter(action => {
      const matchesTitle = action.title.toLowerCase().includes(lowerQuery);
      const matchesDescription = action.description.toLowerCase().includes(lowerQuery);
      const matchesKeywords = action.keywords?.some(keyword =>
        keyword.toLowerCase().includes(lowerQuery)
      );

      return matchesTitle || matchesDescription || matchesKeywords;
    });

    setFilteredActions(filtered);
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!open) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredActions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredActions[selectedIndex]) {
          filteredActions[selectedIndex].action();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      default:
        break;
    }
  }, [open, filteredActions, selectedIndex, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Reset query when dialog opens
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          position: 'fixed',
          top: '20%',
          m: 0
        }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Search Input */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            fullWidth
            autoFocus
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            variant="standard"
            InputProps={{
              disableUnderline: true,
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{
              '& input': {
                fontSize: '1.1rem'
              }
            }}
          />
        </Box>

        {/* Actions List */}
        <List sx={{ maxHeight: 400, overflow: 'auto', p: 1 }}>
          {filteredActions.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No actions found for &quot;{query}&quot;
              </Typography>
            </Box>
          ) : (
            filteredActions.map((action, index) => (
              <ListItem
                key={action.id}
                button
                selected={index === selectedIndex}
                onClick={() => action.action()}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark'
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText'
                    },
                    '& .MuiChip-root': {
                      borderColor: 'primary.contrastText',
                      color: 'primary.contrastText'
                    }
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {action.icon}
                </ListItemIcon>
                <ListItemText
                  primary={action.title}
                  secondary={action.description}
                  secondaryTypographyProps={{
                    sx: {
                      color: index === selectedIndex ? 'inherit' : 'text.secondary',
                      opacity: index === selectedIndex ? 0.8 : 1
                    }
                  }}
                />
                {action.shortcut && (
                  <Chip
                    label={action.shortcut}
                    size="small"
                    variant="outlined"
                    sx={{ ml: 1 }}
                  />
                )}
              </ListItem>
            ))
          )}
        </List>

        {/* Footer */}
        <Box
          sx={{
            p: 1.5,
            borderTop: 1,
            borderColor: 'divider',
            display: 'flex',
            gap: 2,
            fontSize: '0.75rem',
            color: 'text.secondary'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Chip label="↑↓" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
            <span>Navigate</span>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Chip label="↵" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
            <span>Select</span>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Chip label="Esc" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
            <span>Close</span>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default QuickActions;
