/**
 * Electron main process entry point.
 * Manages application lifecycle, native window instances, and the WSL PTY bridge.
 */
import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { WslTerminalBridge } from './pty/wsl_terminal_bridge.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let terminalBridge: WslTerminalBridge | null = null;

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Initialize and attach the WSL terminal bridge for the operator user
  terminalBridge = new WslTerminalBridge({
    distro: 'kali-linux',
    user: 'carlos',
  });
  terminalBridge.attach(mainWindow);

  mainWindow.on('closed', () => {
    if (terminalBridge) {
      terminalBridge.cleanup();
      terminalBridge = null;
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (terminalBridge) {
    terminalBridge.cleanup();
    terminalBridge = null;
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
