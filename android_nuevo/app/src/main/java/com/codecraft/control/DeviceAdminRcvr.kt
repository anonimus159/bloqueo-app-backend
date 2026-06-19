package com.codecraft.control

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent
import android.widget.Toast

/**
 * Receptor encargado de interceptar y procesar eventos relacionados con las directivas
 * de administración del dispositivo. Actúa como el puente de comunicación de eventos del sistema Android.
 */
class DeviceAdminRcvr : DeviceAdminReceiver() {

    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        showToast(context, "Administración de dispositivo activa para CodeCraft.")
    }

    override fun onDisableRequested(context: Context, intent: Intent): CharSequence? {
        // Muestra un mensaje disuasorio en pantalla cuando el usuario intenta desactivar el administrador
        showToast(context, "¡Alerta de Seguridad! Desactivar los privilegios bloqueará el celular.")
        return "Esta aplicación controla la suscripción del crédito del dispositivo. Si desactivas la administración, el terminal será bloqueado remotamente."
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        showToast(context, "Administración desactivada. El celular ingresará en modo restringido.")
        // Aquí se dispara el bloqueo local si se pierden los permisos empresariales
    }

    override fun onPasswordChanged(context: Context, intent: Intent) {
        super.onPasswordChanged(context, intent)
        showToast(context, "Políticas de contraseña sincronizadas en el terminal.")
    }

    private fun showToast(context: Context, msg: String) {
        Toast.makeText(context, msg, Toast.LENGTH_LONG).show()
    }
}
