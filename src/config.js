// Application configuration
const isDev = process.env.NODE_ENV === 'development';

const config = {
  // API configuration
  api: {
    baseUrl: process.env.REACT_APP_API_BASE || 'http://localhost:43110',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
  },
  
  // WebSocket configuration
  ws: {
    url: process.env.REACT_APP_WS_URL || 'ws://localhost:43110/ws',
    reconnectInterval: 5000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000
  },
  
  // App configuration
  app: {
    name: 'Clippy Revival',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    isDev,
    logLevel: isDev ? 'debug' : 'info'
  },
  
  // Feature flags
  features: {
    scheduler: true,
    webAutomation: true,
    softwareManagement: true,
    characterPacks: true,
    voiceCommands: false // Disabled for now
  },
  
  // System paths
  paths: {
    characters: './characters',
    logs: './logs',
    temp: './temp'
  }
};

export default config;