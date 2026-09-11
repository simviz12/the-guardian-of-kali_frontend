# The Guardian of Kali — Aplicación de Escritorio (`the-guardian-of-kali_frontend`)

Aplicación de escritorio para **The Guardian of Kali**, un entorno de terminal integrado para **Kali Linux sobre WSL2** complementado con un copiloto de inteligencia artificial para ciberseguridad ofensiva, pruebas de penetración y entrenamiento en CTFs (HackTheBox, TryHackMe, laboratorios locales).

---

## ✨ Características Principales

- **Terminal Nativa de Kali Linux**: Sesión pseudoterminal (PTY) real usando `@xterm/xterm`, `@xterm/addon-fit` y `node-pty` conectada directamente a Kali Linux sobre WSL2 bajo la identidad del operador (`carlos`).
- **Copiloto Asistente con IA (Claude 3.5 Sonnet)**: Chat en lenguaje natural en tiempo real integrado con el motor de políticas del backend y la API de Anthropic Claude (`/chat`).
- **Indicador Visual de Políticas (Semáforo de Seguridad)**: Componente `PolicyIndicator` que clasifica visualmente el nivel de riesgo (`LOW`, `MEDIUM`, `HIGH`, `BLOCKED`) y la decisión de política antes de ejecutar cualquier comando.
- **Configuración de Sesión Zero-Trust**: Pantalla inicial obligatoria (`SessionSetup`) para fijar el alcance de IPs/CIDRs/dominios autorizados y seleccionar el modo de operación (`suggestion` vs `autonomous`).
- **Historial y Auditoría de Comandos**: Tabla filtrable, ordenable y paginada (`SessionHistory`) que audita cada comando ejecutado, su origen (`AI` o `MANUAL_USER`), fecha y resultado.
- **Manejo Global de Errores y Resiliencia**: Diagnósticos interactivos (`ErrorBanner`, `ErrorModal`) con sugerencias directas de remediación ante caídas de backend, límites de cuota de Claude API, desconexión de WSL2 o validaciones Pydantic.

---

## 🏛️ Arquitectura del Frontend

El frontend está desarrollado con **Electron** y **React 18 con TypeScript**, empaquetado con **Vite**:

```
src/
├── components/
│   ├── Terminal.tsx             # Emulador interactivo xterm.js con soporte PTY
│   ├── ChatPanel.tsx            # Interfaz de chat con el copiloto Claude
│   ├── PolicyIndicator.tsx      # Indicador de estado y riesgo de políticas
│   ├── SessionSetup.tsx         # Configuración zero-trust de objetivos y modo
│   ├── SessionHistory.tsx       # Tabla de auditoría y comandos históricos
│   ├── ErrorBanner.tsx          # Banner superior para alertas de error accionables
│   └── ErrorModal.tsx           # Modal detallado para errores técnicos y validación
├── services/
│   └── apiClient.ts             # Cliente HTTP tipado contra la API FastAPI (8765)
├── types/
│   └── errors.ts                # Modelos de error estructurados y tipados
├── App.tsx                      # Orquestador principal y maquetación de pantalla dividida
└── main.tsx                     # Punto de entrada de React
```

---

## 🚀 Stack Tecnológico

- **Entorno de Escritorio**: Electron 32
- **Interfaz de Usuario**: React 18 + TypeScript + Vite
- **Terminal Emulator**: `@xterm/xterm` 5.5 + `@xterm/addon-fit` + `node-pty`
- **Estilos y Maquetación**: TailwindCSS
- **Cliente HTTP**: Fetch API nativo con manejo inteligente de errores y tipado estricto

---

## ⚙️ Instalación y Ejecución

### Requisitos Previos
- Node.js 20 LTS o superior.
- npm o pnpm.
- El backend de **The Guardian of Kali** ejecutándose en `http://127.0.0.1:8765`.

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/simviz12/the-guardian-of-kali_frontend.git
cd the-guardian-of-kali_frontend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno (opcional)
copy .env.example .env

# 4. Iniciar en modo desarrollo
npm run dev

# 5. Compilar TypeScript y empaquetar con Vite
npm run build

# 6. Ejecutar linter de código
npm run lint
```

---

## 🔒 Consideraciones de Seguridad

- **Context Isolation Activado**: La comunicación entre el proceso de renderizado y el proceso principal de Electron se realiza mediante scripts de precarga seguros (`preload.js`) con `contextIsolation: true` y `nodeIntegration: false`.
- **Restricción CORS**: El backend valida que las peticiones provengan estrictamente de los orígenes locales autorizados de Electron (`localhost:5173`, `app://-`, `file://`).

---

## 📄 Licencia

Este proyecto se encuentra bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.
