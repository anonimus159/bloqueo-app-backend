package com.codecraft.control

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
                // Lanzar la pantalla de bloqueo inmediatamente
                val intent = Intent(this, LockScreenActivity::class.java)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                startActivity(intent)
            } else if (action == "unlock") {
                // Para desbloquear, enviamos un broadcast o iniciamos un servicio
                // En este caso, LockScreenActivity tiene un polling que saldrá solo,
                // pero si queremos forzarlo, enviamos un broadcast local.
                val intent = Intent("com.codecraft.control.UNLOCK_ACTION")
                sendBroadcast(intent)
            }
        }
    }
}
