import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Alert,
  Menu,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Delete as DeleteIcon,
  PushPin as PinIcon,
  ContentCopy as CopyIcon,
  MoreVert as MoreIcon,
  Psychology as AiIcon,
  Clear as ClearIcon,
  Category as CategoryIcon,
  InsertChart as StatsIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

const backendUrl = 'http://127.0.0.1:43110';

const ClipboardManager = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [analyzeOpen, setAnalyzeOpen] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    loadClipboardHistory();
    loadCategories();
    loadStatistics();
  }, [search, category]);

  const loadClipboardHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      if (activeTab === 1) params.pinned_only = true;

      const response = await axios.get(`${backendUrl}/clipboard/history`, { params });
      setItems(response.data.items || []);
    } catch (err) {
      console.error('Failed to load clipboard history:', err);
      setError('Failed to load clipboard history');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await axios.get(`${backendUrl}/clipboard/categories`);
      setCategories(response.data.categories || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await axios.get(`${backendUrl}/clipboard/statistics`);
      setStatistics(response.data.statistics);
    } catch (err) {
      console.error('Failed to load statistics:', err);
    }
  };

  const handleCopy = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      // Show success feedback (you could add a snackbar here)
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handlePin = async (item) => {
    try {
      await axios.put(`${backendUrl}/clipboard/item/${item.id}`, {
        pinned: !item.pinned
      });
      await loadClipboardHistory();
    } catch (err) {
      console.error('Failed to pin item:', err);
      setError('Failed to pin item');
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Delete this clipboard item?')) {
      return;
    }

    try {
      await axios.delete(`${backendUrl}/clipboard/item/${itemId}`);
      await loadClipboardHistory();
      await loadStatistics();
    } catch (err) {
      console.error('Failed to delete item:', err);
      setError('Failed to delete item');
    }
  };

  const handleClear = async (keepPinned = true) => {
    const message = keepPinned
      ? 'Clear all unpinned clipboard items?'
      : 'Clear ALL clipboard items (including pinned)?';

    if (!window.confirm(message)) {
      return;
    }

    try {
      await axios.delete(`${backendUrl}/clipboard/clear?keep_pinned=${keepPinned}`);
      await loadClipboardHistory();
      await loadStatistics();
    } catch (err) {
      console.error('Failed to clear history:', err);
      setError('Failed to clear history');
    }
  };

  const handleAnalyze = async (content) => {
    try {
      setAnalyzing(true);
      const response = await axios.post(`${backendUrl}/clipboard/analyze`, {
        content: content
      });
      setAnalysis(response.data.analysis);
    } catch (err) {
      console.error('Failed to analyze content:', err);
      setAnalysis('Failed to analyze content');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleShowDetails = (item) => {
    setSelectedItem(item);
    setDetailsOpen(true);
  };

  const handleShowAnalysis = (item) => {
    setSelectedItem(item);
    setAnalysis('');
    setAnalyzeOpen(true);
    handleAnalyze(item.content);
  };

  const getPreview = (content, maxLength = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const getCategoryColor = (cat) => {
    const colors = {
      code: 'primary',
      url: 'secondary',
      email: 'success',
      phone: 'info',
      text: 'default',
      json: 'warning',
      markdown: 'primary',
      html: 'secondary'
    };
    return colors[cat] || 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Clipboard History
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your clipboard with AI-powered features
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<StatsIcon />}
            onClick={loadStatistics}
          >
            Stats
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<ClearIcon />}
            onClick={() => handleClear(true)}
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
                  {statistics.total_items}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Items
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="secondary">
                  {statistics.pinned_items}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Pinned
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {Object.keys(statistics.categories || {}).length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Categories
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {statistics.most_common_category || 'N/A'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Most Common
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 2 }}>
        <Tab label="All Items" />
        <Tab label="Pinned" />
      </Tabs>

      {/* Search and Filter */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search clipboard..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
        />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={category}
            label="Category"
            onChange={(e) => setCategory(e.target.value)}
          >
            <MenuItem value="">All Categories</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Clipboard Items */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : items.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No clipboard items found
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {items.map((item) => (
            <Grid item xs={12} key={item.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={item.category}
                        size="small"
                        color={getCategoryColor(item.category)}
                        icon={<CategoryIcon />}
                      />
                      {item.pinned && (
                        <Chip
                          label="Pinned"
                          size="small"
                          color="secondary"
                          icon={<PinIcon />}
                        />
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(item.timestamp), 'MMM d, yyyy h:mm a')}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      fontFamily: item.category === 'code' ? 'monospace' : 'inherit',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleShowDetails(item)}
                  >
                    {getPreview(item.content, 200)}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Copy">
                      <IconButton size="small" onClick={() => handleCopy(item.content)}>
                        <CopyIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={item.pinned ? 'Unpin' : 'Pin'}>
                      <IconButton
                        size="small"
                        onClick={() => handlePin(item)}
                        color={item.pinned ? 'secondary' : 'default'}
                      >
                        <PinIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="AI Analysis">
                      <IconButton size="small" onClick={() => handleShowAnalysis(item)}>
                        <AiIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <IconButton size="small" onClick={() => handleDelete(item.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedItem && (
          <>
            <DialogTitle>Clipboard Item Details</DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 2 }}>
                <Chip label={selectedItem.category} color={getCategoryColor(selectedItem.category)} sx={{ mr: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(selectedItem.timestamp), 'MMMM d, yyyy h:mm:ss a')}
                </Typography>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={10}
                value={selectedItem.content}
                InputProps={{
                  readOnly: true,
                  sx: {
                    fontFamily: selectedItem.category === 'code' ? 'monospace' : 'inherit'
                  }
                }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => handleCopy(selectedItem.content)} startIcon={<CopyIcon />}>
                Copy
              </Button>
              <Button onClick={() => setDetailsOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* AI Analysis Dialog */}
      <Dialog
        open={analyzeOpen}
        onClose={() => setAnalyzeOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AiIcon />
            AI Analysis
          </Box>
        </DialogTitle>
        <DialogContent>
          {analyzing ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {analysis}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnalyzeOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClipboardManager;
