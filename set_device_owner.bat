@echo off
title CodeCraft Device Owner Setup Utility
color 0b
echo =====================================================================
echo 🛠️  CODECRAFT DEVICE OWNER CONFIGURATION UTILITY (ANDROID)
echo =====================================================================
echo.
echo Requisitos:
echo 1. El celular debe estar conectado por cable USB a la computadora.
echo 2. La Depuracion USB debe estar activa (Ajustes > Opciones de desarrollador).
echo 3. El celular NO debe tener cuentas registradas (Google, WhatsApp, etc).
echo.
echo =====================================================================
echo Buscando dispositivo conectado...
adb devices
echo.
echo ⚠️  Presione cualquier tecla cuando este listo para establecer la aplicacion
echo    como Propietario del Dispositivo (Device Owner)...
pause > null

echo.
echo 🚀 Configurando com.codecraft.control como Device Owner...
adb shell dpm set-device-owner com.codecraft.control/.MDMDeviceAdminReceiver

if %errorlevel% equ 0 (
    echo.
    echo =====================================================================
    echo ✅ ¡EXITO! La aplicacion se ha establecido como Device Owner.
    echo    Ahora es inamovible y tiene control total de politicas.
    echo =====================================================================
) else (
    echo.
    echo =====================================================================
    echo ❌ ERROR: No se pudo configurar el Device Owner.
    echo    Asegurese de haber eliminado todas las cuentas del telefono
    echo    (incluyendo cuentas de Google, Samsung, Xiaomi, etc.)
    echo =====================================================================
)
echo.
pause
