import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Button,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Alert,
  Chip,
  Stack,
  Divider
} from '@mui/material';
import {
  Mic as MicIcon,
  Stop as StopIcon,
  VolumeUp as SpeakIcon,
  VolumeOff as MuteIcon
} from '@mui/icons-material';
import voiceService from '../services/voiceService';

const VoiceControls = () => {
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('default');
  const [textToSpeak, setTextToSpeak] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    // Load available voices
    setVoices(voiceService.getVoices());

    // Reload voices when they change (async loading)
    const timer = setTimeout(() => {
      setVoices(voiceService.getVoices());
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleStartRecording = () => {
    setError(null);
    setSuccess(null);
    setRecognizedText('');
    setInterimText('');

    const started = voiceService.startListening({
      onStart: () => {
        setIsRecording(true);
        setSuccess('Listening... Speak now!');
      },
      onInterim: (text) => {
        setInterimText(text);
      },
      onResult: (text) => {
        setRecognizedText(text);
        setInterimText('');
        setSuccess(`Recognized: "${text}"`);
      },
      onError: (event) => {
        setError(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
      },
      onEnd: () => {
        setIsRecording(false);
      }
    });

    if (!started) {
      setError('Failed to start speech recognition. Not supported in this environment.');
    }
  };

  const handleStopRecording = () => {
    voiceService.stopListening();
    setIsRecording(false);
    setInterimText('');
  };

  const handleTextToSpeech = async () => {
    if (!textToSpeak.trim()) {
      setError('Please enter text to speak');
      return;
    }

    setIsSpeaking(true);
    setError(null);
    setSuccess(null);

    try {
      await voiceService.speak(textToSpeak, {
        voice: selectedVoice,
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0
      });

      setSuccess('Speech completed!');
      setIsSpeaking(false);
    } catch (err) {
      console.error('Text-to-speech error:', err);
      setError('Failed to speak text');
      setIsSpeaking(false);
    }
  };

  const handleStopSpeaking = () => {
    voiceService.stopSpeaking();
    setIsSpeaking(false);
  };

  return (
    <Box>
      {/* Error/Success Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Speech-to-Text */}
      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Speech-to-Text
        </Typography>

        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Button
            variant={isRecording ? 'contained' : 'outlined'}
            color={isRecording ? 'error' : 'primary'}
            startIcon={isRecording ? <StopIcon /> : <MicIcon />}
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={isSpeaking}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Button>

          {isRecording && (
            <Chip
              label="Recording..."
              color="error"
              icon={<MicIcon />}
              sx={{ animation: 'pulse 1.5s infinite' }}
            />
          )}
        </Stack>

        {interimText && (
          <Paper sx={{ p: 2, bgcolor: 'grey.200', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {interimText}
            </Typography>
          </Paper>
        )}

        {recognizedText && (
          <Paper sx={{ p: 2, bgcolor: 'success.light' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Recognized:
            </Typography>
            <Typography variant="body1">{recognizedText}</Typography>
          </Paper>
        )}
      </Paper>

      {/* Text-to-Speech */}
      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Text-to-Speech
        </Typography>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Voice</InputLabel>
          <Select
            value={selectedVoice}
            label="Voice"
            onChange={(e) => setSelectedVoice(e.target.value)}
            disabled={isSpeaking}
          >
            <MenuItem value="default">Default Voice</MenuItem>
            {voices.map((voice, idx) => (
              <MenuItem key={idx} value={voice.name}>
                {voice.name} ({voice.lang})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          multiline
          rows={3}
          value={textToSpeak}
          onChange={(e) => setTextToSpeak(e.target.value)}
          placeholder="Enter text to speak..."
          sx={{ mb: 2 }}
          disabled={isSpeaking}
        />

        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<SpeakIcon />}
            onClick={handleTextToSpeech}
            disabled={!textToSpeak || isSpeaking || isRecording}
          >
            {isSpeaking ? 'Speaking...' : 'Speak'}
          </Button>

          {isSpeaking && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<MuteIcon />}
              onClick={handleStopSpeaking}
            >
              Stop
            </Button>
          )}
        </Stack>
      </Paper>

      {/* Features Info */}
      <Alert severity="info">
        <Typography variant="body2" fontWeight="bold" gutterBottom>
          Voice Features:
        </Typography>
        <Typography variant="body2">
          ✅ Speech Recognition (Web Speech API)<br />
          ✅ Text-to-Speech (Web Speech API)<br />
          ✅ Multiple Voices<br />
          ✅ Real-time Transcription
        </Typography>
      </Alert>
    </Box>
  );
};

export default VoiceControls;
