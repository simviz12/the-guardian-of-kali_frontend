/**
 * Type declarations for terminal IPC and window context bridge.
 */
export interface IElectronAPI {
  sendTerminalInput: (data: string) => void;
  onTerminalOutput: (callback: (data: string) => void) => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
