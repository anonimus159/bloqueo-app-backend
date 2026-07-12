package com.workspace.manager

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class OfflineLockReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action
        Log.d("OfflineLockReceiver", "Broadcast recibido: $action")
        
        if (action == Intent.ACTION_BOOT_COMPLETED) {
            // Reprogramar alarmas ya que el sistema las limpia al apagar
            OfflineLockManager.rescheduleAlarmFromPrefs(context)
        }
        
        // Evaluar si corresponde bloquear por límite de pago o alteración de hora
        OfflineLockManager.checkAndEnforceOfflineLock(context)
    }
}
