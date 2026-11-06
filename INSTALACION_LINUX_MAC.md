# 🛡️ Guía de Instalación para macOS y Linux — The Guardian of Kali

Esta guía detalla el proceso completo para instalar y ejecutar **The Guardian of Kali** en **macOS** y **distribuciones Linux** (Kali Linux nativo, Ubuntu, Debian, Fedora, Arch Linux, etc.).

---

## 📋 Requisitos del Sistema

| Plataforma | Requisitos Mínimos |
|------------|---------------------|
| **Linux**  | Kali Linux (bare-metal o VM), Ubuntu 20.04+, Debian 11+, Fedora 36+, Arch Linux |
| **macOS**  | macOS 11 (Big Sur) o superior (Intel y Apple Silicon M1/M2/M3/M4) |
| **Herramientas** | `git`, `node` (≥ 18 o 20 LTS), `npm`, `python3` (≥ 3.10), `python3-venv`, `curl` |

> 💡 **Nota sobre Kali Linux:**
> En Windows, la aplicación se comunica con Kali a través de WSL2.
> En **Linux nativo o Kali Linux**, la terminal interactiva se conecta **directamente y de forma nativa** a tu shell (`/bin/bash`), ejecutando las herramientas de auditoría sin capas intermedias.
> En **macOS**, se conecta directamente a tu shell (`/bin/zsh` o `/bin/bash`).

---

## ⚡ Método 1: Instalación y Arranque en 1 Paso (`setup_and_run.sh`)

Este script se encarga de todo: verifica herramientas, clona el backend si no existe, instala dependencias de Python y Node, compila la app y la abre de inmediato.

```bash
# 1. Dar permisos de ejecución
chmod +x setup_and_run.sh

# 2. Ejecutar
./setup_and_run.sh
```

---

## 📦 Método 2: Instalador Asistido (`install.sh`)

Si prefieres instalar todo una sola vez y tener accesos directos creados para abrir la aplicación en tu día a día:

```bash
# 1. Dar permisos de ejecución
chmod +x install.sh

# 2. Ejecutar el instalador
./install.sh
```

El instalador:
1. Detecta tu sistema operativo (macOS o distribución de Linux).
2. Instala dependencias faltantes automáticamente (`apt`, `dnf`, `pacman` o `brew`).
3. Clona o actualiza el backend (`the-guardian-of-kali_backend`).
4. Configura el entorno virtual `.venv` de Python e instala `requirements.txt`.
5. Instala las dependencias de Node.js y compila el bundle de escritorio.
6. Genera los lanzadores rápidos:
   - **En Linux:** Crea `Iniciar_Guardian.sh` y un acceso directo en el menú de aplicaciones (`the-guardian-of-kali.desktop`).
   - **En macOS:** Crea `Iniciar_Guardian.sh` y `Iniciar_Guardian.command` (para abrir con **doble clic en el Finder**).

### Cómo abrir la app en el día a día:
- **macOS:** Doble clic en `Iniciar_Guardian.command` (Finder) o `./Iniciar_Guardian.sh` desde Terminal.
- **Linux:** Clic en "The Guardian of Kali" en tu menú de aplicaciones o `./Iniciar_Guardian.sh` desde Terminal.

---

## 🛠️ Método 3: Instalación Manual Paso a Paso

Si prefieres realizar la configuración manualmente:

### 1. Dependencias del sistema

**Debian / Ubuntu / Kali Linux:**
```bash
sudo apt-get update
sudo apt-get install -y git nodejs npm python3 python3-venv python3-pip build-essential curl
```

**Fedora / RHEL:**
```bash
sudo dnf install -y git nodejs npm python3 python3-pip gcc-c++ make curl
```

**Arch Linux / Manjaro:**
```bash
sudo pacman -Sy --noconfirm git nodejs npm python python-pip base-devel curl
```

**macOS (vía Homebrew):**
```bash
brew install git node python curl
```

### 2. Clonar repositorios
```bash
# Frontend
git clone https://github.com/simviz12/the-guardian-of-kali_frontend.git
cd the-guardian-of-kali_frontend

# Backend (al lado del frontend)
git clone https://github.com/simviz12/the-guardian-of-kali_backend.git ../the-guardian-of-kali_backend
```

### 3. Configurar Backend (Python)
```bash
cd ../the-guardian-of-kali_backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
```

### 4. Configurar Frontend (React + Electron)
```bash
cd ../the-guardian-of-kali_frontend
cp .env.example .env
npm install
npm run build
```

### 5. Iniciar Backend y Frontend
```bash
# Terminal 1 - Backend:
cd ../the-guardian-of-kali_backend
source .venv/bin/activate
python3 -m src.main

# Terminal 2 - Frontend:
cd ../the-guardian-of-kali_frontend
npm start
```

---

## 📦 Generar Paquetes de Distribución (Instaladores Binarios)

Puedes compilar instaladores nativos portables para tu plataforma usando `electron-builder`:

### Para Linux (.AppImage, .deb, .tar.gz):
```bash
npm run package:linux
```
Los instaladores generados se guardarán en la carpeta `release/`:
- `The Guardian of Kali-0.1.0.AppImage` (Ejecutable portable en cualquier distro)
- `the-guardian-of-kali_0.1.0_amd64.deb` (Instalador para Debian / Ubuntu / Kali Linux)

### Para macOS (.dmg, .zip):
*(Debe ejecutarse en una máquina con macOS)*
```bash
npm run package:mac
```
Genera:
- `The Guardian of Kali-0.1.0.dmg` (Instalador estándar de arrastrar a Aplicaciones)
- `The Guardian of Kali-0.1.0-mac.zip`

---

## 🔑 Configurar la Clave de IA (Gemini / Claude)

1. Obtén tu API Key de Google Gemini en [Google AI Studio](https://aistudio.google.com/apikey).
2. Abre la aplicación, ve a la pestaña **AJUSTES** y pega la clave.
3. También puedes colocarla en `the-guardian-of-kali_backend/.env`:
   ```bash
   GEMINI_API_KEY="tu-api-key-aqui"
   ```

---

## ❓ Solución de Problemas Frecuentes

| Error | Causa | Solución |
|-------|-------|----------|
| `Puerto 8765 en uso` | Un backend anterior quedó en segundo plano | Ejecuta `lsof -ti:8765 \| xargs kill -9` |
| `Permission denied` al ejecutar scripts | Faltan permisos de ejecución | Ejecuta `chmod +x *.sh *.command` |
| `node-pty build error` en Linux | Faltan cabeceras de compilación C/C++ | Instala `build-essential` (o `base-devel`) |
| `Backend python not found` | No se creó el entorno `.venv` | Ejecuta `python3 -m venv .venv` dentro de la carpeta del backend |
