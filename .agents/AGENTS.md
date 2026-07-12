# CodeCraft Device Controller - Memoria de Progreso y Estado de Desarrollo

Este archivo sirve como memoria persistente del estado del desarrollo del sistema para que cualquier agente de IA asistente conozca el contexto actual del proyecto.

## 🛠️ Estado Actual del Proyecto

### 1. Aplicación Web Frontend (Vercel)
* **Estado:** Totalmente operativa y desplegada en producción.
* **URL:** `https://bloqueo-app-backend.vercel.app/`
* **Credenciales de Administrador para Pruebas:**
  * **Email:** `admin@codecraft.com`
  * **Contraseña:** `admin1234`
  * *(Restablecido mediante [reset_admin_password.ts](file:///d:/INFORMACION/Documents/bloqueo%20app/reset_admin_password.ts)).*

### 2. Agente de Control Android (`android_nuevo`)
* **Estado:** Compila exitosamente. APK listo para su despliegue desde Android Studio.
* **Serie de Prueba (Emulador):** `58e625a7f1ff4fbd` (Registrado en la base de datos central de Supabase como ID `6`).
* **Cambios Recientes:**
  * **Túnel Inverso ADB:** Configurado con éxito mediante `adb reverse tcp:3000 tcp:3000` para pruebas de conectividad locales sin depender de internet en el emulador.
  * **Código de Desbloqueo Fuera de Línea (OTP):** 
    * Implementado en [LockScreenActivity.kt](file:///d:/INFORMACION/Documents/bloqueo%20app/android_nuevo/app/src/main/java/com/codecraft/control/LockScreenActivity.kt) un algoritmo MD5 que genera y valida un PIN diario de 6 dígitos basado en la serie del dispositivo, la clave secreta `"CodeCraftBypass2026"` y la fecha actual (validando Hoy, Ayer y Mañana). El código de HOY para el emulador es **`394717`**.
    * Creado el script [generate_bypass_code.ts](file:///d:/INFORMACION/Documents/bloqueo%20app/generate_bypass_code.ts) para calcular estos códigos desde la terminal de administración.
  * **Estabilidad y Permisos:**
    * Declarado el permiso `android.permission.USE_EXACT_ALARM` en el [AndroidManifest.xml](file:///d:/INFORMACION/Documents/bloqueo%20app/android_nuevo/app/src/main/AndroidManifest.xml) para evitar excepciones de seguridad en Android 13+.
    * Envuelto en `try-catch` la programación de alarmas en [MainActivity.kt](file:///d:/INFORMACION/Documents/bloqueo%20app/android_nuevo/app/src/main/java/com/codecraft/control/MainActivity.kt) para prevenir que la caída del hilo principal impida el despliegue del bloqueo.

---

## 🚀 Próximos Pasos Definidos

### 1. Finalización de Pruebas Offline
1. Iniciar el emulador de forma limpia.
2. Compilar e instalar la app actualizada desde Android Studio.
3. Establecer el túnel `adb reverse tcp:3000 tcp:3000`.
4. El emulador debe bloquearse (está en estado `locked` en Supabase).
5. Probar el desbloqueo ingresando el código OTP diario generado.

### 2. Siguientes Tareas de Desarrollo (Roadmap de Producción)
* **Integración con Firebase (FCM):** Reemplazar el polling HTTP de 3 segundos por notificaciones push silenciosas para bloquear el celular en tiempo real sin drenar batería.
* **Mapeo de Inventario y Auditoría:** Agregar módulo de stock/IMEI en el panel y logs inalterables de transacciones.
