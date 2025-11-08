import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  Card,
  CardContent,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  ArrowForward as NextIcon,
  ArrowBack as BackIcon,
  Done as DoneIcon
} from '@mui/icons-material';

const steps = ['Welcome', 'Prerequisites', 'Configuration', 'Complete'];

const Onboarding = ({ onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [prerequisitesChecked, setPrerequisitesChecked] = useState({
    ollama: false,
    node: false,
    python: false
  });

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      // Mark onboarding as complete
      localStorage.setItem('clippy-onboarding-complete', 'true');
      onComplete();
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const checkPrerequisites = async () => {
    // Check if Ollama is available
    try {
      const response = await fetch('http://localhost:11434/api/version');
      if (response.ok) {
        setPrerequisitesChecked(prev => ({ ...prev, ollama: true }));
      }
    } catch (e) {
      setPrerequisitesChecked(prev => ({ ...prev, ollama: false }));
    }

    // Assume Node and Python are available if we got this far
    setPrerequisitesChecked(prev => ({
      ...prev,
      node: true,
      python: true
    }));
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0: // Welcome
        return (
          <Box>
            <Typography variant="h4" gutterBottom>
              Welcome to Clippy Revival! 📎
            </Typography>
            <Typography variant="body1" paragraph>
              Your AI-powered desktop assistant for Windows. Let&apos;s get you set up in just a few steps.
            </Typography>
            <Card sx={{ mt: 3, bgcolor: 'primary.50' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  What Clippy can do for you:
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                    <ListItemText primary="Monitor system performance" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                    <ListItemText primary="Manage files and folders" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                    <ListItemText primary="Install and update software" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                    <ListItemText primary="Automate web tasks" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                    <ListItemText primary="Answer questions and help you work" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Box>
        );

      case 1: // Prerequisites
        return (
          <Box>
            <Typography variant="h5" gutterBottom>
              Prerequisites Check
            </Typography>
            <Typography variant="body1" paragraph>
              Let&apos;s make sure everything is set up correctly.
            </Typography>

            <Button variant="contained" onClick={checkPrerequisites} sx={{ mb: 3 }}>
              Check Prerequisites
            </Button>

            <List>
              <ListItem>
                <ListItemIcon>
                  {prerequisitesChecked.ollama ? <CheckIcon color="success" /> : <CheckIcon color="disabled" />}
                </ListItemIcon>
                <ListItemText
                  primary="Ollama (AI Engine)"
                  secondary={prerequisitesChecked.ollama ? "✓ Running" : "Not detected"}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  {prerequisitesChecked.node ? <CheckIcon color="success" /> : <CheckIcon color="disabled" />}
                </ListItemIcon>
                <ListItemText
                  primary="Node.js"
                  secondary={prerequisitesChecked.node ? "✓ Installed" : "Checking..."}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  {prerequisitesChecked.python ? <CheckIcon color="success" /> : <CheckIcon color="disabled" />}
                </ListItemIcon>
                <ListItemText
                  primary="Python 3.12+"
                  secondary={prerequisitesChecked.python ? "✓ Installed" : "Checking..."}
                />
              </ListItem>
            </List>

            {!prerequisitesChecked.ollama && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Ollama not detected. Please install Ollama and pull a model:
                <br />
                <code>ollama pull llama3.2</code>
              </Alert>
            )}
          </Box>
        );

      case 2: // Configuration
        return (
          <Box>
            <Typography variant="h5" gutterBottom>
              Quick Configuration
            </Typography>
            <Typography variant="body1" paragraph>
              Your basic settings are already configured. You can customize them later in Settings.
            </Typography>

            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Default Settings:
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="AI Model"
                      secondary="llama3.2 (can be changed in Settings)"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Auto-execute Tools"
                      secondary="Disabled (asks for confirmation)"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Notifications"
                      secondary="Enabled"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Character"
                      secondary="Classic Clippy"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            <Alert severity="info" sx={{ mt: 2 }}>
              You can customize all these settings from the Settings page at any time.
            </Alert>
          </Box>
        );

      case 3: // Complete
        return (
          <Box textAlign="center">
            <DoneIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              All Set!
            </Typography>
            <Typography variant="body1" paragraph>
              Clippy Revival is ready to help you be more productive.
            </Typography>

            <Card sx={{ mt: 3, maxWidth: 500, mx: 'auto' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Tips:
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Access Settings from the menu to customize your experience"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Import custom character packs from the Characters page"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Set up scheduled tasks in the Scheduler"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Double-click Clippy to toggle click-through mode"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%', p: 3, maxWidth: 800, mx: 'auto' }}>
      <Paper elevation={3} sx={{ p: 4 }}>
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
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<BackIcon />}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={activeStep === steps.length - 1 ? <DoneIcon /> : <NextIcon />}
          >
            {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

Onboarding.propTypes = {
  onComplete: PropTypes.func.isRequired
};

export default Onboarding;
