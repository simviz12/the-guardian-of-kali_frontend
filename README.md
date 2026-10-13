# The Guardian of Kaliche - Frontend
> Consola unificada de operaciones de seguridad (React 18 + Vite + TailwindCSS + Electron).

---

## ⚡ EJECUCIÓN RÁPIDA MEDIANTE SCRIPTS (.BAT)

En la carpeta raíz del proyecto dispones de scripts batch diseñados para la gestión del sistema:

* 🛠️ **`Instalar_Guardian.bat`**: Ejecútalo la primera vez. Instala paquetes, compila el bundle y prepara el entorno.
* 🚀 **`Iniciar_Guardian.bat`**: Ejecútalo para abrir la aplicación diariamente en 2 segundos sin esperas ni recompilaciones.

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
   - Acceso nativo e interactivo como `root` a Kali Linux en WSL2.

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
