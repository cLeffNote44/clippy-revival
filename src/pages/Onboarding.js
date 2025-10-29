import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Paper,
  LinearProgress,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import DownloadIcon from '@mui/icons-material/Download';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../components/Toast';
import { checkBackendConnection } from '../services/errorHandler';

const steps = [
  'Welcome',
  'System Check',
  'AI Setup',
  'Complete'
];

const Onboarding = ({ onComplete }) => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [systemChecks, setSystemChecks] = useState({
    backend: { status: 'checking', message: 'Checking backend connection...' },
    ollama: { status: 'checking', message: 'Checking Ollama installation...' },
    model: { status: 'pending', message: 'Waiting for Ollama check...' }
  });
  const { showToast } = useToastStore();

  useEffect(() => {
    // Run system checks when step 1 is active
    if (activeStep === 1) {
      runSystemChecks();
    }
  }, [activeStep]);

  const runSystemChecks = async () => {
    // Check backend connection
    try {
      const backendOk = await checkBackendConnection();
      setSystemChecks(prev => ({
        ...prev,
        backend: backendOk
          ? { status: 'success', message: 'Backend is running' }
          : { status: 'error', message: 'Backend is not responding' }
      }));

      if (!backendOk) {
        return;
      }

      // Check Ollama installation
      try {
        const backendUrl = await window.electronAPI.getBackendUrl();
        const response = await fetch(`${backendUrl}/ai/models`);

        if (response.ok) {
          const data = await response.json();
          setSystemChecks(prev => ({
            ...prev,
            ollama: { status: 'success', message: 'Ollama is installed and running' }
          }));

          // Check if models are available
          if (data.models && data.models.length > 0) {
            setSystemChecks(prev => ({
              ...prev,
              model: { status: 'success', message: `${data.models.length} model(s) available` }
            }));
          } else {
            setSystemChecks(prev => ({
              ...prev,
              model: { status: 'warning', message: 'No models installed' }
            }));
          }
        } else {
          setSystemChecks(prev => ({
            ...prev,
            ollama: { status: 'error', message: 'Ollama is not running' },
            model: { status: 'error', message: 'Cannot check models' }
          }));
        }
      } catch (error) {
        setSystemChecks(prev => ({
          ...prev,
          ollama: { status: 'error', message: 'Ollama is not installed or not running' },
          model: { status: 'error', message: 'Cannot check models' }
        }));
      }
    } catch (error) {
      console.error('System check error:', error);
    }
  };

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      // Complete onboarding
      localStorage.setItem('onboardingCompleted', 'true');
      if (onComplete) {
        onComplete();
      } else {
        navigate('/dashboard');
      }
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSkip = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    showToast('You can access setup from Settings later', 'info', 'Onboarding Skipped');
    if (onComplete) {
      onComplete();
    } else {
      navigate('/dashboard');
    }
  };

  const getStepIcon = (status) => {
    switch (status) {
    case 'success':
      return <CheckCircleIcon sx={{ color: 'success.main' }} />;
    case 'error':
      return <ErrorIcon sx={{ color: 'error.main' }} />;
    case 'warning':
      return <InfoIcon sx={{ color: 'warning.main' }} />;
    case 'checking':
      return <CircularProgress size={20} />;
    default:
      return null;
    }
  };

  const canProceed = () => {
    if (activeStep === 1) {
      // Can proceed if backend is working, even if Ollama is not
      return systemChecks.backend.status === 'success';
    }
    return true;
  };

  const renderStepContent = (step) => {
    switch (step) {
    case 0:
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h3" gutterBottom>
              Welcome to Clippy Revival! 📎
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 600, mx: 'auto', mt: 3 }}>
              Your AI-powered desktop assistant is here to help! Let's get you set up in just a few steps.
          </Typography>
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
                What you can do with Clippy Revival:
            </Typography>
            <List sx={{ maxWidth: 600, mx: 'auto', textAlign: 'left' }}>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="AI-Powered Assistance"
                  secondary="Chat with local AI models for help with tasks"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="System Monitoring"
                  secondary="Keep track of CPU, memory, and disk usage"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="File Management"
                  secondary="Safely manage files and folders"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Custom Characters"
                  secondary="Import character packs to personalize your assistant"
                />
              </ListItem>
            </List>
          </Box>
        </Box>
      );

    case 1:
      return (
        <Box sx={{ py: 4 }}>
          <Typography variant="h5" gutterBottom>
              System Check
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
              We're checking if everything is ready...
          </Typography>

          <List sx={{ mt: 3 }}>
            <ListItem>
              <ListItemIcon>
                {getStepIcon(systemChecks.backend.status)}
              </ListItemIcon>
              <ListItemText
                primary="Backend Service"
                secondary={systemChecks.backend.message}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                {getStepIcon(systemChecks.ollama.status)}
              </ListItemIcon>
              <ListItemText
                primary="Ollama (AI Engine)"
                secondary={systemChecks.ollama.message}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                {getStepIcon(systemChecks.model.status)}
              </ListItemIcon>
              <ListItemText
                primary="AI Models"
                secondary={systemChecks.model.message}
              />
            </ListItem>
          </List>

          {systemChecks.ollama.status === 'error' && (
            <Alert severity="warning" sx={{ mt: 3 }}>
              <AlertTitle>Ollama Not Found</AlertTitle>
                Ollama is required for AI features. Please install it from{' '}
              <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer">
                  ollama.ai
              </a>
                , then run: <code>ollama pull llama3.2</code>
            </Alert>
          )}

          {systemChecks.model.status === 'warning' && (
            <Alert severity="info" sx={{ mt: 3 }}>
              <AlertTitle>No Models Installed</AlertTitle>
                To use AI features, install a model by running: <code>ollama pull llama3.2</code>
            </Alert>
          )}
        </Box>
      );

    case 2:
      return (
        <Box sx={{ py: 4 }}>
          <Typography variant="h5" gutterBottom>
              AI Setup
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
              Configure your AI preferences
          </Typography>

          {systemChecks.ollama.status === 'success' ? (
            <Box sx={{ mt: 3 }}>
              <Alert severity="success">
                <AlertTitle>You're all set!</AlertTitle>
                  Your AI is ready to use. You can change the model and other settings later from the Settings page.
              </Alert>
            </Box>
          ) : (
            <Box sx={{ mt: 3 }}>
              <Alert severity="info">
                <AlertTitle>AI Setup Required</AlertTitle>
                <Typography variant="body2" paragraph>
                    To use AI features, you need to:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <DownloadIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="1. Install Ollama"
                      secondary={
                        <>
                            Download from{' '}
                          <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer">
                              ollama.ai
                          </a>
                        </>
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <DownloadIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="2. Pull an AI Model"
                      secondary="Run: ollama pull llama3.2"
                    />
                  </ListItem>
                </List>
                <Typography variant="body2" sx={{ mt: 2 }}>
                    You can continue without AI features and set them up later from Settings.
                </Typography>
              </Alert>
            </Box>
          )}
        </Box>
      );

    case 3:
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
              You're All Set!
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 600, mx: 'auto', mt: 3 }}>
              Clippy Revival is ready to help you. Click "Get Started" to begin using your new AI assistant!
          </Typography>
          <Box sx={{ mt: 4 }}>
            <Typography variant="body2" color="text.secondary">
                You can access Clippy from the system tray, or open the dashboard anytime.
            </Typography>
          </Box>
        </Box>
      );

    default:
      return 'Unknown step';
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Paper sx={{ maxWidth: 900, mx: 'auto', mt: 4, mb: 4, p: 4, flexGrow: 1 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ minHeight: 400 }}>
          {renderStepContent(activeStep)}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            variant="text"
            onClick={handleSkip}
            disabled={activeStep === steps.length - 1}
          >
            Skip Setup
          </Button>
          <Box>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ mr: 1 }}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!canProceed()}
            >
              {activeStep === steps.length - 1 ? 'Get Started' : 'Next'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Onboarding;
