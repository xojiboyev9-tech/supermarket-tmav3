@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ====================================================
echo   TEGEN Market - POS Baza Tekshiruvi (Read-Only)
echo ====================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [XATO] Node.js o'rnatilmagan!
  echo Avval https://nodejs.org saytidan LTS versiyani o'rnating.
  pause
  exit /b 1
)

if not exist "node_modules\node-firebird" (
  echo Kerakli kutubxona o'rnatilmoqda (npm install)...
  call npm install --omit=dev
  if errorlevel 1 (
    echo [XATO] npm install bajarilmadi. Internetni tekshiring.
    pause
    exit /b 1
  )
)

node sync.js --inspect
echo.
echo ====================================================
echo Natijani rasmga olib yuborishingiz mumkin.
pause
