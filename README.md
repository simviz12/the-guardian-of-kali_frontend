# The Guardian of Kaliche - Frontend

Consola unificada de operaciones de seguridad (React/Vite + Electron). Se encarga de renderizar la terminal nativa de WSL2 (Kali Linux), visualizar el dashboard del historial, y proporcionar una interfaz de chat con el copiloto IA.

## Arquitectura del Sistema (Clean Architecture UI)

El frontend sigue un enfoque modularizado inspirado en Clean Architecture, separando estrictamente la lógica de la Interfaz de Usuario (React) de los servicios externos (APIs) y de las capacidades nativas del Sistema Operativo (Electron).

```text
the-guardian-of-kali_frontend/
├── src/                      # Código React (Renderer Process)
│   ├── components/           # Módulos de la UI separados por dominio
│   │   ├── chat/             # Panel de copiloto IA (ChatPanel, etc.)
│   │   ├── history/          # Tabla de auditoría (SessionHistory)
│   │   ├── session/          # Pantalla de inicio (SessionSetup)
│   │   ├── terminal/         # Integración visual xterm.js (TerminalView)
│   │   └── common/           # Componentes reusables (ErrorBanner)
│   │
│   ├── services/             # Adaptadores de red (Puentes externos)
│   │   └── apiClient.ts      # Cliente HTTP fuertemente tipado para interactuar con FastAPI
│   │
│   ├── types/                # Entidades y Modelos del Frontend
│   │   ├── errors.ts         # Manejo de errores unificado
│   │   └── session.ts        # Interfaces principales (ActiveSessionConfig)
│   │
│   ├── App.tsx               # Orquestador principal (Rutas y Estado Global)
│   └── main.tsx              # Punto de entrada de React
│
├── electron/                 # Código Nativo (Main Process Node.js)
│   ├── pty/                  # Manejo de Pseudo-Terminales
│   │   └── wsl_terminal_bridge.ts  # Adaptador específico que se comunica con WSL2
│   ├── main.ts               # Ciclo de vida de la ventana Electron e IPC Main
│   └── preload.ts            # Seguridad IPC (Exposición segura de APIs a React)
```

### Flujo de Ejecución (IPC Bridge)
Para mantener la seguridad en Electron, el código web (React) nunca toca directamente el sistema.
1. **React (`TerminalView.tsx`)** renderiza la ventana negra usando `xterm.js`.
2. Cuando escribes comandos (o usas la IA), React llama a `window.terminalAPI.sendInput()`.
3. Esto viaja por el puente seguro `preload.ts` hasta el proceso central `main.ts`.
4. El adaptador `wsl_terminal_bridge.ts` intercepta la llamada y la inyecta directamente al `node-pty` de `wsl.exe -u root`, procesándolo a nivel del sistema operativo.
5. Simultáneamente, React utiliza `apiClient.ts` para notificarle asíncronamente al backend (FastAPI) y dejar el registro en SQLite.

## Instalación y Ejecución

*Nota: Ejecuta el script `Iniciar_Guardian.bat` desde la carpeta principal del proyecto para iniciar tanto el frontend como el backend en un solo clic.*

Para ejecutar el frontend manualmente (requiere el backend activo en el puerto 8765):
```bash
# 1. Instalar dependencias
npm install

# 2. Compilar React (Vite)
npm run build:renderer

# 3. Compilar Node/Electron (esbuild)
npm run build:electron

# 4. Iniciar aplicación
npm run start
```
