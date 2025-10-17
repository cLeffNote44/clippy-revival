const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App control
  getBackendUrl: () => ipcRenderer.invoke('get-backend-url'),
  showDashboard: () => ipcRenderer.invoke('show-dashboard'),
  showBuddy: () => ipcRenderer.invoke('show-buddy'),
  hideBuddy: () => ipcRenderer.invoke('hide-buddy'),
  setBuddyClickThrough: (clickThrough) => ipcRenderer.invoke('set-buddy-click-through', clickThrough),
  
  // Event listeners
  onAssistantPaused: (callback) => {
    ipcRenderer.on('assistant-paused', (event, isPaused) => callback(isPaused));
  },
  
  onNavigate: (callback) => {
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
    return ipcRenderer.invoke('select-file', options);
  },
  
  selectDirectory: async (options = {}) => {
    return ipcRenderer.invoke('select-directory', options);
  },
  
  // System info
  getPlatform: () => process.platform,
  getVersion: () => process.versions.electron,
});