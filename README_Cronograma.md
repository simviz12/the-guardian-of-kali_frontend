# Cronograma de Desarrollo: The Guardian of Kali 🐉

Este documento registra el historial de construcción, hitos y desafíos superados durante el desarrollo de la arquitectura del sistema The Guardian of Kali.

## Fase 1: Cimientos y Arquitectura Base
* **Frontend:** Inicialización del proyecto usando React, Vite y TypeScript. Configuración de TailwindCSS para la interfaz gráfica hacker.
* **Aplicación de Escritorio:** Integración de Electron.js para encapsular la aplicación web en una ventana nativa de escritorio con aislamiento de contexto.
* **Backend:** Creación de la API REST usando Python y FastAPI.
* **Persistencia:** Diseño del modelo de datos e implementación de SQLite para guardar el historial.

## Fase 2: Integración de Inteligencia Artificial
* **Conexión API:** Integración del SDK de Google Gemini.
* **Prompt Engineering:** Definición del `SYSTEM_PROMPT` para restringir a la IA a un rol estricto de Co-piloto de Seguridad.
* **Function Calling:** Implementación de la herramienta para que la IA devuelva los comandos estructurados en formato JSON.

## Fase 3: Ejecución Nativa y Puente WSL2
* **Shell Executor:** Creación del adaptador en Python para ejecutar subprocesos de forma nativa dentro de Kali Linux (WSL2).
* **Resolución de Bloqueos:** Solución al problema de comandos interactivos. Se configuró el ejecutor para correr bajo el usuario `root` de WSL.
* **Feedback Loop:** Programación del sistema de "Auto-Feedback" para que la salida de la terminal se reinyecte automáticamente a la IA.

## Fase 4: Seguridad y Sincronización Visual (IPC)
* **Motor Zero-Trust:** Implementación de un motor Regex en FastAPI para interceptar y bloquear comandos destructivos (`rm -rf`, `mkfs`, etc.).
* **Puente IPC:** Desarrollo del canal `terminal:direct-write` entre Electron (Node.js) y React para imprimir texto en vivo dentro de la consola visual.

## Fase 5: Estabilización, Timeouts y Bugs (Fase Final)
* **Resolución de ESM:** Corrección de un fallo crítico donde NodeJS bloqueaba el puente IPC. Se migró a `CommonJS` (`.cjs`).
* **Timeouts de Red:** Detección de caída por límite de tiempo al ejecutar comandos largos (Ej. escaneos Nmap pesados). Se aumentó la tolerancia a 185 segundos.
* **Rutas Portables:** Eliminación de rutas locales hardcodeadas y reemplazo por rutas relativas para garantizar que la aplicación pueda desplegarse en cualquier computador.
* **Pruebas de Estrés:** Superación exitosa de límites de memoria (Tokens), pruebas de Rate Limit (Error 429) y validación del código de salida 124 (Timeouts controlados por Linux).
