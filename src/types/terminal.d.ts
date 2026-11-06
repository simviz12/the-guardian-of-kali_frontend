/**
 * Type declarations for terminal IPC and window context bridge.
 */
export interface TerminalBridgeAPI {
  sendInput: (text: string) => void;
  onOutput: (callback: (data: string) => void) => () => void;
  closeSession: () => void;
}

declare global {
  interface Window {
    terminalAPI: TerminalBridgeAPI;
    /** Returns the last visible lines of the terminal buffer (set by TerminalView). */
    getTerminalText?: () => string;
  }
}
