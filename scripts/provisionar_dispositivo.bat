@echo off
echo ========================================================
echo   CODECRAFT DEVICE CONTROLLER - APROVISIONAMIENTO
echo ========================================================
echo.
echo Asegurate de que el dispositivo Android este conectado por USB
echo y que la Depuracion USB este habilitada.
echo IMPORTANTE: No debe haber ninguna cuenta de Google configurada
echo en el dispositivo antes de ejecutar esto (se requiere Factory Reset).
echo.
pause

echo.
echo Instalando la aplicacion CodeCraft Control...
adb install -r "..\android\app\build\outputs\apk\debug\app-debug.apk"

echo.
echo Estableciendo la aplicacion como Propietario del Dispositivo (Device Owner)...
adb shell dpm set-device-owner com.codecraft.control/.DeviceAdminRcvr

echo.
echo ========================================================
echo Aprovisionamiento finalizado. Verifica el estado en la app.
echo ========================================================
pause
