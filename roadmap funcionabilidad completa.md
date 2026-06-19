# Roadmap de Producción: CodeCraft Device Controller

Para entregar este sistema a una empresa real, debemos transformar nuestro prototipo funcional en una arquitectura segura, escalable y difícil de vulnerar. 

Aquí están los 4 pilares fundamentales que nos faltan. Elige por cuál quieres que empecemos:

## 1. La Aplicación Android Real (Nivel Hardware) 📱
Actualmente estamos simulando el celular. Para la vida real necesitamos construir la aplicación móvil (en React Native, Kotlin o Java) que irá instalada en los teléfonos de los clientes.
*   **Permisos de Administrador:** Configurar la app como *Device Administrator* o *Device Owner* (MDM) para que el cliente no pueda desinstalarla.
*   **Bloqueo de Pantalla Fuerte:** Usar permisos de "Superposición de pantalla" (Draw over other apps) para mostrar la pantalla de cobro e impedir que usen el celular.

## 2. Autenticación y Seguridad Estricta (Nivel Servidor) 🔒
La seguridad es vital; si un hacker descubre cómo funciona la API, podría desbloquear todos los celulares de la empresa.
*   **Login de Administradores:** Crear una tabla de usuarios en Supabase. Eliminar nuestro "token de prueba" y crear un inicio de sesión real en la web con correo y contraseña.
*   **Firmas Criptográficas reales:** Asegurarnos de que el celular solo obedezca órdenes si vienen firmadas digitalmente por el servidor.

## 3. Notificaciones Push Instantáneas (Nivel Conectividad) ⚡
Actualmente, simulamos que el celular le pregunta al servidor cada 5 segundos si hay novedades. En la vida real, eso agota la batería y consume muchos datos móviles.
*   **Integración con Firebase (FCM):** Implementar notificaciones invisibles. Así, cuando presiones "Bloquear" en la web, el servidor le envía un "ping" directo al teléfono para que se bloquee instantáneamente (en menos de 1 segundo) sin gastar batería en segundo plano.

## 4. Expansión del Panel Web (Nivel Empresa) 💻
La empresa necesitará más herramientas administrativas en la interfaz web.
*   **Registro de Inventario:** Una pantalla para agregar teléfonos nuevos (IMEI, Serial, Cliente) a la base de datos antes de entregarlos al comprador.
*   **Historial de Auditoría:** Un registro inalterable de qué empleado bloqueó qué teléfono y a qué hora.
*   **WebSockets:** Para que la tabla de la web se actualice en tiempo real sin tener que recargar la página.
