/**
 * Electron preload bridge.
 * Exposes secure IPC channels between renderer and main processes.
 */
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  sendTerminalInput: (data: string) => ipcRenderer.send('terminal:input', data),
  onTerminalOutput: (callback: (data: string) => void) => {
    ipcRenderer.on('terminal:output', (_, data) => callback(data));
  },
});
