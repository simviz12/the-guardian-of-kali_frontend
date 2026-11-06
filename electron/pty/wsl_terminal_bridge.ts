/**
 * Terminal PTY Process Bridge.
 * Spawns and manages a node-pty pseudoterminal session connected directly
 * to a real Kali Linux instance on WSL2 (on Windows) or the native shell
 * (on Linux and macOS) with streaming I/O and cleanup logic.
 */
import * as pty from 'node-pty';
import { BrowserWindow, ipcMain, IpcMainEvent } from 'electron';

export interface TerminalBridgeOptions {
  distro?: string;
  user?: string;
  cols?: number;
  rows?: number;
}

export class WslTerminalBridge {
  private ptyProcess: pty.IPty | null = null;
  private readonly distro: string;
  private readonly user: string;
  private readonly defaultCols: number;
  private readonly defaultRows: number;
  private window: BrowserWindow | null = null;

  constructor(options: TerminalBridgeOptions = {}) {
    this.distro = options.distro || 'kali-linux';
    this.user = options.user || 'root';
    this.defaultCols = options.cols || 80;
    this.defaultRows = options.rows || 30;
  }

  /**
   * Spawns the underlying shell process and connects IPC events to the window.
   */
  public attach(window: BrowserWindow): void {
    this.window = window;
    this.spawnPtyProcess();
    this.registerIpcHandlers();
  }

  /**
   * Spawns the PTY process:
   * - Windows: wsl.exe attaching to the Kali Linux distro (fallback: powershell.exe)
   * - macOS: default login shell ($SHELL or /bin/zsh)
   * - Linux: default login shell ($SHELL or /bin/bash)
   */
  private spawnPtyProcess(): void {
    let shell: string;
    let args: string[] = [];

    if (process.platform === 'win32') {
      shell = 'wsl.exe';
      args = ['-d', this.distro, '-u', this.user];
    } else if (process.platform === 'darwin') {
      shell = process.env.SHELL || '/bin/zsh';
      args = ['-l'];
    } else {
      shell = process.env.SHELL || '/bin/bash';
      args = ['-l'];
    }

    const homeDir = process.env.HOME || process.env.USERPROFILE || process.cwd();

    try {
      this.ptyProcess = pty.spawn(shell, args, {
        name: 'xterm-256color',
        cols: this.defaultCols,
        rows: this.defaultRows,
        cwd: homeDir,
        env: {
          ...process.env,
          TERM: 'xterm-256color',
          COLORTERM: 'truecolor',
        } as Record<string, string>,
      });
    } catch (err) {
      console.warn(`Terminal spawn error with ${shell}:`, err);
      try {
        const fallbackShell = process.platform === 'win32' ? 'powershell.exe' : '/bin/sh';
        this.ptyProcess = pty.spawn(fallbackShell, [], {
          name: 'xterm-256color',
          cols: this.defaultCols,
          rows: this.defaultRows,
          cwd: homeDir,
          env: process.env as Record<string, string>,
        });
      } catch (fallbackErr) {
        console.error('Fallback terminal spawn failed:', fallbackErr);
      }
    }

    if (!this.ptyProcess) {
      console.error('Unable to initialize terminal pty process.');
      return;
    }

    // Stream terminal output data to the renderer window in real time
    this.ptyProcess.onData((data: string) => {
      if (this.window && !this.window.isDestroyed()) {
        this.window.webContents.send('terminal:output', data);
      }
    });

    this.ptyProcess.onExit((e: { exitCode: number; signal?: number }) => {
      console.log(`Terminal session exited with code ${e.exitCode}, signal ${e.signal}`);
      this.cleanup();
    });
  }

  /**
   * Registers IPC handlers for sending terminal input, resize events, and closing sessions.
   */
  private registerIpcHandlers(): void {
    ipcMain.on('terminal:input', this.handleTerminalInput);
    ipcMain.on('terminal:direct-write', this.handleTerminalDirectWrite);
    ipcMain.on('terminal:resize', this.handleTerminalResize);
    ipcMain.on('terminal:close', this.handleTerminalClose);
  }

  private handleTerminalInput = (_: IpcMainEvent, data: string): void => {
    if (this.ptyProcess) {
      this.ptyProcess.write(data);
    }
  };

  private handleTerminalDirectWrite = (_: IpcMainEvent, data: string): void => {
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send('terminal:output', data);
    }
  };

  private handleTerminalResize = (
    _: IpcMainEvent,
    { cols, rows }: { cols: number; rows: number }
  ): void => {
    if (this.ptyProcess) {
      try {
        this.ptyProcess.resize(cols, rows);
      } catch (err) {
        console.warn('Terminal resize error:', err);
      }
    }
  };

  private handleTerminalClose = (_: IpcMainEvent): void => {
    this.cleanup();
  };

  /**
   * Cleans up running PTY processes and unregisters IPC handlers on window close.
   */
  public cleanup(): void {
    ipcMain.removeListener('terminal:input', this.handleTerminalInput);
    ipcMain.removeListener('terminal:direct-write', this.handleTerminalDirectWrite);
    ipcMain.removeListener('terminal:resize', this.handleTerminalResize);
    ipcMain.removeListener('terminal:close', this.handleTerminalClose);

    if (this.ptyProcess) {
      try {
        this.ptyProcess.kill();
      } catch (err) {
        console.warn('Error terminating PTY process:', err);
      }
      this.ptyProcess = null;
    }

    this.window = null;
  }
}
