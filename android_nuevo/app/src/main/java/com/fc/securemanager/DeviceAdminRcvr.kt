package com.fc.securemanager

import android.app.admin.DeviceAdminReceiver
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.UserManager
import android.util.Log
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

    override fun onProfileProvisioningComplete(context: Context, intent: Intent) {
        super.onProfileProvisioningComplete(context, intent)
        Log.i("DeviceAdminRcvr", "Aprovisionamiento de perfil completado con éxito.")
        
        val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        val adminComponent = ComponentName(context, DeviceAdminRcvr::class.java)
        
        try {
            if (dpm.isDeviceOwnerApp(context.packageName)) {
                // 1. Impedir desinstalación
                dpm.setUninstallBlocked(adminComponent, context.packageName, true)
                // 2. Inhabilitar Factory Reset
                dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_FACTORY_RESET)
                // 3. Forzar hora de red
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    dpm.setAutoTimeRequired(adminComponent, true)
                }
                Log.i("DeviceAdminRcvr", "Políticas iniciales de Device Owner aplicadas.")
            }
        } catch (e: Exception) {
            Log.e("DeviceAdminRcvr", "Error al aplicar políticas en aprovisionamiento: ${e.message}")
        }

        // En Android 10+ (Q), no debemos iniciar la UI manualmente desde aquí.
        // El Setup Wizard se encarga de iniciar MainActivity con la acción ADMIN_POLICY_COMPLIANCE.
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            val launchIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            }
            context.startActivity(launchIntent)
        }
    }

    override fun onDisableRequested(context: Context, intent: Intent): CharSequence? {
        showToast(context, "¡Alerta de Seguridad! Desactivar los privilegios bloqueará el celular.")
        return "Esta aplicación controla la suscripción del crédito del dispositivo. Si desactivas la administración, el terminal será bloqueado remotamente."
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        showToast(context, "Administración desactivada. El celular ingresará en modo restringido.")
    }

    override fun onPasswordChanged(context: Context, intent: Intent) {
        super.onPasswordChanged(context, intent)
        showToast(context, "Políticas de contraseña sincronizadas en el terminal.")
    }

    private fun showToast(context: Context, msg: String) {
        Toast.makeText(context, msg, Toast.LENGTH_LONG).show()
    }
}
