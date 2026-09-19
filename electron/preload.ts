/**
 * Electron Preload Script.
 * Safely exposes a minimal, hardened IPC bridge to the renderer window using contextBridge.
 *
 * Security Principles:
 * - nodeIntegration stays DISABLED: Prevents renderer code from accessing Node.js runtime/fs/child_process.
 * - contextIsolation stays ENABLED: Keeps preload and renderer execution contexts strictly isolated
 *   in memory, preventing prototype pollution or privilege escalation.
 */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export interface TerminalBridgeAPI {
  sendInput: (text: string) => void;
  writeOutput: (text: string) => void;
  onOutput: (callback: (data: string) => void) => () => void;
  closeSession: () => void;
}

const terminalAPI: TerminalBridgeAPI = {
  /**
   * Sends user keystrokes or command text to the WSL pseudoterminal.
   */
  sendInput: (text: string): void => {
    if (typeof text === 'string') {
      ipcRenderer.send('terminal:input', text);
    }
  },

  /**
   * Directly writes text to the terminal UI without sending to WSL stdin.
   */
  writeOutput: (text: string): void => {
    if (typeof text === 'string') {
      ipcRenderer.send('terminal:direct-write', text);
    }
  },

  /**
   * Subscribes to real-time streaming terminal output from Kali Linux.
   * Returns an unsubscribe cleanup function to prevent memory leaks.
   */
  onOutput: (callback: (data: string) => void): (() => void) => {
    const listener = (_: IpcRendererEvent, data: string): void => {
      callback(data);
    };
    ipcRenderer.on('terminal:output', listener);

    return () => {
      ipcRenderer.removeListener('terminal:output', listener);
    };
  },

  /**
   * Requests graceful termination and cleanup of the active WSL session.
   */
  closeSession: (): void => {
    ipcRenderer.send('terminal:close');
  },
};

// Expose the hardened API exclusively under window.terminalAPI
contextBridge.exposeInMainWorld('terminalAPI', terminalAPI);
