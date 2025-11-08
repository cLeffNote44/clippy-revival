import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Switch,
  FormControlLabel,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PlayArrow as ExecuteIcon,
  Schedule as ScheduleIcon,
  Build as BuildIcon
} from '@mui/icons-material';

const backendUrl = 'http://127.0.0.1:43110';

const WorkflowBuilder = () => {
  const [workflows, setWorkflows] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createDialog, setCreateDialog] = useState(false);
  const [templateDialog, setTemplateDialog] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    triggerType: 'schedule',
    triggerValue: '',
    actions: [],
    enabled: true
  });

  useEffect(() => {
    loadWorkflows();
    loadTemplates();
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${backendUrl}/workflows/`);
      setWorkflows(response.data.workflows || []);
    } catch (err) {
      console.error('Failed to load workflows:', err);
      setError('Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await axios.get(`${backendUrl}/workflows/templates`);
      setTemplates(response.data.templates || []);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const handleCreate = () => {
    setEditingWorkflow(null);
    setFormData({
      name: '',
      description: '',
      triggerType: 'schedule',
      triggerValue: '0 0 * * *',
      actions: [],
      enabled: true
    });
    setCreateDialog(true);
  };

  const handleEdit = (workflow) => {
    setEditingWorkflow(workflow);
    setFormData({
      name: workflow.name,
      description: workflow.description,
      triggerType: workflow.trigger?.type || 'schedule',
      triggerValue: workflow.trigger?.cron || '',
      actions: workflow.actions || [],
      enabled: workflow.enabled
    });
    setCreateDialog(true);
  };

  const handleSave = async () => {
    try {
      const workflowData = {
        name: formData.name,
        description: formData.description,
        trigger: {
          type: formData.triggerType,
          cron: formData.triggerValue
        },
        actions: formData.actions,
        enabled: formData.enabled
      };

      if (editingWorkflow) {
        await axios.put(`${backendUrl}/workflows/${editingWorkflow.id}`, workflowData);
      } else {
        await axios.post(`${backendUrl}/workflows/`, workflowData);
      }

      setCreateDialog(false);
      await loadWorkflows();
    } catch (err) {
      console.error('Failed to save workflow:', err);
      setError(err.response?.data?.detail || 'Failed to save workflow');
    }
  };

  const handleDelete = async (workflowId) => {
    if (!window.confirm('Delete this workflow?')) {
      return;
    }

    try {
      await axios.delete(`${backendUrl}/workflows/${workflowId}`);
      await loadWorkflows();
    } catch (err) {
      console.error('Failed to delete workflow:', err);
      setError('Failed to delete workflow');
    }
  };

  const handleToggle = async (workflow) => {
    try {
      await axios.put(`${backendUrl}/workflows/${workflow.id}`, {
        enabled: !workflow.enabled
      });
      await loadWorkflows();
    } catch (err) {
      console.error('Failed to toggle workflow:', err);
      setError('Failed to toggle workflow');
    }
  };

  const handleExecute = async (workflowId) => {
    try {
      await axios.post(`${backendUrl}/workflows/${workflowId}/execute`);
      setError(null);
      alert('Workflow executed successfully!');
    } catch (err) {
      console.error('Failed to execute workflow:', err);
      setError('Failed to execute workflow');
    }
  };

  const handleCreateFromTemplate = async (template) => {
    try {
      const name = prompt(`Name for workflow based on "${template.name}":`, template.name);
      if (!name) return;

      await axios.post(`${backendUrl}/workflows/from-template/${template.id}?name=${encodeURIComponent(name)}`);
      setTemplateDialog(false);
      await loadWorkflows();
    } catch (err) {
      console.error('Failed to create from template:', err);
      setError('Failed to create from template');
    }
  };

  const addAction = () => {
    setFormData({
      ...formData,
      actions: [...formData.actions, { type: 'notification', message: '' }]
    });
  };

  const removeAction = (index) => {
    const newActions = [...formData.actions];
    newActions.splice(index, 1);
    setFormData({ ...formData, actions: newActions });
  };

  const updateAction = (index, field, value) => {
    const newActions = [...formData.actions];
    newActions[index] = { ...newActions[index], [field]: value };
    setFormData({ ...formData, actions: newActions });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Workflow Automation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Automate repetitive tasks with custom workflows
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<BuildIcon />}
            onClick={() => setTemplateDialog(true)}
          >
            Templates
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
          >
            Create Workflow
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Workflows List */}
      {workflows.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No workflows yet. Create one or use a template!
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {workflows.map((workflow) => (
            <Grid item xs={12} md={6} key={workflow.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6">{workflow.name}</Typography>
                    <Switch
                      checked={workflow.enabled}
                      onChange={() => handleToggle(workflow)}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {workflow.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<ScheduleIcon />}
                      label={workflow.trigger?.type || 'No trigger'}
                      size="small"
                    />
                    <Chip
                      label={`${workflow.actions?.length || 0} actions`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" startIcon={<EditIcon />} onClick={() => handleEdit(workflow)}>
                      Edit
                    </Button>
                    <Button size="small" startIcon={<ExecuteIcon />} onClick={() => handleExecute(workflow.id)}>
                      Run
                    </Button>
                  </Box>
                  <IconButton size="small" color="error" onClick={() => handleDelete(workflow.id)}>
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingWorkflow ? 'Edit Workflow' : 'Create Workflow'}</DialogTitle>
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

            <Typography variant="h6" sx={{ mt: 2 }}>Trigger</Typography>
            <FormControl fullWidth>
              <InputLabel>Trigger Type</InputLabel>
              <Select
                value={formData.triggerType}
                label="Trigger Type"
                onChange={(e) => setFormData({ ...formData, triggerType: e.target.value })}
              >
                <MenuItem value="schedule">Schedule (Cron)</MenuItem>
                <MenuItem value="event">Event</MenuItem>
                <MenuItem value="manual">Manual</MenuItem>
              </Select>
            </FormControl>

            {formData.triggerType === 'schedule' && (
              <TextField
                label="Cron Expression"
                value={formData.triggerValue}
                onChange={(e) => setFormData({ ...formData, triggerValue: e.target.value })}
                fullWidth
                helperText="Example: 0 0 * * * (daily at midnight)"
              />
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Typography variant="h6">Actions</Typography>
              <Button startIcon={<AddIcon />} onClick={addAction} size="small">
                Add Action
              </Button>
            </Box>

            {formData.actions.map((action, index) => (
              <Paper key={index} sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <FormControl sx={{ minWidth: 150 }}>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={action.type}
                      label="Type"
                      onChange={(e) => updateAction(index, 'type', e.target.value)}
                    >
                      <MenuItem value="notification">Notification</MenuItem>
                      <MenuItem value="ai_chat">AI Chat</MenuItem>
                      <MenuItem value="backup_files">Backup Files</MenuItem>
                      <MenuItem value="run_command">Run Command</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label="Value"
                    value={action.message || action.prompt || action.command || ''}
                    onChange={(e) => {
                      const field = action.type === 'ai_chat' ? 'prompt' :
                                   action.type === 'run_command' ? 'command' : 'message';
                      updateAction(index, field, e.target.value);
                    }}
                    fullWidth
                  />
                  <IconButton onClick={() => removeAction(index)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Paper>
            ))}

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
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={!formData.name}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Templates Dialog */}
      <Dialog open={templateDialog} onClose={() => setTemplateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Workflow Templates</DialogTitle>
        <DialogContent>
          <List>
            {templates.map((template, index) => (
              <React.Fragment key={template.id}>
                {index > 0 && <Divider />}
                <ListItem
                  button
                  onClick={() => handleCreateFromTemplate(template)}
                >
                  <ListItemText
                    primary={template.name}
                    secondary={template.description}
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkflowBuilder;
