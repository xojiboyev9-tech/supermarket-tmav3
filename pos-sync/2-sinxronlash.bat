@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ====================================================
echo   TEGEN Market - Hozir Sinxronlash (Base.FDB -^> TMA)
echo ====================================================
echo.

if not exist "node_modules\node-firebird" (
  call npm install --omit=dev
)

node sync.js
echo.
pause
