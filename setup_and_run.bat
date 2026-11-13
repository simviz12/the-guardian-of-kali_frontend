@echo off
setlocal enabledelayedexpansion
title The Guardian of Kali - Setup and Run
color 0A

:: ============================================================================
:: setup_and_run.bat  -  One-click install + launch for The Guardian of Kali
::
:: Works in two modes automatically:
::   A) Standalone: download just this .bat into an empty folder and double-click.
::      It clones BOTH repositories (frontend + backend) and sets everything up.
::   B) Inside the frontend repo: it uses the current checkout and clones only
::      the sibling backend if missing.
::
:: Steps:
::   1. Verify / auto-install Git, Node.js and Python (via winget when available)
::   2. Resolve or clone the frontend and backend repositories
::   3. Create .env files from the .env.example templates
::   4. Install backend (.venv + pip) and frontend (npm) dependencies
::   5. Rebuild node-pty for Electron's ABI and build the desktop bundle
::   6. Start the FastAPI backend, wait for health, then launch the app
:: ============================================================================

cd /d "%~dp0"
set "ROOT=%CD%"

echo ======================================================================
echo          THE GUARDIAN OF KALI - SETUP AND RUN
echo ======================================================================
echo.

:: ----------------------------------------------------------------------------
:: 1. Environment prerequisites (installed first, so git is available to clone)
:: ----------------------------------------------------------------------------
echo [*] Checking prerequisites...

set "HAVE_WINGET=0"
where winget >nul 2>&1 && set "HAVE_WINGET=1"
set "DID_INSTALL=0"

call :ensure_tool git  "Git.Git"              "https://git-scm.com/"
if errorlevel 1 exit /b 1
call :ensure_tool node "OpenJS.NodeJS.LTS"    "https://nodejs.org/"
if errorlevel 1 exit /b 1
call :ensure_tool python "Python.Python.3.12" "https://python.org/"
if errorlevel 1 exit /b 1

if "%DID_INSTALL%"=="1" (
    echo [*] Refreshing environment after installation...
    call :refresh_path
    git --version >nul 2>&1 && node --version >nul 2>&1 && python --version >nul 2>&1 || (
        echo.
        echo [!] Dependencies were installed but are not yet on PATH for this window.
        echo     Please CLOSE this window and run setup_and_run.bat again.
        pause
        exit /b 0
    )
)

call :ensure_kali
if errorlevel 1 exit /b 1
echo.

:: ----------------------------------------------------------------------------
:: 2. Resolve or clone BOTH repositories
:: ----------------------------------------------------------------------------
echo [*] Resolving repositories...

set "FE_REPO=https://github.com/simviz12/the-guardian-of-kali_frontend.git"
set "BE_REPO=https://github.com/simviz12/the-guardian-of-kali_backend.git"

:: -- Frontend --
set "FRONTEND_DIR="
if exist "%ROOT%\package.json" set "FRONTEND_DIR=%ROOT%"
if not defined FRONTEND_DIR if exist "%ROOT%\the-guardian-of-kali_frontend\package.json" set "FRONTEND_DIR=%ROOT%\the-guardian-of-kali_frontend"
if not defined FRONTEND_DIR (
    echo    Cloning frontend...
    git clone %FE_REPO% "%ROOT%\the-guardian-of-kali_frontend" || (echo [ERROR] frontend clone failed. & pause & exit /b 1)
    set "FRONTEND_DIR=%ROOT%\the-guardian-of-kali_frontend"
)
echo    [OK] Frontend: !FRONTEND_DIR!

:: Parent folder of the frontend: the backend lives alongside it.
for %%I in ("!FRONTEND_DIR!\..") do set "PARENT=%%~fI"

:: -- Backend --
set "BACKEND_DIR="
if exist "!PARENT!\the-guardian-of-kali_backend\requirements.txt" set "BACKEND_DIR=!PARENT!\the-guardian-of-kali_backend"
if not defined BACKEND_DIR if exist "!PARENT!\backend\requirements.txt" set "BACKEND_DIR=!PARENT!\backend"
if not defined BACKEND_DIR (
    echo    Cloning backend...
    git clone %BE_REPO% "!PARENT!\the-guardian-of-kali_backend" || (echo [ERROR] backend clone failed. & pause & exit /b 1)
    set "BACKEND_DIR=!PARENT!\the-guardian-of-kali_backend"
)
echo    [OK] Backend:  !BACKEND_DIR!
echo.

:: ----------------------------------------------------------------------------
:: 3. .env files from templates
:: ----------------------------------------------------------------------------
echo [*] Preparing environment files...
if not exist "!BACKEND_DIR!\.env" if exist "!BACKEND_DIR!\.env.example" (
    copy /Y "!BACKEND_DIR!\.env.example" "!BACKEND_DIR!\.env" >nul
    echo    [OK] Created backend .env ^(edit it to add your API key^)
)
if not exist "!FRONTEND_DIR!\.env" if exist "!FRONTEND_DIR!\.env.example" (
    copy /Y "!FRONTEND_DIR!\.env.example" "!FRONTEND_DIR!\.env" >nul
    echo    [OK] Created frontend .env
)
echo.

:: ----------------------------------------------------------------------------
:: 4. Backend dependencies (.venv + pip)
:: ----------------------------------------------------------------------------
echo [*] Installing backend dependencies...
pushd "!BACKEND_DIR!"
if not exist ".venv" (
    echo    Creating virtual environment ^(.venv^)...
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
pushd "!FRONTEND_DIR!"
call npm install || (echo [ERROR] npm install failed. & popd & pause & exit /b 1)
echo    Rebuilding native modules (node-pty) for Electron...
call npx electron-rebuild -f -w node-pty >nul 2>&1 || echo    [WARN] electron-rebuild skipped - relying on bundled prebuilds.
echo    Building desktop bundle...
call npm run build || (echo [ERROR] build failed. & popd & pause & exit /b 1)
popd
echo    [OK] Frontend built.
echo.

:: ----------------------------------------------------------------------------
:: 6. Start backend, wait for health, launch app
:: ----------------------------------------------------------------------------
echo [*] Starting the FastAPI backend...
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr "127.0.0.1:8765" ^| findstr "LISTENING"') do taskkill /PID %%p /F >nul 2>&1
:: pushd so the started process inherits the backend dir as its working directory.
pushd "!BACKEND_DIR!"
start "Guardian Backend" /B ".venv\Scripts\python.exe" -m src.main
popd

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
pushd "!FRONTEND_DIR!"
call npx electron .
popd
echo.
:: Stop the backend this script started so it does not linger after the app closes.
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr "127.0.0.1:8765" ^| findstr "LISTENING"') do taskkill /PID %%p /F >nul 2>&1
echo [*] Application closed.
exit /b 0

:: ============================================================================
:: Helpers
:: ============================================================================

:: --- ensure a tool exists, installing via winget when possible ---------------
:ensure_tool
set "TOOL_CMD=%~1"
set "TOOL_ID=%~2"
set "TOOL_URL=%~3"
:: Run the tool instead of "where": Windows ships a fake python.exe Store alias
:: that "where" finds even when Python is not installed.
%TOOL_CMD% --version >nul 2>&1 && (echo    [OK] %TOOL_CMD% & goto :eof)
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

:: --- ensure WSL2 + the kali-linux distro exist, installing them when missing ---
:: The app always enters Kali as root (wsl -d kali-linux -u root), so no Linux
:: user has to be created and the whole step can run unattended.
:ensure_kali
set "WSL_UTF8=1"
set "KALI_TEST=wsl.exe -d kali-linux -u root -e true"
where wsl >nul 2>&1 || goto kali_no_wsl
%KALI_TEST% >nul 2>&1 && goto kali_tools

echo    [..] Kali Linux not found in WSL - installing it ^(downloads several hundred MB^)...
wsl.exe --install -d kali-linux --no-launch
%KALI_TEST% >nul 2>&1 && goto kali_tools

:: Plain install failed: WSL itself is not enabled yet, which needs administrator.
echo    [..] Requesting administrator rights to enable WSL2 ^(accept the Windows prompt^)...
powershell -NoProfile -Command "Start-Process wsl.exe -ArgumentList '--install','-d','kali-linux','--no-launch' -Verb RunAs -Wait"
%KALI_TEST% >nul 2>&1 && goto kali_tools

echo.
echo [!] WSL2 / Kali was installed but Windows must RESTART to finish enabling it.
echo     Restart the computer and run setup_and_run.bat again.
pause
exit /b 1

:kali_tools
echo    [OK] Kali Linux ^(WSL2^) ready
:: The Kali WSL image is minimal: add the basic tools the copilot suggests.
wsl.exe -d kali-linux -u root -e sh -c "command -v nmap >/dev/null && command -v whois >/dev/null && command -v dig >/dev/null" >nul 2>&1 && goto :eof
echo    [..] Installing basic Kali tools ^(nmap, whois, dnsutils, curl^)...
wsl.exe -d kali-linux -u root -e sh -c "apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq nmap whois dnsutils curl iputils-ping" || echo    [WARN] Could not install the Kali tools - run 'apt install nmap whois dnsutils' inside Kali later.
exit /b 0

:kali_no_wsl
echo [ERROR] wsl.exe not found. This Windows version is too old for WSL2
echo         ^(Windows 10 2004+ or Windows 11 is required^).
pause
exit /b 1

:: --- reload PATH from the registry (machine + user) ---------------------------
:refresh_path
for /f "usebackq tokens=2,*" %%A in (`reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path 2^>nul`) do set "MACHINE_PATH=%%B"
for /f "usebackq tokens=2,*" %%A in (`reg query "HKCU\Environment" /v Path 2^>nul`) do set "USER_PATH=%%B"
:: "call" expands the %SystemRoot%-style references stored in the registry, and the
:: current PATH is kept so system tools (curl, timeout, wsl) are never lost.
call set "PATH=%PATH%;%MACHINE_PATH%;%USER_PATH%"
goto :eof
