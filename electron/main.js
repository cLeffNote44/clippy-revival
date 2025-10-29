const { app, BrowserWindow, Tray, Menu, ipcMain, shell, nativeImage, dialog, globalShortcut } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');
const logger = require('./logger');

// Environment configuration
const isDev = process.env.NODE_ENV === 'development';
const BACKEND_PORT = 43110;
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;

// Window references
let dashboardWindow = null;
let buddyWindow = null;
let tray = null;
let backendProcess = null;

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // If someone tried to run a second instance, focus our windows
    if (dashboardWindow) {
      if (dashboardWindow.isMinimized()) dashboardWindow.restore();
      dashboardWindow.focus();
    }
  });
}

// Backend management
async function startBackend() {
  // Check if backend is already running
  try {
    await axios.get(`${BACKEND_URL}/health`, { timeout: 1000 });
    logger.info('Backend already running');
    return true;
  } catch (error) {
    logger.info('Starting backend...');
  }

  return new Promise((resolve, reject) => {
    if (isDev) {
      // In development, run Python with uvicorn
      const pythonPath = path.join(__dirname, '..', 'backend', 'venv', 'Scripts', 'python.exe');
      const appPath = path.join(__dirname, '..', 'backend', 'app.py');
      
      // Try venv python first, fall back to system python
      const pythonExe = require('fs').existsSync(pythonPath) ? pythonPath : 'python';
      
      backendProcess = spawn(pythonExe, [
        '-m', 'uvicorn',
        'app:app',
        '--host', '127.0.0.1',
        '--port', BACKEND_PORT.toString(),
        '--reload'
      ], {
        cwd: path.join(__dirname, '..', 'backend'),
        env: { ...process.env, PYTHONPATH: path.join(__dirname, '..', 'backend') }
      });
    } else {
      // In production, run the packaged backend executable
      const backendPath = path.join(process.resourcesPath, 'backend', 'clippy-backend.exe');
      backendProcess = spawn(backendPath, [], {
        env: { ...process.env, PORT: BACKEND_PORT.toString() }
      });
    }

    backendProcess.stdout.on('data', (data) => {
      logger.debug(`Backend: ${data}`);
      if (data.toString().includes('Uvicorn running on') || data.toString().includes('Application startup complete')) {
        resolve(true);
      }
    });

    backendProcess.stderr.on('data', (data) => {
      logger.error(`Backend Error: ${data}`);
    });

    backendProcess.on('error', (error) => {
      logger.error('Failed to start backend', error);
      reject(error);
    });

    // Wait for backend to be ready
    let attempts = 0;
    const maxAttempts = 30;
    
    const checkHealth = setInterval(async () => {
      attempts++;
      try {
        await axios.get(`${BACKEND_URL}/health`, { timeout: 1000 });
        clearInterval(checkHealth);
        logger.info('Backend is ready');
        resolve(true);
      } catch (error) {
        if (attempts >= maxAttempts) {
          clearInterval(checkHealth);
          logger.error('Backend failed to start after 30 seconds');
          reject(new Error('Backend failed to start after 30 seconds'));
        }
      }
    }, 1000);
  });
}

function stopBackend() {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
}

// Create dashboard window
function createDashboardWindow() {
  dashboardWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      webSecurity: true,
      sandbox: true,
      webviewTag: false,
      enableRemoteModule: false,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      navigateOnDragDrop: false
    }
  });

  // Load the app
  if (isDev) {
    dashboardWindow.loadURL('http://localhost:5173');
    dashboardWindow.webContents.openDevTools();
  } else {
    dashboardWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // Set Content Security Policy
  dashboardWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self';",
          "script-src 'self' 'unsafe-inline';",  // unsafe-inline needed for React in dev
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",  // MUI styles
          "font-src 'self' https://fonts.gstatic.com;",
          "img-src 'self' data: blob:;",
          "connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*;",
          "frame-src 'none';",
          "object-src 'none';",
          "base-uri 'self';",
          "form-action 'self';"
        ].join(' ')
      }
    });
  });

  dashboardWindow.on('ready-to-show', () => {
    dashboardWindow.show();
  });

  dashboardWindow.on('closed', () => {
    dashboardWindow = null;
  });

  // Prevent navigation to external URLs
  dashboardWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('http://localhost:5173') && !url.startsWith('file://')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
}

// Create buddy window (floating character)
function createBuddyWindow() {
  buddyWindow = new BrowserWindow({
    width: 150,
    height: 150,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      webSecurity: true,
      sandbox: true,
      webviewTag: false,
      enableRemoteModule: false,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      navigateOnDragDrop: false
    }
  });

  // Load buddy page
  if (isDev) {
    buddyWindow.loadURL('http://localhost:5173/#/buddy');
  } else {
    buddyWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'), {
      hash: '/buddy'
    });
  }

  // Set Content Security Policy
  buddyWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self';",
          "script-src 'self' 'unsafe-inline';",
          "style-src 'self' 'unsafe-inline';",
          "img-src 'self' data: blob:;",
          "connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*;",
          "frame-src 'none';",
          "object-src 'none';"
        ].join(' ')
      }
    });
  });

  // Make window draggable
  buddyWindow.on('closed', () => {
    buddyWindow = null;
  });
}

// Create system tray
function createTray() {
  // Create a small icon for the tray (you'll need to add an actual icon file)
  const iconPath = path.join(__dirname, '..', 'assets', 'tray-icon.png');
  
  // Create tray icon (fallback to empty icon if file doesn't exist)
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    if (trayIcon.isEmpty()) {
      // Create a simple colored square as fallback
      trayIcon = nativeImage.createFromBuffer(Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA7AAAAOwBeShxvQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABPSURBVDiN7dOxDQAgCETRB3ZhAHZnAHZhABYgkRBjYqLnXy655Aoh/JUk1bNkAGCckL3DcgZqAmQBsgDZJYDk0km3CrIbsAP4gnsC0Ov+AFdqDwfs7SfGAAAAAElFTkSuQmCC',
        'base64'
      ));
    }
  } catch (error) {
    // Create fallback icon
    trayIcon = nativeImage.createFromBuffer(Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA7AAAAOwBeShxvQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABPSURBVDiN7dOxDQAgCETRB3ZhAHZnAHZhABYgkRBjYqLnXy655Aoh/JUk1bNkAGCckL3DcgZqAmQBsgDZJYDk0km3CrIbsAP4gnsC0Ov+AFdqDwfs7SfGAAAAAElFTkSuQmCC',
      'base64'
    ));
  }
  
  tray = new Tray(trayIcon);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Dashboard',
      click: () => {
        if (!dashboardWindow) {
          createDashboardWindow();
        } else {
          dashboardWindow.show();
          dashboardWindow.focus();
        }
      }
    },
    {
      label: 'Show Buddy',
      click: () => {
        if (!buddyWindow) {
          createBuddyWindow();
        } else {
          buddyWindow.show();
          buddyWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Pause Assistant',
      type: 'checkbox',
      checked: false,
      click: (menuItem) => {
        // Send pause state to backend
        if (dashboardWindow) {
          dashboardWindow.webContents.send('assistant-paused', menuItem.checked);
        }
        if (buddyWindow) {
          buddyWindow.webContents.send('assistant-paused', menuItem.checked);
        }
      }
    },
    {
      label: 'Settings',
      click: () => {
        if (!dashboardWindow) {
          createDashboardWindow();
        }
        dashboardWindow.show();
        dashboardWindow.focus();
        dashboardWindow.webContents.send('navigate', '/settings');
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Clippy Revival');
  tray.setContextMenu(contextMenu);
  
  // Double click to show dashboard
  tray.on('double-click', () => {
    if (!dashboardWindow) {
      createDashboardWindow();
    } else {
      dashboardWindow.show();
      dashboardWindow.focus();
    }
  });
}

// Register global keyboard shortcuts
function registerGlobalShortcuts() {
  try {
    // Ctrl+Shift+D - Show Dashboard
    globalShortcut.register('CommandOrControl+Shift+D', () => {
      if (!dashboardWindow) {
        createDashboardWindow();
      } else {
        dashboardWindow.show();
        dashboardWindow.focus();
      }
      logger.info('Global shortcut triggered: Show Dashboard');
    });

    // Ctrl+Shift+B - Toggle Buddy Window
    globalShortcut.register('CommandOrControl+Shift+B', () => {
      if (!buddyWindow) {
        createBuddyWindow();
      } else if (buddyWindow.isVisible()) {
        buddyWindow.hide();
      } else {
        buddyWindow.show();
      }
      logger.info('Global shortcut triggered: Toggle Buddy');
    });

    logger.info('Global shortcuts registered successfully');
  } catch (error) {
    logger.error('Failed to register global shortcuts', error);
  }
}

// Unregister all shortcuts when app quits
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  logger.info('Global shortcuts unregistered');
});

// IPC handlers
ipcMain.handle('get-backend-url', () => BACKEND_URL);

ipcMain.handle('show-dashboard', () => {
  if (!dashboardWindow) {
    createDashboardWindow();
  } else {
    dashboardWindow.show();
    dashboardWindow.focus();
  }
});

ipcMain.handle('show-buddy', () => {
  if (!buddyWindow) {
    createBuddyWindow();
  } else {
    buddyWindow.show();
    buddyWindow.focus();
  }
});

ipcMain.handle('hide-buddy', () => {
  if (buddyWindow) {
    buddyWindow.hide();
  }
});

ipcMain.handle('set-buddy-click-through', (event, clickThrough) => {
  if (buddyWindow) {
    buddyWindow.setIgnoreMouseEvents(clickThrough, { forward: true });
  }
});

// Error logging handler
ipcMain.handle('log-error', (event, errorData) => {
  logger.error('Renderer error', null, errorData);
  return true;
});

// App event handlers
app.whenReady().then(async () => {
  logger.info('Application starting', { isDev, version: app.getVersion() });
  try {
    // Start backend first
    await startBackend();

    // Create tray icon
    createTray();

    // Create buddy window by default
    createBuddyWindow();

    // Show dashboard on first run or in dev mode
    if (isDev) {
      createDashboardWindow();
    }

    logger.info('Application started successfully');

    // Register global keyboard shortcuts
    registerGlobalShortcuts();
  } catch (error) {
    logger.crash(error, { context: 'app.whenReady' });
    dialog.showErrorBox(
      'Startup Error',
      'Failed to start the application. Please check the logs for more details.'
    );
    app.quit();
  }
});

app.on('window-all-closed', () => {
  // Don't quit when all windows are closed (keep in tray)
  // On macOS, this is the standard behavior
});

app.on('before-quit', () => {
  // Stop backend when quitting
  stopBackend();
});

app.on('activate', () => {
  // On macOS, re-create windows when dock icon is clicked
  if (process.platform === 'darwin') {
    if (!dashboardWindow) {
      createDashboardWindow();
    }
  }
});