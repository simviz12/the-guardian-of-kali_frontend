@echo off
setlocal enabledelayedexpansion
title Instalador One-Click - The Guardian of Kaliche
color 0A

echo ======================================================================
echo          THE GUARDIAN OF KALICHE - INSTALADOR ONE-CLICK
echo ======================================================================
echo Este script descargara e instalara el proyecto completo de forma automatica:
echo  1. Descarga el Backend (FastAPI + Python)
echo  2. Descarga el Frontend (React + Electron)
echo  3. Crea el entorno virtual de Python (.venv) e instala dependencias
echo  4. Instala librerias de Node.js y compila la aplicacion de escritorio
echo  5. Crea el lanzador de arranque rapido (Iniciar_Guardian.bat)
echo ======================================================================
echo.

cd /d "%~dp0"

:: 1. Verificacion de requisitos basicos
echo [*] Verificando requisitos de tu sistema...

where git >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git no esta instalado o no esta en el PATH.
    echo Por favor instalalo desde: https://git-scm.com/
    pause
    exit /b 1
)
echo    [OK] Git detectado.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado.
    echo Por favor descargalo desde: https://nodejs.org/
    pause
    exit /b 1
)
echo    [OK] Node.js detectado.

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python no esta instalado.
    echo Por favor descargalo desde: https://python.org/ y marca "Add Python to PATH".
    pause
    exit /b 1
)
echo    [OK] Python detectado.
echo.

:: 2. Descargar repositorios si no existen
echo [*] Descargando repositorios desde GitHub...

if not exist "the-guardian-of-kali_backend" (
    echo    Clonando Backend...
    git clone https://github.com/simviz12/the-guardian-of-kali_backend.git
) else (
    echo    [INFO] Backend ya existe localmente. Actualizando con git pull...
    cd the-guardian-of-kali_backend && git pull origin main && cd ..
)

if not exist "the-guardian-of-kali_frontend" (
    echo    Clonando Frontend...
    git clone https://github.com/simviz12/the-guardian-of-kali_frontend.git
) else (
    echo    [INFO] Frontend ya existe localmente. Actualizando con git pull...
    cd the-guardian-of-kali_frontend && git pull origin main && cd ..
)
echo.

:: 3. Configurar Backend (Python FastAPI)
echo [*] Configurando Backend de Inteligencia Artificial...
cd the-guardian-of-kali_backend
if not exist ".venv" (
    echo    Creando entorno virtual Python (.venv)...
    python -m venv .venv
)
call .venv\Scripts\activate.bat
python -m pip install --upgrade pip >nul 2>&1
echo    Instalando dependencias de Python (requirements.txt)...
pip install -r requirements.txt
cd ..
echo    [OK] Backend configurado con exito.
echo.

:: 4. Configurar Frontend (Electron + React)
echo [*] Configurando Frontend de escritorio...
cd the-guardian-of-kali_frontend
echo    Instalando modulos de Node (npm install)...
call npm install
echo    Compilando paquetes para produccion (npm run build)...
call npm run build
cd ..
echo    [OK] Frontend compilado con exito.
echo.

:: 5. Generar Iniciar_Guardian.bat
echo [*] Creando lanzador de arranque rapido (Iniciar_Guardian.bat)...
(
echo @echo off
echo title The Guardian of Kaliche
echo color 0B
echo cd /d "%%~dp0"
echo echo ===================================================
echo echo   Iniciando The Guardian of Kaliche...
echo echo ===================================================
echo for /f "tokens=5" %%%%p in ^('netstat -ano 2^^^>nul ^^^| findstr "127.0.0.1:8765" ^^^| findstr "LISTENING"'^) do ^( taskkill /PID %%%%p /F ^>nul 2^>^&1 ^)
echo if exist "the-guardian-of-kali_backend\.venv\Scripts\python.exe" ^(
echo     echo [*] Levantando Backend ^(FastAPI^)...
echo     cd the-guardian-of-kali_backend
echo     start /B .venv\Scripts\python.exe -m src.main ^>nul 2^>^&1
echo     cd ..
echo ^) else ^(
echo     echo [ERROR] Entorno de backend no encontrado.
echo     pause ^& exit /b 1
echo ^)
echo timeout /t 2 /nobreak ^>nul
echo if exist "the-guardian-of-kali_frontend\dist-electron\main.cjs" ^(
echo     echo [*] Abriendo interfaz de escritorio...
echo     cd the-guardian-of-kali_frontend
echo     start "" npx electron .
echo     cd ..
echo ^) else ^(
echo     echo [ERROR] Frontend compilado no encontrado.
echo     pause ^& exit /b 1
echo ^)
echo echo [*] Aplicacion iniciada con exito.
echo exit /b 0
) > Iniciar_Guardian.bat

echo.
echo ======================================================================
echo    INSTALACION COMPLETADA CORRECTAMENTE!
echo ======================================================================
echo Ya esta todo listo. Para abrir la aplicacion en el dia a dia, haz doble clic en:
echo.
echo           --> Iniciar_Guardian.bat <--
echo ======================================================================
echo.
pause
exit /b 0
