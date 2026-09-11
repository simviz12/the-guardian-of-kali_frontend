# The Guardian of Kali — Interfaz de Escritorio (`the-guardian-of-kali_frontend`)

Aplicación de escritorio para **The Guardian of Kali**, un entorno de terminal integrado para Kali Linux sobre WSL2 complementado con un copiloto de inteligencia artificial para ciberseguridad ofensiva, pruebas de penetración y entrenamiento en CTFs (HackTheBox, TryHackMe, laboratorios locales).

---

## Características Principales

- **Terminal Nativa de Kali Linux**: Sesión pseudoterminal (PTY) real usando `xterm.js` y `node-pty` conectada directamente a Kali Linux sobre WSL2 bajo la identidad del operador (`carlos`).
- **Copiloto Asistente con IA (Claude 3.5)**: Chat en lenguaje natural en tiempo real integrado con el motor de políticas del backend y la API de Anthropic Claude.
- **Indicador Visual de Políticas (Semáforo de Seguridad)**: Componente `PolicyIndicator` que clasifica el nivel de riesgo (`LOW`, `MEDIUM`, `HIGH`, `BLOCKED`) y la decisión de política antes de ejecutar cualquier comando.
- **Configuración de Sesión Zero-Trust**: Pantalla inicial obligatoria (`SessionSetup`) para fijar el alcance de IPs/CIDRs/dominios autorizados y seleccionar el modo de operación (`suggestion` vs `autonomous`).
- **Historial y Auditoría de Comandos**: Tabla filtrable, ordenable y paginada (`SessionHistory`) que audita cada comando ejecutado, su origen (`AI` o `MANUAL_USER`) y su resultado.
- **Manejo Global de Errores y Resiliencia**: Diagnósticos interactivos con sugerencias directas de remediación ante caídas de backend, límites de Claude API, desconexión de WSL2 o validaciones Pydantic.

---

## Arquitectura Tecnológica

- **Framework de Escritorio**: Electron
- **Biblioteca de Interfaz**: React 18 + TypeScript
- **Empaquetador y Servidor Dev**: Vite
- **Emulador de Terminal**: `@xterm/xterm` + `@xterm/addon-fit` + `node-pty`
- **Estilos**: TailwindCSS
- **Comunicación IPC / Backend**: Preload script con contextIsolation habilitado + HTTP Client contra FastAPI (`127.0.0.1:8765`).

---

## Instalación y Ejecución

```bash
# 1. Clonar el repositorio
git clone https://github.com/simviz12/the-guardian-of-kali_frontend.git
cd the-guardian-of-kali_frontend

# 2. Instalar dependencias
npm install

# 3. Ejecutar en modo desarrollo
npm run dev

# 4. Compilar para producción y verificar tipos
npm run build

# 5. Ejecutar linter
npm run lint
```

---

## Licencia

Este proyecto se encuentra bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.

