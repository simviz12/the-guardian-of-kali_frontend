# The Guardian of Kali — Desktop Application (`the-guardian-of-kali_frontend`)

[![React](https://img.shields.io/badge/React-18.3+-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Electron](https://img.shields.io/badge/Electron-32.0+-47848F.svg?logo=electron&logoColor=white)](https://www.electronjs.org)
[![Vite](https://img.shields.io/badge/Vite-5.4+-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4+-06B6D4.svg?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Cross-platform desktop application for **The Guardian of Kali** — an integrated dual-pane cybersecurity terminal for **Kali Linux on WSL2** coupled with a real-time **Anthropic Claude 3.5 Sonnet** ethical hacking co-pilot and zero-trust safety guardrails.

---

## 📋 Table of Contents

- [Core Features](#core-features)
- [Prerequisites (WSL2 + Kali Linux + Node.js)](#prerequisites-wsl2--kali-linux--nodejs)
- [Installation Steps](#installation-steps)
- [Secure API Key Configuration](#secure-api-key-configuration)
- [Quickstart Guide](#quickstart-guide)
  - [Operating Modes: Suggestion vs Autonomous](#operating-modes-suggestion-vs-autonomous)
  - [Policy Indicator Colors & Threat Matrix](#policy-indicator-colors--threat-matrix)
- [Architecture & Security Principles](#architecture--security-principles)
- [Development & Build Commands](#development--build-commands)
- [License](#license)

---

## ✨ Core Features

- **Native Kali Linux Pseudo-Terminal (PTY)**: Hardware-accelerated terminal emulator built with `@xterm/xterm` 5.5, `@xterm/addon-fit`, and `node-pty` connected directly to your Kali Linux WSL2 instance under the human operator identity (`carlos`).
- **AI Cybersecurity Co-Pilot (Claude 3.5 Sonnet)**: Conversational assistant tailored for penetration testing, CTFs (HackTheBox, TryHackMe), and vulnerability analysis with structured command proposals.
- **Visual Policy Indicator (Safety Traffic Light)**: Real-time UI indicator rendering risk classification (`LOW`, `MEDIUM`, `HIGH`, `BLOCKED`) and exact policy decision reasons before commands touch the shell.
- **Zero-Trust Session Setup**: Initial setup screen enforcing strict target scope definition (IPs, CIDR subnets, domain names) and operational execution mode.
- **Audit History & Forensics**: Searchable, paginated audit table recording executed commands, origin (`AI` vs `MANUAL_USER`), timestamps, risk scores, and process exit codes.
- **Global Error Handling & Resilience**: Interactive diagnostics (`ErrorBanner`, `ErrorModal`) providing one-click recovery hints for backend downtime, Claude API rate limits, or WSL2 connection failures.

---

## ⚙️ Prerequisites (WSL2 + Kali Linux + Node.js)

To run the desktop application, ensure your environment meets the following requirements:

1. **Windows 10/11 with WSL2 & Kali Linux**:
   - Ensure WSL2 is installed:
     ```powershell
     wsl --install -d kali-linux
     ```
   - Ensure the operator user `carlos` and AI restricted user `ia-user` are configured.
2. **Node.js**:
   - Node.js **20 LTS** or higher installed on Windows.
   - npm (bundled with Node.js) or pnpm.
3. **Backend Service Running**:
   - The Guardian of Kali FastAPI backend service must be running locally on `http://127.0.0.1:8765`.

---

## 📦 Installation Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/simviz12/the-guardian-of-kali_frontend.git
   cd the-guardian-of-kali_frontend
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables (Optional)**:
   ```powershell
   copy .env.example .env
   ```

---

## 🔑 Secure API Key Configuration

> [!IMPORTANT]
> **No Frontend Secrets**: The frontend desktop application connects to the local FastAPI backend on `127.0.0.1:8765`. **Never** store secret credentials, Anthropic Claude API keys, or private tokens inside frontend code, environment variables, or localStorage.

- The Anthropic API key is strictly maintained and consumed by the **backend service** (`the-guardian-of-kali_backend`) via the system environment variable `ANTHROPIC_API_KEY`.
- Frontend communications only handle operational parameters:
  - `VITE_BACKEND_URL`: URL of the local FastAPI backend (default: `http://127.0.0.1:8765`).
  - `VITE_API_TIMEOUT_MS`: Network request timeout (default: `30000` ms).

---

## 🚀 Quickstart Guide

### Starting the Application
1. Ensure your backend is running:
   ```powershell
   # In the backend repository:
   python -m src.main
   ```
2. Start the desktop frontend in development mode:
   ```powershell
   npm run dev
   ```
   Or launch the full Electron desktop window:
   ```powershell
   npm run build
   npx electron .
   ```

### Operating Modes: Suggestion vs Autonomous

When starting a session on the **Session Setup** screen, select your desired operating mode:

| Mode | Autonomous Execution | Required Operator Action | Recommendation |
| :--- | :--- | :--- | :--- |
| **Suggestion Mode** (`is_autonomous=False`) | Only **LOW** risk commands (e.g. `whois`, `dig`, `ping`) auto-execute. | **MEDIUM** and **HIGH** risk commands require explicit operator confirmation before execution. | Recommended for beginners, CTF training, and sensitive security assessments where manual human validation is mandatory. |
| **Autonomous Mode** (`is_autonomous=True`) | **LOW** and **MEDIUM** risk commands (e.g. `nmap -sV`, `gobuster`, `nikto`) auto-execute without prompting. | **HIGH** risk commands (e.g. `sqlmap`, `hydra`, `msfconsole`) **always** pause and require explicit operator confirmation. | Recommended for experienced security engineers conducting rapid reconnaissance workflows. |

> [!NOTE]
> Regardless of mode, commands matching destructive blacklist patterns (`rm -rf /`, `mkfs`, `fdisk`, `shutdown`, `sudo nmap --script`) are **permanently blocked** by the policy engine with `HTTP 403 Forbidden`.

### Policy Indicator Colors & Threat Matrix

The visual `PolicyIndicator` badge provides real-time security feedback:

| Color | Badge Label | Risk Level | Description & Examples | Action |
| :---: | :--- | :---: | :--- | :--- |
| 🟢 **Green** | `LOW` | Low Risk | Passive reconnaissance, DNS lookups, reachability checks (`whois`, `dig`, `nslookup`, `ping`, `uname -s`, `id`). | **Auto-executes** in both modes. |
| 🟡 **Yellow** | `MEDIUM` | Medium Risk | Active network mapping, port scanning, service enumeration, directory fuzzing (`nmap -sV`, `gobuster`, `dirsearch`, `nikto`, `whatweb`, `sslscan`). | **Requires Confirmation** in Suggestion mode; **Auto-executes** in Autonomous mode. |
| 🔴 **Red** | `HIGH` | High Risk | Vulnerability exploitation, credential brute-forcing, password cracking, payload delivery (`sqlmap`, `hydra`, `medusa`, `john`, `hashcat`, `msfconsole`). | **Always Requires Confirmation** across all modes. |
| 🚫 **Black / Dark Red** | `BLOCKED` | Destructive | Mass filesystem deletion (`rm -rf /`), partition formatting (`mkfs`), raw device overwrites (`dd of=/dev/sd*`), host firewall disabling (`iptables -F`), or sudo breakout attempts (`sudo nmap --script`). | **BLOCKED IMMEDIATELY** (never touches terminal shell). |

---

## 🛡️ Architecture & Security Principles

- **Electron IPC Isolation**: Built with `contextIsolation: true` and `nodeIntegration: false`. Terminal PTY streams and backend calls are safely brokered through validated preload bridges.
- **Zero-Trust Scope Enforcement**: Commands with target IPs or domains outside the session's configured targets are immediately blocked before shell invocation.
- **Operator Separation**: Manual terminal input is executed under the interactive user `carlos`, while AI-suggested commands execute under the unprivileged `ia-user` with strict sudo whitelist boundaries.

---

## 🛠️ Development & Build Commands

```bash
# Start local Vite development server
npm run dev

# Type check TypeScript and bundle for production
npm run build

# Run ESLint to verify code quality
npm run lint
```

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
