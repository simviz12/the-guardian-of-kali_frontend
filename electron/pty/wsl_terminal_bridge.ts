/**
 * WSL PTY process bridge.
 * Spawns and manages node-pty session connected directly to Kali Linux on WSL2.
 */
export interface TerminalBridgeOptions {
  distro: string;
  user: string;
}

export class WslTerminalBridge {
  private distro: string;
  private user: string;

  constructor(options: TerminalBridgeOptions) {
    this.distro = options.distro;
    this.user = options.user;
  }

  public initializeSession(): void {
    // Placeholder: node-pty integration will be attached here.
  }
}
