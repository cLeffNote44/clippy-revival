import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  IconButton,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import {
  Mic as MicIcon,
  Stop as StopIcon,
  VolumeUp as SpeakIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

const backendUrl = 'http://127.0.0.1:43110';

const VoiceControls = () => {
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('default');
  const [textToSpeak, setTextToSpeak] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    loadVoices();
    loadStatus();
  }, []);

  const loadVoices = async () => {
    try {
      const response = await axios.get(`${backendUrl}/voice/voices`);
      setVoices(response.data.voices || []);
    } catch (err) {
      console.error('Failed to load voices:', err);
    }
  };

  const loadStatus = async () => {
    try {
      const response = await axios.get(`${backendUrl}/voice/status`);
      setStatus(response.data);
    } catch (err) {
      console.error('Failed to load status:', err);
    }
  };

  const handleStartRecording = async () => {
    setIsRecording(true);
    setError(null);
    setRecognizedText('');

    try {
      // In a real implementation, this would use the browser's MediaRecorder API
      // or Web Speech API
      alert('Voice recording would start here. Integration with Web Speech API or recording library needed.');

      // Placeholder: simulate recording
      setTimeout(() => {
        setRecognizedText('This is placeholder text from voice recognition');
        setIsRecording(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to start voice recording');
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
  };

  const handleTextToSpeech = async () => {
    if (!textToSpeak) return;

    setIsSpeaking(true);
    setError(null);

    try {
      await axios.post(`${backendUrl}/voice/text-to-speech`, {
        text: textToSpeak,
        voice: selectedVoice
      });

      // In a real implementation, this would play the returned audio
      alert('Text-to-speech would play here. Integration with Web Speech API or audio player needed.');

      setTimeout(() => {
        setIsSpeaking(false);
      }, 1000);
    } catch (err) {
      console.error('Failed to convert text to speech:', err);
      setError('Failed to convert text to speech');
      setIsSpeaking(false);
    }
  };

  const handleEnableWakeWord = async () => {
    try {
      await axios.post(`${backendUrl}/voice/enable-wake-word`);
      alert('Wake word "Hey Clippy" enabled! (Integration required for actual functionality)');
    } catch (err) {
      console.error('Failed to enable wake word:', err);
      setError('Failed to enable wake word');
    }
  };

  return (
    <Box>
      {/* Status */}
      {status && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'info.light' }}>
          <Typography variant="body2">
            STT: {status.stt_enabled ? '✅ Enabled' : '⚠️ Integration Required'} |
            TTS: {status.tts_enabled ? '✅ Enabled' : '⚠️ Integration Required'} |
            Voices: {status.available_voices}
          </Typography>
        </Paper>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Speech-to-Text */}
      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Speech-to-Text
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Button
            variant={isRecording ? 'contained' : 'outlined'}
            color={isRecording ? 'error' : 'primary'}
            startIcon={isRecording ? <StopIcon /> : <MicIcon />}
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={isSpeaking}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Button>
          {isRecording && <CircularProgress size={24} />}
        </Box>

        {recognizedText && (
          <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
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
          >
            {voices.map((voice) => (
              <MenuItem key={voice.id} value={voice.id}>
                {voice.name} ({voice.language})
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
        />

        <Button
          variant="contained"
          startIcon={isSpeaking ? <CircularProgress size={20} /> : <SpeakIcon />}
          onClick={handleTextToSpeech}
          disabled={!textToSpeak || isSpeaking || isRecording}
        >
          {isSpeaking ? 'Speaking...' : 'Speak'}
        </Button>
      </Paper>

      {/* Wake Word */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Wake Word Detection
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enable "Hey Clippy" wake word to activate voice commands
        </Typography>
        <Button
          variant="outlined"
          startIcon={<SettingsIcon />}
          onClick={handleEnableWakeWord}
        >
          Enable Wake Word
        </Button>
      </Paper>

      {/* Integration Notice */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Integration Required:</strong> Voice features require integration with:
        </Typography>
        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip label="Web Speech API" size="small" />
          <Chip label="OpenAI Whisper" size="small" />
          <Chip label="ElevenLabs" size="small" />
          <Chip label="Google Cloud Speech" size="small" />
        </Box>
      </Alert>
    </Box>
  );
};

export default VoiceControls;
