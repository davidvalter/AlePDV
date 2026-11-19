import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import { initStore } from './config/store';
import { registerIpcHandlers } from './ipc/handlers';
import { startWebhookServer } from './fiscal/webhookServer';
import { getLogFilePath, logger } from './utils/logger';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#1a2e1a',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(join(__dirname, '../../dist/renderer/index.html'));
  }
}

app.whenReady().then(() => {
  logger.info('app.started', {
    version: app.getVersion(),
    platform: process.platform,
    logFile: getLogFilePath(),
  });
  initStore();
  registerIpcHandlers();
  startWebhookServer(3010);
  createWindow();
}).catch((error) => {
  logger.error('app.startup.failed', error);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});