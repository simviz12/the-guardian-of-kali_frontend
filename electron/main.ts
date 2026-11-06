/**
 * Electron main process entry point.
 * Manages application lifecycle, native window instances, and the WSL PTY bridge.
 */
import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
// In CJS, __dirname and __filename are natively available.
import { WslTerminalBridge } from './pty/wsl_terminal_bridge.js';
import { spawn, ChildProcess } from 'child_process';

let terminalBridge: WslTerminalBridge | null = null;
let backendProcess: ChildProcess | null = null;

function resolveBackendDir(): string {
  // Allow the launcher (setup_and_run.bat) to pin the backend location.
  if (process.env.GUARDIAN_BACKEND_DIR) {
    return path.resolve(process.env.GUARDIAN_BACKEND_DIR);
  }
  // Otherwise probe the common sibling layouts relative to the frontend repo.
  const candidates = [
    path.resolve(__dirname, '../../the-guardian-of-kali_backend'),
    path.resolve(__dirname, '../../backend'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, '.venv', 'Scripts', 'python.exe'))) return dir;
  }
  return candidates[0];
}

function startBackend() {
  // When an external launcher already started the backend, do not spawn a second
  // instance (that would collide on port 8765).
  if (process.env.GUARDIAN_SKIP_BACKEND === '1') {
    console.log('GUARDIAN_SKIP_BACKEND=1 set; using the externally managed backend.');
    return;
  }

  const backendDir = resolveBackendDir();
  const pythonExe = path.join(backendDir, '.venv', 'Scripts', 'python.exe');

  if (!fs.existsSync(pythonExe)) {
    console.error(`Backend python not found at ${pythonExe}. Start the backend manually.`);
    return;
  }

  backendProcess = spawn(pythonExe, ['-m', 'src.main'], {
    cwd: backendDir,
    detached: false,
  });

  backendProcess.stdout?.on('data', (data) => console.log(`Backend: ${data}`));
  backendProcess.stderr?.on('data', (data) => console.error(`Backend Error: ${data}`));
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    backgroundColor: '#09090b', // zinc-950 color to match the app theme
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Initialize and attach the WSL terminal bridge for the operator user
  terminalBridge = new WslTerminalBridge({
    distro: 'kali-linux',
    user: 'root',
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
