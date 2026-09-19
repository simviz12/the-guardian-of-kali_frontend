/**
 * Electron main process entry point.
 * Manages application lifecycle, native window instances, and the WSL PTY bridge.
 */
import { app, BrowserWindow } from 'electron';
import * as path from 'path';
// In CJS, __dirname and __filename are natively available.
import { WslTerminalBridge } from './pty/wsl_terminal_bridge.js';
import { spawn, ChildProcess } from 'child_process';

let terminalBridge: WslTerminalBridge | null = null;
let backendProcess: ChildProcess | null = null;

function startBackend() {
  // __dirname is dist-electron, so we go up two levels to reach the root workspace folder
  const backendDir = path.resolve(__dirname, '../../the-guardian-of-kali_backend');
  const pythonExe = path.join(backendDir, '.venv', 'Scripts', 'python.exe');
  
  backendProcess = spawn(pythonExe, ['-m', 'src.main'], {
    cwd: backendDir,
    detached: false
  });

  backendProcess.stdout?.on('data', (data) => console.log(`Backend: ${data}`));
  backendProcess.stderr?.on('data', (data) => console.error(`Backend Error: ${data}`));
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
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

app.whenReady().then(() => {
  startBackend();
  createWindow();
});

app.on('window-all-closed', () => {
  if (terminalBridge) {
    terminalBridge.cleanup();
    terminalBridge = null;
  }
  if (backendProcess) {
    backendProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
