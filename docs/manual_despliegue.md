# Manual de Despliegue y Aprovisionamiento - CodeCraft Device Lock System

Este manual describe el procedimiento para desplegar la infraestructura del backend en producción, configurar la base de datos centralizada, ofuscar la aplicación Android y firmar los perfiles de restricciones de iOS.

---

## 1. Servidor Backend y Base de Datos (PostgreSQL)

### Requisitos Previos:
*   Instalancia de PostgreSQL 14 o superior activa en la nube.
*   Servidor Node.js v22.x o superior en un VPS (Hetzner, DigitalOcean o AWS).

### Pasos de Despliegue:
1.  **Migración de Base de Datos:**
    Ejecute el script [schema.sql](file:///d:/INFORMACION/Documents/bloqueo%20app/src/db/schema.sql) en su base de datos PostgreSQL de producción para crear la estructura de tablas e índices:
    ```bash
    psql -h <host_db> -U <usuario_db> -d <nombre_db> -f src/db/schema.sql
    ```
2.  **Configurar Variables de Entorno (.env):**
    Cree el archivo `.env` en el servidor con los secretos reales de producción:
    ```env
    PORT=443
    NODE_ENV=production
    DATABASE_URL=postgresql://db_user:secure_password@db_host:5432/db_name
    JWT_SECRET=reemplazar_con_un_hash_aleatorio_seguro_de_64_caracteres
    DEVICE_TOKEN_SECRET=reemplazar_con_clave_de_firma_de_hardware
    PAYMENTS_WEBHOOK_SECRET=secreto_hmac_compartido_con_pasarela_de_pagos
    ```
3.  **Compilar e Iniciar el Servidor:**
    ```bash
    npm install --production
    npm run build
    npm run start
    ```

---

## 2. Aprovisionamiento y Enrolamiento de Dispositivos

### A. Android (Modo Device Owner)
Para que el agente móvil tenga privilegios absolutos (bloquear desinstalación e inhabilitar Factory Reset), debe registrarse como **Propietario del Dispositivo** durante el primer arranque del terminal.

1.  **Ofuscación con ProGuard/R8 (Antes del empaquetado):**
    Asegúrese de activar la ofuscación en el archivo `build.gradle` de la app de Android:
    ```groovy
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    ```
2.  **Enrolamiento en Fábrica / Tiendas (Zero-Touch o QR Code):**
    *   **Paso 1:** Encienda el celular nuevo (en la pantalla inicial de bienvenida de Android "Hola").
    *   **Paso 2:** Presione la pantalla 6 veces seguidas en el mismo lugar para activar el lector de códigos QR oculto del sistema de Android.
    *   **Paso 3:** Conecte el dispositivo a una red Wi-Fi cuando el sistema lo solicite.
    *   **Paso 4:** Escanee el código QR de aprovisionamiento empresarial generado con el siguiente payload JSON (reemplazando los datos por los de su servidor de producción):
    ```json
    {
      "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "com.codecraft.control/.DeviceAdminRcvr",
      "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": "https://tuservidor.com/downloads/app-control-release.apk",
      "android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM": "hash_sha256_del_certificado_apk"
    }
    ```
    *   **Paso 5:** Android descargará e instalará la aplicación en modo invisible como administrador inmutable.

### B. iOS (Modo Supervisado + Apple Business Manager)
1.  **Registro de Organización:** Registre la empresa en [Apple Business Manager](https://business.apple.com) ingresando el número D-U-N-S legal.
2.  **Firma del Perfil:** Firme digitalmente el archivo [ios_device_lock_restrictions.mobileconfig](file:///d:/INFORMACION/Documents/bloqueo%20app/ios/profiles/ios_device_lock_restrictions.mobileconfig) utilizando un certificado SSL de confianza o el certificado de firma de perfiles empresariales de Apple.
3.  **Inscripción por Cable / DEP:**
    *   Conecte el dispositivo iOS nuevo a una Mac mediante cable USB.
    *   Utilice **Apple Configurator 2** para preparar el dispositivo y asignarlo a su servidor MDM (MicroMDM).
    *   Una vez asignado, al iniciar el iPhone por primera vez, el sistema descargará el perfil de restricciones obligatorias sin que el usuario pueda cancelarlo ni desinstalarlo.

---

## 3. Integración con Pasarela de Pagos (MercadoPago/Stripe)

1.  **Configurar Webhook en la Consola de la Pasarela:**
    *   Registre la URL de notificaciones: `https://tu-dominio.com/api/v1/payments/webhook`
    *   Seleccione el evento: `payment.created` / `payment.updated`
2.  **Intercambio de Secreto:**
    *   Copie el token de firma (firma secreta) que le provee la pasarela de pagos.
    *   Coloque este valor en la variable de entorno `PAYMENTS_WEBHOOK_SECRET` de su servidor. El backend validará de forma segura cada firma HMAC en tiempo real.
