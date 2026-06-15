const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Local Database Imports
const { initDatabase } = require('./db/dbManager');
const { registerOrderHandlers } = require('./ipc/orderHandlers');
const { registerMenuHandlers } = require('./ipc/menuHandlers');
const { startSyncEngine, stopSyncEngine, executeSync, getPendingQueueCount } = require('./syncEngine');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    title: "RMS POS Desktop",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../admin-frontend/dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  // 1. Initialize SQLite Database (Async WebAssembly Wasm boot)
  await initDatabase();

  // 2. Register IPC Main Query handlers
  registerOrderHandlers(ipcMain);
  registerMenuHandlers(ipcMain);

  // 3. Register Sync IPC Actions
  ipcMain.handle('db:sync-queue-now', async () => {
    executeSync();
    return { success: true };
  });

  ipcMain.handle('db:get-sync-status', async () => {
    const pendingCount = getPendingQueueCount();
    return { pendingCount };
  });

  // 4. Start Background Sync engine
  startSyncEngine();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Stop background sync threads cleanly
  stopSyncEngine();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
