/**
 * Electron preload bridge.
 * Exposes secure, isolated IPC channels between renderer and main processes.
 */
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  sendTerminalInput: (data: string): void => {
    ipcRenderer.send('terminal:input', data);
  },
  sendTerminalResize: (cols: number, rows: number): void => {
    ipcRenderer.send('terminal:resize', { cols, rows });
  },
  onTerminalOutput: (callback: (data: string) => void): void => {
    ipcRenderer.on('terminal:output', (_, data: string) => callback(data));
  },
});
