package com.codecraft.control

import android.content.Intent
import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class MyFirebaseMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d("FCM", "Refreshed token: $token")
        // Aquí se enviaría el token al servidor (por ejemplo, a través de MainActivity o almacenándolo en SharedPreferences para enviarlo en el próximo check-in)
        val prefs = getSharedPreferences("CodeCraftPrefs", MODE_PRIVATE)
        prefs.edit().putString("fcm_token", token).apply()
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        Log.d("FCM", "Message data payload: ${remoteMessage.data}")

        val action = remoteMessage.data["action"]
        
        when (action) {
            "lock" -> {
                Log.d("FCM", "Acción recibida: lock. Iniciando bloqueo...")
                val intent = Intent(this, LockOverlayService::class.java)
                startService(intent)
            }
            "unlock" -> {
                Log.d("FCM", "Acción recibida: unlock. Deteniendo bloqueo...")
                val intent = Intent(this, LockOverlayService::class.java)
                stopService(intent)
            }
            "wipe" -> {
                Log.d("FCM", "Acción recibida: wipe. Ejecutando borrado (SIMULADO)...")
                // Aquí llamarías a dpm.wipeData(0) si tuvieras permisos, por seguridad esto solo registra
            }
        }
    }
}
