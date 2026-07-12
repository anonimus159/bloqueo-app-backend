package com.workspace.manager

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.os.UserManager
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

object OfflineLockManager {
    private const val TAG = "OfflineLockManager"

    /**
     * Guarda la fecha límite y programa la alarma para el bloqueo del dispositivo.
     * Si la fecha es nula o vacía, cancela cualquier alarma existente.
     */
    fun scheduleOfflineLockAlarm(context: Context, deadlineString: String?) {
        val prefs = context.getSharedPreferences("CodeCraftPrefs", Context.MODE_PRIVATE)
        
        if (deadlineString.isNullOrEmpty() || deadlineString == "null") {
            Log.d(TAG, "No hay fecha límite de pago o fue borrada. Cancelando alarma.")
            cancelAlarm(context)
            return
        }

        try {
            // Guardar el string original de la fecha límite
            prefs.edit().putString("next_payment_deadline", deadlineString).apply()

            // Formato esperado de PostgreSQL o ISO: "2026-06-20T00:00:00.000Z" o "2026-06-20"
            val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.US).apply {
                timeZone = TimeZone.getTimeZone("UTC")
            }
            
            val datePart = if (deadlineString.contains("T")) {
                deadlineString.substringBefore("T")
            } else {
                deadlineString
            }
            
            val date = sdf.parse(datePart)
            if (date != null) {
                // deadlineMs representará las 00:00:00 UTC del día límite
                val deadlineMs = date.time 
                
                prefs.edit().putLong("next_payment_deadline_ms", deadlineMs).apply()
                
                val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
                val intent = Intent(context, OfflineLockReceiver::class.java).apply {
                    action = "com.fc.securemanager.CHECK_OFFLINE_LOCK"
                }
                
                val pendingIntent = PendingIntent.getBroadcast(
                    context,
                    0,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setExactAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP,
                        deadlineMs,
                        pendingIntent
                    )
                } else {
                    alarmManager.setExact(
                        AlarmManager.RTC_WAKEUP,
                        deadlineMs,
                        pendingIntent
                    )
                }
                Log.d(TAG, "Alarma programada exitosamente para: $deadlineString ($deadlineMs ms)")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error al programar la alarma offline: ${e.message}")
        }
    }

    /**
     * Cancela la alarma del AlarmManager y limpia las variables guardadas en preferencias.
     */
    fun cancelAlarm(context: Context) {
        val prefs = context.getSharedPreferences("CodeCraftPrefs", Context.MODE_PRIVATE)
        prefs.edit()
            .remove("next_payment_deadline")
            .remove("next_payment_deadline_ms")
            .apply()

        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, OfflineLockReceiver::class.java).apply {
            action = "com.fc.securemanager.CHECK_OFFLINE_LOCK"
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        alarmManager.cancel(pendingIntent)
        Log.d(TAG, "Alarma cancelada y preferencias borradas.")
    }

    /**
     * Vuelve a programar la alarma leyendo los valores almacenados en SharedPreferences (e.g. tras un reinicio).
     */
    fun rescheduleAlarmFromPrefs(context: Context) {
        val prefs = context.getSharedPreferences("CodeCraftPrefs", Context.MODE_PRIVATE)
        val deadlineMs = prefs.getLong("next_payment_deadline_ms", 0L)
        
        if (deadlineMs > 0L) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent(context, OfflineLockReceiver::class.java).apply {
                action = "com.fc.securemanager.CHECK_OFFLINE_LOCK"
            }
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    deadlineMs,
                    pendingIntent
                )
            } else {
                alarmManager.setExact(
                    AlarmManager.RTC_WAKEUP,
                    deadlineMs,
                    pendingIntent
                )
            }
            Log.d(TAG, "Alarma reprogramada tras reinicio para timestamp: $deadlineMs ms")
        }
    }

    /**
     * Realiza las validaciones horarias de bloqueo offline y evasión horaria.
     */
    fun checkAndEnforceOfflineLock(context: Context) {
        val prefs = context.getSharedPreferences("CodeCraftPrefs", Context.MODE_PRIVATE)
        val isLocked = prefs.getBoolean("is_locked", false)
        val deadlineMs = prefs.getLong("next_payment_deadline_ms", 0L)
        val lastKnownTime = prefs.getLong("last_known_time", 0L)
        val currentTime = System.currentTimeMillis()

        Log.d(TAG, "Evaluando estado offline: isLocked=$isLocked, deadlineMs=$deadlineMs, lastKnownTime=$lastKnownTime, currentTime=$currentTime")

        if (isLocked) {
            Log.w(TAG, "El dispositivo ya estaba marcado como bloqueado. Re-enforzando políticas y pantallas de bloqueo.")
            lockDevice(context, "El dispositivo ya estaba bloqueado.")
            return
        }

        if (deadlineMs <= 0L) {
            // Si no hay fecha límite de pago guardada, el dispositivo está al día.
            // Actualizar la última hora conocida si el reloj avanza.
            if (currentTime > lastKnownTime) {
                prefs.edit().putLong("last_known_time", currentTime).apply()
            }
            return
        }

        // 1. Detección de Evasión por cambio manual de reloj (retraso del tiempo del celular)
        // Permitimos un margen de hasta 5 minutos de desfase para evitar falsos positivos por sincronizaciones NTP.
        val driftThreshold = 5 * 60 * 1000L // 5 minutos
        if (currentTime < lastKnownTime - driftThreshold) {
            Log.w(TAG, "Manipulación horaria detectada: La hora del sistema ($currentTime) retrocedió respecto a la última conocida ($lastKnownTime)")
            lockDevice(context, "Dispositivo suspendido por manipulación de fecha del sistema.")
            return
        }

        // 2. Comprobar si la fecha límite de pago ya expiró
        if (currentTime >= deadlineMs) {
            Log.w(TAG, "Fecha límite de pago expirada offline. Límite: $deadlineMs, Actual: $currentTime")
            lockDevice(context, "Dispositivo suspendido por falta de pago.")
            return
        }

        // 3. El tiempo avanza correctamente y no ha expirado. Actualizar la última hora conocida.
        if (currentTime > lastKnownTime) {
            prefs.edit().putLong("last_known_time", currentTime).apply()
        }
    }

    /**
     * Aplica el estado de bloqueo, guardando la preferencia local y levantando las vistas inescapables.
     */
    private fun lockDevice(context: Context, reason: String) {
        val prefs = context.getSharedPreferences("CodeCraftPrefs", Context.MODE_PRIVATE)
        
        // Guardar estado persistente
        prefs.edit().putBoolean("is_locked", true).apply()

        Log.w(TAG, "Enforzando bloqueo offline local: $reason")

        // Aplicar restricciones empresariales (barra de estado, ajustes, etc.)
        applyEnterpriseLockPolicies(context, true)



        // Iniciar LockScreenActivity
        try {
            val lockIntent = Intent(context, LockScreenActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            context.startActivity(lockIntent)
        } catch (e: Exception) {
            Log.e(TAG, "No se pudo iniciar LockScreenActivity: ${e.message}")
        }
    }

    /**
     * Aplica o remueve restricciones empresariales nativas usando DevicePolicyManager
     * (requiere que la aplicación sea Device Owner).
     */
    fun applyEnterpriseLockPolicies(context: Context, lock: Boolean) {
        val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as? DevicePolicyManager ?: return
        val adminComponent = ComponentName(context, DeviceAdminRcvr::class.java)

        if (!dpm.isDeviceOwnerApp(context.packageName)) {
            Log.w(TAG, "applyEnterpriseLockPolicies: La aplicación no es Device Owner. Se omiten políticas empresariales.")
            return
        }

        try {
            if (lock) {
                // 1. Deshabilitar la barra de estado (previene deslizar notificaciones/ajustes rápidos)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    dpm.setStatusBarDisabled(adminComponent, true)
                }

                // 2. Bloquear acceso a los Ajustes del sistema
                dpm.addUserRestriction(adminComponent, "no_config_settings")

                // 3. Deshabilitar reinicio en Modo Seguro (Safe Boot)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_SAFE_BOOT)
                }

                Log.i(TAG, "Políticas empresariales de bloqueo aplicadas con éxito.")
            } else {
                // 1. Rehabilitar la barra de estado
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    dpm.setStatusBarDisabled(adminComponent, false)
                }

                // 2. Permitir acceso a los Ajustes del sistema
                dpm.clearUserRestriction(adminComponent, "no_config_settings")

                // 3. Permitir reinicio en Modo Seguro
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    dpm.clearUserRestriction(adminComponent, UserManager.DISALLOW_SAFE_BOOT)
                }

                Log.i(TAG, "Políticas empresariales de bloqueo removidas con éxito.")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error al configurar políticas empresariales de bloqueo: ${e.message}")
        }
    }
}
