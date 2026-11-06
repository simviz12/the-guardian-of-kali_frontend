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

:: winget (Windows Package Manager) lets us auto-install missing base tools.
set "HAVE_WINGET=0"
where winget >nul 2>&1 && set "HAVE_WINGET=1"
set "DID_INSTALL=0"

call :ensure_tool git  "Git.Git"                 "https://git-scm.com/"
if errorlevel 1 exit /b 1
call :ensure_tool node "OpenJS.NodeJS.LTS"       "https://nodejs.org/"
if errorlevel 1 exit /b 1
call :ensure_tool python "Python.Python.3.12"    "https://python.org/"
if errorlevel 1 exit /b 1

:: If we installed anything, PATH changed: refresh it in this session and re-verify.
if "%DID_INSTALL%"=="1" (
    echo [*] Refreshing environment after installation...
    call :refresh_path
    where git >nul 2>&1 && where node >nul 2>&1 && where python >nul 2>&1 || (
        echo.
        echo [!] Dependencies were installed but are not yet on PATH for this window.
        echo     Please CLOSE this window and run setup_and_run.bat again.
        pause
        exit /b 0
    )
)

where wsl >nul 2>&1 && (echo    [OK] WSL detected) || (echo    [WARN] WSL not detected - the Kali terminal needs WSL2 with the kali-linux distro ^(see INSTALACION.md^).)
echo.
goto :after_prereqs

:: --- helper: ensure a tool exists, installing via winget when possible ---------
:ensure_tool
set "TOOL_CMD=%~1"
set "TOOL_ID=%~2"
set "TOOL_URL=%~3"
where %TOOL_CMD% >nul 2>&1 && (echo    [OK] %TOOL_CMD% & goto :eof)
if "%HAVE_WINGET%"=="1" (
    echo    [..] %TOOL_CMD% not found - installing with winget ^(%TOOL_ID%^)...
    winget install -e --id %TOOL_ID% --accept-source-agreements --accept-package-agreements --silent
    set "DID_INSTALL=1"
    goto :eof
)
echo [ERROR] %TOOL_CMD% not found and winget is unavailable.
echo         Install it manually from %TOOL_URL% ^(for Python, check "Add to PATH"^), then re-run.
pause
exit /b 1

:: --- helper: reload PATH from the registry (user + machine) ---------------------
:refresh_path
for /f "usebackq tokens=2,*" %%A in (`reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path 2^>nul`) do set "MACHINE_PATH=%%B"
for /f "usebackq tokens=2,*" %%A in (`reg query "HKCU\Environment" /v Path 2^>nul`) do set "USER_PATH=%%B"
set "PATH=%MACHINE_PATH%;%USER_PATH%"
goto :eof

:after_prereqs

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
