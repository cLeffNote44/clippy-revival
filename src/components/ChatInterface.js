import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Typography,
  Avatar,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useAppStore } from '../store/appStore';

function ChatInterface() {
  const { chatHistory, isTyping, sendMessage, backendUrl } = useAppStore();
  const [input, setInput] = useState('');
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    sendMessage(input);
    setInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleConfirmTool = async (confirmed) => {
    if (!pendingConfirmation) return;

    try {
      const response = await fetch(`${backendUrl}/ai/tools/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_name: pendingConfirmation.tool,
          arguments: pendingConfirmation.arguments,
          confirmed: confirmed
        })
      });

      const result = await response.json();
      
      // Add result to chat
      const resultMessage = {
        role: 'assistant',
        content: confirmed 
          ? `✓ Action completed: ${JSON.stringify(result.result, null, 2)}`
          : '✗ Action cancelled'
      };
      
      useAppStore.setState({ 
        chatHistory: [...chatHistory, resultMessage] 
      });
      
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Tool execution error:', error);
    }

    setPendingConfirmation(null);
  };

  useEffect(() => {
    // Check if last message contains tool confirmation request
    const lastMessage = chatHistory[chatHistory.length - 1];
    if (lastMessage && lastMessage.role === 'assistant') {
      if (lastMessage.tool_call?.requires_confirmation) {
        // Use microtask to avoid cascading render
        queueMicrotask(() => {
          setPendingConfirmation({
            tool: lastMessage.tool_call.tool,
            arguments: lastMessage.tool_call.arguments,
            message: lastMessage.tool_call.message
          });
        });
      }
    }
  }, [chatHistory]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chat Messages */}
      <Box sx={{ 
        flex: 1, 
        overflowY: 'auto', 
        p: 2,
        bgcolor: 'background.default'
      }}>
        {chatHistory.length === 0 && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: 2
          }}>
            <BotIcon sx={{ fontSize: 64, color: 'primary.main', opacity: 0.3 }} />
            <Typography variant="h6" color="text.secondary">
              Hi! I&apos;m Clippy. How can I help you today?
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Chip label="Check system metrics" onClick={() => setInput('Show me system metrics')} />
              <Chip label="List my files" onClick={() => setInput('List files in my Downloads')} />
              <Chip label="Search for software" onClick={() => setInput('Search for Firefox')} />
            </Box>
          </Box>
        )}

        {chatHistory.map((message, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              gap: 2,
              mb: 2,
              flexDirection: message.role === 'user' ? 'row-reverse' : 'row'
            }}
          >
            <Avatar sx={{ 
              bgcolor: message.role === 'user' ? 'primary.main' : 'secondary.main'
            }}>
              {message.role === 'user' ? <PersonIcon /> : <BotIcon />}
            </Avatar>
            
            <Paper
              sx={{
                p: 2,
                maxWidth: '70%',
                bgcolor: message.role === 'user' ? 'primary.light' : 'background.paper',
                color: message.role === 'user' ? 'primary.contrastText' : 'text.primary'
              }}
            >
              <Typography
                variant="body1"
                sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
              >
                {message.content}
              </Typography>
              
              {message.tool_call && (
                <Box sx={{ mt: 1 }}>
                  <Chip 
                    size="small" 
                    label={`Tool: ${message.tool_call.action || message.tool_call.tool}`}
                    color="info"
                  />
                </Box>
              )}
            </Paper>
          </Box>
        ))}

        {isTyping && (
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Avatar sx={{ bgcolor: 'secondary.main' }}>
              <BotIcon />
            </Avatar>
            <Paper sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Clippy is typing...
              </Typography>
            </Paper>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Paper sx={{ p: 2, borderRadius: 0 }} elevation={3}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Ask Clippy anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isTyping}
          />
          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog open={!!pendingConfirmation} onClose={() => setPendingConfirmation(null)}>
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action requires your confirmation before proceeding.
          </Alert>
          <Typography variant="body1" gutterBottom>
            {pendingConfirmation?.message}
          </Typography>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Tool: {pendingConfirmation?.tool}
            </Typography>
            <pre style={{ fontSize: '12px', margin: '8px 0 0 0' }}>
              {JSON.stringify(pendingConfirmation?.arguments, null, 2)}
            </pre>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            startIcon={<CancelIcon />}
            onClick={() => handleConfirmTool(false)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<CheckIcon />}
            onClick={() => handleConfirmTool(true)}
          >
            Confirm & Execute
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ChatInterface;