# The Guardian of Kaliche - Frontend
> Consola unificada de operaciones de seguridad (React 18 + Vite + TailwindCSS + Electron).

---

> 📖 **¿Instalas por primera vez en un equipo nuevo?** Sigue la guía paso a paso:
> **[INSTALACION.md](./INSTALACION.md)** (incluye cómo preparar WSL2 + Kali Linux).

## ⚡ INSTALACIÓN Y ARRANQUE EN 1 CLIC (`setup_and_run.bat`)

La forma recomendada de instalar **y** ejecutar todo el ecosistema (backend + frontend) es el
script **`setup_and_run.bat`** que vive en la raíz de este repositorio. Hace todo de una sola vez:

1. Verifica **Git, Node.js y Python** — y los **instala automáticamente con `winget`** si faltan (avisa si falta WSL2).
2. Resuelve el backend como carpeta hermana (`..\the-guardian-of-kali_backend` o `..\backend`) y lo **clona si falta**.
3. Crea los archivos **`.env`** a partir de las plantillas **`.env.example`** (backend y frontend).
4. Instala dependencias del backend (**`.venv` + `pip`**) y del frontend (**`npm install`**).
5. Reconstruye **`node-pty`** para la ABI de Electron y compila el bundle de escritorio.
6. Arranca el **backend FastAPI**, espera a que `/health` responda y **lanza la app de escritorio**.

```bat
:: Desde la carpeta del frontend, doble clic o:
setup_and_run.bat
```

> El script evita arrancar el backend dos veces: exporta `GUARDIAN_SKIP_BACKEND=1` y
> `GUARDIAN_BACKEND_DIR` para que Electron use el backend que él mismo ya levantó.

### Requisitos mínimos
- **Windows 10/11** con **WSL2** y la distro **`kali-linux`** instalada (`wsl --install -d kali-linux`).
- **Node.js ≥ 20**, **Python ≥ 3.11**, **Git**.
- Una **API Key de Google Gemini** (o de Anthropic Claude) para el copiloto IA — se configura en `AJUSTES` o en el `.env` del backend.

> Alternativa histórica: `Instalar_Guardian.bat` (solo instala y genera `Iniciar_Guardian.bat`).
> `setup_and_run.bat` reemplaza ese flujo instalando **y** ejecutando en un solo paso.

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
│   ├── pty/                  # Manejo de Pseudo-Terminales WSL2 (wsl_terminal_bridge.ts)
│   ├── main.ts               # Ciclo de vida de la ventana Electron e IPC Main
│   └── preload.ts            # Seguridad IPC (Exposición segura de APIs a React)
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
4. **💻 Puente Terminal PTY:**
   - Acceso nativo e interactivo como `root` a Kali Linux en WSL2 vía `node-pty`.
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
