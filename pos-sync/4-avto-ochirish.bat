@echo off
chcp 65001 >nul
echo ====================================================
echo   TEGEN Market - Avto-Sinxronlashni O'chirish
echo ====================================================
echo.

schtasks /Delete /F /TN "TEGEN_POS_Sync"
if errorlevel 1 (
  echo [INFO] Avto-sinxronlash topilmadi yoki allaqachon o'chirilgan.
) else (
  echo [OK] Avto-sinxronlash o'chirildi.
)
echo.
pause
