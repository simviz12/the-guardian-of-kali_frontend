@echo off
setlocal enabledelayedexpansion
title The Guardian of Kali - Setup and Run
color 0A

:: ============================================================================
:: setup_and_run.bat  -  One-click install + launch for The Guardian of Kali
::   1. Verifies Git, Node.js and Python are installed
::   2. Resolves (or clones) the sibling backend repository
::   3. Creates .env files from the .env.example templates
::   4. Installs backend (.venv + pip) and frontend (npm) dependencies
::   5. Rebuilds node-pty for Electron's ABI and builds the desktop bundle
::   6. Starts the FastAPI backend, waits for health, then launches the app
:: ============================================================================

cd /d "%~dp0"
set "FRONTEND_DIR=%CD%"

echo ======================================================================
echo          THE GUARDIAN OF KALI - SETUP AND RUN
echo ======================================================================
echo.

:: ----------------------------------------------------------------------------
:: 1. Environment prerequisites
:: ----------------------------------------------------------------------------
echo [*] Checking prerequisites...

where git >nul 2>&1 || (echo [ERROR] Git not found. Install from https://git-scm.com/ & pause & exit /b 1)
echo    [OK] Git
where node >nul 2>&1 || (echo [ERROR] Node.js not found. Install from https://nodejs.org/ & pause & exit /b 1)
echo    [OK] Node.js
where python >nul 2>&1 || (echo [ERROR] Python not found. Install from https://python.org/ and check "Add to PATH". & pause & exit /b 1)
echo    [OK] Python

where wsl >nul 2>&1 && (echo    [OK] WSL detected) || (echo    [WARN] WSL not detected - the Kali terminal needs WSL2 with the kali-linux distro.)
echo.

:: ----------------------------------------------------------------------------
:: 2. Resolve the backend repository (sibling folder, cloned if missing)
:: ----------------------------------------------------------------------------
set "BACKEND_DIR="
if exist "%FRONTEND_DIR%\..\the-guardian-of-kali_backend\requirements.txt" set "BACKEND_DIR=%FRONTEND_DIR%\..\the-guardian-of-kali_backend"
if not defined BACKEND_DIR if exist "%FRONTEND_DIR%\..\backend\requirements.txt" set "BACKEND_DIR=%FRONTEND_DIR%\..\backend"

if not defined BACKEND_DIR (
    echo [*] Backend not found next to the frontend. Cloning...
    pushd "%FRONTEND_DIR%\.."
    git clone https://github.com/simviz12/the-guardian-of-kali_backend.git
    popd
    set "BACKEND_DIR=%FRONTEND_DIR%\..\the-guardian-of-kali_backend"
)
echo    [OK] Backend: !BACKEND_DIR!
echo.

:: ----------------------------------------------------------------------------
:: 3. .env files from templates
:: ----------------------------------------------------------------------------
echo [*] Preparing environment files...
if not exist "!BACKEND_DIR!\.env" if exist "!BACKEND_DIR!\.env.example" (
    copy /Y "!BACKEND_DIR!\.env.example" "!BACKEND_DIR!\.env" >nul
    echo    [OK] Created backend .env (edit it to add your API key)
)
if not exist "%FRONTEND_DIR%\.env" if exist "%FRONTEND_DIR%\.env.example" (
    copy /Y "%FRONTEND_DIR%\.env.example" "%FRONTEND_DIR%\.env" >nul
    echo    [OK] Created frontend .env
)
echo.

:: ----------------------------------------------------------------------------
:: 4. Backend dependencies (.venv + pip)
:: ----------------------------------------------------------------------------
echo [*] Installing backend dependencies...
pushd "!BACKEND_DIR!"
if not exist ".venv" (
    echo    Creating virtual environment (.venv)...
    python -m venv .venv
)
call ".venv\Scripts\activate.bat"
python -m pip install --upgrade pip >nul 2>&1
pip install -r requirements.txt || (echo [ERROR] pip install failed. & popd & pause & exit /b 1)
call deactivate
popd
echo    [OK] Backend ready.
echo.

:: ----------------------------------------------------------------------------
:: 5. Frontend dependencies + native rebuild + build
:: ----------------------------------------------------------------------------
echo [*] Installing frontend dependencies...
call npm install || (echo [ERROR] npm install failed. & pause & exit /b 1)
echo    Rebuilding native modules (node-pty) for Electron...
call npx electron-rebuild -f -w node-pty >nul 2>&1 || echo    [WARN] electron-rebuild skipped - relying on bundled prebuilds.
echo    Building desktop bundle...
call npm run build || (echo [ERROR] build failed. & pause & exit /b 1)
echo    [OK] Frontend built.
echo.

:: ----------------------------------------------------------------------------
:: 6. Start backend, wait for health, launch app
:: ----------------------------------------------------------------------------
echo [*] Starting the FastAPI backend...
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr "127.0.0.1:8765" ^| findstr "LISTENING"') do taskkill /PID %%p /F >nul 2>&1
start "Guardian Backend" /B cmd /c ""!BACKEND_DIR!\.venv\Scripts\python.exe" -m src.main"

echo    Waiting for backend health at http://127.0.0.1:8765/health ...
set /a tries=0
:healthloop
set /a tries+=1
curl -s -o nul http://127.0.0.1:8765/health && goto healthy
if !tries! geq 30 (echo [WARN] Backend did not report healthy in time; launching UI anyway. & goto launch)
timeout /t 1 /nobreak >nul
goto healthloop

:healthy
echo    [OK] Backend is healthy.

:launch
echo [*] Launching The Guardian of Kali desktop app...
:: The backend is already managed by this script; tell Electron not to spawn another.
set "GUARDIAN_SKIP_BACKEND=1"
set "GUARDIAN_BACKEND_DIR=!BACKEND_DIR!"
call npx electron .
echo.
echo [*] Application closed.
exit /b 0
