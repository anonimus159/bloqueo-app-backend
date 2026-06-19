package com.codecraft.control

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Color
import android.graphics.Typeface
import android.net.Uri
import android.os.Bundle
import android.view.Gravity
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextClock
import android.widget.TextView

class LockScreenActivity : Activity() {

    private val unlockReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == "com.codecraft.control.UNLOCK_ACTION") {
                polling = false
                try {
                    stopLockTask()
                } catch (e: Exception) {}
                finish()
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Registrar receiver para desbloqueo instantáneo por Push
        val filter = IntentFilter("com.codecraft.control.UNLOCK_ACTION")
        // Use RECEIVER_NOT_EXPORTED for security on Android 14+
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(unlockReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(unlockReceiver, filter)
        }

        // Prevenir que la pantalla se apague y mostrar sobre la pantalla de bloqueo normal
        window.addFlags(
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        )

        // ¡EL TRUCO MAGICO! Esto ancla la aplicación a la pantalla e impide salir
        try {
            startLockTask()
        } catch (e: Exception) {
            e.printStackTrace()
        }

        // Construcción de la Interfaz (UI) nativa
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.BLACK)
            setPadding(50, 100, 50, 100)
        }

        // Reloj (Hora)
        val textClockTime = TextClock(this).apply {
            format12Hour = "hh:mm a"
            format24Hour = "HH:mm"
            textSize = 64f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)
        }
        layout.addView(textClockTime)

        // Reloj (Fecha)
        val textClockDate = TextClock(this).apply {
            format12Hour = "EEEE, dd 'de' MMMM"
            format24Hour = "EEEE, dd 'de' MMMM"
            textSize = 20f
            setTextColor(Color.LTGRAY)
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 80)
        }
        layout.addView(textClockDate)

        // Mensaje de Bloqueo
        val titleView = TextView(this).apply {
            text = "DISPOSITIVO BLOQUEADO"
            textSize = 24f
            setTypeface(null, Typeface.BOLD)
            setTextColor(Color.parseColor("#EF4444")) // Rojo intenso
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 20)
        }
        layout.addView(titleView)

        val messageView = TextView(this).apply {
            text = "Este equipo ha sido suspendido por su proveedor. Para reactivarlo, por favor regularice su situación."
            textSize = 16f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 60)
        }
        layout.addView(messageView)

        // Botón de Llamadas de Emergencia
        val btnEmergency = Button(this).apply {
            text = "LLAMADAS DE EMERGENCIA"
            textSize = 16f
            setBackgroundColor(Color.parseColor("#374151")) // Gris oscuro
            setTextColor(Color.WHITE)
            setPadding(40, 30, 40, 30)
            setOnClickListener {
                try {
                    val intent = Intent(Intent.ACTION_DIAL)
                    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    startActivity(intent)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
        layout.addView(btnEmergency)

        setContentView(layout)
    }

    override fun onResume() {
        super.onResume()
        startPolling()
    }

    override fun onPause() {
        super.onPause()
        polling = false
    }

    override fun onDestroy() {
        super.onDestroy()
        polling = false
        try {
            unregisterReceiver(unlockReceiver)
        } catch (e: Exception) {}
    }

    private var polling = false
    private val serverUrl = "http://10.0.2.2:3000/api/v1/devices"
    private val deviceSerialNumber = "REF-SAMSUNG-S24-001"

    private fun startPolling() {
        if (polling) return
        polling = true
        Thread {
            while (polling) {
                try {
                    val url = java.net.URL(serverUrl)
                    val connection = url.openConnection() as java.net.HttpURLConnection
                    connection.requestMethod = "GET"
                    connection.setRequestProperty("Authorization", "Bearer test-token")
                    connection.connectTimeout = 5000
                    connection.readTimeout = 5000

                    if (connection.responseCode == 200) {
                        val responseText = connection.inputStream.bufferedReader().use { it.readText() }
                        val responseArray = org.json.JSONArray(responseText)
                        var isStillLocked = true
                        
                        for (i in 0 until responseArray.length()) {
                            val obj = responseArray.getJSONObject(i)
                            if (obj.getString("serial_number") == deviceSerialNumber) {
                                if (obj.getString("status") == "active") {
                                    isStillLocked = false
                                }
                                break
                            }
                        }

                        if (!isStillLocked) {
                            runOnUiThread {
                                try {
                                    stopLockTask()
                                } catch (e: Exception) {}
                                finish()
                            }
                            polling = false
                        }
                    }
                    connection.disconnect()
                } catch (e: Exception) {
                    e.printStackTrace()
                }
                Thread.sleep(3000)
            }
        }.start()
    }

    // Interceptar el botón "Atrás" por si acaso
    override fun onBackPressed() {
        // No hacer nada (impide salir)
    }
}
