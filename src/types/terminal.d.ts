/**
 * Type declarations for terminal IPC and window context bridge.
 */
export interface IElectronAPI {
  sendTerminalInput: (data: string) => void;
  sendTerminalResize: (cols: number, rows: number) => void;
  onTerminalOutput: (callback: (data: string) => void) => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
