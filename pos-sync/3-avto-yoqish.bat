@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ====================================================
echo   TEGEN Market - Avto-Sinxronlashni Yoqish (10 daq)
echo ====================================================
echo.

set "TASK_NAME=TEGEN_POS_Sync"
set "VBS_PATH=%~dp0run-hidden.vbs"

schtasks /Create /F /SC MINUTE /MO 10 /TN "%TASK_NAME%" /TR "wscript.exe \"%VBS_PATH%\""
if errorlevel 1 (
  echo.
  echo [XATO] Rejalashtiruvchi yaratilmadi. Faylni o'ng tugma bilan bosib
  echo "Run as administrator" (Administrator sifatida) ishga tushiring.
) else (
  echo.
  echo [OK] Avto-sinxronlash yoqildi! Har 10 daqiqada fonda (oynasiz) ishlaydi.
  echo Holatni sync.log faylida yoki Telegram Mini App ichida ko'rishingiz mumkin.
)
echo.
pause
