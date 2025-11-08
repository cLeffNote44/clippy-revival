import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PlayArrow as RunIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';

const SchedulerPage = ({ backendUrl }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    action: 'system.cleanup',
    parameters: {},
    schedule_type: 'daily',
    schedule_value: '00:00',
    enabled: true
  });

  // Available actions
  const actions = [
    { value: 'system.cleanup', label: 'System Cleanup' },
    { value: 'backup.create', label: 'Create Backup' },
    { value: 'notification.send', label: 'Send Notification' },
    { value: 'custom', label: 'Custom Action' }
  ];

  useEffect(() => {
    loadTasks();
  }, [backendUrl]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/scheduler/tasks`);
      setTasks(response.data);
    } catch (error) {
      showSnackbar('Failed to load tasks: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenDialog = (task = null) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        name: task.name,
        action: task.action,
        parameters: task.parameters,
        schedule_type: task.schedule_type,
        schedule_value: task.schedule_value,
        enabled: task.enabled
      });
    } else {
      setEditingTask(null);
      setFormData({
        name: '',
        action: 'system.cleanup',
        parameters: {},
        schedule_type: 'daily',
        schedule_value: '00:00',
        enabled: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTask(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingTask) {
        // Update existing task
        await axios.put(`${backendUrl}/scheduler/tasks/${editingTask.id}`, {
          name: formData.name,
          parameters: formData.parameters,
          schedule_type: formData.schedule_type,
          schedule_value: formData.schedule_value,
          enabled: formData.enabled
        });
        showSnackbar('Task updated successfully', 'success');
      } else {
        // Create new task
        await axios.post(`${backendUrl}/scheduler/tasks`, formData);
        showSnackbar('Task created successfully', 'success');
      }
      handleCloseDialog();
      loadTasks();
    } catch (error) {
      showSnackbar('Failed to save task: ' + error.message, 'error');
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await axios.delete(`${backendUrl}/scheduler/tasks/${taskId}`);
      showSnackbar('Task deleted successfully', 'success');
      loadTasks();
    } catch (error) {
      showSnackbar('Failed to delete task: ' + error.message, 'error');
    }
  };

  const handleToggleEnabled = async (task) => {
    try {
      if (task.enabled) {
        await axios.post(`${backendUrl}/scheduler/tasks/${task.id}/disable`);
      } else {
        await axios.post(`${backendUrl}/scheduler/tasks/${task.id}/enable`);
      }
      showSnackbar(`Task ${task.enabled ? 'disabled' : 'enabled'}`, 'success');
      loadTasks();
    } catch (error) {
      showSnackbar('Failed to toggle task: ' + error.message, 'error');
    }
  };

  const handleRunNow = async (taskId) => {
    try {
      await axios.post(`${backendUrl}/scheduler/tasks/${taskId}/execute`);
      showSnackbar('Task execution started', 'success');
      loadTasks();
    } catch (error) {
      showSnackbar('Failed to run task: ' + error.message, 'error');
    }
  };

  const formatSchedule = (type, value) => {
    switch (type) {
      case 'once':
        return `Once at ${new Date(value).toLocaleString()}`;
      case 'interval':
        return `Every ${value} seconds`;
      case 'daily':
        return `Daily at ${value}`;
      case 'weekly':
        return `Weekly on ${value.day} at ${value.time}`;
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Scheduled Tasks
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadTasks}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            New Task
          </Button>
        </Box>
      </Box>

      {tasks.length === 0 && !loading ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No scheduled tasks yet. Create one to get started!
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Schedule</TableCell>
                <TableCell>Last Run</TableCell>
                <TableCell>Next Run</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Stats</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>{task.name}</TableCell>
                  <TableCell>{task.action}</TableCell>
                  <TableCell>{formatSchedule(task.schedule_type, task.schedule_value)}</TableCell>
                  <TableCell>{formatDate(task.last_run)}</TableCell>
                  <TableCell>{formatDate(task.next_run)}</TableCell>
                  <TableCell>
                    <Chip
                      label={task.enabled ? 'Enabled' : 'Disabled'}
                      color={task.enabled ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="caption" display="block">
                        Runs: {task.run_count}
                      </Typography>
                      {task.error_count > 0 && (
                        <Typography variant="caption" color="error" display="block">
                          Errors: {task.error_count}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleRunNow(task.id)}
                      title="Run now"
                    >
                      <RunIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleToggleEnabled(task)}
                      title={task.enabled ? 'Disable' : 'Enable'}
                    >
                      <Switch
                        checked={task.enabled}
                        size="small"
                      />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(task)}
                      title="Edit"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(task.id)}
                      title="Delete"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Task Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />

            <FormControl fullWidth>
              <InputLabel>Action</InputLabel>
              <Select
                value={formData.action}
                onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                label="Action"
              >
                {actions.map((action) => (
                  <MenuItem key={action.value} value={action.value}>
                    {action.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Schedule Type</InputLabel>
              <Select
                value={formData.schedule_type}
                onChange={(e) => setFormData({ ...formData, schedule_type: e.target.value })}
                label="Schedule Type"
              >
                <MenuItem value="once">Once</MenuItem>
                <MenuItem value="interval">Interval</MenuItem>
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
              </Select>
            </FormControl>

            {formData.schedule_type === 'daily' && (
              <TextField
                label="Time (HH:MM)"
                type="time"
                value={formData.schedule_value}
                onChange={(e) => setFormData({ ...formData, schedule_value: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            )}

            {formData.schedule_type === 'interval' && (
              <TextField
                label="Interval (seconds)"
                type="number"
                value={formData.schedule_value}
                onChange={(e) => setFormData({ ...formData, schedule_value: parseInt(e.target.value) })}
                fullWidth
              />
            )}

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
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingTask ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

SchedulerPage.propTypes = {
  backendUrl: PropTypes.string.isRequired
};

export default SchedulerPage;
