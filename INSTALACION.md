# 🛡️ Guía de Instalación — The Guardian of Kali

Esta guía explica, paso a paso, todo lo que debe hacer la persona que instala la
aplicación por primera vez en un equipo nuevo. Síguela en orden.

> ⏱️ **Tiempo estimado:** 20–40 min (la mayor parte es la descarga de Kali Linux).
> 🔁 Varios pasos piden **reiniciar** el equipo: es normal.

---

## 0. Requisitos del equipo

| Requisito | Detalle |
|-----------|---------|
| Sistema operativo | **Windows 10 (v2004+)** o **Windows 11** |
| Permisos | Cuenta de **administrador** (necesaria para instalar WSL y Kali) |
| Disco | ~10 GB libres (Kali Linux ocupa espacio) |
| Internet | Requerido durante toda la instalación |

La app es un **copiloto de seguridad** que ejecuta comandos dentro de un **Kali Linux
real** que corre sobre **WSL2** (el subsistema de Linux de Windows). Por eso lo primero
es preparar WSL + Kali, y luego instalar la aplicación.

---

## 1. Instalar WSL2 + Kali Linux  *(la "parte de Kali")*

> ⚠️ **Este paso NO lo hace el instalador automático.** Hay que hacerlo una sola vez,
> a mano, porque necesita permisos de administrador y reiniciar el equipo.

1. Abre **PowerShell como administrador**
   (botón derecho en el menú Inicio → *Terminal (Administrador)* o *Windows PowerShell (Administrador)*).

2. Instala WSL2 junto con la distro de Kali:
   ```powershell
   wsl --install -d kali-linux
   ```

3. **Reinicia el equipo** cuando lo pida.

4. Al volver, se abrirá una ventana de Kali que pedirá **crear un usuario y contraseña**
   de Linux. Créalos y recuérdalos.

5. Verifica que quedó bien instalada (en PowerShell normal):
   ```powershell
   wsl -l -v
   ```
   Debe aparecer **`kali-linux`** con **`VERSION 2`**.

   > 📌 **Importante:** la distro debe llamarse exactamente **`kali-linux`**.
   > Es el nombre que la app usa por defecto. Si aparece con otro nombre, avísalo.

6. (Recomendado) Actualiza Kali una vez:
   ```powershell
   wsl -d kali-linux -u root -- apt update && apt -y upgrade
   ```

---

## 2. Herramientas base (Git, Node.js, Python) — **automático**

**Normalmente no tienes que hacer nada en este paso.** El instalador del Paso 3
(`setup_and_run.bat`) detecta si faltan **Git, Node.js o Python** y los **instala solo**
usando `winget` (el gestor de paquetes incluido en Windows 10 2004+/Windows 11).

> Si el `.bat` instaló alguna de estas herramientas, te pedirá **cerrar la ventana y
> volver a ejecutarlo** una vez (para que Windows cargue el nuevo PATH). Es normal.

**Solo si tu Windows no tiene `winget`** (versiones antiguas), instálalas a mano:

| Herramienta | Dónde | Nota al instalar |
|-------------|-------|------------------|
| **Git** | https://git-scm.com/ | Valores por defecto |
| **Node.js (LTS ≥ 20)** | https://nodejs.org/ | Deja marcada la opción de añadir al PATH |
| **Python (≥ 3.11)** | https://python.org/downloads/ | ✅ **Marca "Add python.exe to PATH"** |

---

## 3. Obtener e instalar la aplicación (un clic)

1. Descarga/clona el repositorio del **frontend** (donde está el instalador).
2. Dentro de esa carpeta, haz **doble clic** en **`setup_and_run.bat`**.

El script hace todo automáticamente:
- ✅ Verifica Git, Node.js y Python — **y los instala con `winget` si faltan** (avisa si falta WSL).
- ✅ Descarga el **backend** si no está al lado (carpeta hermana).
- ✅ Crea los archivos `.env` a partir de las plantillas.
- ✅ Instala dependencias de Python (`.venv`) y de Node (`npm`).
- ✅ Reconstruye `node-pty` para Electron y compila la app.
- ✅ Arranca el backend, espera a que responda, y **abre la aplicación**.

> La primera vez tarda varios minutos (instala todo). Las siguientes es casi instantáneo.

---

## 4. Configurar la API Key del copiloto IA

El chat con IA necesita una clave de **Google Gemini** (o de **Anthropic Claude**):

1. Obtén una API Key gratuita en https://aistudio.google.com/apikey (Gemini).
2. Abre la app → pestaña **AJUSTES** → pega la clave → **Guardar**.
   *(También puedes ponerla en el archivo `.env` del backend como `GEMINI_API_KEY=...`.)*

La **terminal de Kali funciona sin API Key**; la clave solo activa el **copiloto IA**.

---

## 5. Comprobar que todo funciona

- Arriba a la derecha debe verse **API OK** (el backend responde).
- En la pestaña **TERMINAL**, escribe un comando de prueba y pulsa Enter:
  ```bash
  whoami
  ```
  Debe responder dentro de Kali (ej. `root`).
- En el **chat**, pide por ejemplo *"escanea los puertos de 127.0.0.1"* y la IA propondrá un comando.

---

## ❓ Solución de problemas

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| La terminal dice *"No hay ninguna distribución instalada"* | Kali no está en WSL | Repite el **Paso 1** (`wsl --install -d kali-linux`). |
| La terminal no responde / banner "WSL no disponible" | La distro tiene otro nombre | Comprueba con `wsl -l -v` que sea `kali-linux`. |
| El `.bat` dice `[ERROR] Python no encontrado` | Python sin PATH | Reinstala Python marcando **"Add to PATH"** y reabre la terminal. |
| Arriba dice **API ERROR** | El backend no arrancó | Revisa que Python esté instalado y vuelve a ejecutar `setup_and_run.bat`. |
| El chat da error de IA | Falta/incorrecta la API Key | Reconfigúrala en **AJUSTES** (Paso 4). |

---

## 📋 Resumen rápido (checklist)

- [ ] `wsl --install -d kali-linux` + reiniciar + crear usuario Linux
- [ ] `wsl -l -v` muestra **kali-linux / VERSION 2**
- [ ] Git, Node.js y Python (los instala el `.bat` con winget si faltan)
- [ ] Doble clic en **`setup_and_run.bat`**
- [ ] API Key de Gemini puesta en **AJUSTES**
- [ ] **API OK** visible y `whoami` responde en la terminal
