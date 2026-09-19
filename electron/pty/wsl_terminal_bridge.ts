/**
 * WSL PTY Process Bridge.
 * Spawns and manages a node-pty pseudoterminal session connected directly
 * to a real Kali Linux instance on WSL2 with streaming I/O and cleanup logic.
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
    this.user = options.user || 'carlos';
    this.defaultCols = options.cols || 80;
    this.defaultRows = options.rows || 30;
  }

  /**
   * Spawns the underlying wsl.exe process and connects IPC events to the window.
   */
  public attach(window: BrowserWindow): void {
    this.window = window;
    this.spawnPtyProcess();
    this.registerIpcHandlers();
  }

  /**
   * Spawns wsl.exe attaching to the Kali Linux distribution under the specified user.
   */
  private spawnPtyProcess(): void {
    const shell = 'wsl.exe';
    const args = ['-d', this.distro, '-u', this.user];

    this.ptyProcess = pty.spawn(shell, args, {
      name: 'xterm-256color',
      cols: this.defaultCols,
      rows: this.defaultRows,
      cwd: process.env.HOME || process.env.USERPROFILE,
      env: process.env as Record<string, string>,
    });

    // Stream terminal output data to the renderer window in real time
    this.ptyProcess.onData((data: string) => {
      if (this.window && !this.window.isDestroyed()) {
        this.window.webContents.send('terminal:output', data);
      }
    });

    this.ptyProcess.onExit((e: { exitCode: number; signal?: number }) => {
      console.log(`WSL terminal session exited with code ${e.exitCode}, signal ${e.signal}`);
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
