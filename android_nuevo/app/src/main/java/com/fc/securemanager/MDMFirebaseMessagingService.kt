package com.fc.securemanager

import android.content.Intent
import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class MDMFirebaseMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d("WPC-FCM", "Nuevo token FCM: $token")
        
        // Guardar token en SharedPreferences para enviarlo en el próximo check-in
        val prefs = getSharedPreferences("CodeCraftPrefs", MODE_PRIVATE)
        prefs.edit().putString("fcm_token", token).apply()
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        
        Log.d("WPC-FCM", "Mensaje FCM recibido de: ${remoteMessage.from}")

        // Los datos que enviamos desde el backend están en remoteMessage.data
        if (remoteMessage.data.isNotEmpty()) {
            val action = remoteMessage.data["action"]
            Log.d("WPC-FCM", "Acción solicitada: $action")

            if (action == "lock") {
                // Guardar estado de bloqueo persistente
                val prefs = getSharedPreferences("CodeCraftPrefs", MODE_PRIVATE)
                prefs.edit().putBoolean("is_locked", true).apply()

                // Aplicar políticas empresariales de bloqueo (barra de estado, ajustes, etc.)
                OfflineLockManager.applyEnterpriseLockPolicies(this, true)

                // 1. Iniciar el servicio de overlay para asegurar el bloqueo en segundo plano
                try {
                    val overlayIntent = Intent(this, LockOverlayService::class.java)
                    startService(overlayIntent)
                } catch (e: Exception) {
                    Log.e("WPC-FCM", "Error al iniciar LockOverlayService: ${e.message}")
                }

                // 2. Lanzar la actividad de bloqueo
                try {
                    val intent = Intent(this, LockScreenActivity::class.java)
                    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                    startActivity(intent)
                } catch (e: Exception) {
                    Log.e("WPC-FCM", "Error al iniciar LockScreenActivity: ${e.message}")
                }
            } else if (action == "unlock") {
                // Guardar estado de desbloqueo persistente
                val prefs = getSharedPreferences("CodeCraftPrefs", MODE_PRIVATE)
                prefs.edit().putBoolean("is_locked", false).apply()

                // Remover políticas empresariales de bloqueo
                OfflineLockManager.applyEnterpriseLockPolicies(this, false)

                // Detener el overlay
                try {
                    val overlayIntent = Intent(this, LockOverlayService::class.java)
                    stopService(overlayIntent)
                } catch (e: Exception) {
                    Log.e("WPC-FCM", "Error al detener LockOverlayService: ${e.message}")
                }

                // Detener la actividad de bloqueo
                val intent = Intent("com.fc.securemanager.UNLOCK_ACTION")
                sendBroadcast(intent)
            }
        }
    }
}
