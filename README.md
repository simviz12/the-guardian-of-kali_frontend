# The Guardian of Kaliche - Frontend
> Consola unificada de operaciones de seguridad (React 18 + Vite + TailwindCSS + Electron).

---

> 📖 **Guías de instalación paso a paso:**
> - 🪟 **Windows (WSL2 + Kali):** [INSTALACION.md](./INSTALACION.md)
> - 🍎 **macOS y 🐧 Linux (Nativo / Kali Linux):** [INSTALACION_LINUX_MAC.md](./INSTALACION_LINUX_MAC.md)

---

## ⚡ INSTALACIÓN Y ARRANQUE EN 1 CLIC

El proyecto cuenta con instaladores automáticos para **todas las plataformas**:

### 🪟 En Windows (`setup_and_run.bat`)
```bat
setup_and_run.bat
```
*(Verifica e instala Git, Node y Python vía `winget`, clona el backend, configura venv, compila y abre la app).*

### 🐧 En Linux y 🍎 En macOS (`setup_and_run.sh` / `install.sh`)
```bash
chmod +x setup_and_run.sh install.sh
./setup_and_run.sh
```
O para instalar una sola vez y generar accesos directos:
```bash
./install.sh
```
- **macOS:** Genera `Iniciar_Guardian.command` para abrir con **doble clic en el Finder**.
- **Linux:** Genera un acceso directo en tu menú de aplicaciones (`the-guardian-of-kali.desktop`) y `./Iniciar_Guardian.sh`.

---

## 📦 GENERAR INSTALADORES PORTABLES (ELECTRON-BUILDER)

Puedes compilar binarios de instalación para distribución:

```bash
# Para Linux (.AppImage, .deb, .tar.gz):
npm run package:linux

# Para macOS (.dmg, .zip):
npm run package:mac

# Para Windows (.exe NSIS):
npm run package:win
```
Los archivos de distribución resultantes se generan en la carpeta `release/`.

---

## 🏗️ ARQUITECTURA DEL SISTEMA (CLEAN ARCHITECTURE UI)

El frontend sigue un enfoque modularizado inspirado en Clean Architecture, separando estrictamente la lógica de la Interfaz de Usuario (React) de los servicios externos (APIs) y de las capacidades nativas del Sistema Operativo (Electron):

```text
the-guardian-of-kali_frontend/
├── src/                      # Código React (Renderer Process)
│   ├── components/           # Módulos de la UI separados por dominio
│   │   ├── auth/             # Pantalla de Autenticación y Registro (LoginScreen)
│   │   ├── chat/             # Panel de copiloto IA (ChatPanel)
│   │   ├── history/          # Tabla de auditoría (SessionHistory)
│   │   ├── session/          # Pantalla de inicio de sesión Zero-Trust (SessionSetup)
│   │   ├── terminal/         # Integración visual xterm.js (TerminalView)
│   │   ├── settings/         # Configuración de API Keys (SettingsView)
│   │   ├── guide/            # Guía interactiva RoE (GuideView)
│   │   └── common/           # Componentes reusables (ErrorBanner, ErrorBoundary)
│   │
│   ├── contexts/             # Estado Global (AppContext: Tema Dark/Light e Idioma ES/EN)
│   ├── services/             # Adaptadores de red (apiClient.ts para FastAPI)
│   ├── types/                # Entidades y Modelos del Frontend (session.ts, errors.ts)
│   ├── App.tsx               # Orquestador principal (Rutas y Control de Acceso)
│   └── main.tsx              # Punto de entrada de React
│
├── electron/                 # Código Nativo (Main Process Node.js)
│   ├── pty/                  # Manejo de Pseudo-Terminales WSL2 / Linux / macOS (wsl_terminal_bridge.ts)
│   ├── main.ts               # Ciclo de vida de la ventana Electron e IPC Main
│   └── preload.ts            # Seguridad IPC (Exposición segura de APIs a React)
│
├── install.sh                # Instalador asistido para Linux y macOS
├── setup_and_run.sh          # Instalación + arranque en 1 paso (Linux/macOS)
├── Iniciar_Guardian.sh       # Lanzador diario rápido para Linux/macOS
├── Iniciar_Guardian.command  # Lanzador doble clic para macOS Finder
└── the-guardian-of-kali.desktop # Lanzador de aplicaciones para Linux
```

---

## 🎨 CARACTERÍSTICAS DE LA INTERFAZ

1. **🔐 Autenticación Completa de Operador:**
   - Inicio de sesión con **Correo Electrónico** y **Contraseña**.
   - Pestaña para **Crear Cuenta (Registro)** con confirmación de clave y almacenamiento seguro local.
2. **🌓 Modos Visuales (Dark & Light):**
   - Conmutador en tiempo real con icono de sol/luna en la barra superior.
3. **🌐 Internacionalización Integral (`ES | EN`):**
   - Selector tipo cápsula con soporte completo de traducción para toda la aplicación.
4. **💻 Puente Terminal PTY Multiplataforma:**
   - En **Windows**: Acceso nativo interactivo a Kali Linux en WSL2 vía `node-pty`.
   - En **Linux**: Conexión nativa interactiva a tu shell local (`/bin/bash`).
   - En **macOS**: Conexión nativa interactiva a tu shell local (`/bin/zsh` o `/bin/bash`).
   - **Historial de comandos** con flechas `↑/↓`, comando/botón **`clear`** (y `Ctrl+L`), y buffer acotado a 2000 líneas para evitar fugas de memoria.
5. **🚀 Splash Screen:**
   - Animación de bienvenida (reutiliza `public/intro.mp4`) que valida la conexión con el backend y los sockets antes de entrar, con transición automática y timeout de seguridad si el backend no responde.

---

## 🛠️ EJECUCIÓN MANUAL (MODO DESARROLLO)

```bash
# 1. Instalar dependencias
npm install

# 2. Compilar aplicación para producción
npm run build

# 3. Iniciar ventana Electron
npm run start
```
