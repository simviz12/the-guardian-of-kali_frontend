#!/usr/bin/env bash
# ==============================================================================
# Iniciar_Guardian.sh - Lanzador rápido de The Guardian of Kali (Mac & Linux)
# ==============================================================================

set -e

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

# 1. Liberar puerto 8765 si quedo colgado de una sesión anterior
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
    echo "Por favor ejecuta primero ./install.sh o ./setup_and_run.sh"
    exit 1
fi

echo "[*] Levantando Backend (FastAPI)..."
cd "$BACKEND_DIR"
"$PYTHON_BIN" -m src.main >/dev/null 2>&1 &
BACKEND_PID=$!

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
