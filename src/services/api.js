import http from './http';

// AI Service
export const aiService = {
  // Get available models
  getModels: () => http.get('/ai/models'),
  
  // Send chat message
  chat: (message, conversationId = null) => 
    http.post('/ai/chat', { message, conversation_id: conversationId }),
  
  // Set active model
  setModel: (modelName) => 
    http.post('/ai/model', { model: modelName }),
  
  // Get available tools
  getTools: () => http.get('/ai/tools'),
  
  // Execute a tool
  executeTool: (toolName, params) => 
    http.post('/ai/tools/execute', { tool: toolName, parameters: params })
};

// System Service
export const systemService = {
  // Get system metrics
  getMetrics: () => http.get('/system/metrics'),
  
  // Get system info
  getInfo: () => http.get('/system/info'),
  
  // Health check
  health: () => http.get('/health')
};

// File Service
export const fileService = {
  // List directory contents
  list: (path) => 
    http.get('/files/list', { params: { path } }),
  
  // Move/rename files
  move: (source, destination) => 
    http.post('/files/move', { source, destination }),
  
  // Copy files
  copy: (source, destination) => 
    http.post('/files/copy', { source, destination }),
  
  // Delete files (to recycle bin)
  delete: (path, permanent = false) => 
    http.post('/files/delete', { path, permanent }),
  
  // Search for files
  search: (pattern, directory) => 
    http.post('/files/search', { pattern, directory })
};

// Software Service
export const softwareService = {
  // Search packages
  search: (query) => 
    http.get('/software/search', { params: { query } }),
  
  // Get installed packages
  getInstalled: () => 
    http.get('/software/installed'),
  
  // Install package
  install: (packageId) => 
    http.post('/software/install', { package_id: packageId }),
  
  // Uninstall package
  uninstall: (packageId) => 
    http.post('/software/uninstall', { package_id: packageId })
};

// Web Service
export const webService = {
  // Start browser session
  startSession: () => 
    http.post('/web/session/start'),
  
  // End browser session
  endSession: (sessionId) => 
    http.post('/web/session/end', { session_id: sessionId }),
  
  // Navigate to URL
  navigate: (sessionId, url) => 
    http.post('/web/navigate', { session_id: sessionId, url }),
  
  // Extract text from page
  extract: (sessionId, selector = null) => 
    http.post('/web/extract', { session_id: sessionId, selector }),
  
  // Execute automation steps
  executeSteps: (sessionId, steps) => 
    http.post('/web/steps', { session_id: sessionId, steps })
};

// Character Service
export const characterService = {
  // List available character packs
  list: () => 
    http.get('/characters/list'),
  
  // Get character details
  get: (characterId) => 
    http.get(`/characters/${characterId}`),
  
  // Import character pack
  import: (formData) => 
    http.post('/characters/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  // Delete character pack
  delete: (characterId) => 
    http.delete(`/characters/${characterId}`),
  
  // Set active character
  setActive: (characterId) => 
    http.post('/characters/active', { character_id: characterId })
};

// Scheduler Service
export const schedulerService = {
  // Get scheduled tasks
  getTasks: () => 
    http.get('/scheduler/tasks'),
  
  // Create new task
  createTask: (task) => 
    http.post('/scheduler/tasks', task),
  
  // Update task
  updateTask: (taskId, updates) => 
    http.put(`/scheduler/tasks/${taskId}`, updates),
  
  // Delete task
  deleteTask: (taskId) => 
    http.delete(`/scheduler/tasks/${taskId}`),
  
  // Start scheduler
  start: () => 
    http.post('/scheduler/start'),
  
  // Stop scheduler
  stop: () => 
    http.post('/scheduler/stop'),
  
  // Get scheduler status
  getStatus: () => 
    http.get('/scheduler/status')
};

// Export all services
export default {
  ai: aiService,
  system: systemService,
  files: fileService,
  software: softwareService,
  web: webService,
  characters: characterService,
  scheduler: schedulerService
};