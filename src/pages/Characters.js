import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Tabs,
  Tab
} from '@mui/material';
import {
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import CharacterAvatar from '../components/CharacterAvatar';
import { characterService } from '../services/api';

const Characters = () => {
  const [packs, setPacks] = useState([]);
  const [selectedPack, setSelectedPack] = useState(null);
  const [activePack, setActivePack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewState, setPreviewState] = useState('idle');
  const [uploadProgress, setUploadProgress] = useState(false);

  useEffect(() => {
    loadPacks();
    loadActivePack();
  }, []);

  const loadPacks = async () => {
    try {
      setLoading(true);
      const response = await characterService.list();
      setPacks(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load character packs: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadActivePack = () => {
    // Load active pack ID from localStorage
    const activeId = localStorage.getItem('activeCharacterPack');
    if (activeId) {
      setActivePack(activeId);
    }
  };

  const handlePreview = async (pack) => {
    try {
      const response = await characterService.get(pack.id);
      setSelectedPack(response.data);
      setPreviewOpen(true);
      setPreviewState('idle');
    } catch (err) {
      setError('Failed to load character details: ' + err.message);
    }
  };

  const handleSetActive = (packId) => {
    setActivePack(packId);
    localStorage.setItem('activeCharacterPack', packId);
    // Notify parent/global state if needed
    window.dispatchEvent(new CustomEvent('characterChanged', { detail: { packId } }));
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadProgress(true);
      const response = await characterService.import(formData);

      if (response.data.success) {
        alert(`Successfully imported: ${response.data.pack_id}`);
        loadPacks();
      }
    } catch (err) {
      setError('Import failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setUploadProgress(false);
      event.target.value = '';
    }
  };

  const handleDelete = async (packId) => {
    if (!window.confirm('Are you sure you want to delete this character pack?')) {
      return;
    }

    try {
      await characterService.delete(packId);
      
      if (activePack === packId) {
        setActivePack(null);
        localStorage.removeItem('activeCharacterPack');
      }
      
      loadPacks();
    } catch (err) {
      setError('Delete failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  const animationStates = ['idle', 'speak', 'think', 'wave', 'notify', 'work', 'success', 'error'];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Character Packs
        </Typography>
        
        <Button
          variant="contained"
          startIcon={uploadProgress ? <CircularProgress size={20} /> : <UploadIcon />}
          component="label"
          disabled={uploadProgress}
        >
          Import Pack
          <input
            type="file"
            hidden
            accept=".zip"
            onChange={handleImport}
          />
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {packs.map((pack) => (
            <Grid item xs={12} sm={6} md={4} key={pack.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="div"
                  sx={{
                    height: 140,
                    backgroundColor: '#f5f5f5',
                    backgroundImage: pack.thumbnail ? `url(${pack.thumbnail})` : 'none',
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    position: 'relative'
                  }}
                >
                  {activePack === pack.id && (
                    <Chip
                      label="Active"
                      color="success"
                      size="small"
                      icon={<CheckIcon />}
                      sx={{ position: 'absolute', top: 8, right: 8 }}
                    />
                  )}
                </CardMedia>
                
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h6" component="h2">
                    {pack.name}
                  </Typography>
                  
                  {pack.author && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      by {pack.author}
                    </Typography>
                  )}
                  
                  {pack.description && (
                    <Typography variant="body2" color="text.secondary">
                      {pack.description}
                    </Typography>
                  )}
                  
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    v{pack.version}
                  </Typography>
                </CardContent>
                
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<InfoIcon />}
                    onClick={() => handlePreview(pack)}
                  >
                    Preview
                  </Button>
                  
                  {activePack !== pack.id && (
                    <Button
                      size="small"
                      onClick={() => handleSetActive(pack.id)}
                    >
                      Set Active
                    </Button>
                  )}
                  
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(pack.id)}
                    sx={{ ml: 'auto' }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
          
          {packs.length === 0 && (
            <Grid item xs={12}>
              <Alert severity="info">
                No character packs installed. Import a pack to get started!
              </Alert>
            </Grid>
          )}
        </Grid>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedPack?.name}
          {selectedPack?.author && (
            <Typography variant="subtitle2" color="text.secondary">
              by {selectedPack.author}
            </Typography>
          )}
        </DialogTitle>
        
        <DialogContent>
          {selectedPack && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <CharacterAvatar
                  pack={selectedPack}
                  state={previewState}
                  style={{ margin: '0 auto' }}
                />
              </Box>
              
              <Typography variant="subtitle2" gutterBottom>
                Animation States:
              </Typography>
              
              <Tabs
                value={previewState}
                onChange={(e, newValue) => setPreviewState(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ mb: 2 }}
              >
                {animationStates
                  .filter(state => selectedPack.animations[state])
                  .map(state => (
                    <Tab key={state} label={state} value={state} />
                  ))}
              </Tabs>
              
              {selectedPack.description && (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    Description:
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {selectedPack.description}
                  </Typography>
                </>
              )}
              
              <Typography variant="caption" color="text.secondary">
                Version: {selectedPack.version} | ID: {selectedPack.id}
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>
            Close
          </Button>
          {selectedPack && activePack !== selectedPack.id && (
            <Button
              variant="contained"
              onClick={() => {
                handleSetActive(selectedPack.id);
                setPreviewOpen(false);
              }}
            >
              Set as Active
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Characters;
