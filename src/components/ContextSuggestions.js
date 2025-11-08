import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Collapse,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Lightbulb as SuggestionIcon,
  Code as CodeIcon,
  Language as BrowserIcon,
  Article as WriteIcon,
  Schedule as TimeIcon,
  ContentPaste as ClipboardIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandIcon,
  ArrowForward as ActionIcon
} from '@mui/icons-material';

const backendUrl = 'http://127.0.0.1:43110';

const ContextSuggestions = () => {
  const [context, setContext] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [enabled, setEnabled] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (enabled) {
      loadContext();
      // Refresh context every 30 seconds
      const interval = setInterval(loadContext, 30000);
      return () => clearInterval(interval);
    }
  }, [enabled]);

  const loadContext = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/context/detect`);
      setContext(response.data);
      setSuggestions(response.data.suggestions || []);
    } catch (err) {
      console.error('Failed to load context:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeSuggestions = async () => {
    try {
      const response = await axios.get(`${backendUrl}/context/suggestions`);
      setSuggestions([...(suggestions || []), ...(response.data.suggestions || [])]);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    }
  };

  const handleToggleEnabled = async () => {
    try {
      await axios.post(`${backendUrl}/context/enable-suggestions?enabled=${!enabled}`);
      setEnabled(!enabled);
      if (!enabled) {
        loadContext();
      }
    } catch (err) {
      console.error('Failed to toggle suggestions:', err);
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'coding':
        return <CodeIcon />;
      case 'browsing':
        return <BrowserIcon />;
      case 'writing':
        return <WriteIcon />;
      case 'time':
        return <TimeIcon />;
      case 'clipboard':
        return <ClipboardIcon />;
      default:
        return <SuggestionIcon />;
    }
  };

  const getColorForType = (type) => {
    switch (type) {
      case 'coding':
        return 'primary';
      case 'browsing':
        return 'secondary';
      case 'writing':
        return 'success';
      case 'time':
        return 'warning';
      default:
        return 'default';
    }
  };

  const handleActionClick = (action) => {
    // In a real implementation, this would trigger the action
    alert(`Action: ${action}`);
  };

  if (!enabled) {
    return (
      <Paper sx={{ p: 2 }}>
        <FormControlLabel
          control={<Switch checked={enabled} onChange={handleToggleEnabled} />}
          label="Enable Smart Suggestions"
        />
      </Paper>
    );
  }

  return (
    <Paper sx={{ overflow: 'hidden' }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.light' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SuggestionIcon />
          <Typography variant="h6">Smart Suggestions</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="small" onClick={loadContext} disabled={loading}>
            <RefreshIcon />
          </IconButton>
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            <ExpandIcon sx={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }} />
          </IconButton>
        </Box>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ p: 2 }}>
          {/* Active Window */}
          {context?.active_window && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Current Window
              </Typography>
              <Typography variant="body2">
                {context.active_window.title || 'Unknown'}
              </Typography>
            </Box>
          )}

          {/* Suggestions */}
          {suggestions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body2" color="text.secondary">
                No suggestions available
              </Typography>
              <Button size="small" onClick={loadTimeSuggestions} sx={{ mt: 1 }}>
                Get Time-Based Suggestions
              </Button>
            </Box>
          ) : (
            <List dense>
              {suggestions.map((suggestion, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <Divider />}
                  <ListItem>
                    <ListItemIcon>
                      {getIconForType(suggestion.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={suggestion.message}
                      secondary={
                        <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {suggestion.actions?.map((action, idx) => (
                            <Chip
                              key={idx}
                              label={action}
                              size="small"
                              onClick={() => handleActionClick(action)}
                              icon={<ActionIcon />}
                              color={getColorForType(suggestion.type)}
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}

          {/* Controls */}
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <FormControlLabel
              control={<Switch checked={enabled} onChange={handleToggleEnabled} size="small" />}
              label="Enable suggestions"
            />
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default ContextSuggestions;
