import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon
} from '@mui/material';
import {
  Search as SearchIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  GetApp as ExportIcon,
  MoreVert as MoreIcon,
  Chat as ChatIcon,
  DateRange as DateIcon,
  TrendingUp as StatsIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

const backendUrl = 'http://127.0.0.1:43110';

const Conversations = () => {
  const [sessions, setSessions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [messages, setMessages] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    loadSessions();
    loadStatistics();
  }, [search]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      // We'll use conversation_db endpoints
      const response = await axios.get(`${backendUrl}/conversations/sessions`, {
        params: search ? { search } : {}
      });
      setSessions(response.data.sessions || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await axios.get(`${backendUrl}/conversations/statistics`);
      setStatistics(response.data.statistics);
    } catch (err) {
      console.error('Failed to load statistics:', err);
    }
  };

  const handleViewSession = async (sessionId) => {
    try {
      const response = await axios.get(`${backendUrl}/conversations/session/${sessionId}`);
      setMessages(response.data.messages || []);
      setSelectedSession(sessions.find(s => s.session_id === sessionId));
      setViewDialog(true);
    } catch (err) {
      console.error('Failed to load session:', err);
      setError('Failed to load session details');
    }
  };

  const handleDelete = async (sessionId) => {
    if (!window.confirm('Delete this conversation?')) {
      return;
    }

    try {
      await axios.delete(`${backendUrl}/conversations/session/${sessionId}`);
      await loadSessions();
      await loadStatistics();
    } catch (err) {
      console.error('Failed to delete session:', err);
      setError('Failed to delete conversation');
    }
  };

  const handleExport = async (sessionId) => {
    try {
      const response = await axios.get(`${backendUrl}/conversations/session/${sessionId}/export`);
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation-${sessionId}-${Date.now()}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export conversation:', err);
      setError('Failed to export conversation');
    }
  };

  const handleExportAll = async () => {
    try {
      const response = await axios.get(`${backendUrl}/conversations/export-all`);
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all-conversations-${Date.now()}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export all conversations:', err);
      setError('Failed to export conversations');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Delete ALL conversations? This cannot be undone!')) {
      return;
    }

    try {
      await axios.delete(`${backendUrl}/conversations/clear-all`);
      await loadSessions();
      await loadStatistics();
    } catch (err) {
      console.error('Failed to clear conversations:', err);
      setError('Failed to clear conversations');
    }
  };

  const getPreview = (messages) => {
    if (!messages || messages.length === 0) return 'No messages';
    const lastMessage = messages[messages.length - 1];
    const content = lastMessage.content || '';
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Conversation History
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View and manage your AI conversations
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExportAll}
          >
            Export All
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleClearAll}
          >
            Clear All
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics */}
      {statistics && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {statistics.total_sessions || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Sessions
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="secondary">
                  {statistics.total_messages || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Messages
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {statistics.active_sessions || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Active Sessions
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {statistics.avg_messages_per_session?.toFixed(1) || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Avg Messages/Session
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Search conversations..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
        }}
      />

      {/* Conversations List */}
      {sessions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No conversations found
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {sessions.map((session) => (
            <Grid item xs={12} key={session.session_id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {session.session_id}
                      </Typography>
                      {session.model && (
                        <Chip
                          label={session.model}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                      )}
                      <Chip
                        label={`${session.message_count || 0} messages`}
                        size="small"
                        icon={<ChatIcon />}
                      />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {session.created_at && format(new Date(session.created_at), 'MMM d, yyyy h:mm a')}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {getPreview(session.messages)}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      startIcon={<ViewIcon />}
                      onClick={() => handleViewSession(session.session_id)}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      startIcon={<ExportIcon />}
                      onClick={() => handleExport(session.session_id)}
                    >
                      Export
                    </Button>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(session.session_id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* View Dialog */}
      <Dialog
        open={viewDialog}
        onClose={() => setViewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedSession && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6">{selectedSession.session_id}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {messages.length} messages
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <List>
                {messages.map((message, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <Divider sx={{ my: 2 }} />}
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Chip
                              label={message.role}
                              size="small"
                              color={message.role === 'user' ? 'primary' : 'secondary'}
                            />
                            {message.timestamp && (
                              <Typography variant="caption" color="text.secondary">
                                {format(new Date(message.timestamp), 'h:mm:ss a')}
                              </Typography>
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography
                            variant="body2"
                            component="div"
                            sx={{ whiteSpace: 'pre-wrap', mt: 1 }}
                          >
                            {message.content}
                          </Typography>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => handleExport(selectedSession.session_id)} startIcon={<ExportIcon />}>
                Export
              </Button>
              <Button onClick={() => setViewDialog(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Conversations;
