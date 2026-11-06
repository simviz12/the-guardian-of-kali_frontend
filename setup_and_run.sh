#!/usr/bin/env bash
# ==============================================================================
# setup_and_run.sh - One-click install + launch for The Guardian of Kali
# Compatible with macOS and Linux (Kali, Debian, Ubuntu, Fedora, Arch, etc.)
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
echo -e "${CYAN}${BOLD}          THE GUARDIAN OF KALI - SETUP AND RUN (MAC & LINUX)          ${NC}"
echo -e "${GREEN}${BOLD}======================================================================${NC}"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR"

OS="$(uname -s)"
case "$OS" in
    Darwin*) OS_TYPE="macos" ;;
    Linux*)  OS_TYPE="linux" ;;
    *) echo -e "${RED}[ERROR] Sistema operativo no soportado: $OS${NC}"; exit 1 ;;
esac

# ------------------------------------------------------------------------------
# 1. Verificar herramientas necesarias
# ------------------------------------------------------------------------------
echo -e "${BLUE}[*] Verificando prerrequisitos...${NC}"

ensure_cmd() {
    local cmd="$1"
    local hint="$2"
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo -e "${YELLOW}[!] Falta herramienta: $cmd${NC}"
        if [ "$OS_TYPE" = "macos" ]; then
            if ! command -v brew >/dev/null 2>&1; then
                echo -e "Instalando Homebrew..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
                [ -x "/opt/homebrew/bin/brew" ] && eval "$(/opt/homebrew/bin/brew shellenv)"
                [ -x "/usr/local/bin/brew" ] && eval "$(/usr/local/bin/brew shellenv)"
            fi
            brew install "$cmd"
        elif [ "$OS_TYPE" = "linux" ]; then
            if command -v apt-get >/dev/null 2>&1; then
                sudo apt-get update && sudo apt-get install -y "$cmd"
            elif command -v dnf >/dev/null 2>&1; then
                sudo dnf install -y "$cmd"
            elif command -v pacman >/dev/null 2>&1; then
                sudo pacman -Sy --noconfirm "$cmd"
            fi
        fi
    fi
}

ensure_cmd "git" "Git"
ensure_cmd "curl" "Curl"

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    echo -e "${CYAN}[*] Instalando Node.js...${NC}"
    if [ "$OS_TYPE" = "macos" ]; then
        brew install node
    elif command -v apt-get >/dev/null 2>&1; then
        sudo apt-get update && sudo apt-get install -y nodejs npm build-essential
    elif command -v dnf >/dev/null 2>&1; then
        sudo dnf install -y nodejs npm gcc-c++ make
    elif command -v pacman >/dev/null 2>&1; then
        sudo pacman -Sy --noconfirm nodejs npm base-devel
    fi
fi

if ! command -v python3 >/dev/null 2>&1; then
    echo -e "${CYAN}[*] Instalando Python 3...${NC}"
    if [ "$OS_TYPE" = "macos" ]; then
        brew install python
    elif command -v apt-get >/dev/null 2>&1; then
        sudo apt-get update && sudo apt-get install -y python3 python3-venv python3-pip
    elif command -v dnf >/dev/null 2>&1; then
        sudo dnf install -y python3 python3-pip
    elif command -v pacman >/dev/null 2>&1; then
        sudo pacman -Sy --noconfirm python python-pip
    fi
fi

echo -e "    ${GREEN}[OK] Git:     $(git --version)${NC}"
echo -e "    ${GREEN}[OK] Node.js: $(node -v) (npm $(npm -v))${NC}"
echo -e "    ${GREEN}[OK] Python:  $(python3 --version)${NC}"
echo ""

# ------------------------------------------------------------------------------
# 2. Resolver repositorios Frontend y Backend
# ------------------------------------------------------------------------------
echo -e "${BLUE}[*] Resolviendo repositorios...${NC}"
FE_REPO="https://github.com/simviz12/the-guardian-of-kali_frontend.git"
BE_REPO="https://github.com/simviz12/the-guardian-of-kali_backend.git"

if [ -f "$ROOT/package.json" ]; then
    FRONTEND_DIR="$ROOT"
elif [ -d "$ROOT/the-guardian-of-kali_frontend" ]; then
    FRONTEND_DIR="$ROOT/the-guardian-of-kali_frontend"
else
    echo -e "    Clonando Frontend..."
    git clone "$FE_REPO" "$ROOT/the-guardian-of-kali_frontend"
    FRONTEND_DIR="$ROOT/the-guardian-of-kali_frontend"
fi
echo -e "    ${GREEN}[OK] Frontend: $FRONTEND_DIR${NC}"

PARENT="$(cd "$FRONTEND_DIR/.." && pwd)"

if [ -d "$PARENT/the-guardian-of-kali_backend" ]; then
    BACKEND_DIR="$PARENT/the-guardian-of-kali_backend"
elif [ -d "$PARENT/backend" ]; then
    BACKEND_DIR="$PARENT/backend"
else
    echo -e "    Clonando Backend..."
    git clone "$BE_REPO" "$PARENT/the-guardian-of-kali_backend"
    BACKEND_DIR="$PARENT/the-guardian-of-kali_backend"
fi
echo -e "    ${GREEN}[OK] Backend:  $BACKEND_DIR${NC}"
echo ""

# ------------------------------------------------------------------------------
# 3. Archivos .env
# ------------------------------------------------------------------------------
echo -e "${BLUE}[*] Verificando archivos .env...${NC}"
if [ ! -f "$BACKEND_DIR/.env" ] && [ -f "$BACKEND_DIR/.env.example" ]; then
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
    echo -e "    ${GREEN}[OK] Creado backend .env${NC}"
fi
if [ ! -f "$FRONTEND_DIR/.env" ] && [ -f "$FRONTEND_DIR/.env.example" ]; then
    cp "$FRONTEND_DIR/.env.example" "$FRONTEND_DIR/.env"
    echo -e "    ${GREEN}[OK] Creado frontend .env${NC}"
fi
echo ""

# ------------------------------------------------------------------------------
# 4. Dependencias del Backend (.venv + pip)
# ------------------------------------------------------------------------------
echo -e "${BLUE}[*] Configurando dependencias del Backend...${NC}"
cd "$BACKEND_DIR"
if [ ! -d ".venv" ]; then
    echo -e "    Creando entorno virtual (.venv)..."
    python3 -m venv .venv
fi
"$BACKEND_DIR/.venv/bin/python" -m pip install --upgrade pip >/dev/null 2>&1 || true
"$BACKEND_DIR/.venv/bin/pip" install -r requirements.txt
echo -e "    ${GREEN}[OK] Backend preparado.${NC}"
echo ""

# ------------------------------------------------------------------------------
# 5. Dependencias del Frontend + compilación
# ------------------------------------------------------------------------------
echo -e "${BLUE}[*] Configurando Frontend...${NC}"
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    echo -e "    Instalando dependencias de Node.js..."
    npm install
fi

echo -e "    Compilando aplicación..."
npm run build
echo -e "    ${GREEN}[OK] Frontend compilado.${NC}"
echo ""

# ------------------------------------------------------------------------------
# 6. Levantar Backend y lanzar la Aplicación
# ------------------------------------------------------------------------------
echo -e "${BLUE}[*] Iniciando el servicio Backend (FastAPI)...${NC}"

# Liberar puerto 8765 si estaba en uso
if command -v lsof >/dev/null 2>&1; then
    OLD_PID=$(lsof -ti:8765 2>/dev/null || true)
    if [ -n "$OLD_PID" ]; then
        kill -9 $OLD_PID 2>/dev/null || true
    fi
elif command -v fuser >/dev/null 2>&1; then
    fuser -k 8765/tcp >/dev/null 2>&1 || true
fi

cd "$BACKEND_DIR"
"$BACKEND_DIR/.venv/bin/python" -m src.main >/dev/null 2>&1 &
BACKEND_PID=$!

cleanup() {
    echo ""
    echo -e "${CYAN}[*] Deteniendo servicios de The Guardian of Kali...${NC}"
    if kill -0 "$BACKEND_PID" 2>/dev/null; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
}
trap cleanup EXIT INT TERM

echo -e "    Esperando a que el backend responda en http://127.0.0.1:8765/health ..."
tries=0
while [ $tries -lt 30 ]; do
    if curl -s -f http://127.0.0.1:8765/health >/dev/null 2>&1; then
        echo -e "    ${GREEN}[OK] Backend saludable y activo.${NC}"
        break
    fi
    tries=$((tries + 1))
    sleep 0.5
done

echo ""
echo -e "${GREEN}${BOLD}[*] Lanzando la interfaz de escritorio de The Guardian of Kali...${NC}"
cd "$FRONTEND_DIR"
export GUARDIAN_SKIP_BACKEND=1
export GUARDIAN_BACKEND_DIR="$BACKEND_DIR"
npx electron .

echo ""
echo -e "${BLUE}[*] Aplicación cerrada.${NC}"
exit 0
