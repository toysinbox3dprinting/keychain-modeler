import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { registerFileIpc } from './ipc/files';
import { registerAppIpc } from './ipc/app';

const DEV_SERVER_URL = process.env.ELECTRON_RENDERER_URL || 'http://localhost:5173';
const DEV_SERVER_ORIGIN = (() => {
  try {
    return new URL(DEV_SERVER_URL).origin;
  } catch {
    return null;
  }
})();

const isNavigationAllowed = (targetUrl: string): boolean => {
  if (targetUrl === 'about:blank') {
    return true;
  }

  if (app.isPackaged) {
    return false;
  }

  if (!DEV_SERVER_ORIGIN) {
    return false;
  }

  try {
    return new URL(targetUrl).origin === DEV_SERVER_ORIGIN;
  } catch {
    return false;
  }
};

const createMainWindow = async (): Promise<void> => {
  const window = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 720,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.once('ready-to-show', () => {
    window.show();
  });

  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event, targetUrl) => {
    if (!isNavigationAllowed(targetUrl)) {
      event.preventDefault();
    }
  });

  if (app.isPackaged) {
    await window.loadFile(path.join(__dirname, '..', 'build', 'index.html'));
    return;
  }

  await window.loadURL(DEV_SERVER_URL);
};

app.whenReady().then(async () => {
  registerAppIpc(ipcMain);
  registerFileIpc(ipcMain);
  await createMainWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
