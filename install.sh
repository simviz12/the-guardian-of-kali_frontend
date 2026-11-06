#!/usr/bin/env bash
# ==============================================================================
#          THE GUARDIAN OF KALI - INSTALADOR PARA MAC Y LINUX
# ==============================================================================
# Este script descarga, configura e instala el proyecto completo:
#  1. Detecta el Sistema Operativo (macOS / Linux: Kali, Debian, Ubuntu, etc.)
#  2. Verifica e instala dependencias del sistema (Git, Node.js, Python, build tools)
#  3. Clona o actualiza los repositorios de Frontend y Backend
#  4. Prepara el entorno virtual de Python (.venv) y sus dependencias
#  5. Instala paquetes de Node.js y compila la aplicación de escritorio Electron
#  6. Crea los lanzadores rápidos:
#     - Iniciar_Guardian.sh (Linux / macOS terminal)
#     - Iniciar_Guardian.command (macOS doble clic)
#     - the-guardian-of-kali.desktop (Linux lanzador de escritorio)
# ==============================================================================

set -e

# Configuración de colores
if [ -t 1 ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    CYAN='\033[0;36m'
    BOLD='\033[1m'
    NC='\033[0m'
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    CYAN=''
    BOLD=''
    NC=''
fi

echo -e "${GREEN}${BOLD}======================================================================${NC}"
echo -e "${CYAN}${BOLD}         THE GUARDIAN OF KALI - INSTALADOR (MAC Y LINUX)             ${NC}"
echo -e "${GREEN}${BOLD}======================================================================${NC}"
echo -e "Instalando entorno completo para Frontend (React/Electron) y Backend (FastAPI)."
echo ""

# Ubicación actual del script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ------------------------------------------------------------------------------
# 1. Detección de Sistema Operativo y Gestor de Paquetes
# ------------------------------------------------------------------------------
OS="$(uname -s)"
echo -e "${BLUE}[*] Detectando sistema operativo...${NC}"
case "$OS" in
    Darwin*)
        OS_TYPE="macos"
        echo -e "    ${GREEN}[OK] Sistema detectado: macOS (${OS})${NC}"
        ;;
    Linux*)
        OS_TYPE="linux"
        if [ -f /etc/os-release ]; then
            . /etc/os-release
            DISTRO_NAME="${NAME:-Linux}"
        else
            DISTRO_NAME="Linux"
        fi
        echo -e "    ${GREEN}[OK] Sistema detectado: Linux (${DISTRO_NAME})${NC}"
        ;;
    *)
        echo -e "${RED}[ERROR] Sistema no compatible directamente con este script: $OS${NC}"
        exit 1
        ;;
esac

# ------------------------------------------------------------------------------
# 2. Verificación e Instalación de Herramientas Base
# ------------------------------------------------------------------------------
echo ""
echo -e "${BLUE}[*] Verificando requisitos del sistema (Git, Node.js, Python3)...${NC}"

ensure_prerequisites() {
    local missing=0

    if ! command -v git >/dev/null 2>&1; then
        echo -e "    ${YELLOW}[!] Git no está instalado.${NC}"
        missing=1
    else
        echo -e "    ${GREEN}[OK] Git detectado: $(git --version)${NC}"
    fi

    if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
        echo -e "    ${YELLOW}[!] Node.js o npm no están instalados.${NC}"
        missing=1
    else
        echo -e "    ${GREEN}[OK] Node.js detectado: $(node -v) (npm $(npm -v))${NC}"
    fi

    if ! command -v python3 >/dev/null 2>&1; then
        echo -e "    ${YELLOW}[!] Python 3 no está instalado.${NC}"
        missing=1
    else
        echo -e "    ${GREEN}[OK] Python detectado: $(python3 --version)${NC}"
    fi

    if [ "$missing" -eq 1 ]; then
        echo ""
        echo -e "${CYAN}[*] Instalando dependencias faltantes automáticamente...${NC}"
        if [ "$OS_TYPE" = "macos" ]; then
            if ! command -v brew >/dev/null 2>&1; then
                echo -e "${YELLOW}[!] Homebrew no encontrado. Instalando Homebrew...${NC}"
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
                if [ -x "/opt/homebrew/bin/brew" ]; then
                    eval "$(/opt/homebrew/bin/brew shellenv)"
                elif [ -x "/usr/local/bin/brew" ]; then
                    eval "$(/usr/local/bin/brew shellenv)"
                fi
            fi
            echo -e "    Instalando paquetes via Homebrew..."
            brew install git node python curl
        elif [ "$OS_TYPE" = "linux" ]; then
            if command -v apt-get >/dev/null 2>&1; then
                echo -e "    Instalando paquetes con APT (Kali/Debian/Ubuntu)..."
                sudo apt-get update
                sudo apt-get install -y git nodejs npm python3 python3-venv python3-pip python3-dev build-essential curl
            elif command -v dnf >/dev/null 2>&1; then
                echo -e "    Instalando paquetes con DNF (Fedora/RHEL)..."
                sudo dnf install -y git nodejs npm python3 python3-pip python3-devel gcc gcc-c++ make curl
            elif command -v pacman >/dev/null 2>&1; then
                echo -e "    Instalando paquetes con Pacman (Arch/Manjaro)..."
                sudo pacman -Sy --noconfirm git nodejs npm python python-pip base-devel curl
            elif command -v zypper >/dev/null 2>&1; then
                echo -e "    Instalando paquetes con Zypper (openSUSE)..."
                sudo zypper install -y git nodejs npm python3 python3-pip gcc gcc-c++ make curl
            else
                echo -e "${RED}[ERROR] No se pudo instalar automáticamente. Instala Git, Node.js y Python 3 a mano.${NC}"
                exit 1
            fi
        fi
    fi
}

ensure_prerequisites

# ------------------------------------------------------------------------------
# 3. Resolver y Clonar Repositorios (Frontend y Backend)
# ------------------------------------------------------------------------------
echo ""
echo -e "${BLUE}[*] Resolviendo repositorios de Frontend y Backend...${NC}"

FE_REPO="https://github.com/simviz12/the-guardian-of-kali_frontend.git"
BE_REPO="https://github.com/simviz12/the-guardian-of-kali_backend.git"

# Identificar directorio frontend
if [ -f "$SCRIPT_DIR/package.json" ]; then
    FRONTEND_DIR="$SCRIPT_DIR"
elif [ -d "$SCRIPT_DIR/the-guardian-of-kali_frontend" ]; then
    FRONTEND_DIR="$SCRIPT_DIR/the-guardian-of-kali_frontend"
else
    echo -e "    Clonando Frontend..."
    git clone "$FE_REPO" "$SCRIPT_DIR/the-guardian-of-kali_frontend"
    FRONTEND_DIR="$SCRIPT_DIR/the-guardian-of-kali_frontend"
fi
echo -e "    ${GREEN}[OK] Frontend: $FRONTEND_DIR${NC}"

PARENT_DIR="$(cd "$FRONTEND_DIR/.." && pwd)"

# Identificar directorio backend
if [ -d "$PARENT_DIR/the-guardian-of-kali_backend" ]; then
    BACKEND_DIR="$PARENT_DIR/the-guardian-of-kali_backend"
elif [ -d "$PARENT_DIR/backend" ]; then
    BACKEND_DIR="$PARENT_DIR/backend"
else
    echo -e "    Clonando Backend..."
    git clone "$BE_REPO" "$PARENT_DIR/the-guardian-of-kali_backend"
    BACKEND_DIR="$PARENT_DIR/the-guardian-of-kali_backend"
fi
echo -e "    ${GREEN}[OK] Backend:  $BACKEND_DIR${NC}"

# ------------------------------------------------------------------------------
# 4. Configurar Archivos .env
# ------------------------------------------------------------------------------
echo ""
echo -e "${BLUE}[*] Configurando variables de entorno (.env)...${NC}"
if [ ! -f "$BACKEND_DIR/.env" ] && [ -f "$BACKEND_DIR/.env.example" ]; then
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
    echo -e "    ${GREEN}[OK] Creado backend .env desde plantilla .env.example${NC}"
fi

if [ ! -f "$FRONTEND_DIR/.env" ] && [ -f "$FRONTEND_DIR/.env.example" ]; then
    cp "$FRONTEND_DIR/.env.example" "$FRONTEND_DIR/.env"
    echo -e "    ${GREEN}[OK] Creado frontend .env desde plantilla .env.example${NC}"
fi

# ------------------------------------------------------------------------------
# 5. Configurar Backend (Python FastAPI)
# ------------------------------------------------------------------------------
echo ""
echo -e "${BLUE}[*] Configurando Backend de Inteligencia Artificial (Python)...${NC}"
cd "$BACKEND_DIR"

if [ ! -d ".venv" ]; then
    echo -e "    Creando entorno virtual Python (.venv)..."
    python3 -m venv .venv
fi

echo -e "    Actualizando pip e instalando requerimientos..."
"$BACKEND_DIR/.venv/bin/python" -m pip install --upgrade pip >/dev/null 2>&1 || true
"$BACKEND_DIR/.venv/bin/pip" install -r requirements.txt
echo -e "    ${GREEN}[OK] Backend configurado exitosamente.${NC}"

# ------------------------------------------------------------------------------
# 6. Configurar Frontend (Electron + React)
# ------------------------------------------------------------------------------
echo ""
echo -e "${BLUE}[*] Configurando Frontend de escritorio (Electron + React)...${NC}"
cd "$FRONTEND_DIR"

echo -e "    Instalando dependencias de Node.js (npm install)..."
npm install

echo -e "    Recompilando módulos nativos (node-pty) para Electron..."
npx --yes @electron/rebuild -f -w node-pty >/dev/null 2>&1 || echo -e "    ${YELLOW}[WARN] electron-rebuild omitido; usando prebuilds.${NC}"

echo -e "    Compilando aplicación (npm run build)..."
npm run build
echo -e "    ${GREEN}[OK] Frontend compilado exitosamente.${NC}"

# ------------------------------------------------------------------------------
# 7. Generar Lanzadores Rápidos
# ------------------------------------------------------------------------------
echo ""
echo -e "${BLUE}[*] Creando lanzadores de inicio rápido...${NC}"

# A) Iniciar_Guardian.sh (Cross-platform shell launcher)
cat << 'EOF' > "$FRONTEND_DIR/Iniciar_Guardian.sh"
#!/usr/bin/env bash
set -e

# Directorios de trabajo
FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PARENT_DIR="$(cd "$FRONTEND_DIR/.." && pwd)"

if [ -d "$PARENT_DIR/the-guardian-of-kali_backend" ]; then
    BACKEND_DIR="$PARENT_DIR/the-guardian-of-kali_backend"
elif [ -d "$PARENT_DIR/backend" ]; then
    BACKEND_DIR="$PARENT_DIR/backend"
else
    BACKEND_DIR="$FRONTEND_DIR/../the-guardian-of-kali_backend"
fi

echo "==================================================="
echo "   Iniciando The Guardian of Kali"
echo "==================================================="

# 1. Liberar puerto 8765 si quedo colgado de una sesion anterior
if command -v lsof >/dev/null 2>&1; then
    STALE_PID=$(lsof -ti:8765 2>/dev/null || true)
    if [ -n "$STALE_PID" ]; then
        echo "[*] Limpiando proceso previo en puerto 8765 (PID: $STALE_PID)..."
        kill -9 $STALE_PID 2>/dev/null || true
    fi
elif command -v fuser >/dev/null 2>&1; then
    fuser -k 8765/tcp >/dev/null 2>&1 || true
fi

# 2. Iniciar Backend en segundo plano
PYTHON_BIN=""
if [ -f "$BACKEND_DIR/.venv/bin/python3" ]; then
    PYTHON_BIN="$BACKEND_DIR/.venv/bin/python3"
elif [ -f "$BACKEND_DIR/.venv/bin/python" ]; then
    PYTHON_BIN="$BACKEND_DIR/.venv/bin/python"
fi

if [ -z "$PYTHON_BIN" ]; then
    echo "[ERROR] Entorno virtual de Python no encontrado en $BACKEND_DIR/.venv"
    exit 1
fi

echo "[*] Levantando Backend (FastAPI)..."
cd "$BACKEND_DIR"
"$PYTHON_BIN" -m src.main >/dev/null 2>&1 &
BACKEND_PID=$!

# Trap para matar el backend cuando el script o electron termine
cleanup() {
    echo ""
    echo "[*] Cerrando servicios de The Guardian of Kali..."
    if kill -0 "$BACKEND_PID" 2>/dev/null; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
}
trap cleanup EXIT INT TERM

# 3. Esperar que el backend responda en /health
echo "[*] Esperando estado saludable en http://127.0.0.1:8765/health ..."
tries=0
while [ $tries -lt 30 ]; do
    if curl -s -f http://127.0.0.1:8765/health >/dev/null 2>&1; then
        echo "    [OK] Backend listo y saludable."
        break
    fi
    tries=$((tries + 1))
    sleep 0.5
done

# 4. Iniciar Frontend Electron
echo "[*] Abriendo interfaz de escritorio..."
cd "$FRONTEND_DIR"
export GUARDIAN_SKIP_BACKEND=1
export GUARDIAN_BACKEND_DIR="$BACKEND_DIR"
npx electron .

echo "[*] Aplicación finalizada."
EOF
chmod +x "$FRONTEND_DIR/Iniciar_Guardian.sh"
echo -e "    ${GREEN}[OK] Creado: $FRONTEND_DIR/Iniciar_Guardian.sh${NC}"

# B) macOS: Iniciar_Guardian.command (Doble clic en Finder)
if [ "$OS_TYPE" = "macos" ]; then
cat << 'EOF' > "$FRONTEND_DIR/Iniciar_Guardian.command"
#!/usr/bin/env bash
cd "$(dirname "$0")"
./Iniciar_Guardian.sh
EOF
chmod +x "$FRONTEND_DIR/Iniciar_Guardian.command"
echo -e "    ${GREEN}[OK] Creado: $FRONTEND_DIR/Iniciar_Guardian.command (Doble clic en Finder)${NC}"
fi

# C) Linux: the-guardian-of-kali.desktop
if [ "$OS_TYPE" = "linux" ]; then
DESKTOP_ENTRY="$FRONTEND_DIR/the-guardian-of-kali.desktop"
cat << EOF > "$DESKTOP_ENTRY"
[Desktop Entry]
Name=The Guardian of Kali
Comment=Co-piloto de Seguridad y Ciberseguridad
Exec=bash -c "cd '$FRONTEND_DIR' && ./Iniciar_Guardian.sh"
Icon=utilities-terminal
Terminal=false
Type=Application
Categories=Development;Security;System;
EOF
chmod +x "$DESKTOP_ENTRY"
echo -e "    ${GREEN}[OK] Creado acceso directo de Linux: $DESKTOP_ENTRY${NC}"

# Si existe el directorio de aplicaciones del usuario, copiarlo
USER_APP_DIR="$HOME/.local/share/applications"
if [ -d "$USER_APP_DIR" ]; then
    cp "$DESKTOP_ENTRY" "$USER_APP_DIR/" || true
    echo -e "    ${GREEN}[OK] Añadido al menú de aplicaciones ($USER_APP_DIR/the-guardian-of-kali.desktop)${NC}"
fi
fi

# ------------------------------------------------------------------------------
# 8. Finalización
# ------------------------------------------------------------------------------
echo ""
echo -e "${GREEN}${BOLD}======================================================================${NC}"
echo -e "${GREEN}${BOLD}             INSTALACIÓN COMPLETADA CORRECTAMENTE!                   ${NC}"
echo -e "${GREEN}${BOLD}======================================================================${NC}"
echo -e "Para iniciar la aplicación:"
if [ "$OS_TYPE" = "macos" ]; then
echo -e "  - Doble clic en: ${CYAN}Iniciar_Guardian.command${NC} (en Finder)"
echo -e "  - O desde terminal: ${CYAN}./Iniciar_Guardian.sh${NC}"
else
echo -e "  - En el menú de aplicaciones de tu escritorio: ${CYAN}The Guardian of Kali${NC}"
echo -e "  - O desde la terminal: ${CYAN}./Iniciar_Guardian.sh${NC}"
fi
echo -e "${GREEN}======================================================================${NC}"
echo ""
