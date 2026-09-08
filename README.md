# The Guardian of Kali — Desktop (`kali-ai-desktop`)

Desktop frontend application for **The Guardian of Kali**, featuring an integrated Kali Linux terminal emulator and an AI assistant interface for ethical hacking and CTF training.

## Features

- **Embedded Kali Terminal**: Real PTY terminal session using `xterm.js` and `node-pty` connected to Kali Linux via WSL2.
- **Interactive AI Chat**: Real-time natural language chat assistant powered by the backend policy engine and Claude API.
- **Visual Policy Indicator**: Security badge displaying policy evaluation status (Safe, Risky, Blocked) before commands are run.

## Tech Stack

- **Desktop Framework**: Electron
- **UI Library**: React + TypeScript
- **Bundler**: Vite
- **Terminal Emulator**: `xterm.js` + `node-pty`
- **Styling**: TailwindCSS

## Setup (Placeholder)

```bash
# Clone the repository
git clone https://github.com/simviz12/the-guardian-of-kali_frontend.git
cd the-guardian-of-kali_frontend

# Install dependencies
npm install

# Run in development mode
npm run dev
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
