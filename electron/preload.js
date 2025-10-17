const { contextBridge, ipcRenderer } = require('electron');

// Whitelist of allowed IPC channels
const ALLOWED_CHANNELS = {
  invoke: [
    'get-backend-url',
    'show-dashboard',
    'show-buddy',
    'hide-buddy',
    'set-buddy-click-through',
    'select-file',
    'select-directory'
  ],
  on: [
    'assistant-paused',
    'navigate'
  ]
};

// Validate channel names
function validateChannel(channel, type) {
  if (!ALLOWED_CHANNELS[type]?.includes(channel)) {
    throw new Error(`Unauthorized IPC channel: ${channel}`);
  }
}

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App control
  getBackendUrl: () => {
    validateChannel('get-backend-url', 'invoke');
    return ipcRenderer.invoke('get-backend-url');
  },
  showDashboard: () => {
    validateChannel('show-dashboard', 'invoke');
    return ipcRenderer.invoke('show-dashboard');
  },
  showBuddy: () => {
    validateChannel('show-buddy', 'invoke');
    return ipcRenderer.invoke('show-buddy');
  },
  hideBuddy: () => {
    validateChannel('hide-buddy', 'invoke');
    return ipcRenderer.invoke('hide-buddy');
  },
  setBuddyClickThrough: (clickThrough) => {
    validateChannel('set-buddy-click-through', 'invoke');
    if (typeof clickThrough !== 'boolean') {
      throw new Error('clickThrough must be a boolean');
    }
    return ipcRenderer.invoke('set-buddy-click-through', clickThrough);
  },
  
  // Event listeners
  onAssistantPaused: (callback) => {
    validateChannel('assistant-paused', 'on');
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    ipcRenderer.on('assistant-paused', (event, isPaused) => callback(isPaused));
  },
  
  onNavigate: (callback) => {
    validateChannel('navigate', 'on');
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    ipcRenderer.on('navigate', (event, path) => callback(path));
  },
  
  // Backend communication helpers
  sendToBackend: async (endpoint, method = 'GET', data = null) => {
    const backendUrl = await ipcRenderer.invoke('get-backend-url');
    const url = `${backendUrl}${endpoint}`;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }
    
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Backend communication error:', error);
      throw error;
    }
  },
  
  // WebSocket connection helper
  connectWebSocket: async (path = '/ws') => {
    const backendUrl = await ipcRenderer.invoke('get-backend-url');
    const wsUrl = backendUrl.replace('http://', 'ws://') + path;
    return new WebSocket(wsUrl);
  },
  
  // File operations (with security checks)
  selectFile: async (options = {}) => {
    validateChannel('select-file', 'invoke');
    // Validate options
    const safeOptions = {
      properties: options.properties || ['openFile'],
      filters: options.filters || [],
      defaultPath: options.defaultPath || undefined
    };
    return ipcRenderer.invoke('select-file', safeOptions);
  },
  
  selectDirectory: async (options = {}) => {
    validateChannel('select-directory', 'invoke');
    // Validate options
    const safeOptions = {
      properties: options.properties || ['openDirectory'],
      defaultPath: options.defaultPath || undefined
    };
    return ipcRenderer.invoke('select-directory', safeOptions);
  },
  
  // System info
  getPlatform: () => process.platform,
  getVersion: () => process.versions.electron,
});