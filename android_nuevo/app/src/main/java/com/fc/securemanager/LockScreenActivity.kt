package com.fc.securemanager

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
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.view.animation.DecelerateInterpolator
import android.animation.ObjectAnimator
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextClock
import android.widget.TextView
import android.widget.Toast
import android.util.Log
import android.text.InputType
import android.text.InputFilter
import android.graphics.drawable.GradientDrawable
import android.graphics.drawable.RippleDrawable
import android.content.res.ColorStateList
import java.security.MessageDigest
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class LockScreenActivity : Activity() {

    private val unlockReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == "com.fc.securemanager.UNLOCK_ACTION") {
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
        
        // Obtener el identificador único del dispositivo (Android ID)
        deviceSerialNumber = android.provider.Settings.Secure.getString(contentResolver, android.provider.Settings.Secure.ANDROID_ID) ?: "UNKNOWN_DEVICE"

        // Registrar receiver para desbloqueo instantáneo por Push
        val filter = IntentFilter("com.fc.securemanager.UNLOCK_ACTION")
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

        // Helper functions for premium UI shapes and ripples
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

        fun createRippleDrawable(normalColor: Int, pressedColor: Int, cornerRadiusDp: Float, strokeColor: Int = Color.TRANSPARENT, strokeWidthDp: Int = 0): RippleDrawable {
            val content = createRoundedDrawable(normalColor, cornerRadiusDp, strokeColor, strokeWidthDp)
            val mask = createRoundedDrawable(Color.WHITE, cornerRadiusDp)
            return RippleDrawable(
                ColorStateList.valueOf(pressedColor),
                content,
                mask
            )
        }

        // Scale feedback on press for tactile experience
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
        val rootLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setBackgroundColor(Color.parseColor("#090D16")) // Very dark blue space background
            setPadding(40, 140, 40, 60)
        }

        // 1. Clock Section
        val textClockTime = TextClock(this).apply {
            format12Hour = "hh:mm a"
            format24Hour = "HH:mm"
            textSize = 50f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            typeface = Typeface.create("sans-serif-thin", Typeface.NORMAL)
        }
        rootLayout.addView(textClockTime)

        val textClockDate = TextClock(this).apply {
            format12Hour = "EEEE, dd 'de' MMMM"
            format24Hour = "EEEE, dd 'de' MMMM"
            textSize = 14f
            setTextColor(Color.parseColor("#9CA3AF")) // Muted Gray
            gravity = Gravity.CENTER
            setPadding(0, 5, 0, 40)
        }
        rootLayout.addView(textClockDate)

        // 2. Card Container (Bento Box / Glassmorphism UI)
        val cardLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = createRippleDrawable(
                Color.parseColor("#111827"), // Dark Surface
                Color.parseColor("#1F2937"),
                24f,
                Color.parseColor("#374151"), // Border
                1
            )
            setPadding(40, 40, 40, 40)
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
            lp.bottomMargin = 30
            layoutParams = lp
        }

        // Warning Icon in Red accent
        val iconView = TextView(this).apply {
            text = "⚠"
            textSize = 28f
            setTextColor(Color.parseColor("#EF4444")) // Destructive Red
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 10)
        }
        cardLayout.addView(iconView)

        val titleView = TextView(this).apply {
            text = "ACCESO RESTRINGIDO"
            textSize = 16f
            setTypeface(null, Typeface.BOLD)
            setTextColor(Color.parseColor("#EF4444"))
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 12)
        }
        cardLayout.addView(titleView)

        val messageView = TextView(this).apply {
            text = "El dispositivo se encuentra bloqueado temporalmente por administración. Ingrese el código de liberación o realice su pago para desbloquear."
            textSize = 13f
            setTextColor(Color.parseColor("#D1D5DB")) // Light Muted Gray
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 24)
            setLineSpacing(0f, 1.2f)
        }
        cardLayout.addView(messageView)

        // Passcode Input Area
        val txtOfflineLabel = TextView(this).apply {
            text = "CÓDIGO DE DESBLOQUEO OFFLINE"
            textSize = 11f
            setTypeface(null, Typeface.BOLD)
            setTextColor(Color.parseColor("#9CA3AF"))
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 10)
        }
        cardLayout.addView(txtOfflineLabel)

        val edtBypassCode = EditText(this).apply {
            hint = "------"
            textSize = 20f
            setTextColor(Color.WHITE)
            setHintTextColor(Color.parseColor("#4B5563"))
            gravity = Gravity.CENTER
            inputType = InputType.TYPE_CLASS_NUMBER
            filters = arrayOf(InputFilter.LengthFilter(6))
            typeface = Typeface.MONOSPACE
            background = createRoundedDrawable(Color.parseColor("#1F2937"), 12f, Color.parseColor("#374151"), 1)
            setPadding(20, 20, 20, 20)
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
            lp.bottomMargin = 20
            layoutParams = lp
        }
        
        // Input Focus Glowing Animation
        edtBypassCode.onFocusChangeListener = View.OnFocusChangeListener { _, hasFocus ->
            if (hasFocus) {
                edtBypassCode.background = createRoundedDrawable(
                    Color.parseColor("#1F2937"),
                    12f,
                    Color.parseColor("#8B5CF6"), // Accent Purple Glowing border
                    1
                )
            } else {
                edtBypassCode.background = createRoundedDrawable(
                    Color.parseColor("#1F2937"),
                    12f,
                    Color.parseColor("#374151"),
                    1
                )
            }
        }
        cardLayout.addView(edtBypassCode)

        // Primary Unlock Button
        val btnUnlockOffline = Button(this).apply {
            text = "REVALIDAR ACCESO"
            textSize = 14f
            setTypeface(null, Typeface.BOLD)
            setTextColor(Color.WHITE)
            background = createRippleDrawable(
                Color.parseColor("#10B981"), // Emerald Green
                Color.parseColor("#059669"),
                12f
            )
            setPadding(30, 20, 30, 20)
            setupPressScaleAnimation(this)
            
            setOnClickListener {
                val code = edtBypassCode.text.toString().trim()
                if (code.length < 6) {
                    Toast.makeText(this@LockScreenActivity, "Ingrese el código de 6 dígitos.", Toast.LENGTH_SHORT).show()
                    shakeView(cardLayout)
                } else {
                    if (validateBypassCode(code)) {
                        val prefs = getSharedPreferences("CodeCraftPrefs", MODE_PRIVATE)
                        prefs.edit().putBoolean("is_locked", false).apply()
                        applyGracePeriod()
                        OfflineLockManager.applyEnterpriseLockPolicies(this@LockScreenActivity, false)

                        Toast.makeText(this@LockScreenActivity, "Acceso verificado con éxito.", Toast.LENGTH_LONG).show()
                        runOnUiThread {
                            try { stopLockTask() } catch (e: Exception) {}
                            finish()
                        }
                    } else {
                        Toast.makeText(this@LockScreenActivity, "Código incorrecto.", Toast.LENGTH_LONG).show()
                        shakeView(cardLayout)
                    }
                }
            }
        }
        cardLayout.addView(btnUnlockOffline)

        rootLayout.addView(cardLayout)

        // 3. Side-by-side action buttons
        val buttonRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
            layoutParams = lp
        }

        val btnEmergency = Button(this).apply {
            text = "EMERGENCIA"
            textSize = 11f
            setTypeface(null, Typeface.BOLD)
            setTextColor(Color.parseColor("#EF4444")) // Destructive Red
            background = createRippleDrawable(
                Color.TRANSPARENT,
                Color.parseColor("#1F1C1C"),
                12f,
                Color.parseColor("#EF4444"),
                1
            )
            setPadding(20, 20, 20, 20)
            setupPressScaleAnimation(this)
            val lp = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1.0f).apply {
                rightMargin = 15
            }
            layoutParams = lp
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
        buttonRow.addView(btnEmergency)

        val btnHowToPay = Button(this).apply {
            text = "CÓM0 PAGAR"
            textSize = 11f
            setTypeface(null, Typeface.BOLD)
            setTextColor(Color.WHITE)
            background = createRippleDrawable(
                Color.parseColor("#2563EB"), // Accent Blue
                Color.parseColor("#1D4ED8"),
                12f
            )
            setPadding(20, 20, 20, 20)
            setupPressScaleAnimation(this)
            val lp = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1.0f)
            layoutParams = lp
            setOnClickListener {
                try {
                    val builder = android.app.AlertDialog.Builder(this@LockScreenActivity)
                    builder.setTitle("Instrucciones de Pago")
                    builder.setMessage("Para reactivar su servicio, realice su pago en:\n\n" +
                            "• Transferencia Bancaria:\n" +
                            "  Banco: Banco de Demostración\n" +
                            "  CLABE: 1234 5678 9012 3456 78\n" +
                            "  Titular: CodeCraft S.A.\n\n" +
                            "• Corresponsales:\n" +
                            "  OXXO / Walmart (Ref: 987654321)")
                    builder.setPositiveButton("Entendido", null)
                    builder.show()
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
        buttonRow.addView(btnHowToPay)

        rootLayout.addView(buttonRow)

        // 4. Wrap layout in a ScrollView to prevent screen cut-offs
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

        // 5. Stagger Entrance Animations
        textClockTime.alpha = 0f
        textClockTime.translationY = -40f
        textClockDate.alpha = 0f
        textClockDate.translationY = -25f
        cardLayout.alpha = 0f
        cardLayout.scaleX = 0.9f
        cardLayout.scaleY = 0.9f
        buttonRow.alpha = 0f
        buttonRow.translationY = 40f

        textClockTime.animate().alpha(1f).translationY(0f).setDuration(450).setStartDelay(100).start()
        textClockDate.animate().alpha(1f).translationY(0f).setDuration(450).setStartDelay(200).start()
        cardLayout.animate().alpha(1f).scaleX(1.0f).scaleY(1.0f).setDuration(550).setStartDelay(300).start()
        buttonRow.animate().alpha(1f).translationY(0f).setDuration(450).setStartDelay(450).start()
    }

    private fun shakeView(view: View) {
        val animatorX = ObjectAnimator.ofFloat(
            view, "translationX",
            0f, 25f, -25f, 25f, -25f, 15f, -15f, 6f, -6f, 0f
        )
        animatorX.duration = 500
        animatorX.interpolator = DecelerateInterpolator()
        animatorX.start()
    }

    private fun generateDailyBypassCode(serial: String, dateStr: String): String {
        try {
            val input = serial + "CodeCraftBypass2026" + dateStr
            val bytes = MessageDigest.getInstance("MD5").digest(input.toByteArray())
            var value = 0
            for (i in 0..3) {
                value = (value shl 8) or (bytes[i].toInt() and 0xFF)
            }
            val code = Math.abs(value) % 1000000
            return String.format("%06d", code)
        } catch (e: Exception) {
            return "000000"
        }
    }

    private fun validateBypassCode(enteredCode: String): Boolean {
        val sdf = SimpleDateFormat("yyyyMMdd", Locale.US)
        val now = System.currentTimeMillis()
        
        val todayStr = sdf.format(Date(now))
        val yesterdayStr = sdf.format(Date(now - 24 * 60 * 60 * 1000L))
        val tomorrowStr = sdf.format(Date(now + 24 * 60 * 60 * 1000L))
        
        val codeToday = generateDailyBypassCode(deviceSerialNumber, todayStr)
        val codeYesterday = generateDailyBypassCode(deviceSerialNumber, yesterdayStr)
        val codeTomorrow = generateDailyBypassCode(deviceSerialNumber, tomorrowStr)
        
        Log.d("BypassCode", "Validando: $enteredCode contra Hoy=$codeToday, Ayer=$codeYesterday, Mañana=$codeTomorrow")
        
        return enteredCode == codeToday || enteredCode == codeYesterday || enteredCode == codeTomorrow
    }

    private fun applyGracePeriod() {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        // 3 días de gracia
        val graceMs = System.currentTimeMillis() + 3L * 24 * 60 * 60 * 1000L
        val graceDateStr = sdf.format(Date(graceMs))
        OfflineLockManager.scheduleOfflineLockAlarm(this, graceDateStr)
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
    private val serverUrl = "https://bloqueo-app-backend.onrender.com/api/v1/devices"
    private lateinit var deviceSerialNumber: String

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
                            // Guardar estado de desbloqueo persistente
                            val prefs = getSharedPreferences("CodeCraftPrefs", MODE_PRIVATE)
                            prefs.edit().putBoolean("is_locked", false).apply()

                            // Remover restricciones empresariales
                            OfflineLockManager.applyEnterpriseLockPolicies(this@LockScreenActivity, false)



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
