#!/usr/bin/env bash
# ==============================================================================
# setup_and_run.sh - One-click install + launch for The Guardian of Kali
# Compatible with macOS and Linux (Kali, Debian, Ubuntu, Fedora, Arch, etc.)
#
# Works in two modes automatically:
#   A) Standalone: download just this file into an empty folder and run it.
#      It clones BOTH repositories (frontend + backend) and sets everything up.
#   B) Inside the frontend repo: it uses the current checkout and clones only
#      the sibling backend if missing.
#
# Everything it installs is announced first. System packages need "sudo", so
# the script may ask for your password (it explains why before asking).
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

info()  { echo -e "${BLUE}[*] $*${NC}"; }
ok()    { echo -e "    ${GREEN}[OK] $*${NC}"; }
warn()  { echo -e "    ${YELLOW}[AVISO] $*${NC}"; }
fail()  { echo -e "${RED}[ERROR] $*${NC}"; exit 1; }

echo -e "${GREEN}${BOLD}======================================================================${NC}"
echo -e "${CYAN}${BOLD}          THE GUARDIAN OF KALI - SETUP AND RUN (MAC & LINUX)          ${NC}"
echo -e "${GREEN}${BOLD}======================================================================${NC}"
echo "Este script instala lo que falte (Git, Node.js, Python y herramientas de"
echo "compilación), descarga el proyecto, lo compila y abre la aplicación."
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
ROOT="$SCRIPT_DIR"

OS="$(uname -s)"
case "$OS" in
    Darwin*) OS_TYPE="macos" ;;
    Linux*)  OS_TYPE="linux" ;;
    *) fail "Sistema operativo no soportado: $OS" ;;
esac

# "sudo" only when needed: root (the default user on some Kali setups) has none.
if [ "$(id -u)" -eq 0 ]; then SUDO=""; else SUDO="sudo"; fi

# ------------------------------------------------------------------------------
# 1. Herramientas necesarias
# ------------------------------------------------------------------------------
info "Verificando prerrequisitos..."

# Installs system packages with the distro's package manager, announcing them first.
pkg_install() {
    echo -e "    ${CYAN}Se van a instalar paquetes del sistema: $*${NC}"
    if [ "$OS_TYPE" = "macos" ]; then
        if ! command -v brew >/dev/null 2>&1; then
            echo -e "    ${CYAN}Homebrew no está instalado: se instalará primero (pedirá tu contraseña).${NC}"
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            if [ -x "/opt/homebrew/bin/brew" ]; then eval "$(/opt/homebrew/bin/brew shellenv)"; fi
            if [ -x "/usr/local/bin/brew" ]; then eval "$(/usr/local/bin/brew shellenv)"; fi
        fi
        brew install "$@"
        return
    fi
    if [ -n "$SUDO" ]; then
        echo -e "    ${CYAN}Se necesita permiso de administrador (sudo): puede pedir tu contraseña.${NC}"
    fi
    if command -v apt-get >/dev/null 2>&1; then
        $SUDO apt-get update -qq
        DEBIAN_FRONTEND=noninteractive $SUDO apt-get install -y "$@"
    elif command -v dnf >/dev/null 2>&1; then
        $SUDO dnf install -y "$@"
    elif command -v pacman >/dev/null 2>&1; then
        $SUDO pacman -Sy --noconfirm "$@"
    elif command -v zypper >/dev/null 2>&1; then
        $SUDO zypper install -y "$@"
    else
        fail "No se reconoce el gestor de paquetes. Instala a mano: $*"
    fi
}

# Picks the package name for the current package manager: pkg_name <apt> <dnf> <pacman> <brew>
pkg_name() {
    if [ "$OS_TYPE" = "macos" ]; then echo "$4"
    elif command -v apt-get >/dev/null 2>&1; then echo "$1"
    elif command -v dnf >/dev/null 2>&1 || command -v zypper >/dev/null 2>&1; then echo "$2"
    else echo "$3"; fi
}

NEEDED=""
command -v git  >/dev/null 2>&1 || NEEDED="$NEEDED git"
command -v curl >/dev/null 2>&1 || NEEDED="$NEEDED curl"
if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    NEEDED="$NEEDED $(pkg_name "nodejs npm" "nodejs npm" "nodejs npm" "node")"
fi
command -v python3 >/dev/null 2>&1 || NEEDED="$NEEDED $(pkg_name "python3" "python3 python3-pip" "python python-pip" "python")"

if [ "$OS_TYPE" = "linux" ]; then
    # Debian/Ubuntu/Kali ship python3 without the venv module.
    if command -v apt-get >/dev/null 2>&1 && ! python3 -c "import ensurepip" >/dev/null 2>&1; then
        NEEDED="$NEEDED python3-venv python3-pip"
    fi
    # node-pty (the real terminal) is compiled from source on Linux.
    if ! command -v make >/dev/null 2>&1 || ! command -v g++ >/dev/null 2>&1; then
        NEEDED="$NEEDED $(pkg_name "build-essential" "gcc-c++ make" "base-devel" "")"
    fi
fi

if [ -n "$NEEDED" ]; then
    # shellcheck disable=SC2086
    pkg_install $NEEDED
fi

command -v git >/dev/null 2>&1     || fail "Git no quedó instalado. Instálalo a mano y vuelve a ejecutar."
command -v node >/dev/null 2>&1    || fail "Node.js no quedó instalado. Instálalo a mano y vuelve a ejecutar."
command -v python3 >/dev/null 2>&1 || fail "Python 3 no quedó instalado. Instálalo a mano y vuelve a ejecutar."

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 18 ]; then
    fail "Node.js $(node -v) es demasiado antiguo: se necesita la versión 18 o superior.
        Instala una versión LTS desde https://nodejs.org/ (o con nvm) y vuelve a ejecutar."
fi

ok "Git:     $(git --version)"
ok "Node.js: $(node -v) (npm $(npm -v))"
ok "Python:  $(python3 --version)"

# The terminal panel uses this machine's own shell: the copilot suggests Kali tools.
if ! command -v nmap >/dev/null 2>&1; then
    warn "nmap no está instalado. El copiloto propone herramientas de Kali (nmap, whois, dig...)"
    warn "y solo funcionarán las que tengas instaladas en este equipo."
fi
echo ""

# ------------------------------------------------------------------------------
# 2. Resolver repositorios Frontend y Backend
# ------------------------------------------------------------------------------
info "Resolviendo repositorios..."
FE_REPO="https://github.com/simviz12/the-guardian-of-kali_frontend.git"
BE_REPO="https://github.com/simviz12/the-guardian-of-kali_backend.git"

if [ -f "$ROOT/package.json" ]; then
    FRONTEND_DIR="$ROOT"
elif [ -f "$ROOT/the-guardian-of-kali_frontend/package.json" ]; then
    FRONTEND_DIR="$ROOT/the-guardian-of-kali_frontend"
else
    echo "    Descargando el Frontend desde GitHub..."
    git clone "$FE_REPO" "$ROOT/the-guardian-of-kali_frontend"
    FRONTEND_DIR="$ROOT/the-guardian-of-kali_frontend"
fi
ok "Frontend: $FRONTEND_DIR"

PARENT="$(cd "$FRONTEND_DIR/.." && pwd)"

if [ -f "$PARENT/the-guardian-of-kali_backend/requirements.txt" ]; then
    BACKEND_DIR="$PARENT/the-guardian-of-kali_backend"
elif [ -f "$PARENT/backend/requirements.txt" ]; then
    BACKEND_DIR="$PARENT/backend"
else
    echo "    Descargando el Backend desde GitHub..."
    git clone "$BE_REPO" "$PARENT/the-guardian-of-kali_backend"
    BACKEND_DIR="$PARENT/the-guardian-of-kali_backend"
fi
ok "Backend:  $BACKEND_DIR"
echo ""

# ------------------------------------------------------------------------------
# 3. Archivos .env
# ------------------------------------------------------------------------------
info "Verificando archivos .env..."
if [ ! -f "$BACKEND_DIR/.env" ] && [ -f "$BACKEND_DIR/.env.example" ]; then
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
    ok "Creado backend .env"
fi
if [ ! -f "$FRONTEND_DIR/.env" ] && [ -f "$FRONTEND_DIR/.env.example" ]; then
    cp "$FRONTEND_DIR/.env.example" "$FRONTEND_DIR/.env"
    ok "Creado frontend .env"
fi
echo ""

# ------------------------------------------------------------------------------
# 4. Dependencias del Backend (.venv + pip)
# ------------------------------------------------------------------------------
info "Instalando dependencias del Backend (Python)..."
cd "$BACKEND_DIR"
if [ ! -x ".venv/bin/python" ]; then
    echo "    Creando entorno virtual (.venv)..."
    rm -rf .venv
    python3 -m venv .venv
fi
"$BACKEND_DIR/.venv/bin/python" -m pip install --upgrade pip >/dev/null 2>&1 || true
"$BACKEND_DIR/.venv/bin/python" -m pip install -r requirements.txt
ok "Backend preparado."
echo ""

# ------------------------------------------------------------------------------
# 5. Dependencias del Frontend + compilación
# ------------------------------------------------------------------------------
info "Instalando dependencias del Frontend (Node.js) - puede tardar varios minutos..."
cd "$FRONTEND_DIR"
npm install

# Electron needs the desktop libraries (GTK, NSS...). Desktop distros ship them,
# minimal installs (servers, containers, WSL) do not.
ELECTRON_BIN="$FRONTEND_DIR/node_modules/electron/dist/electron"
if [ "$OS_TYPE" = "linux" ] && [ -x "$ELECTRON_BIN" ] && ldd "$ELECTRON_BIN" 2>/dev/null | grep -q "not found"; then
    echo "    Faltan librerías gráficas que necesita la aplicación de escritorio."
    if command -v apt-get >/dev/null 2>&1; then
        # Newer Debian/Ubuntu/Kali renamed several of these with a "t64" suffix.
        GUI_LIBS=""
        for lib in libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libgbm1 libgtk-3-0 \
            libasound2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2; do
            if apt-cache show "${lib}t64" >/dev/null 2>&1; then
                GUI_LIBS="$GUI_LIBS ${lib}t64"
            else
                GUI_LIBS="$GUI_LIBS $lib"
            fi
        done
        # shellcheck disable=SC2086
        pkg_install $GUI_LIBS
    elif command -v pacman >/dev/null 2>&1; then
        pkg_install nss atk at-spi2-atk cups libdrm mesa gtk3 alsa-lib libxkbcommon
    else
        pkg_install nss atk at-spi2-atk cups-libs libdrm mesa-libgbm gtk3 alsa-lib libxkbcommon
    fi
    if ldd "$ELECTRON_BIN" 2>/dev/null | grep -q "not found"; then
        warn "Siguen faltando librerías para abrir la ventana:"
        ldd "$ELECTRON_BIN" | grep "not found" | sed 's/^/        /'
    fi
fi

echo "    Compilando aplicación..."
npm run build
ok "Frontend compilado."
echo ""

# ------------------------------------------------------------------------------
# 6. Levantar Backend y lanzar la Aplicación
# ------------------------------------------------------------------------------
info "Iniciando el servicio Backend (FastAPI)..."

# Liberar puerto 8765 si estaba en uso
if command -v lsof >/dev/null 2>&1; then
    OLD_PID=$(lsof -ti:8765 2>/dev/null || true)
    if [ -n "$OLD_PID" ]; then
        # shellcheck disable=SC2086
        kill -9 $OLD_PID 2>/dev/null || true
    fi
elif command -v fuser >/dev/null 2>&1; then
    fuser -k 8765/tcp >/dev/null 2>&1 || true
fi

# Per-user file: a log left by another account (e.g. root) would not be writable.
BACKEND_LOG="${TMPDIR:-/tmp}/guardian-backend-$(id -u).log"
cd "$BACKEND_DIR"
"$BACKEND_DIR/.venv/bin/python" -m src.main >"$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

cleanup() {
    echo ""
    echo -e "${CYAN}[*] Deteniendo servicios de The Guardian of Kali...${NC}"
    if kill -0 "$BACKEND_PID" 2>/dev/null; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
}
trap cleanup EXIT INT TERM

echo "    Esperando a que el backend responda en http://127.0.0.1:8765/health ..."
healthy=0
tries=0
while [ $tries -lt 60 ]; do
    if curl -s -f http://127.0.0.1:8765/health >/dev/null 2>&1; then
        healthy=1
        break
    fi
    tries=$((tries + 1))
    sleep 0.5
done
if [ "$healthy" -eq 1 ]; then
    ok "Backend saludable y activo."
else
    warn "El backend no respondió a tiempo; se abre la app igualmente."
    warn "Revisa el registro del backend en: $BACKEND_LOG"
fi

echo ""
echo -e "${GREEN}${BOLD}[*] Lanzando la interfaz de escritorio de The Guardian of Kali...${NC}"
cd "$FRONTEND_DIR"
export GUARDIAN_SKIP_BACKEND=1
export GUARDIAN_BACKEND_DIR="$BACKEND_DIR"

# Chromium refuses to start its sandbox as root, so it is disabled only then.
ELECTRON_FLAGS=""
if [ "$(id -u)" -eq 0 ]; then
    warn "Ejecutando como root: la app se abre sin el sandbox de Chromium (--no-sandbox)."
    ELECTRON_FLAGS="--no-sandbox"
fi

set +e
# shellcheck disable=SC2086
npx electron . $ELECTRON_FLAGS
ELECTRON_EXIT=$?
set -e

echo ""
if [ "$ELECTRON_EXIT" -ne 0 ]; then
    echo -e "${RED}[ERROR] La aplicación terminó con error (código $ELECTRON_EXIT).${NC}"
    echo "        - Se necesita un entorno gráfico (no funciona por SSH sin escritorio)."
    echo "        - Si el mensaje menciona 'sandbox' (Ubuntu 24.04 o posterior), ejecuta:"
    echo "            sudo sysctl -w kernel.apparmor_restrict_unprivileged_userns=0"
    echo "          y vuelve a lanzar este script."
    exit "$ELECTRON_EXIT"
fi
echo -e "${BLUE}[*] Aplicación cerrada.${NC}"
exit 0
