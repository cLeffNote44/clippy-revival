const { app, BrowserWindow, Tray, Menu, ipcMain, shell, nativeImage } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');

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
    console.log('Backend already running');
    return true;
  } catch (error) {
    console.log('Starting backend...');
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
      const backendPath = path.join(process.resourcesPath, 'backend', 'backend.exe');
      backendProcess = spawn(backendPath, [], {
        env: { ...process.env, PORT: BACKEND_PORT.toString() }
      });
    }

    backendProcess.stdout.on('data', (data) => {
      console.log(`Backend: ${data}`);
      if (data.toString().includes('Uvicorn running on') || data.toString().includes('Application startup complete')) {
        resolve(true);
      }
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`Backend Error: ${data}`);
    });

    backendProcess.on('error', (error) => {
      console.error('Failed to start backend:', error);
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
        console.log('Backend is ready');
        resolve(true);
      } catch (error) {
        if (attempts >= maxAttempts) {
          clearInterval(checkHealth);
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
      webSecurity: true
    }
  });

  // Load the app
  if (isDev) {
    dashboardWindow.loadURL('http://localhost:5173');
    dashboardWindow.webContents.openDevTools();
  } else {
    dashboardWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

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
      webSecurity: true
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

// App event handlers
app.whenReady().then(async () => {
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
  } catch (error) {
    console.error('Failed to start application:', error);
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