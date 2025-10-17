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
    scheduler: process.env.ENABLE_SCHEDULER !== 'false', // Default true
    webAutomation: process.env.ENABLE_WEB_AUTOMATION !== 'false', // Default true
    softwareManagement: process.env.ENABLE_SOFTWARE_MANAGEMENT !== 'false', // Default true
    characterPacks: process.env.ENABLE_CHARACTER_PACKS !== 'false', // Default true
    voiceCommands: process.env.ENABLE_VOICE_COMMANDS === 'true' // Default false
  },
  
  // System paths
  paths: {
    characters: './characters',
    logs: './logs',
    temp: './temp'
  }
};

export default config;