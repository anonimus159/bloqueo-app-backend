# Memoria de Progreso - CodeCraft Device Controller

Este documento contiene el estado actual del proyecto, los hitos completados y los siguientes pasos definidos. Ha sido guardado de forma persistente tanto en la memoria del asistente (`.agents/AGENTS.md`) como en este archivo.

## 🛠️ Hitos Completados en esta Sesión

### 1. Pruebas y Aprovisionamiento con Emulador
- **Hito:** Se configuró y aprovisionó el emulador `Pixel 10 Pro API 37` como **Device Owner** de forma exitosa.
- **Túnel Inverso:** Se implementó y activó `adb reverse tcp:3000 tcp:3000` para redirigir peticiones a `127.0.0.1:3000` al backend local de la computadora, solucionando los problemas de DNS internos del emulador en Windows.
- **Verificación de Bloqueo:** Se probó con éxito el bloqueo remoto desde la web oficial (`https://bloqueo-app-backend.vercel.app/`). El emulador bloqueó su pantalla y deshabilitó los Ajustes y Barra de Notificaciones nativamente.

### 2. Código de Desbloqueo Fuera de Línea (Bypass Code / OTP)
- **Hito:** Implementada la funcionalidad para desbloquear el terminal de forma segura si no tiene red.
- **Lógica Android:** Se modificó [LockScreenActivity.kt](file:///d:/INFORMACION/Documents/bloqueo%20app/android_nuevo/app/src/main/java/com/codecraft/control/LockScreenActivity.kt) agregando un campo `EditText` numérico y un botón verde de validación. La validación se hace localmente mediante hash MD5 del Android ID + una salt secreta + fecha (válido para Hoy, Ayer y Mañana). El código de hoy para el emulador es **`394717`**.
- **Herramienta de Consola:** Se creó el script [generate_bypass_code.ts](file:///d:/INFORMACION/Documents/bloqueo%20app/generate_bypass_code.ts) para generar el PIN diario desde la computadora de administración.
- **Período de Gracia:** Al desbloquearse offline, el dispositivo recibe un período de gracia de 3 días antes de volver a requerir validación.

### 3. Estabilidad y Permisos en Android 13+
- **Manifiesto:** Declarado el permiso `uses-permission android.permission.USE_EXACT_ALARM` en [AndroidManifest.xml](file:///d:/INFORMACION/Documents/bloqueo%20app/android_nuevo/app/src/main/AndroidManifest.xml) para permitir alarmas exactas automáticamente en versiones recientes.
- **Robusto:** Envuelto en `try-catch` el método de alarmas en [MainActivity.kt](file:///d:/INFORMACION/Documents/bloqueo%20app/android_nuevo/app/src/main/java/com/codecraft/control/MainActivity.kt) para evitar que una excepción de seguridad tire abajo el hilo de check-in y bloquee la app.

### 4. Credenciales de Administrador en Base de Datos (Supabase)
- **Hito:** Se creó el script [reset_admin_password.ts](file:///d:/INFORMACION/Documents/bloqueo%20app/reset_admin_password.ts) para actualizar/crear credenciales seguras.
- **Acceso:**
  * **Email:** `admin@codecraft.com`
  * **Password:** `admin1234`

---

## 🚀 Siguientes Pasos

1. **Finalizar Prueba de Liberación Offline:**
   - Iniciar el emulador limpio tras el cierre forzado de procesos.
   - Ejecutar la compilación desde Android Studio.
   - Establecer `adb reverse tcp:3000 tcp:3000`.
   - Ingresar el PIN de hoy **`394717`** en la pantalla roja y ver la liberación offline en acción.

2. **Implementación de Notificaciones Push FCM (Fase Conectividad):**
   - Integrar Firebase Cloud Messaging (FCM) real para recibir pings instantáneos de bloqueo/desbloqueo desde el backend sin depender del polling.

3. **Mapeo de Inventario y Auditoría:**
   - Agregar módulo de stock/IMEI en el panel web y logs inalterables de transacciones.
