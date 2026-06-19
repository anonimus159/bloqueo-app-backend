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
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import com.google.firebase.messaging.FirebaseMessaging
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
    private val serverUrl = "${BuildConfig.API_URL}/api/v1/devices/check-in"
    private val deviceSerialNumber = "REF-SAMSUNG-S24-001" // Obtenido por hardware
    private val deviceToken = "TOKEN_DE_HARDWARE_GENERADO" // Almacenado en SharedPreferences

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Inicializar DPM (Device Policy Manager)
        dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        adminComponent = ComponentName(this, DeviceAdminRcvr::class.java)

        // Configuración básica de UI para demostración
        val layout = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            gravity = android.view.Gravity.CENTER
            setPadding(50, 50, 50, 50)
        }

        val titleView = TextView(this).apply {
            text = "CodeCraft Device Controller"
            textSize = 24f
            setTypeface(null, android.graphics.Typeface.BOLD)
            setTextColor(android.graphics.Color.BLACK)
        }
        layout.addView(titleView)

        val statusView = TextView(this).apply {
            text = "Verificando políticas del sistema..."
            textSize = 16f
            setPadding(0, 20, 0, 40)
        }
        layout.addView(statusView)

        val btnSync = Button(this).apply {
            text = "Sincronizar con Servidor"
            setOnClickListener {
                statusView.text = "Sincronizando estado..."
                syncDeviceStatus(statusView)
            }
        }
        layout.addView(btnSync)

        // Se removió el botón "Probar Bloqueo" porque el overlay ahora es ineludible.
        // El bloqueo debe probarse mediante el botón "Sincronizar con Servidor".

        setContentView(layout)

        // Obtener el token de FCM actual en caso de que no haya saltado onNewToken
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (task.isSuccessful) {
                val token = task.result
                Log.d("FCM", "Token actual: $token")
                val prefs = getSharedPreferences("CodeCraftPrefs", Context.MODE_PRIVATE)
                prefs.edit().putString("fcm_token", token).apply()
            }
        }

        // Verificar e imponer restricciones de administración si somos el "Device Owner"
        applyEnterprisePolicies(statusView)
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
                dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_DEBUGGING_FEATURES)

                statusView.text = "Estado: APROVISIONADO (Dispositivo Protegido)"
                statusView.setTextColor(android.graphics.Color.GREEN)
            } catch (e: Exception) {
                Log.e("WPC", "Error al aplicar directivas de administración: ${e.message}")
            }
        } else {
            statusView.text = "Estado: MODO PRUEBA (Device Owner inactivo)\n\nEjecuta en tu terminal:\nadb shell dpm set-device-owner com.codecraft.control/.DeviceAdminRcvr"
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

                // Retrieve FCM Token from SharedPreferences
                val prefs = getSharedPreferences("CodeCraftPrefs", Context.MODE_PRIVATE)
                val fcmToken = prefs.getString("fcm_token", null)

                // Body de la petición
                val jsonBody = JSONObject().apply {
                    put("serial_number", deviceSerialNumber)
                    if (fcmToken != null) {
                        put("fcm_token", fcmToken)
                    }
                    put("integrity_status", JSONObject().apply {
                        put("compromised", false) // En producción usar Play Integrity API
                    })
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
                    val commands = responseJson.optJSONArray("commands")

                    runOnUiThread {
                        if (status == "locked") {
                            // Iniciar el overlay de bloqueo en primer plano
                            if (Settings.canDrawOverlays(this@MainActivity)) {
                                startService(Intent(this@MainActivity, LockOverlayService::class.java))
                            }
                            // Ejecutar bloqueo de pantalla nativo de Android (apaga pantalla)
                            dpm.lockNow()
                            // Iniciar Kiosk Mode
                            startLockTask()
                            Toast.makeText(this@MainActivity, "DISPOSITIVO BLOQUEADO POR IMPAGO", Toast.LENGTH_LONG).show()
                            statusView.text = "Estado: SUSPENDIDO / BLOQUEADO"
                            statusView.setTextColor(android.graphics.Color.RED)
                        } else {
                            // Detener el overlay
                            stopService(Intent(this@MainActivity, LockOverlayService::class.java))
                            
                            // Si estaba en modo Kiosk, salir
                            try {
                                stopLockTask()
                            } catch (e: Exception) {}
                            statusView.text = "Estado: ACTIVO / AL CORRIENTE"
                            statusView.setTextColor(android.graphics.Color.GREEN)
                        }
                    }
                } else {
                    runOnUiThread {
                        statusView.text = "Error del servidor: Código $responseCode"
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
