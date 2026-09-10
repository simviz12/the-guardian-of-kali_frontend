/**
 * WSL PTY process bridge.
 * Spawns and manages node-pty session connected directly to Kali Linux on WSL2.
 */
export interface TerminalBridgeOptions {
  distro: string;
  user: string;
}

export class WslTerminalBridge {
  public readonly distro: string;
  public readonly user: string;

  constructor(options: TerminalBridgeOptions) {
    this.distro = options.distro;
    this.user = options.user;
  }

  public initializeSession(): void {
    // Placeholder: node-pty integration will be attached here.
    console.log(`Connecting to WSL distro: ${this.distro} as ${this.user}`);
  }
}
