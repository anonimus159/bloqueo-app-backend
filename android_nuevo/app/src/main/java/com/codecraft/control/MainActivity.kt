package com.codecraft.control

import android.app.Activity
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.net.Uri
import android.os.UserManager
import android.provider.Settings
import android.util.Log
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import android.widget.ScrollView
import android.graphics.Typeface
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.graphics.drawable.RippleDrawable
import android.content.res.ColorStateList
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

/**
 * Actividad principal que administra el ciclo de vida del agente móvil,
 * valida el estado del Device Owner y ejecuta las políticas de bloqueo nativas.
 */
class MainActivity : Activity() {

    private lateinit var dpm: DevicePolicyManager
    private lateinit var adminComponent: ComponentName
    private val serverUrl = "https://bloqueo-app-backend.onrender.com/api/v1/devices/check-in"
    private lateinit var deviceSerialNumber: String
    private val deviceToken = "TOKEN_DE_HARDWARE_GENERADO" // Almacenado en SharedPreferences

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // EMM Provisioning compliance handled by PolicyComplianceActivity

        // Obtener el identificador único del dispositivo (Android ID)
        deviceSerialNumber = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID) ?: "UNKNOWN_DEVICE"

        // Inicializar DPM (Device Policy Manager)
        dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        adminComponent = ComponentName(this, DeviceAdminRcvr::class.java)

        // Helper functions for UI
        fun createRoundedDrawable(backgroundColor: Int, cornerRadiusDp: Float, strokeColor: Int = Color.TRANSPARENT, strokeWidthDp: Int = 0): GradientDrawable {
            return GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                setColor(backgroundColor)
                cornerRadius = cornerRadiusDp * resources.displayMetrics.density
                if (strokeWidthDp > 0) {
                    setStroke((strokeWidthDp * resources.displayMetrics.density).toInt(), strokeColor)
                }
            }
        }

        fun createRippleDrawable(normalColor: Int, pressedColor: Int, cornerRadiusDp: Float): RippleDrawable {
            val content = createRoundedDrawable(normalColor, cornerRadiusDp)
            val mask = createRoundedDrawable(Color.WHITE, cornerRadiusDp)
            return RippleDrawable(
                ColorStateList.valueOf(pressedColor),
                content,
                mask
            )
        }

        fun setupPressScaleAnimation(view: View) {
            view.setOnTouchListener { v, event ->
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        v.animate().scaleX(0.97f).scaleY(0.97f).setDuration(80).start()
                    }
                    MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                        v.animate().scaleX(1.0f).scaleY(1.0f).setDuration(80).start()
                    }
                }
                false
            }
        }

        // Parent layout
        val rootLayout = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setBackgroundColor(Color.parseColor("#090D16")) // Very dark blue space background
            setPadding(40, 60, 40, 60)
        }

        // Header Section
        val headerTitle = TextView(this).apply {
            text = "FINCONTROL"
            textSize = 22f
            setTypeface(null, Typeface.BOLD)
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            letterSpacing = 0.1f
        }
        rootLayout.addView(headerTitle)

        val headerSubtitle = TextView(this).apply {
            text = "SECURE DEVICE MANAGER"
            textSize = 10f
            setTypeface(null, Typeface.BOLD)
            setTextColor(Color.parseColor("#9CA3AF")) // Gray muted text
            gravity = Gravity.CENTER
            setPadding(0, 5, 0, 40)
            letterSpacing = 0.05f
        }
        rootLayout.addView(headerSubtitle)

        // Status Card
        val statusCard = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            background = createRoundedDrawable(Color.parseColor("#111827"), 16f, Color.parseColor("#374151"), 1)
            setPadding(35, 30, 35, 30)
            val lp = android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
            )
            lp.bottomMargin = 25
            layoutParams = lp
        }

        val statusLabel = TextView(this).apply {
            text = "ESTADO DE SEGURIDAD NATIVA"
            textSize = 10f
            setTypeface(null, Typeface.BOLD)
            setTextColor(Color.parseColor("#9CA3AF"))
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 15)
        }
        statusCard.addView(statusLabel)

        val statusView = TextView(this).apply {
            text = "Verificando políticas del sistema..."
            textSize = 15f
            setTypeface(null, Typeface.BOLD)
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
        }
        statusCard.addView(statusView)
        rootLayout.addView(statusCard)

        // Device Info Card
        val infoCard = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            background = createRoundedDrawable(Color.parseColor("#111827"), 16f, Color.parseColor("#374151"), 1)
            setPadding(35, 35, 35, 35)
            val lp = android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
            )
            lp.bottomMargin = 25
            layoutParams = lp
        }

        val brand = android.os.Build.BRAND.uppercase()
        val model = android.os.Build.MODEL

        fun addInfoRow(title: String, value: String, isMono: Boolean = false) {
            val label = TextView(this).apply {
                text = title
                textSize = 9f
                setTypeface(null, Typeface.BOLD)
                setTextColor(Color.parseColor("#9CA3AF"))
                setPadding(0, 0, 0, 4)
            }
            infoCard.addView(label)

            val valView = TextView(this).apply {
                text = value
                textSize = 13f
                setTextColor(Color.WHITE)
                if (isMono) {
                    typeface = Typeface.MONOSPACE
                }
                setPadding(0, 0, 0, 15)
            }
            infoCard.addView(valView)
        }

        addInfoRow("IDENTIFICADOR DE DISPOSITIVO (SERIE)", deviceSerialNumber, isMono = true)
        addInfoRow("MARCA / FABRICANTE", brand)
        addInfoRow("MODELO DE HARDWARE", model)
        
        rootLayout.addView(infoCard)

        // Test Lock Button (Gradient Styled)
        val btnDemoLock = Button(this).apply {
            text = "PROBAR BLOQUEO LOCAL (SIN SERVIDOR)"
            textSize = 12f
            setTypeface(null, Typeface.BOLD)
            setTextColor(Color.WHITE)
            background = createRippleDrawable(
                Color.parseColor("#4F46E5"), // Indigo Accent
                Color.parseColor("#3730A3"),
                12f
            )
            setPadding(30, 20, 30, 20)
            setupPressScaleAnimation(this)
            val lp = android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
            )
            layoutParams = lp

            setOnClickListener {
                if (!Settings.canDrawOverlays(this@MainActivity)) {
                    val intent = Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:$packageName")
                    )
                    startActivity(intent)
                    Toast.makeText(this@MainActivity, "Por favor permite mostrar sobre otras apps", Toast.LENGTH_LONG).show()
                } else {
                    // Simular bloqueo real local
                    val prefs = getSharedPreferences("CodeCraftPrefs", MODE_PRIVATE)
                    prefs.edit().putBoolean("is_locked", true).apply()
                    OfflineLockManager.applyEnterpriseLockPolicies(this@MainActivity, true)
                    
                    try {
                        val overlayIntent = Intent(this@MainActivity, LockOverlayService::class.java)
                        startService(overlayIntent)
                    } catch (e: Exception) {}

                    val intent = Intent(this@MainActivity, LockScreenActivity::class.java)
                    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                    startActivity(intent)
                }
            }
        }
        rootLayout.addView(btnDemoLock)

        // Wrap in ScrollView
        val scrollContainer = ScrollView(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.parseColor("#090D16"))
            isFillViewport = true
            isVerticalScrollBarEnabled = false
        }
        scrollContainer.addView(rootLayout)

        setContentView(scrollContainer)

        // Obtener el FCM Token proactivamente
        try {
            com.google.firebase.messaging.FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    val token = task.result
                    Log.d("WPC-FCM", "Token FCM actual: $token")
                    val prefs = getSharedPreferences("CodeCraftPrefs", MODE_PRIVATE)
                    prefs.edit().putString("fcm_token", token).apply()
                } else {
                    Log.w("WPC-FCM", "No se pudo obtener el FCM token: ${task.exception?.message}")
                }
                
                // SINCRONIZACIÓN AUTOMÁTICA
                runOnUiThread {
                    statusView.text = "Sincronizando estado automáticamente..."
                    syncDeviceStatus(statusView)
                }
            }
        } catch (e: Exception) {
            Log.e("WPC-FCM", "Fallo al inicializar FCM Messaging: ${e.message}")
            // Intentar check-in de todas formas
            runOnUiThread {
                statusView.text = "Sincronizando estado automáticamente..."
                syncDeviceStatus(statusView)
            }
        }

        // Verificar e imponer restricciones de administración si somos el "Device Owner"
        applyEnterprisePolicies(statusView)

        // Solicitar permiso de superposición (overlay) para asegurar el bloqueo en segundo plano
        if (!Settings.canDrawOverlays(this)) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:$packageName")
            )
            startActivity(intent)
            Toast.makeText(this, "Por favor activa el permiso de superposición para que el bloqueo funcione en segundo plano.", Toast.LENGTH_LONG).show()
        }

        // Verificar si debe iniciarse bloqueado por persistencia (SharedPreferences)
        val prefs = getSharedPreferences("CodeCraftPrefs", MODE_PRIVATE)
        if (prefs.getBoolean("is_locked", false)) {
            try {
                // Asegurar restricciones empresariales (barra de estado, ajustes, etc.)
                OfflineLockManager.applyEnterpriseLockPolicies(this, true)

                // Relanzar servicio de overlay
                val overlayIntent = Intent(this, LockOverlayService::class.java)
                startService(overlayIntent)
                
                // Relanzar la actividad de bloqueo inescapable
                val lockIntent = Intent(this, LockScreenActivity::class.java)
                lockIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                startActivity(lockIntent)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        // Realizar comprobación offline de fecha límite de pago y manipulación horaria
        OfflineLockManager.checkAndEnforceOfflineLock(this)
    }

    /**
     * Aplica las restricciones empresariales nativas contra desinstalación y formateo.
     * Requiere que la aplicación haya sido aprovisionada previamente como Device Owner.
     */
    private fun applyEnterprisePolicies(statusView: TextView) {
        val isDeviceOwner = dpm.isDeviceOwnerApp(packageName)

        if (isDeviceOwner) {
            try {
                // 1. Impedir la desinstalación de la app
                dpm.setUninstallBlocked(adminComponent, packageName, true)
                Log.i("WPC", "Desinstalación bloqueada exitosamente.")

                // 2. Inhabilitar el restablecimiento de valores de fábrica (Factory Reset)
                dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_FACTORY_RESET)
                Log.i("WPC", "Restablecimiento de fábrica inhabilitado.")

                // 3. Inhabilitar el modo de depuración USB (ADB) para evitar modificaciones externas
                // dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_DEBUGGING_FEATURES)

                // 4. Autorizar el Kiosk Mode (LockTask packages)
                dpm.setLockTaskPackages(adminComponent, arrayOf(packageName, "com.android.dialer", "com.google.android.dialer"))

                // 5. Forzar fecha y hora automáticas (de red)
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
                    dpm.setAutoTimeRequired(adminComponent, true)
                    Log.i("WPC", "Fecha y hora automáticas (red) forzadas exitosamente.")
                }

                statusView.text = "Estado: APROVISIONADO (Dispositivo Protegido)"
                statusView.setTextColor(android.graphics.Color.GREEN)
            } catch (e: Exception) {
                Log.e("WPC", "Error al aplicar directivas de administración: ${e.message}")
            }
        } else {
            statusView.text = "Estado: MODO DEMO (Falta activar Device Owner)"
            statusView.setTextColor(android.graphics.Color.RED)
            Log.w("WPC", "La aplicación no está configurada como Device Owner del terminal.")
        }
    }

    /**
     * Envía una petición HTTP POST en segundo plano para realizar el check-in con la API.
     * Procesa la orden de bloqueo recibida.
     */
    private fun syncDeviceStatus(statusView: TextView) {
        thread {
            try {
                val url = URL(serverUrl)
                val connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "POST"
                connection.setRequestProperty("Content-Type", "application/json")
                connection.setRequestProperty("x-device-token", deviceToken)
                connection.doOutput = true
                connection.connectTimeout = 8000
                connection.readTimeout = 8000

                // Obtener FCM Token de las preferencias (guardado por MDMFirebaseMessagingService)
                val prefs = getSharedPreferences("CodeCraftPrefs", MODE_PRIVATE)
                val fcmToken = prefs.getString("fcm_token", null)

                // Body de la petición
                val jsonBody = JSONObject().apply {
                    put("serial_number", deviceSerialNumber)
                    put("integrity_status", JSONObject().apply {
                        put("compromised", false) // En producción usar Play Integrity API
                    })
                    if (fcmToken != null) {
                        put("fcm_token", fcmToken)
                    }
                }

                val writer = OutputStreamWriter(connection.outputStream)
                writer.write(jsonBody.toString())
                writer.flush()
                writer.close()

                val responseCode = connection.responseCode
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    val responseText = connection.inputStream.bufferedReader().use { it.readText() }
                    val responseJson = JSONObject(responseText)
                    val status = responseJson.optString("status", "active")
                    val nextDeadline = responseJson.optString("next_payment_deadline", "")
                    val commands = responseJson.optJSONArray("commands")

                    // Programar o cancelar la alarma local de bloqueo fuera de línea
                    try {
                        OfflineLockManager.scheduleOfflineLockAlarm(this@MainActivity, nextDeadline)
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }

                    runOnUiThread {
                        val prefs = getSharedPreferences("CodeCraftPrefs", MODE_PRIVATE)
                        if (status == "locked") {
                            prefs.edit().putBoolean("is_locked", true).apply()

                            // Aplicar políticas empresariales de bloqueo
                            OfflineLockManager.applyEnterpriseLockPolicies(this@MainActivity, true)

                            // Lanzar el overlay de bloqueo inmediatamente
                            try {
                                val overlayIntent = Intent(this@MainActivity, LockOverlayService::class.java)
                                startService(overlayIntent)
                            } catch (e: Exception) {}

                            // Lanza nuestra actividad inescapable en modo Kiosk
                            val lockIntent = Intent(this@MainActivity, LockScreenActivity::class.java)
                            lockIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                            startActivity(lockIntent)
                            
                            Toast.makeText(this@MainActivity, "DISPOSITIVO BLOQUEADO POR IMPAGO", Toast.LENGTH_LONG).show()
                            statusView.text = "Estado: SUSPENDIDO / BLOQUEADO"
                            statusView.setTextColor(android.graphics.Color.RED)
                        } else {
                            // Ejecutar comprobación local offline por si hay desajuste
                            OfflineLockManager.checkAndEnforceOfflineLock(this@MainActivity)

                            if (!prefs.getBoolean("is_locked", false)) {
                                // Si no está bloqueado localmente por expiración offline o alteración, liberar restricciones
                                OfflineLockManager.applyEnterpriseLockPolicies(this@MainActivity, false)
                                try {
                                    stopLockTask()
                                    stopService(android.content.Intent(this@MainActivity, LockOverlayService::class.java))
                                } catch (e: Exception) {}
                                statusView.text = "Estado: ACTIVO / AL CORRIENTE"
                                statusView.setTextColor(android.graphics.Color.GREEN)
                            } else {
                                statusView.text = "Estado: SUSPENDIDO / BLOQUEADO"
                                statusView.setTextColor(android.graphics.Color.RED)
                            }
                        }
                    }
                } else {
                    val errorText = connection.errorStream?.bufferedReader()?.use { it.readText() } ?: "Sin detalle"
                    runOnUiThread {
                        statusView.text = "Error $responseCode: $errorText"
                    }
                }
                connection.disconnect()
            } catch (e: Exception) {
                runOnUiThread {
                    statusView.text = "Error de red: ${e.message}"
                }
            }
        }
    }
}
